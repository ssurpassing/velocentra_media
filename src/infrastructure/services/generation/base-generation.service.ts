/**
 * 基础生成服务
 * 提供所有生成任务的公共逻辑
 * 
 * 重要变更（v4.0）：
 * 1. 任务 ID 使用 AI API 返回的 ID（不再自动生成 UUID）
 * 2. 删除 external_task_id 字段
 * 3. 删除 stage_progress 等执行过程字段
 * 4. 使用独立的 media_files 表存储结果
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/infrastructure/database/server-client';
import { UserProfile } from '@/shared/lib/api-middleware';
import { MediaFileService } from '../database/media-file-service';
import type { MediaFileInsert } from '@/shared/types';
import pino from 'pino';

const logger = pino({ name: 'base-generation-service' });

export interface GenerationTaskParams {
  id: string; // 必须提供 AI API 返回的 ID
  userId: string;
  mediaType: 'image' | 'video';
  aiModel: string;
  originalPrompt?: string;
  optimizedPrompt?: string;
  promptOptimized?: boolean;
  inputImageUrls?: string[];
  costCredits: number;
  generationParams?: Record<string, any>;
  // v4.1: 重试/重新生成相关字段
  parentTaskId?: string;
  isFreeRetry?: boolean;
}

export interface TaskUpdateParams {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  completedAt?: string;
  generationTimeMs?: number;
  promptOptimizationTimeMs?: number;
}

/**
 * 基础生成服务类
 */
export class BaseGenerationService {
  protected supabase: SupabaseClient;

  constructor() {
    this.supabase = createAdminClient();
  }

  /**
   * 创建生成任务
   * 注意：必须提供 AI API 返回的 ID
   */
  async createTask(params: GenerationTaskParams): Promise<{
    success: boolean;
    task?: any;
    error?: string;
  }> {
    try {
      const { data: task, error: taskError } = await this.supabase
        .from('generation_tasks')
        .insert({
          id: params.id, // 使用 AI API 返回的 ID
          user_id: params.userId,
          media_type: params.mediaType,
          status: 'pending',
          ai_model: params.aiModel,
          original_prompt: params.originalPrompt,
          optimized_prompt: params.optimizedPrompt,
          prompt_optimized: params.promptOptimized || false,
          input_image_urls: params.inputImageUrls,
          generation_params: params.generationParams || {},
          cost_credits: params.costCredits,
          // v4.1: 重试/重新生成相关字段
          parent_task_id: params.parentTaskId || null,
          is_free_retry: params.isFreeRetry ?? false,
        })
        .select()
        .single();

      if (taskError || !task) {
        logger.error({ error: taskError }, 'Failed to create task');
        return {
          success: false,
          error: taskError?.message || 'Failed to create task',
        };
      }

      logger.info({ taskId: task.id, mediaType: params.mediaType }, 'Task created successfully');
      return { success: true, task };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Create task error');
      return {
        success: false,
        error: error.message || 'Failed to create task',
      };
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    taskId: string,
    params: TaskUpdateParams
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};

      if (params.status) updateData.status = params.status;
      if (params.errorMessage) updateData.error_message = params.errorMessage;
      if (params.completedAt) updateData.completed_at = params.completedAt;
      if (params.generationTimeMs) updateData.generation_time_ms = params.generationTimeMs;
      if (params.promptOptimizationTimeMs) updateData.prompt_optimization_time_ms = params.promptOptimizationTimeMs;

      const { error } = await this.supabase
        .from('generation_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        logger.error({ taskId, error }, 'Failed to update task status');
        return { success: false, error: error.message };
      }

      logger.info({ taskId, status: params.status }, 'Task status updated');
      return { success: true };
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Update task status error');
      return { success: false, error: error.message };
    }
  }

  /**
   * 标记任务失败
   */
  async markTaskFailed(
    taskId: string,
    errorMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateTaskStatus(taskId, {
      status: 'failed',
      errorMessage,
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * 标记任务完成
   */
  async markTaskCompleted(
    taskId: string,
    generationTimeMs?: number
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateTaskStatus(taskId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      generationTimeMs,
    });
  }

  /**
   * 创建媒体文件记录
   * 使用新的 media_files 表
   */
  async createMediaFile(params: MediaFileInsert): Promise<{
    success: boolean;
    media?: any;
    error?: string;
  }> {
    try {
      const media = await MediaFileService.createMediaFile(params);
      logger.info({ taskId: params.task_id, mediaId: media.id }, 'Media file created');
      return { success: true, media };
    } catch (error: any) {
      logger.error({ taskId: params.task_id, error: error.message }, 'Create media file error');
      return {
        success: false,
        error: error.message || 'Failed to create media file',
      };
    }
  }

  /**
   * 批量创建媒体文件记录
   */
  async createMediaFiles(files: MediaFileInsert[]): Promise<{
    success: boolean;
    media?: any[];
    error?: string;
  }> {
    try {
      const media = await MediaFileService.createMediaFiles(files);
      logger.info({ count: media.length }, 'Media files created');
      return { success: true, media };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Create media files error');
      return {
        success: false,
        error: error.message || 'Failed to create media files',
      };
    }
  }

  /**
   * 获取任务信息
   */
  async getTask(taskId: string): Promise<{
    success: boolean;
    task?: any;
    error?: string;
  }> {
    try {
      const { data: task, error } = await this.supabase
        .from('generation_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !task) {
        return {
          success: false,
          error: error?.message || 'Task not found',
        };
      }

      return { success: true, task };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get task',
      };
    }
  }

  /**
   * 获取任务及其媒体文件
   */
  async getTaskWithMedia(taskId: string): Promise<{
    success: boolean;
    task?: any;
    media?: any[];
    error?: string;
  }> {
    try {
      const { data: task, error: taskError } = await this.supabase
        .from('generation_tasks')
        .select(`
          *,
          media_files (*)
        `)
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return {
          success: false,
          error: taskError?.message || 'Task not found',
        };
      }

      return { 
        success: true, 
        task,
        media: task.media_files || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get task with media',
      };
    }
  }
}

// 导出单例
export const baseGenerationService = new BaseGenerationService();
