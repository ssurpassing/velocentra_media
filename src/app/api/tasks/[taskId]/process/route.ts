/**
 * 任务状态处理 API
 * 主动查询 KIE 任务状态，用于错过回调的情况
 * 
 * 更新（v4.0）：
 * 1. 删除 external_task_id（任务 ID 直接使用 AI 返回的 ID）
 * 2. 使用 media_files 而不是 generated_photos
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/infrastructure/database/server-client';
import { createVeo3Client } from '@/infrastructure/services/ai-clients/veo3';
import { createSora2QueryClient } from '@/infrastructure/services/ai-clients/sora2';
import { MediaFileService } from '@/infrastructure/services/database/media-file-service';
import pino from 'pino';

const logger = pino({ name: 'task-process' });

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = await params;
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    // 验证用户登录
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select(`
        *,
        media_files (*)
      `)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 如果任务已经完成或失败，直接返回
    if (task.status === 'completed' || task.status === 'failed') {
      return NextResponse.json({
        success: true,
        data: { task },
      });
    }

    // 根据 AI 模型类型，主动查询任务状态
    const isVeo3Task = task.ai_model?.includes('veo');
    const isSora2Task = task.ai_model?.includes('sora');
    const isKieImageTask = task.ai_model?.includes('nano-banana') || task.ai_model?.includes('gpt4o');
    
    if (isKieImageTask) {
      logger.info({ 
        taskId, 
        status: task.status,
        aiModel: task.ai_model
      }, '🔍 主动查询 KIE 图片任务状态');

      try {
        const { getKieImageClient } = await import('@/infrastructure/services/ai-clients');
        const kieImageClient = getKieImageClient();
        const kieStatus = await kieImageClient.getTaskStatus(taskId);

        logger.info({ 
          taskId,
          kieState: kieStatus.state,
          hasResults: !!kieStatus.resultUrls?.length
        }, '📊 KIE 图片任务状态');

        // 如果 KIE 那边已经完成，更新数据库
        if (kieStatus.state === 'success' || kieStatus.state === 'completed') {
          const imageUrls = kieStatus.resultUrls || [];
          
          if (imageUrls.length > 0) {
            logger.info({ taskId, imageCount: imageUrls.length }, '✅ 从 KIE 获取到图片结果，更新数据库');

            // 创建 media_files 记录
            const mediaFiles = imageUrls.map((url, index) => ({
              task_id: taskId,
              user_id: task.user_id,
              media_type: 'image' as const,
              url: url,
              thumbnail_url: url,
              original_url: url,
              storage_status: 'original_only' as const,
              result_index: index,
              width: 1024,
              height: 1024,
            }));

            await MediaFileService.createMediaFiles(mediaFiles);

            // 使用 admin client 更新任务状态
            const { error: updateError } = await adminSupabase
              .from('generation_tasks')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', taskId);

            if (updateError) {
              logger.error({ error: updateError }, '更新任务状态失败');
            } else {
              logger.info({ taskId }, '✅ 任务状态已更新为 completed');
              
              // 返回更新后的任务
              const { data: updatedTask } = await supabase
                .from('generation_tasks')
                .select(`
                  *,
                  media_files (*)
                `)
                .eq('id', taskId)
                .single();

              return NextResponse.json({
                success: true,
                data: { task: updatedTask },
              });
            }
          }
        } else if (kieStatus.state === 'failed') {
          // KIE 任务失败
          logger.warn({ taskId, error: kieStatus.error }, '❌ KIE 图片任务失败');

          const { error: updateError } = await adminSupabase
            .from('generation_tasks')
            .update({
              status: 'failed',
              error_message: kieStatus.error?.message || 'Image generation failed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', taskId);

          if (!updateError) {
            const { data: updatedTask } = await supabase
              .from('generation_tasks')
              .select(`
                *,
                media_files (*)
              `)
              .eq('id', taskId)
              .single();

            return NextResponse.json({
              success: true,
              data: { task: updatedTask },
            });
          }
        }
      } catch (kieError: any) {
        logger.error({ 
          taskId, 
          error: kieError.message 
        }, '❌ 查询 KIE 图片任务失败');
        // 继续返回原任务状态，不报错
      }
    } else if (isVeo3Task) {
      logger.info({ 
        taskId, 
        status: task.status,
        aiModel: task.ai_model
      }, '🔍 主动查询 Veo3 任务状态');

      try {
        const veo3Client = createVeo3Client();
        const kieStatus = await veo3Client.getTaskStatus(taskId);

        logger.info({ 
          taskId,
          kieState: kieStatus.state,
          hasResults: !!kieStatus.resultUrls?.length
        }, '📊 KIE 任务状态');

        // 如果 KIE 那边已经完成，更新数据库
        if (kieStatus.state === 'success' || kieStatus.state === 'completed') {
          const videoUrls = kieStatus.resultUrls || [];
          
          if (videoUrls.length > 0) {
            logger.info({ taskId, videoCount: videoUrls.length }, '✅ 从 KIE 获取到视频结果，更新数据库');

            // 创建 media_files 记录
            const mediaFiles = videoUrls.map((url, index) => ({
              task_id: taskId,
              user_id: task.user_id,
              media_type: 'video' as const,
              url: url,
              thumbnail_url: url,
              original_url: url,
              storage_status: 'original_only' as const,
              result_index: index,
              width: 1920,
              height: 1080,
            }));

            await MediaFileService.createMediaFiles(mediaFiles);

            // 使用 admin client 更新任务状态
            const { error: updateError } = await adminSupabase
              .from('generation_tasks')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', taskId);

            if (updateError) {
              logger.error({ error: updateError }, '更新任务状态失败');
            } else {
              logger.info({ taskId }, '✅ 任务状态已更新为 completed');
              
              // 返回更新后的任务
              const { data: updatedTask } = await supabase
                .from('generation_tasks')
                .select(`
                  *,
                  media_files (*)
                `)
                .eq('id', taskId)
                .single();

              return NextResponse.json({
                success: true,
                data: { task: updatedTask },
              });
            }
          }
        } else if (kieStatus.state === 'failed') {
          // KIE 任务失败
          logger.warn({ taskId, error: kieStatus.error }, '❌ KIE 任务失败');

          const { error: updateError } = await adminSupabase
            .from('generation_tasks')
            .update({
              status: 'failed',
              error_message: kieStatus.error?.message || 'Video generation failed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', taskId);

          if (!updateError) {
            const { data: updatedTask } = await supabase
              .from('generation_tasks')
              .select(`
                *,
                media_files (*)
              `)
              .eq('id', taskId)
              .single();

            return NextResponse.json({
              success: true,
              data: { task: updatedTask },
            });
          }
        }
      } catch (kieError: any) {
        logger.error({ 
          taskId, 
          error: kieError.message 
        }, '❌ 查询 KIE 任务失败');
        // 继续返回原任务状态，不报错
      }
    } else if (isSora2Task) {
      logger.info({ 
        taskId, 
        status: task.status,
        aiModel: task.ai_model
      }, '🔍 主动查询 Sora2 任务状态');

      try {
        const sora2Client = createSora2QueryClient();
        const sora2Status = await sora2Client.getTaskStatus(taskId);

        logger.info({ 
          taskId,
          state: sora2Status.state,
          hasResults: !!sora2Status.resultUrls?.length
        }, '📊 Sora2 任务状态');

        // 如果 Sora2 任务已经完成，更新数据库
        if (sora2Status.state === 'success') {
          const videoUrls = sora2Status.resultUrls || [];
          
          if (videoUrls.length > 0) {
            logger.info({ taskId, videoCount: videoUrls.length }, '✅ 从 Sora2 获取到视频结果，更新数据库');

            // 创建 media_files 记录
            const mediaFiles = videoUrls.map((url, index) => ({
              task_id: taskId,
              user_id: task.user_id,
              media_type: 'video' as const,
              url: url,
              thumbnail_url: url,
              original_url: url,
              storage_status: 'original_only' as const,
              result_index: index,
              width: 1920,
              height: 1080,
            }));

            await MediaFileService.createMediaFiles(mediaFiles);

            // 使用 admin client 更新任务状态
            const { error: updateError } = await adminSupabase
              .from('generation_tasks')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', taskId);

            if (updateError) {
              logger.error({ error: updateError }, '更新任务状态失败');
            } else {
              logger.info({ taskId }, '✅ 任务状态已更新为 completed');
              
              // 返回更新后的任务
              const { data: updatedTask } = await supabase
                .from('generation_tasks')
                .select(`
                  *,
                  media_files (*)
                `)
                .eq('id', taskId)
                .single();

              return NextResponse.json({
                success: true,
                data: { task: updatedTask },
              });
            }
          }
        } else if (sora2Status.state === 'fail') {
          // Sora2 任务失败
          logger.warn({ taskId, error: sora2Status.error }, '❌ Sora2 任务失败');

          const { error: updateError } = await adminSupabase
            .from('generation_tasks')
            .update({
              status: 'failed',
              error_message: sora2Status.error?.message || 'Video generation failed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', taskId);

          if (!updateError) {
            const { data: updatedTask } = await supabase
              .from('generation_tasks')
              .select(`
                *,
                media_files (*)
              `)
              .eq('id', taskId)
              .single();

            return NextResponse.json({
              success: true,
              data: { task: updatedTask },
            });
          }
        }
      } catch (sora2Error: any) {
        logger.error({ 
          taskId, 
          error: sora2Error.message 
        }, '❌ 查询 Sora2 任务失败');
        // 继续返回原任务状态，不报错
      }
    }

    // 返回当前任务状态
    return NextResponse.json({
      success: true,
      data: { task },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, '❌ Process task error');
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
