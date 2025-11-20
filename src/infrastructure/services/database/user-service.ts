/**
 * 用户服务
 * 统一处理用户相关的数据库操作，添加缓存支持
 */

import { createAdminClient } from '@/infrastructure/database/server-client';
import { cache, getCached, invalidateCache } from '@/infrastructure/database/cache';
import { UserProfile } from '@/shared/lib/api-middleware';
import pino from 'pino';

const logger = pino({ name: 'user-service' });

// ========================================
// 用户服务类
// ========================================

export class UserService {
  private supabase = createAdminClient();

  /**
   * 获取用户配置（带缓存）
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `user:profile:${userId}`;

    try {
      return await getCached(
        cacheKey,
        async () => {
          const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error || !data) {
            return null;
          }

          return data as UserProfile;
        },
        30000 // 30秒缓存
      );
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get user profile');
      return null;
    }
  }

  /**
   * 更新用户配置（并使缓存失效）
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        logger.error({ userId, error }, 'Failed to update user profile');
        return { success: false, error: error.message };
      }

      // 使缓存失效
      invalidateCache(`user:profile:${userId}`);

      return { success: true };
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Update user profile error');
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建用户配置
   */
  async createUserProfile(
    userId: string,
    email: string,
    additionalData?: Partial<UserProfile>
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          membership_tier: 'free',
          credits: 0,
          free_generations_remaining: 3,
          locale: 'zh',
          ...additionalData,
        })
        .select()
        .single();

      if (error || !data) {
        logger.error({ userId, error }, 'Failed to create user profile');
        return { success: false, error: error?.message || 'Failed to create profile' };
      }

      // 缓存新创建的配置
      cache.set(`user:profile:${userId}`, data, 30000);

      return { success: true, profile: data as UserProfile };
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Create user profile error');
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取或创建用户配置
   */
  async getOrCreateUserProfile(
    userId: string,
    email: string
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    // 先尝试获取
    const profile = await this.getUserProfile(userId);
    if (profile) {
      return { success: true, profile };
    }

    // 不存在则创建
    return await this.createUserProfile(userId, email);
  }

  /**
   * 批量获取用户配置（用于性能优化）
   */
  async getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
    const result = new Map<string, UserProfile>();

    try {
      // 先从缓存获取
      const uncachedIds: string[] = [];
      for (const userId of userIds) {
        const cached = cache.get<UserProfile>(`user:profile:${userId}`);
        if (cached) {
          result.set(userId, cached);
        } else {
          uncachedIds.push(userId);
        }
      }

      // 批量查询未缓存的
      if (uncachedIds.length > 0) {
        const { data, error } = await this.supabase
          .from('user_profiles')
          .select('*')
          .in('id', uncachedIds);

        if (!error && data) {
          for (const profile of data) {
            result.set(profile.id, profile as UserProfile);
            // 缓存结果
            cache.set(`user:profile:${profile.id}`, profile, 30000);
          }
        }
      }

      return result;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to get user profiles');
      return result;
    }
  }

  /**
   * 清除用户缓存
   */
  clearUserCache(userId: string): void {
    invalidateCache(`user:profile:${userId}`);
  }
}

// ========================================
// 单例导出
// ========================================

export const userService = new UserService();

