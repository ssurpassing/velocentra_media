/**
 * 任务管理服务
 * 统一处理任务创建、状态更新、错误处理和积分返还
 */

import { createAdminClient } from '@/infrastructure/database/server-client';
import { refundCredits } from '@/shared/lib/api-middleware';
import pino from 'pino';

const logger = pino({ name: 'task-service' });

// ========================================
// 类型定义
// ========================================

export interface CreateTaskParams {
  taskId?: string;  // v4.0: 可选的任务 ID（视频生成时使用 AI 返回的 ID）
  userId: string;
  style: string;
  aiModel: string;
  originalPhotoUrl?: string;
  costCredits: number;
  membershipTypeUsed: string;
  userPrompt?: string;
  originalPrompt?: string;
  optimizedPrompt?: string;
  negativePrompt?: string;
  generationParams?: Record<string, any>;
  promptOptimized?: boolean;  // v4.0: 改名从 llmOptimizationUsed
  generationMode?: string;
  pipelineVersion?: string;
  currentStage?: string;
  stageProgress?: number;
  totalStages?: number;
  parentTaskId?: string;
  isFreeRetry?: boolean;
  status?: 'pending' | 'processing';
}

export interface UpdateTaskStatusParams {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generatedPhotos?: string[];
  errorMessage?: string;
  completedAt?: string;
  generationTimeMs?: number;
  currentStage?: string;
  stageProgress?: number;
  stageMetrics?: Record<string, any>;
  totalCostUsd?: number;
  qualityScore?: Record<string, any>;
  metadata?: Record<string, any>;
  externalTaskId?: string;
}

export interface CreateGeneratingPhotoParams {
  taskId: string;
  userId: string;
  style: string;
  aiModel: string;
  userPrompt?: string;
  optimizedPrompt?: string;
  originalPhotoUrl?: string;
  hasWatermark?: boolean;
  showComparison?: boolean;
  userName?: string;
  userAvatar?: string;
}

export interface UpdatePhotoStatusParams {
  status: 'generating' | 'completed' | 'failed';
  photoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  width?: number;
  height?: number;
}

// ========================================
// 任务管理类
// ========================================

export class TaskService {
  private supabase = createAdminClient();

