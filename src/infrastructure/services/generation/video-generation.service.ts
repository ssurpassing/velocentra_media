/**
 * 视频生成服务
 * 统一处理所有视频生成相关逻辑
 * 
 * 重要变更（v4.0）：
 * 1. 先调用 AI API 获取任务 ID，再创建数据库任务
 * 2. 删除 external_task_id 字段
 * 3. 支持多图输入（input_image_urls 数组）
 * 4. 使用独立的 media_files 表存储结果
 */

import { BaseGenerationService } from './base-generation.service';
import { creditService } from './credit.service';
import { UserProfile } from '@/shared/lib/api-middleware';
import type { MediaFileInsert } from '@/shared/types';
import pino from 'pino';

const logger = pino({ name: 'video-generation-service' });

export interface VideoGenerationRequest {
  taskId: string; // AI API 返回的任务 ID
  userId: string;
  profile: UserProfile;
  model: string;
  prompt: string;
  originalPrompt?: string;
  optimizedPrompt?: string;
  promptOptimized?: boolean;
  creditCost: number;
  generationType?: string;
  aspectRatio?: string;
  nFrames?: string;
  imageUrls?: string[];
  seeds?: number[];
  enableTranslation?: boolean;
  removeWatermark?: boolean;
  quality?: string;
  // v4.1: 重试/重新生成相关字段
  parentTaskId?: string;
  isFreeRetry?: boolean;
}

