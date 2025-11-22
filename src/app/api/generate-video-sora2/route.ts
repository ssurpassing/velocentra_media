/**
 * Sora 2 视频生成 API
 * 
 * 重要变更（v4.0）：
 * 1. 先调用 Sora 2 API 获取任务 ID
 * 2. 使用 AI 返回的 ID 创建数据库任务
 * 3. 删除 external_task_id 字段
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getUserProfile, deductCredits } from '@/shared/lib/api-middleware';
import { videoGenerationService } from '@/infrastructure/services/generation';
import { createSora2Client } from '@/infrastructure/services/ai-clients/sora2';
import { calculateVideoCredits } from '@/shared/config/model-credits';
import { Sora2Model, Sora2AspectRatio, Sora2Frames } from '@/infrastructure/services/ai-clients/sora2/types';
import pino from 'pino';

const logger = pino({ name: 'generate-video-sora2-api' });

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return authResult.response;
    }
    const { user, supabase } = authResult.context;

    // 2. 解析请求数据
    const body = await request.json();
    const {
      model,
      prompt,
      aspectRatio: rawAspectRatio = '16:9',
      nFrames = '10',
      removeWatermark = false,
      imageUrls,
      quality = 'standard',
      scenes, // Storyboard 场景列表
    } = body;

    // v4.1: 重试/重新生成相关字段
    const parentTaskId = body.parentTaskId as string | undefined;
    const retryFromTaskId = body.retryFromTaskId as string | undefined;

    // 转换宽高比格式：'16:9' | '9:16' | 'Auto' -> 'landscape' | 'portrait'
    let aspectRatio: Sora2AspectRatio = 'landscape';
    if (rawAspectRatio === '9:16') {
      aspectRatio = 'portrait';
    } else if (rawAspectRatio === '16:9') {
      aspectRatio = 'landscape';
    } else if (rawAspectRatio === 'Auto') {
      aspectRatio = 'landscape'; // Auto 默认使用 landscape
    } else {
      // 处理其他可能的格式
      logger.warn({ rawAspectRatio }, '⚠️ Unknown aspect ratio format, using landscape as default');
      aspectRatio = 'landscape';
    }

    logger.info({ 
      userId: user.id, 
      model, 
      prompt: prompt?.substring(0, 100),
      rawAspectRatio,
      aspectRatio,
      nFrames,
      quality,
    }, '📥 Sora 2 视频生成请求');

    // 3. Pro 模型权限检查
    const isProModel = model?.includes('pro');
    if (isProModel) {
      // 获取用户配置检查是否为付费用户
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('membership_tier, subscription_end_date, credits')
        .eq('id', user.id)
        .single();

      // 付费用户判断：
      // 1. membership_tier 为 'subscription' 且订阅未过期
      // 2. 或者 membership_tier 为 'credits' 且有足够积分
      const isSubscriptionActive = 
        userProfile?.membership_tier === 'subscription' &&
        userProfile?.subscription_end_date &&
        new Date(userProfile.subscription_end_date) > new Date();
      
      const hasCredits = 
        userProfile?.membership_tier === 'credits' &&
        (userProfile?.credits || 0) > 0;

      const isPaidUser = isSubscriptionActive || hasCredits;

      if (!isPaidUser) {
        logger.warn({ userId: user.id, model, userProfile }, '⛔ Pro 模型仅限付费用户');
        return NextResponse.json(
          { 
            success: false, 
            error: 'PRO_MODEL_REQUIRES_SUBSCRIPTION',
            message: 'Sora 2 Pro models are only available for paid subscribers or users with credits. Please upgrade your plan.'
          },
          { status: 403 }
        );
      }
    }

    // 4. 验证参数
    const generationType = model?.includes('image-to-video') ? 'image-to-video' : 'text-to-video';
    const validation = videoGenerationService.validateVideoRequest({
      model,
      prompt,
      generationType,
      imageUrls,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 5. Pro 模型 n_frames 限制（仅支持 10s 和 15s）
    if (isProModel && nFrames === '25') {
      logger.warn({ userId: user.id, model, nFrames }, '⚠️ Pro 模型不支持 25s 时长');
      return NextResponse.json(
        { 
          success: false, 
          error: 'PRO_MODEL_DURATION_LIMIT',
          message: 'Sora 2 Pro models only support 10s and 15s duration'
        },
        { status: 400 }
      );
    }

    // 6. 获取用户配置
    const profileResult = await getUserProfile(supabase, user.id);
    if (!profileResult.success) {
      return NextResponse.json(
        { success: false, error: profileResult.error },
        { status: profileResult.status }
      );
    }
    const profile = profileResult.profile;

    // 7. 计算积分成本
    const duration = (nFrames === '10' ? '10s' : nFrames === '15' ? '15s' : '25s') as '10s' | '15s' | '25s';
    const creditCost = calculateVideoCredits(
      model as Sora2Model,
      duration,
      quality
    );

    logger.info({ creditCost, model, duration, quality }, '💰 积分成本计算');

    // 8. 获取回调 URL
    const callbackUrl = videoGenerationService.getCallbackUrl();
    logger.info({ callbackUrl, hasCallback: !!callbackUrl }, '📡 回调 URL');

    // 9. 先调用 Sora 2 API 获取任务 ID
    const sora2Client = createSora2Client();
    let sora2TaskId: string;

    try {
      // 根据模型类型调用不同的方法
      if (model === 'sora-2-text-to-video') {
        sora2TaskId = await sora2Client.textToVideo(prompt, {
          aspectRatio: aspectRatio as Sora2AspectRatio,
          nFrames: nFrames as Sora2Frames,
          removeWatermark,
          callbackUrl,
        });
      } else if (model === 'sora-2-image-to-video') {
        sora2TaskId = await sora2Client.imageToVideo(prompt, {
          imageUrls,
          aspectRatio: aspectRatio as Sora2AspectRatio,
          nFrames: nFrames as Sora2Frames,
          removeWatermark,
          callbackUrl,
        });
      } else if (model === 'sora-2-pro-text-to-video') {
        sora2TaskId = await sora2Client.proTextToVideo(prompt, {
          aspectRatio: aspectRatio as Sora2AspectRatio,
          nFrames: nFrames as Sora2Frames,
          removeWatermark,
          quality,
          callbackUrl,
        });
      } else if (model === 'sora-2-pro-image-to-video') {
        sora2TaskId = await sora2Client.proImageToVideo(prompt, {
          imageUrls,
          aspectRatio: aspectRatio as Sora2AspectRatio,
          nFrames: nFrames as Sora2Frames,
          removeWatermark,
          quality,
          callbackUrl,
        });
      } else if (model === 'sora-2-pro-storyboard') {
        // Storyboard 模式：支持多场景数组
        const storyboardScenes = scenes && Array.isArray(scenes) && scenes.length > 0
          ? scenes
          : [{ prompt, duration: parseFloat(nFrames) || 15 }]; // 回退到单场景
        
        logger.info({ scenesCount: storyboardScenes.length }, '🎬 Storyboard 场景数量');
        
        sora2TaskId = await sora2Client.proStoryboard({
          scenes: storyboardScenes,
          nFrames: nFrames as Sora2Frames, // ✅ 必填：视频总时长
          imageUrls,
          aspectRatio: aspectRatio as Sora2AspectRatio,
          callbackUrl,
        });
      } else if (model === 'sora-watermark-remover') {
        if (!imageUrls || imageUrls.length === 0) {
          throw new Error('Video URL required for watermark removal');
        }
        sora2TaskId = await sora2Client.removeWatermark({
          videoUrl: imageUrls[0],
          callbackUrl,
        });
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }

      logger.info({ sora2TaskId, model }, '✅ Sora 2 任务创建成功');
    } catch (apiError: any) {
      logger.error({ error: apiError.message }, '❌ Sora 2 API 调用失败');
      return NextResponse.json(
        { success: false, error: apiError.message || 'Failed to generate video' },
        { status: 500 }
      );
    }

    // 10. 使用 Sora 2 返回的 ID 创建数据库任务
    const prepareResult = await videoGenerationService.prepareVideoGeneration({
      taskId: sora2TaskId, // 使用 Sora 2 返回的 ID
      userId: user.id,
      profile,
      model,
      prompt,
      creditCost,
      aspectRatio: rawAspectRatio, // 保存原始格式到数据库
      nFrames,
      imageUrls,
      removeWatermark,
      quality,
      // v4.1: 重试/重新生成相关字段
      parentTaskId: parentTaskId || retryFromTaskId || undefined,
      isFreeRetry: false,
    });

    if (!prepareResult.success) {
      logger.error({ error: prepareResult.error, sora2TaskId }, '❌ Failed to prepare task');
      return NextResponse.json(
        { success: false, error: prepareResult.error },
        { status: prepareResult.errorCode === 'INSUFFICIENT_CREDITS' ? 403 : 500 }
      );
    }

    logger.info({ taskId: sora2TaskId, userId: user.id, model }, '📝 任务已创建');

    // 11. 扣除积分并记录历史
    const deductResult = await deductCredits(
      supabase,
      user.id,
      profile,
      creditCost,
      sora2TaskId,
      `Generated video with ${model}`
    );
    
    if (!deductResult.success) {
      logger.error({ error: deductResult.error }, '❌ Failed to deduct credits');
    } else {
      logger.info({ credits: creditCost, taskId: sora2TaskId }, '✅ Credits deducted');
    }

    // 12. v4.1: 如果是从失败任务重试而来，删除旧的失败任务记录
    if (retryFromTaskId) {
      try {
        const { data: oldTask } = await supabase
          .from('generation_tasks')
          .select('status')
          .eq('id', retryFromTaskId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (oldTask && oldTask.status === 'failed') {
          await supabase
            .from('generation_tasks')
            .delete()
            .eq('id', retryFromTaskId)
            .eq('user_id', user.id);
          
          logger.info({ oldTaskId: retryFromTaskId }, 'Deleted old failed task');
        }
      } catch (err) {
        // 删除失败不影响主流程，只记录日志
        logger.error({ error: err }, 'Failed to delete old task');
      }
    }

    // 12. 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        taskId: sora2TaskId,
        message: 'Video generation task created successfully',
      },
    });

  } catch (error: any) {
    logger.error({ error: error.message }, '❌ 处理请求失败');
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
