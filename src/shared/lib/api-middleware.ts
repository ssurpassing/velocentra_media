/**
 * API 中间件和工具函数
 * 统一处理认证、用户配置、积分管理等公共逻辑
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';
import { SupabaseClient, User } from '@supabase/supabase-js';

// ========================================
// 类型定义
// ========================================

export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  membership_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  credits: number;
  free_generations_remaining: number;
  locale?: string;
  is_admin?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ========================================
// 认证相关
// ========================================

/**
 * 验证用户认证
 */
export async function authenticateUser(
  request: NextRequest
): Promise<{ success: true; context: AuthContext } | { success: false; response: NextResponse }> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    return {
      success: true,
      context: { user, supabase },
    };
  } catch (error: any) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: error.message || 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * 认证中间件 - 高阶函数包装 API 处理器
 */
export function withAuth<T = any>(
  handler: (context: AuthContext, request: NextRequest, params?: any) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, context?: { params: any }) => {
    const authResult = await authenticateUser(request);

    if (!authResult.success) {
      return authResult.response;
    }

    try {
      return await handler(authResult.context, request, context?.params);
    } catch (error: any) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// ========================================
// 用户配置管理
// ========================================

/**
 * 获取用户配置
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: true; profile: UserProfile } | { success: false; error: string; status: number }> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      // 尝试创建新的用户配置
      const { data: user } = await supabase.auth.getUser();
      
      if (user.user) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: user.user.email!,
            membership_tier: 'free',
            credits: 0,
            free_generations_remaining: 3,
            locale: 'zh',
          })
          .select()
          .single();

        if (createError || !newProfile) {
          return {
            success: false,
            error: 'Failed to create user profile',
            status: 500,
          };
        }

        return { success: true, profile: newProfile as UserProfile };
      }

      return {
        success: false,
        error: 'User profile not found',
        status: 404,
      };
    }

    return { success: true, profile: profile as UserProfile };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get user profile',
      status: 500,
    };
  }
}

// ========================================
// 积分管理
// ========================================

/**
 * 检查用户积分是否足够
 */
export function checkCredits(
  profile: UserProfile,
  requiredCredits: number
): { success: true } | { success: false; error: string; status: number } {
  if (profile.membership_tier === 'free') {
    if (profile.free_generations_remaining <= 0) {
      return {
        success: false,
        error: 'No free generations remaining. Please purchase credits.',
        status: 403,
      };
    }
  } else if (profile.credits < requiredCredits) {
    return {
      success: false,
      error: `Insufficient credits. Required: ${requiredCredits}, Available: ${profile.credits}`,
      status: 403,
    };
  }

  return { success: true };
}

/**
 * 扣除用户积分
 */
export async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  profile: UserProfile,
  credits: number,
  taskId: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (profile.membership_tier === 'free') {
      // 扣除免费次数
      await supabase
        .from('user_profiles')
        .update({
          free_generations_remaining: profile.free_generations_remaining - 1,
        })
        .eq('id', userId);

      // 记录历史
      const { error: freeHistoryError } = await supabase.from('credit_history').insert({
        user_id: userId,
        amount: 0,
        type: 'usage',
        balance_after: profile.credits,
        task_id: taskId,
        description: description || `Free generation used (${profile.free_generations_remaining - 1} remaining)`,
      });
      
      if (freeHistoryError) {
        console.error('❌ Failed to insert free credit history:', freeHistoryError);
        return { success: false, error: freeHistoryError.message };
      }
    } else {
      // 扣除积分
      const newBalance = profile.credits - credits;
      
      await supabase
        .from('user_profiles')
        .update({ credits: newBalance })
        .eq('id', userId);

      // 记录历史
      const { error: historyError } = await supabase.from('credit_history').insert({
        user_id: userId,
        amount: -credits,
        type: 'usage',
        balance_after: newBalance,
        task_id: taskId,
        description: description || `Generation task (${credits} credits)`,
      });
      
      if (historyError) {
        console.error('❌ Failed to insert credit history:', historyError);
        return { success: false, error: historyError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to deduct credits:', error);
    return {
      success: false,
      error: error.message || 'Failed to deduct credits',
    };
  }
}

/**
 * 返还用户积分
 */
export async function refundCredits(
  supabase: SupabaseClient,
  userId: string,
  credits: number,
  taskId: string,
  reason: string,
  isFreeUser: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isFreeUser) {
      // 返还免费次数
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('free_generations_remaining')
        .eq('id', userId)
        .single();

      if (currentProfile) {
        await supabase
          .from('user_profiles')
          .update({
            free_generations_remaining: currentProfile.free_generations_remaining + 1,
          })
          .eq('id', userId);
      }
    } else {
      // 返还积分
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (currentProfile) {
        const newBalance = currentProfile.credits + credits;
        
        await supabase
          .from('user_profiles')
          .update({ credits: newBalance })
          .eq('id', userId);

        // 记录历史
        await supabase.from('credit_history').insert({
          user_id: userId,
          amount: credits,
          type: 'refund',
          balance_after: newBalance,
          task_id: taskId,
          description: reason,
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to refund credits:', error);
    return {
      success: false,
      error: error.message || 'Failed to refund credits',
    };
  }
}

// ========================================
// 响应辅助函数
// ========================================

/**
 * 成功响应
 */
export function successResponse<T = any>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * 错误响应
 */
export function errorResponse(error: string, status: number = 500): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * 验证响应
 */
export function validationErrorResponse(error: string): NextResponse<ApiResponse> {
  return errorResponse(error, 400);
}

/**
 * 未授权响应
 */
export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorResponse('Unauthorized', 401);
}

/**
 * 未找到响应
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * 权限不足响应
 */
export function forbiddenResponse(message?: string): NextResponse<ApiResponse> {
  return errorResponse(message || 'Permission denied', 403);
}

