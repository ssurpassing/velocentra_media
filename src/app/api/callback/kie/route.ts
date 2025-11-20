/**
 * kie.ai 回调处理端点
 * 处理来自 GPT-4o Image、Nano Banana、Sora、Veo3 的回调
 * 
 * 重要变更（v4.0）：
 * 1. 任务 ID 直接使用 KIE 返回的 ID（不再有 external_task_id）
 * 2. 创建 media_files 记录而不是更新 generated_media
 */

import { NextRequest, NextResponse } from 'next/server';
import pino from 'pino';
import { createAdminClient } from '@/infrastructure/database/server-client';
import { MediaFileService } from '@/infrastructure/services/database/media-file-service';
import type { MediaFileInsert } from '@/shared/types';

const logger = pino({ name: 'kie-callback' });

/**
 * 判断是否是视频任务
 */
function isVideoTask(aiModel: string): boolean {
  return aiModel?.includes('veo') || aiModel?.includes('sora') || aiModel?.includes('video');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    logger.info({ body }, 'Received kie.ai callback');
    
    const { code, data, msg } = body;
    
    if (!data?.taskId) {
      logger.warn({ body }, 'Callback missing taskId');
      return NextResponse.json({ 
        success: false, 
        message: 'Missing taskId' 
      }, { status: 400 });
    }
    
    const supabase = createAdminClient();
    const taskId = data.taskId; // 直接使用 KIE 的 taskId
    
    if (code === 200) {
      // 成功回调
      const { info, completeTime, costTime, consumeCredits, resultJson } = data;
      
      // 提取结果URLs（兼容不同的字段名和格式）
      let resultUrls: string[] = [];
      let watermarkUrls: string[] = [];
      
      // 优先尝试 resultJson（Nano Banana、Sora 2、Veo 3 格式）
      if (resultJson) {
        try {
          const result = JSON.parse(resultJson);
          resultUrls = result.resultUrls || result.result_urls || [];
          
          // Sora 2 可能包含带水印的视频 URL
          if (result.resultWaterMarkUrls) {
            watermarkUrls = result.resultWaterMarkUrls;
          }
        } catch (e) {
          logger.warn({ resultJson, error: e }, 'Failed to parse resultJson');
        }
      }
      
      // 如果没有 resultJson，尝试 info 字段（GPT-4o 格式）
      if (resultUrls.length === 0 && info) {
        if (info.result_urls) {
          resultUrls = info.result_urls;
        } else if (info.resultUrls) {
          resultUrls = info.resultUrls;
        }
      }
      
      logger.info({ 
        taskId, 
        resultUrls, 
        costTime, 
        consumeCredits 
      }, 'Task completed successfully');
      
      // 查找对应的数据库任务（直接使用 taskId）
      const { data: task, error: queryError } = await supabase
        .from('generation_tasks')
        .select('id, status, ai_model, media_type, user_id')
        .eq('id', taskId)
        .single();
      
      if (!task) {
        logger.error({ taskId }, 'Could not find database task');
        return NextResponse.json({ 
          success: false, 
          message: 'Task not found' 
        }, { status: 404 });
      }
      
      // 判断是视频任务还是图片任务
      const isVideo = task.media_type === 'video' || isVideoTask(task.ai_model);
      
      logger.info({ taskId, isVideo, aiModel: task.ai_model }, 'Task type determined');
      
      // 更新数据库中的任务状态
      const updateData: any = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        generation_time_ms: costTime,
      };
      
      const { error: taskError } = await supabase
        .from('generation_tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (taskError) {
        logger.error({ taskId, error: taskError }, 'Failed to update task');
      } else {
        logger.info({ taskId, status: 'completed' }, 'Task updated successfully');
      }
      
      // 创建媒体文件记录
      if (resultUrls.length > 0) {
        try {
          const mediaFiles: MediaFileInsert[] = resultUrls.map((url, index) => ({
            task_id: taskId,
            user_id: task.user_id,
            media_type: isVideo ? 'video' : 'image',
            url: url,
            thumbnail_url: url,
            original_url: url,
            storage_status: 'original_only',
            result_index: index,
            // 视频的默认尺寸（可以后续更新）
            width: isVideo ? 1920 : 1024,
            height: isVideo ? 1080 : 1024,
          }));

          await MediaFileService.createMediaFiles(mediaFiles);
          
          logger.info({ 
            taskId, 
            mediaCount: mediaFiles.length,
            isVideo 
          }, 'Media files created successfully');
        } catch (mediaError: any) {
          logger.error({ 
            taskId, 
            error: mediaError.message 
          }, 'Failed to create media files');
        }
      }
      
      // 如果有带水印的 URL（Sora 2），也创建记录
      if (watermarkUrls.length > 0) {
        try {
          const watermarkFiles: MediaFileInsert[] = watermarkUrls.map((url, index) => ({
            task_id: taskId,
            user_id: task.user_id,
            media_type: 'video',
            url: url,
            thumbnail_url: url,
            original_url: url,
            storage_status: 'original_only',
            result_index: resultUrls.length + index, // 放在无水印版本之后
            width: 1920,
            height: 1080,
          }));

          await MediaFileService.createMediaFiles(watermarkFiles);
          
          logger.info({ 
            taskId, 
            watermarkCount: watermarkFiles.length 
          }, 'Watermark media files created');
        } catch (watermarkError: any) {
          logger.error({ 
            taskId, 
            error: watermarkError.message 
          }, 'Failed to create watermark media files');
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Callback processed successfully',
        taskId: taskId,
      });
      
    } else if (code === 501) {
      // 失败回调
      const { failMsg, failCode } = data;
      
      logger.error({ taskId, failMsg, failCode }, 'Task failed');
      
      // 查找对应的数据库任务
      const { data: failedTask, error: queryError } = await supabase
        .from('generation_tasks')
        .select('id, status')
        .eq('id', taskId)
        .single();
      
      if (!failedTask) {
        logger.error({ taskId }, 'Could not find database task for failed callback');
        return NextResponse.json({ 
          success: false, 
          message: 'Task not found' 
        }, { status: 404 });
      }
      
      // 更新任务状态
      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: failMsg || msg || 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      
      logger.info({ taskId }, 'Failed task updated');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Failure callback processed',
        taskId: taskId,
      });
      
    } else {
      // 其他状态码
      logger.warn({ code, taskId, msg }, 'Unexpected callback code');
      
      return NextResponse.json({ 
        success: false, 
        message: `Unexpected code: ${code}`,
        taskId,
      }, { status: 400 });
    }
    
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Callback processing failed');
    
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * GET 用于验证端点是否可访问
 * 可用于测试回调URL的连通性
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'kie.ai callback handler',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: '/api/callback/kie - 处理回调',
      GET: '/api/callback/kie - 健康检查',
    },
  });
}