export interface VideoGenerationResult {
  success: boolean;
  taskId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * 视频生成服务类
 */
export class VideoGenerationService extends BaseGenerationService {
  /**
   * 准备视频生成任务
   * 注意：必须先调用 AI API 获取 taskId，再调用此方法
   */
  async prepareVideoGeneration(
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResult> {
    const { 
      taskId, 
      userId, 
      profile, 
      model, 
      prompt, 
      originalPrompt,
      optimizedPrompt,
      promptOptimized,
      creditCost, 
      generationType, 
      aspectRatio, 
      nFrames, 
      imageUrls, 
      seeds, 
      enableTranslation, 
      removeWatermark, 
      quality,
      // v4.1: 重试/重新生成相关字段
      parentTaskId,
      isFreeRetry,
    } = request;

    try {
      // 1. 检查积分
      const creditCheck = creditService.checkCredits(profile, creditCost);
      if (!creditCheck.canProceed) {
        return {
          success: false,
          error: creditCheck.error || 'Insufficient credits',
          errorCode: 'INSUFFICIENT_CREDITS',
        };
      }

      // 2. 创建任务（使用 AI API 返回的 ID）
      const taskResult = await this.createTask({
        id: taskId, // 使用 AI API 返回的 ID
        userId,
        mediaType: 'video',
        aiModel: model,
        originalPrompt: originalPrompt || prompt,
        optimizedPrompt,
        promptOptimized,
        inputImageUrls: imageUrls,
        costCredits: creditCost,
        generationParams: {
          generationType,
          model,
          aspectRatio,
          nFrames,
          seeds,
          enableTranslation,
          removeWatermark,
          quality,
        },
        // v4.1: 重试/重新生成相关字段
        parentTaskId,
        isFreeRetry,
      });

      if (!taskResult.success || !taskResult.task) {
        return {
          success: false,
          error: taskResult.error || 'Failed to create task',
          errorCode: 'TASK_CREATION_FAILED',
        };
      }

      const task = taskResult.task;
      logger.info({ taskId: task.id, userId, model }, 'Video task created');

      // 3. 扣除积分
      const deductResult = await creditService.deductCredits(
        userId,
        profile,
        creditCost,
        task.id,
        `Video generation: ${model}`
      );

      if (!deductResult.success) {
        // 积分扣除失败，标记任务失败
        await this.markTaskFailed(task.id, 'Failed to deduct credits');
        logger.error({ taskId: task.id, error: deductResult.error }, 'Failed to deduct credits');
        return {
          success: false,
          error: deductResult.error || 'Failed to deduct credits',
          errorCode: 'CREDIT_DEDUCTION_FAILED',
        };
      }

      logger.info({ taskId: task.id, credits: creditCost }, 'Credits deducted');

      return {
        success: true,
        taskId: task.id,
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Prepare video generation error');
      return {
        success: false,
        error: error.message || 'Failed to prepare video generation',
        errorCode: 'PREPARATION_ERROR',
      };
    }
  }

  /**
   * 处理视频生成失败
   * 包括：标记任务失败、退还积分
   */
  async handleVideoGenerationFailure(
    taskId: string,
    userId: string,
    profile: UserProfile,
    creditCost: number,
    errorMessage: string
  ): Promise<void> {
    try {
      // 1. 标记任务失败
      await this.markTaskFailed(taskId, errorMessage);

      // 2. 退还积分
      const isFreeUser = profile.membership_tier === 'free';
      await creditService.refundCredits(
        userId,
        creditCost,
        taskId,
        `Refund for failed video generation: ${errorMessage}`,
        isFreeUser
      );

      logger.info({ taskId, userId }, 'Video generation failure handled, credits refunded');
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Failed to handle video generation failure');
    }
  }

  /**
   * 完成视频生成任务
   * 创建 media_files 记录并更新任务状态
   */
  async completeVideoGeneration(
    taskId: string,
    userId: string,
    results: Array<{
      url: string;
      thumbnailUrl?: string;
      width?: number;
      height?: number;
      duration?: number;
      format?: string;
      fileSize?: number;
    }>,
    generationTimeMs?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 创建媒体文件记录
      const mediaFiles: MediaFileInsert[] = results.map((result, index) => ({
        task_id: taskId,
        user_id: userId,
        media_type: 'video',
        url: result.url,
        thumbnail_url: result.thumbnailUrl,
        width: result.width,
        height: result.height,
        duration: result.duration,
        format: result.format,
        file_size: result.fileSize,
        original_url: result.url,
        storage_status: 'original_only',
        result_index: index,
      }));

      const mediaResult = await this.createMediaFiles(mediaFiles);
      if (!mediaResult.success) {
        logger.error({ taskId, error: mediaResult.error }, 'Failed to create media files');
        return {
          success: false,
          error: mediaResult.error || 'Failed to create media files',
        };
      }

      // 2. 更新任务状态为完成
      await this.markTaskCompleted(taskId, generationTimeMs);

      logger.info({ taskId, mediaCount: results.length }, 'Video generation completed');
      return { success: true };
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Complete video generation error');
      return {
        success: false,
        error: error.message || 'Failed to complete video generation',
      };
    }
  }

  /**
   * 获取回调URL
   */
  getCallbackUrl(): string | undefined {
    const ngrokUrl = process.env.NEXT_PUBLIC_NGROK_URL?.replace(/\/$/, '');
    return ngrokUrl ? `${ngrokUrl}/api/callback/kie` : undefined;
  }

  /**
   * 验证视频生成请求参数
   */
  validateVideoRequest(params: {
    model?: string;
    prompt?: string;
    generationType?: string;
    imageUrls?: string[];
  }): { valid: boolean; error?: string } {
    if (!params.model) {
      return { valid: false, error: 'Model is required' };
    }

    if (!params.prompt || !params.prompt.trim()) {
      return { valid: false, error: 'Prompt is required' };
    }

    // 图生视频需要图片
    if (
      params.generationType &&
      (params.generationType === 'image-to-video' || params.generationType === 'reference-to-video') &&
      (!params.imageUrls || params.imageUrls.length === 0)
    ) {
      return { valid: false, error: 'Image URLs required for image-to-video generation' };
    }

    return { valid: true };
  }
}

// 导出单例
export const videoGenerationService = new VideoGenerationService();
