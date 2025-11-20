import { NextRequest, NextResponse } from 'next/server';
import { getPublicDataClient } from '@/infrastructure/database/server-client';

export const dynamic = 'force-dynamic';

// 内存缓存（10分钟有效期）
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10分钟

/**
 * 获取任务详情用于"制作同款"功能
 * 返回完整的生成参数，包括输入图片、模型参数等
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'zh';

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // 检查缓存
    const cacheKey = `${taskId}-${locale}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    // 使用公共客户端，允许访问带有 display_location 的任务
    const supabase = getPublicDataClient();

    // 并行获取所有数据以提升性能
    const [
      { data: task, error: taskError },
      { data: mediaFiles },
      { data: translation },
    ] = await Promise.all([
      // 获取任务详情
      supabase
        .from('generation_tasks')
        .select(`
          id,
          media_type,
          status,
          ai_model,
          original_prompt,
          optimized_prompt,
          prompt_optimized,
          input_image_urls,
          generation_params,
          display_location,
          created_at,
          completed_at,
          cost_credits,
          error_message
        `)
        .eq('id', taskId)
        .single(),
      // 获取任务的媒体文件
      supabase
        .from('media_files')
        .select('*')
        .eq('task_id', taskId)
        .order('result_index', { ascending: true }),
      // 获取翻译
      supabase
        .from('generation_tasks_i18n')
        .select('title, description')
        .eq('task_id', taskId)
        .eq('locale', locale)
        .maybeSingle(), // 使用 maybeSingle 避免没有翻译时报错
    ]);


    if (taskError) {
      console.error('[Task Details API] Task error:', taskError);
      return NextResponse.json(
        { success: false, error: taskError.message || 'Task not found' },
        { status: 404 }
      );
    }

    if (!task) {
      console.error('[Task Details API] Task not found');
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 构建返回数据 - 使用前端期望的嵌套结构
    const result = {
      id: task.id,
      mediaType: task.media_type,
      status: task.status,
      createdAt: task.created_at,
      completedAt: task.completed_at,
      // 嵌套的 prompts 对象
      prompts: {
        userInput: task.original_prompt,  // 用户输入的提示词
        original: task.original_prompt,   // 原始提示词
        optimized: task.optimized_prompt, // 优化后的提示词
        llmOptimizationUsed: task.prompt_optimized, // 是否使用了 LLM 优化
        promptOptimized: task.prompt_optimized,
      },
      // 嵌套的 generation 对象
      generation: {
        aiModel: task.ai_model,
        params: task.generation_params || {},
        inputImageUrls: task.input_image_urls || [],
      },
      // 嵌套的 cost 对象
      cost: {
        credits: task.cost_credits || 0,
      },
      // 性能数据（如果需要的话）
      performance: {
        promptOptimizationTimeMs: null,
        generationTimeMs: null,
        totalTimeMs: null,
      },
      // 错误信息
      error: task.error_message || null,
      // 媒体文件
      mediaFiles: mediaFiles || [],
      // 便捷字段
      displayLocation: task.display_location,
      mediaUrl: mediaFiles && mediaFiles.length > 0 ? mediaFiles[0].url : null,
      thumbnailUrl: mediaFiles && mediaFiles.length > 0 ? mediaFiles[0].thumbnail_url : null,
      // 翻译字段
      title: translation?.title || task.original_prompt,
      description: translation?.description || task.optimized_prompt,
      // 向后兼容的字段
      originalPrompt: task.original_prompt,
      optimizedPrompt: task.optimized_prompt,
      aiModel: task.ai_model,
      inputImageUrls: task.input_image_urls || [],
      generationParams: task.generation_params || {},
    };

    // 缓存结果
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Task Details API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch task details',
      },
      { status: 500 }
    );
  }
}