  /**
   * 创建任务
   */
  async createTask(params: CreateTaskParams): Promise<{ success: boolean; task?: any; error?: string }> {
    try {
      // v4.0: taskId 必须由调用方提供（来自 AI API）
      if (!params.taskId) {
        logger.error('taskId is required');
        return {
          success: false,
          error: 'taskId is required',
        };
      }
      
      const { data: task, error: taskError } = await this.supabase
        .from('generation_tasks')
        .insert({
          id: params.taskId,  // v4.0: 使用 AI 返回的 ID
          user_id: params.userId,
          status: params.status || 'pending',
          media_type: 'image',  // v4.0: 新增字段
          ai_model: params.aiModel,
          original_prompt: params.originalPrompt,
          optimized_prompt: params.optimizedPrompt,
          prompt_optimized: params.promptOptimized || false,  // v4.0: 改名
          input_image_urls: params.originalPhotoUrl ? [params.originalPhotoUrl] : [],  // v4.0: 改为数组
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
          error: 'Failed to create generation task',
        };
      }

      logger.info({ taskId: task.id, userId: params.userId }, 'Task created successfully');
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
    params: UpdateTaskStatusParams
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status: params.status,
      };

      // v4.0: 只更新存在的字段
      if (params.errorMessage) updateData.error_message = params.errorMessage;
      if (params.completedAt) updateData.completed_at = params.completedAt;
      if (params.generationTimeMs !== undefined) updateData.generation_time_ms = params.generationTimeMs;

      const { error } = await this.supabase
        .from('generation_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        logger.error({ taskId, error }, 'Failed to update task status');
        return {
          success: false,
          error: 'Failed to update task status',
        };
      }

      logger.info({ taskId, status: params.status }, 'Task status updated');
      return { success: true };
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Update task status error');
      return {
        success: false,
        error: error.message || 'Failed to update task status',
      };
    }
  }

  /**
   * 标记任务失败（含积分返还）
   */
  async markTaskFailed(
    taskId: string,
    errorMessage: string,
    shouldRefund: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 获取任务信息
      const { data: task } = await this.supabase
        .from('generation_tasks')
        .select('user_id, cost_credits')
        .eq('id', taskId)
        .single();

      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      // 更新任务状态为失败
      await this.updateTaskStatus(taskId, {
        status: 'failed',
        errorMessage,
      });

      // v4.0: 不再需要更新 generated_photos 表

      // 返还积分
      if (shouldRefund && task.cost_credits > 0) {
        await refundCredits(
          this.supabase,
          task.user_id,
          task.cost_credits,
          taskId,
          `Generation failed - ${errorMessage}`,
          false  // v4.0: 简化，统一处理
        );
        logger.info({ taskId, credits: task.cost_credits }, 'Credits refunded');
      }

      logger.info({ taskId, errorMessage }, 'Task marked as failed');
      return { success: true };
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Mark task failed error');
      return {
        success: false,
        error: error.message || 'Failed to mark task as failed',
      };
    }
  }

  /**
   * 标记任务完成
   */
  async markTaskCompleted(
    taskId: string,
    results: {
      imageUrl: string;
      generationTimeMs?: number;
      width?: number;
      height?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { MediaFileService } = await import('./media-file-service');
      
      // 获取任务信息
      const { data: task } = await this.supabase
        .from('generation_tasks')
        .select('user_id')
        .eq('id', taskId)
        .single();

      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      // 创建 media_file 记录
      await MediaFileService.createMediaFile({
        task_id: taskId,
        user_id: task.user_id,
        media_type: 'image',
        url: results.imageUrl,
        thumbnail_url: results.imageUrl,
        original_url: results.imageUrl,
        storage_status: 'original_only',
        result_index: 0,
        width: results.width || 1024,
        height: results.height || 1024,
      });

      // 更新任务状态为完成
      await this.updateTaskStatus(taskId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        generationTimeMs: results.generationTimeMs,
      });

      logger.info({ taskId, imageUrl: results.imageUrl }, 'Task marked as completed');
      return { success: true };
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Mark task completed error');
      return {
        success: false,
        error: error.message || 'Failed to mark task as completed',
      };
    }
  }

  /**
   * v4.0: 已废弃 - 不再需要创建占位符
   * 现在直接在任务完成时创建 media_files
   */
  async createGeneratingPhoto(
    params: CreateGeneratingPhotoParams
  ): Promise<{ success: boolean; photo?: any; error?: string }> {
    logger.warn('createGeneratingPhoto is deprecated in v4.0');
    return { success: true };
  }

  /**
   * v4.0: 已废弃 - 不再需要更新照片状态
   * 现在使用 media_files 表
   */
  async updatePhotoStatus(
    taskId: string,
    params: UpdatePhotoStatusParams
  ): Promise<{ success: boolean; error?: string }> {
    logger.warn('updatePhotoStatus is deprecated in v4.0');
    return { success: true };
  }

  /**
   * 获取任务信息
   */
  async getTask(taskId: string): Promise<{ success: boolean; task?: any; error?: string }> {
    try {
      const { data: task, error } = await this.supabase
        .from('generation_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !task) {
        return { success: false, error: 'Task not found' };
      }

      return { success: true, task };
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Get task error');
      return {
        success: false,
        error: error.message || 'Failed to get task',
      };
    }
  }

  /**
   * v4.0: 已废弃 - 不再跟踪任务进度
   */
  async updateTaskProgress(
    taskId: string,
    stage: string,
    progress: number,
    metrics?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    logger.warn('updateTaskProgress is deprecated in v4.0');
    return { success: true };
  }
}

// ========================================
// 单例导出
// ========================================

export const taskService = new TaskService();

