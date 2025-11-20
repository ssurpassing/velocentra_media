/**
 * 生成 API 公共逻辑辅助函数
 * 统一处理生成请求验证、提示词构建、任务准备等
 */

import { buildPrompt, buildNegativePrompt } from '@/shared/config/ai-models';
import { calculateImageCredits } from '@/shared/config/model-credits';
import { generateAvatar } from '@/infrastructure/services/ai';
import { uploadGeneratedAvatar } from '@/infrastructure/services/storage';
import { taskService } from '@/infrastructure/services/database/task-service';
import { UserProfile } from '@/shared/lib/api-middleware';
import pino from 'pino';

const logger = pino({ name: 'generation-helpers' });

// ========================================
// 类型定义
// ========================================

export interface GenerationRequest {
  imageUrl?: string;
  imageUrls?: string[]; // 多图融合支持
  style?: string;
  aiModel?: string;
  customPrompt?: string;
  aspectRatio?: string;
  isPromptOptimized?: boolean;
  numberOfImages?: number;
  // v4.1: 重试/重新生成相关字段
  parentTaskId?: string; // 父任务ID：从哪条任务重新生成来的
  retryFromTaskId?: string; // 重试任务ID：如果是失败任务重试，成功后删除旧任务
}

export interface ValidatedGenerationRequest {
  imageUrl: string;
  imageUrls?: string[]; // 多图融合支持
  style: string;
  aiModel: string;
  customPrompt?: string;
  aspectRatio: string;
  isPromptOptimized: boolean;
  numberOfImages: number;
}

export interface PromptResult {
  prompt: string;
  negativePrompt: string;
  optimizationUsed: boolean;
  originalPrompt: string;
}

export interface TaskPreparation {
  creditCost: number;
  prompt: string;
  negativePrompt: string;
  optimizationUsed: boolean;
  originalPrompt: string;
}

export interface GenerationExecutionParams {
  taskId: string;
  userId: string;
  imageUrl: string;
  imageUrls?: string[]; // 多图融合支持
  prompt: string;
  negativePrompt: string;
  aiModel: string;
  style: string;
  profile: UserProfile;
  numberOfImages?: number;
  aspectRatio?: string;
}

// ========================================
// 验证函数
// ========================================

/**
 * 验证生成请求
 */
export function validateGenerationRequest(
  body: GenerationRequest
): { success: true; data: ValidatedGenerationRequest } | { success: false; error: string } {
  const {
    imageUrl = '', // 文生图模式下可为空
    imageUrls, // 多图融合支持
    style = 'custom', // 默认自定义模式，不使用预设风格
    aiModel = 'kie-nano-banana',
    customPrompt,
    aspectRatio = 'auto',
    isPromptOptimized = false,
    numberOfImages = 1, // 默认生成 1 张
  } = body;

  // 不再强制要求 imageUrl，因为文生图模式不需要
  // 如果是文生图模式（如 kie-nano-banana, kie-gpt4o-image），imageUrl 可以为空
  // 如果是图生图模式（如 kie-nano-banana-edit），调用方应该确保传入 imageUrl 或 imageUrls

  return {
    success: true,
    data: {
      imageUrl,
      imageUrls,
      style,
      aiModel,
      customPrompt,
      aspectRatio,
      isPromptOptimized,
      numberOfImages,
    },
  };
}

// ========================================
// 提示词构建
// ========================================

/**
 * 构建提示词
 */
export function buildPrompts(
  customPrompt: string | undefined,
  style: string,
  isPromptOptimized: boolean
): PromptResult {
  let prompt: string;
  let negativePrompt: string;
  let optimizationUsed = false;
  let originalPrompt: string = '';

  if (customPrompt) {
    // 用户自定义提示词模式：直接使用用户提示词，不添加任何预设
    logger.info(
      {
        promptLength: customPrompt.length,
        isOptimized: isPromptOptimized,
        style,
      },
      '使用用户自定义提示词（不添加预设风格）'
    );

    originalPrompt = customPrompt;
    prompt = customPrompt; // 直接使用，不拼接
    negativePrompt = ''; // 不使用负面提示词，让 AI 自由发挥
    optimizationUsed = isPromptOptimized;
  } else {
    // 传统模式：使用预设风格（向后兼容）
    logger.info({ style }, '使用预设风格提示词');
    prompt = buildPrompt(style, customPrompt);
    negativePrompt = buildNegativePrompt(style);
    originalPrompt = prompt;
  }

  return {
    prompt,
    negativePrompt,
    optimizationUsed,
    originalPrompt,
  };
}

// ========================================
// 任务准备
// ========================================

/**
 * 准备任务数据
 */
