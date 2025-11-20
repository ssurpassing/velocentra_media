import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUser,
  getUserProfile,
  checkCredits,
  deductCredits,
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/shared/lib/api-middleware';
import {
  validateGenerationRequest,
  buildPrompts,
  prepareTaskData,
  executeGenerationAsync,
} from '@/shared/lib/generation-helpers';
import { taskService } from '@/infrastructure/services/database/task-service';

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return authResult.response;
    }
    const { user, supabase } = authResult.context;

    // 2. 解析和验证请求数据
    const body = await request.json();
    
    // 支持新的生成模式参数
    const mode = body.mode || 'image-to-image'; // 'image-to-image' | 'text-to-image'
    const numberOfImages = body.numberOfImages || 1;
    
    // v4.1: 重试/重新生成相关字段
    const parentTaskId = body.parentTaskId as string | undefined;
    const retryFromTaskId = body.retryFromTaskId as string | undefined;
    
    const validationResult = validateGenerationRequest(body);
    
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }
    const validatedRequest = validationResult.data;

    // 3. 获取用户配置
    const profileResult = await getUserProfile(supabase, user.id);
    if (!profileResult.success) {
      return errorResponse(profileResult.error, profileResult.status);
    }
    const profile = profileResult.profile;

    // 4. 构建提示词
    const promptResult = buildPrompts(
      validatedRequest.customPrompt,
      validatedRequest.style,
      validatedRequest.isPromptOptimized
    );

    // 5. 准备任务数据
    const taskPrep = prepareTaskData(user.id, profile, validatedRequest, promptResult);

    // 6. 检查积分
    const creditCheck = checkCredits(profile, taskPrep.creditCost);
    if (!creditCheck.success) {
      return errorResponse(creditCheck.error, creditCheck.status);
    }

    // 7. 先调用 KIE API 获取 taskId（v4.0 新流程）
    const { generateAvatar } = await import('@/infrastructure/services/ai');
    const imageUrls = validatedRequest.imageUrls && validatedRequest.imageUrls.length > 0 
      ? validatedRequest.imageUrls 
      : validatedRequest.imageUrl ? [validatedRequest.imageUrl] : undefined;
    
    const aiResult = await generateAvatar({
      imageUrl: validatedRequest.imageUrl || '',
      imageUrls: imageUrls,
      prompt: taskPrep.prompt,
      negativePrompt: taskPrep.negativePrompt,
      model: validatedRequest.aiModel,
      style: validatedRequest.style,
      numberOfImages: numberOfImages,
      aspectRatio: validatedRequest.aspectRatio,
    });

    if (!aiResult.success || !aiResult.taskId) {
      return errorResponse(aiResult.error || 'Failed to start generation', 500);
    }

    const kieTaskId = aiResult.taskId;

    // 8. 使用 KIE 返回的 taskId 创建数据库记录
    const taskResult = await taskService.createTask({
      taskId: kieTaskId,  // v4.0: 使用 KIE 返回的 ID
      userId: user.id,
      style: validatedRequest.style,
      aiModel: validatedRequest.aiModel,
      originalPhotoUrl: validatedRequest.imageUrl || validatedRequest.imageUrls?.[0],
      costCredits: taskPrep.creditCost,
      membershipTypeUsed: profile.membership_tier,
      userPrompt: validatedRequest.customPrompt,
      originalPrompt: taskPrep.originalPrompt,
      optimizedPrompt: taskPrep.optimizationUsed ? taskPrep.prompt : undefined,
      generationParams: {
        aspectRatio: validatedRequest.aspectRatio,
        aiModel: validatedRequest.aiModel,
        style: validatedRequest.style,
        numberOfImages: numberOfImages,
        imageUrls: validatedRequest.imageUrls,
      },
      promptOptimized: taskPrep.optimizationUsed,
      status: 'processing',  // v4.0: 直接设为 processing
      // v4.1: 重试/重新生成相关字段
      parentTaskId: parentTaskId || retryFromTaskId || undefined,
      isFreeRetry: false, // 目前不做免费重试逻辑，统一为 false
    });

    if (!taskResult.success || !taskResult.task) {
      return errorResponse(taskResult.error || 'Failed to create task', 500);
    }

    // 9. 扣除积分
    await deductCredits(
      supabase,
      user.id,
      profile,
      taskPrep.creditCost,
      kieTaskId,
      `Generated image with ${validatedRequest.aiModel}`
    );

    // 10. v4.1: 如果是从失败任务重试而来，删除旧的失败任务记录
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
        }
      } catch (err) {
        // 删除失败不影响主流程，静默处理
      }
    }

    // 11. 立即返回任务ID（等待 KIE 回调）
    return successResponse({
      taskId: kieTaskId,
      message: 'Generation started. Poll /api/tasks/{taskId} for progress.',
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    return errorResponse(error.message || 'Generation failed', 500);
  }
}

