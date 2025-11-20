/**
 * 视频生成 API（Veo3）
 * 
 * 重要变更（v4.0）：
 * 1. 先调用 Veo3 API 获取任务 ID
 * 2. 使用 AI 返回的 ID 创建数据库任务
 * 3. 删除 external_task_id 字段
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getUserProfile } from '@/shared/lib/api-middleware';
import { videoGenerationService } from '@/infrastructure/services/generation';
import { createVeo3Client } from '@/infrastructure/services/ai-clients/veo3';
import { calculateVideoCredits } from '@/shared/config/model-credits';
import pino from 'pino';

const logger = pino({ name: 'generate-video-api' });

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
      generationType,
      prompt,
      model = 'veo3_fast',
      aspectRatio = '16:9',
      imageUrls,
      seeds,
      enableTranslation = true,
    } = body;

    // v4.1: 重试/重新生成相关字段
    const parentTaskId = body.parentTaskId as string | undefined;
    const retryFromTaskId = body.retryFromTaskId as string | undefined;

    // 3. 验证参数
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

    // 4. 获取用户配置
    const profileResult = await getUserProfile(supabase, user.id);
    if (!profileResult.success) {
      return NextResponse.json(
        { success: false, error: profileResult.error },
        { status: profileResult.status }
      );
    }
    const profile = profileResult.profile;

    // 5. 计算积分成本
    const creditCost = calculateVideoCredits(model, '10s', 'standard');

    // 6. 获取回调 URL
    const callbackUrl = videoGenerationService.getCallbackUrl();
    logger.info({ callbackUrl, hasCallback: !!callbackUrl }, '📡 Callback URL');

    // 7. 先调用 Veo3 API 获取任务 ID
    const veo3Client = createVeo3Client();
    let veo3TaskId: string;

    try {
      let veo3Response;

      if (generationType === 'text-to-video') {
        veo3Response = await veo3Client.generateTextToVideo(prompt, {
          model,
          aspectRatio,
          seeds,
          enableTranslation,
          callbackUrl,
        });
      } else {
        const veo3GenerationType =
          generationType === 'reference-to-video'
            ? 'REFERENCE_2_VIDEO'
            : 'FIRST_AND_LAST_FRAMES_2_VIDEO';

        veo3Response = await veo3Client.generateImageToVideo(prompt, imageUrls, {
          model,
          aspectRatio,
          generationType: veo3GenerationType,
          seeds,
          enableTranslation,
          callbackUrl,
        });
      }

      if (veo3Response.code !== 200 || !veo3Response.data?.taskId) {
        throw new Error(veo3Response.msg || 'Failed to create Veo3 task');
      }

      veo3TaskId = veo3Response.data.taskId;
      logger.info({ veo3TaskId, model }, '✅ Veo3 task created successfully');
    } catch (veo3Error: any) {
      logger.error({ error: veo3Error.message }, '❌ Veo3 API call failed');
      return NextResponse.json(
        { success: false, error: veo3Error.message || 'Failed to start video generation' },
        { status: 500 }
      );
    }

    // 8. 使用 Veo3 返回的 ID 创建数据库任务
    const prepareResult = await videoGenerationService.prepareVideoGeneration({
      taskId: veo3TaskId, // 使用 Veo3 返回的 ID
      userId: user.id,
      profile,
      model: `veo-${model}`,
      prompt,
      creditCost,
      generationType,
      aspectRatio,
      imageUrls,
      seeds,
      enableTranslation,
      // v4.1: 重试/重新生成相关字段
      parentTaskId: parentTaskId || retryFromTaskId || undefined,
      isFreeRetry: false,
    });

    if (!prepareResult.success) {
      logger.error({ error: prepareResult.error, veo3TaskId }, '❌ Failed to prepare task');
      return NextResponse.json(
        { success: false, error: prepareResult.error },
        { status: prepareResult.errorCode === 'INSUFFICIENT_CREDITS' ? 403 : 500 }
      );
    }

    logger.info({ taskId: veo3TaskId, userId: user.id, model }, '📝 Video task prepared');

    // 9. v4.1: 如果是从失败任务重试而来，删除旧的失败任务记录
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

    // 10. 返回任务 ID
    return NextResponse.json({
      success: true,
      data: {
        taskId: veo3TaskId,
        message: 'Video generation started. Check status via /api/tasks/{taskId}',
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, '❌ Video generation error');
    return NextResponse.json(
      { success: false, error: error.message || 'Video generation failed' },
      { status: 500 }
    );
  }
}