export function prepareTaskData(
  userId: string,
  profile: UserProfile,
  validatedRequest: ValidatedGenerationRequest,
  promptResult: PromptResult
): TaskPreparation {
  const creditCost = calculateImageCredits(
    validatedRequest.aiModel, 
    validatedRequest.style,
    validatedRequest.numberOfImages
  );

  return {
    creditCost,
    prompt: promptResult.prompt,
    negativePrompt: promptResult.negativePrompt,
    optimizationUsed: promptResult.optimizationUsed,
    originalPrompt: promptResult.originalPrompt,
  };
}

// ========================================
// 异步生成执行
// ========================================

/**
 * 异步执行生成任务
 */
export async function executeGenerationAsync(params: GenerationExecutionParams): Promise<void> {
  const { taskId, userId, imageUrl, imageUrls, prompt, negativePrompt, aiModel, style, profile, numberOfImages, aspectRatio } = params;

  try {
    // 更新任务状态为processing
    await taskService.updateTaskStatus(taskId, { status: 'processing' });

    // 调用 AI 生成
    const generationStartTime = Date.now();
    const result = await generateAvatar({
      imageUrl,
      imageUrls, // 传递多图 URLs
      prompt,
      negativePrompt,
      model: aiModel,
      style,
      numberOfImages,
      aspectRatio,
    });
    const generationTimeMs = Date.now() - generationStartTime;

    // 检查是否使用回调模式
    const isCallbackMode = result.taskId && !result.imageUrl;
    
    if (!result.success) {
      // 生成失败（非回调模式）
      await taskService.markTaskFailed(taskId, result.error || 'Generation failed', true);
      logger.error({ taskId, error: result.error }, 'Generation failed');
      return;
    }
    
    if (isCallbackMode) {
      // 回调模式：任务已创建，等待KIE回调通知
      logger.info({ 
        taskId, 
        externalTaskId: result.taskId,
        aiModel
      }, 'Task created in callback mode, waiting for KIE callback');
      
      // v4.0: 不再需要 external_task_id，任务 ID 直接使用 AI 返回的 ID
      // 任务已经在创建时使用了 AI 返回的 ID，这里只需要更新状态
      const updateResult = await taskService.updateTaskStatus(taskId, {
        status: 'processing',
      });
      
      logger.info({ 
        taskId, 
        updateSuccess: updateResult.success,
        updateError: updateResult.error
      }, 'Updated task status to processing');
      
      return;
    }
    
    if (!result.imageUrl) {
      // 同步模式但没有图片URL
      await taskService.markTaskFailed(taskId, 'No image URL returned', true);
      logger.error({ taskId }, 'No image URL returned');
      return;
    }

    logger.info({ taskId }, 'Generation successful, uploading to storage...');

    // 上传生成的图片到 Supabase Storage
    let finalImageUrl = result.imageUrl;

    // 如果返回的是 base64（Stability AI），需要上传到 Storage
    if (result.imageBuffer) {
      const uploadResult = await uploadGeneratedAvatar(result.imageBuffer, userId, taskId);

      if (!uploadResult.success || !uploadResult.url) {
        logger.error({ taskId, error: uploadResult.error }, 'Failed to upload generated image');
        await taskService.markTaskFailed(taskId, 'Failed to upload generated image', true);
        return;
      }

      finalImageUrl = uploadResult.url;
      logger.info({ taskId, url: finalImageUrl }, 'Image uploaded to storage');
    }

    // 标记任务完成
    await taskService.markTaskCompleted(taskId, {
      imageUrl: finalImageUrl,
      generationTimeMs,
      width: 1024,
      height: 1024,
    });

    logger.info({ taskId }, 'Generation completed successfully');
  } catch (error: any) {
    logger.error({ taskId, error: error.message }, 'Generation async error');
    await taskService.markTaskFailed(taskId, error.message || 'Generation failed', true);
  }
}

// ========================================
// 上传图片辅助函数
// ========================================

/**
 * 上传用户图片
 */
export async function uploadUserImage(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { uploadOriginalImage } = await import('@/infrastructure/services/storage');
    const result = await uploadOriginalImage(file, userId);

    if (!result.success || !result.url) {
      return {
        success: false,
        error: result.error || 'Upload failed',
      };
    }

    return {
      success: true,
      url: result.url,
    };
  } catch (error: any) {
    logger.error({ error: error.message }, 'Upload user image error');
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

// ========================================
// 模型检测辅助函数
// ========================================

/**
 * 检查是否为 KIE 模型
 */
export function isKieModel(aiModel: string): boolean {
  return aiModel.startsWith('kie-');
}

