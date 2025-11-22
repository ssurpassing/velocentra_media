/**
 * 积分服务
 * 统一管理积分检查、扣除、退还等操作
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/infrastructure/database/server-client';
import { UserProfile } from '@/shared/lib/api-middleware';
import pino from 'pino';

const logger = pino({ name: 'credit-service' });

export interface CreditCheckResult {
  success: boolean;
  error?: string;
  canProceed: boolean;
}

export interface CreditOperationResult {
  success: boolean;
  error?: string;
  newBalance?: number;
}

/**
 * 积分服务类
 */
export class CreditService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createAdminClient();
  }

  /**
   * 检查用户积分是否足够
   * 
   * 规则：
   * - 订阅会员：只检查积分和订阅有效期，不检查生成次数
   * - 积分会员：检查积分和生成次数
   * - 免费会员：只检查免费生成次数
   */
  checkCredits(profile: UserProfile, requiredCredits: number): CreditCheckResult {
    // 免费会员：只检查免费次数
    if (profile.membership_tier === 'free') {
      if (profile.free_generations_remaining <= 0) {
        return {
          success: false,
          canProceed: false,
          error: 'No free generations remaining. Please purchase credits.',
        };
      }
      return { success: true, canProceed: true };
    }

    // 订阅会员：检查积分和订阅有效期
    if (profile.membership_tier === 'subscription') {
      const now = new Date();
      const subscriptionEndDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null;
      
      // 检查订阅是否过期
      if (!subscriptionEndDate || subscriptionEndDate < now) {
        return {
          success: false,
          canProceed: false,
          error: 'Subscription expired. Please renew your subscription.',
        };
      }
      
      // 检查积分
      if (profile.credits < requiredCredits) {
        return {
          success: false,
          canProceed: false,
          error: `Insufficient credits. Required: ${requiredCredits}, Available: ${profile.credits}`,
        };
      }
      
      return { success: true, canProceed: true };
    }

    // 积分会员：检查积分和生成次数
    if (profile.membership_tier === 'credits') {
      // 检查生成次数
      if (profile.free_generations_remaining <= 0) {
        return {
          success: false,
          canProceed: false,
          error: 'No generation quota remaining. Please purchase more credits.',
        };
      }
      
      // 检查积分
      if (profile.credits < requiredCredits) {
        return {
          success: false,
          canProceed: false,
          error: `Insufficient credits. Required: ${requiredCredits}, Available: ${profile.credits}`,
        };
      }
      
      return { success: true, canProceed: true };
    }

    // 默认：只检查积分
    if (profile.credits < requiredCredits) {
      return {
        success: false,
        canProceed: false,
        error: `Insufficient credits. Required: ${requiredCredits}, Available: ${profile.credits}`,
      };
    }

    return { success: true, canProceed: true };
  }

  /**
   * 扣除用户积分
   */
  async deductCredits(
    userId: string,
    profile: UserProfile,
    credits: number,
    taskId: string,
    description?: string
  ): Promise<CreditOperationResult> {
    try {
      if (profile.membership_tier === 'free') {
        // 扣除免费次数
        const newFreeCount = profile.free_generations_remaining - 1;
        
        const { error: updateError } = await this.supabase
          .from('user_profiles')
          .update({
            free_generations_remaining: newFreeCount,
          })
          .eq('id', userId);

        if (updateError) {
          logger.error({ userId, error: updateError }, 'Failed to deduct free generations');
          return {
            success: false,
            error: updateError.message || 'Failed to deduct free generations',
          };
        }

        // 记录历史
        await this.supabase.from('credit_history').insert({
          user_id: userId,
          amount: 0,
          type: 'usage',
          balance_after: profile.credits,
          task_id: taskId,
          description: description || `Free generation used (${newFreeCount} remaining)`,
        });

        logger.info({ userId, taskId, remaining: newFreeCount }, 'Free generation used');
        return { success: true, newBalance: profile.credits };
      } else if (profile.membership_tier === 'credits') {
        // 积分会员：扣除积分和生成次数
        const newBalance = profile.credits - credits;
        const newQuota = profile.free_generations_remaining - 1;
        
        const { error: updateError } = await this.supabase
          .from('user_profiles')
          .update({ 
            credits: newBalance,
            free_generations_remaining: newQuota,
          })
          .eq('id', userId);

        if (updateError) {
          logger.error({ userId, error: updateError }, 'Failed to deduct credits and quota');
          return {
            success: false,
            error: updateError.message || 'Failed to deduct credits and quota',
          };
        }

        // 记录历史
        await this.supabase.from('credit_history').insert({
          user_id: userId,
          amount: -credits,
          type: 'usage',
          balance_after: newBalance,
          task_id: taskId,
          description: description || `Used ${credits} credits (${newQuota} generations remaining)`,
        });

        logger.info({ userId, taskId, credits, newBalance, newQuota }, 'Credits and quota deducted');
        return { success: true, newBalance };
      } else {
        // 订阅会员或其他：只扣除积分
        const newBalance = profile.credits - credits;
        
        const { error: updateError } = await this.supabase
          .from('user_profiles')
          .update({ credits: newBalance })
          .eq('id', userId);

        if (updateError) {
          logger.error({ userId, error: updateError }, 'Failed to deduct credits');
          return {
            success: false,
            error: updateError.message || 'Failed to deduct credits',
          };
        }

        // 记录历史
        await this.supabase.from('credit_history').insert({
          user_id: userId,
          amount: -credits,
          type: 'usage',
          balance_after: newBalance,
          task_id: taskId,
          description: description || `Generation task (${credits} credits)`,
        });

        logger.info({ userId, taskId, credits, newBalance }, 'Credits deducted');
        return { success: true, newBalance };
      }
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Deduct credits error');
      return {
        success: false,
        error: error.message || 'Failed to deduct credits',
      };
    }
  }

  /**
   * 退还用户积分
   */
  async refundCredits(
    userId: string,
    credits: number,
    taskId: string,
    reason: string,
    isFreeUser: boolean = false
  ): Promise<CreditOperationResult> {
    try {
      if (isFreeUser) {
        // 返还免费次数
        const { data: currentProfile } = await this.supabase
          .from('user_profiles')
          .select('free_generations_remaining')
          .eq('id', userId)
          .single();

        if (currentProfile) {
          const newFreeCount = currentProfile.free_generations_remaining + 1;
          
          const { error: updateError } = await this.supabase
            .from('user_profiles')
            .update({
              free_generations_remaining: newFreeCount,
            })
            .eq('id', userId);

          if (updateError) {
            logger.error({ userId, error: updateError }, 'Failed to refund free generations');
            return {
              success: false,
              error: updateError.message || 'Failed to refund free generations',
            };
          }

          logger.info({ userId, taskId, newFreeCount }, 'Free generation refunded');
          return { success: true };
        }
      } else {
        // 返还积分
        const { data: currentProfile } = await this.supabase
          .from('user_profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (currentProfile) {
          const newBalance = currentProfile.credits + credits;
          
          const { error: updateError } = await this.supabase
            .from('user_profiles')
            .update({ credits: newBalance })
            .eq('id', userId);

          if (updateError) {
            logger.error({ userId, error: updateError }, 'Failed to refund credits');
            return {
              success: false,
              error: updateError.message || 'Failed to refund credits',
            };
          }

          // 记录历史
          await this.supabase.from('credit_history').insert({
            user_id: userId,
            amount: credits,
            type: 'refund',
            balance_after: newBalance,
            task_id: taskId,
            description: reason,
          });

          logger.info({ userId, taskId, credits, newBalance }, 'Credits refunded');
          return { success: true, newBalance };
        }
      }

      return { success: false, error: 'User profile not found' };
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Refund credits error');
      return {
        success: false,
        error: error.message || 'Failed to refund credits',
      };
    }
  }

  /**
   * 记录积分扣除（用于视频生成等场景）
   */
  async recordCreditDeduction(
    userId: string,
    credits: number,
    taskId: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.supabase.from('credit_history').insert({
        user_id: userId,
        amount: -credits,
        type: 'deduction',
        balance_after: 0, // 将在后续更新
        reference_id: taskId,
        description,
      });

      logger.info({ userId, taskId, credits }, 'Credit deduction recorded');
      return { success: true };
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Record credit deduction error');
      return {
        success: false,
        error: error.message || 'Failed to record credit deduction',
      };
    }
  }

  /**
   * 获取用户当前积分余额
   */
  async getUserCredits(userId: string): Promise<{
    success: boolean;
    credits?: number;
    freeGenerations?: number;
    error?: string;
  }> {
    try {
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('credits, free_generations_remaining, membership_tier')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return {
          success: false,
          error: error?.message || 'User profile not found',
        };
      }

      return {
        success: true,
        credits: profile.credits,
        freeGenerations: profile.free_generations_remaining,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get user credits',
      };
    }
  }
}

// 导出单例
export const creditService = new CreditService();

