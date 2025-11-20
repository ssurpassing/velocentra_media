import { NextRequest, NextResponse } from 'next/server';
import { getPublicDataClient } from '@/infrastructure/database/server-client';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1小时重新验证

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'zh';
    const limit = parseInt(searchParams.get('limit') || '20');
    const mediaType = searchParams.get('media_type'); // 'video', 'image', or undefined for all
    const displayLocation = searchParams.get('display_location'); // 'homepage', 'ai-image', 'ai-video'

    const supabase = getPublicDataClient();

    // 构建查询 - 从 generation_tasks 获取展示任务
    let query = supabase
      .from('generation_tasks')
      .select(`
        id,
        media_type,
        ai_model,
        original_prompt,
        optimized_prompt,
        input_image_urls,
        generation_params,
        display_location,
        display_order,
        created_at
      `)
      .eq('status', 'completed')
      .not('display_location', 'is', null)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    // 如果指定了展示位置，添加过滤
    if (displayLocation) {
      query = query.eq('display_location', displayLocation);
    }

    // 如果指定了媒体类型，添加过滤
    if (mediaType && (mediaType === 'video' || mediaType === 'image')) {
      query = query.eq('media_type', mediaType);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      throw tasksError;
    }


    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 获取这些任务的媒体文件
    const taskIds = tasks.map(task => task.id);
    
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media_files')
      .select('*')
      .in('task_id', taskIds)
      .order('result_index', { ascending: true });

    if (mediaError) {
      // 即使媒体文件获取失败，也返回基础数据
    }

    // 获取国际化翻译
    const { data: translations, error: translationsError } = await supabase
      .from('generation_tasks_i18n')
      .select('*')
      .in('task_id', taskIds)
      .eq('locale', locale);

    if (translationsError) {
      // 即使翻译失败，也返回基础数据
    }

    // 构建媒体文件映射
    const mediaMap = new Map();
    if (mediaFiles) {
      mediaFiles.forEach(file => {
        if (!mediaMap.has(file.task_id)) {
          mediaMap.set(file.task_id, []);
        }
        mediaMap.get(file.task_id).push(file);
      });
    }

    // 构建翻译映射
    const translationsMap = new Map();
    if (translations) {
      translations.forEach(t => {
        translationsMap.set(t.task_id, t);
      });
    }

    // 组合数据
    const result = tasks.map(task => {
      const translation = translationsMap.get(task.id);
      const taskMediaFiles = mediaMap.get(task.id) || [];
      const firstMedia = taskMediaFiles[0];
      const mediaType = task.media_type;
      
      return {
        id: task.id,
        // 使用翻译的标题和描述，如果没有则使用提示词作为标题
        title: translation?.title || task.original_prompt?.substring(0, 100) || '示例',
        description: translation?.description || '从生成任务导入的示例',
        // 媒体信息
        mediaType: mediaType,
        // 根据类型设置对应的URL
        videoUrl: mediaType === 'video' ? firstMedia?.url : undefined,
        imageUrl: mediaType === 'image' ? firstMedia?.url : undefined,
        thumbnailUrl: firstMedia?.thumbnail_url,
        // 生成参数 - 完整返回用于制作同款
        prompt: task.optimized_prompt || task.original_prompt,
        originalPrompt: task.original_prompt,
        optimizedPrompt: task.optimized_prompt,
        aiModel: task.ai_model,
        inputImageUrls: task.input_image_urls || [],
        generationParams: task.generation_params || {},
        // 设置目标页面
        targetPage: mediaType === 'video' ? 'ai-video' as const : 'ai-image' as const,
        // 元数据
        displayLocation: task.display_location,
        displayOrder: task.display_order,
        createdAt: task.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      locale,
      count: result.length,
    });
  } catch (error: any) {
    console.error('Innovation lab API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch innovation lab examples',
        data: [],
      },
      { status: 500 }
    );
  }
}
