/**
 * Innovation Lab 数据获取工具
 * 用于服务端组件直接调用
 */

import { getPublicDataClient } from '@/infrastructure/database/server-client';

// 内存缓存
interface CacheEntry {
  data: any[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存

// 支持服务端组件直接调用
export async function getInnovationLabExamples(
  locale: string = 'zh',
  limit: number = 20,
  displayLocation?: 'homepage' | 'ai-image' | 'ai-video',
  mediaType?: 'video' | 'image'
) {
  try {
    // 生成缓存键
    const cacheKey = `${locale}-${limit}-${displayLocation || 'all'}-${mediaType || 'all'}`;
    
    // 检查缓存
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, data: cached.data };
    }

    // 验证环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase credentials not configured');
      return { success: true, data: [] };
    }

    let supabase;
    try {
      supabase = getPublicDataClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return { success: true, data: [] };
    }

    // 构建查询
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

    if (displayLocation) {
      query = query.eq('display_location', displayLocation);
    }

    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      console.error('Database query error:', tasksError);
      return { success: true, data: [] };
    }

    if (!tasks || tasks.length === 0) {
      return { success: true, data: [] };
    }

    // 获取媒体文件
    const taskIds = tasks.map(task => task.id);
    let mediaFiles = [];
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .in('task_id', taskIds)
        .order('result_index', { ascending: true });
      
      if (!error && data) {
        mediaFiles = data;
      }
    } catch (error) {
      console.warn('Failed to fetch media files:', error);
    }

    // 获取翻译
    let translations = [];
    try {
      const { data, error } = await supabase
        .from('generation_tasks_i18n')
        .select('*')
        .in('task_id', taskIds)
        .eq('locale', locale);
      
      if (!error && data) {
        translations = data;
      }
    } catch (error) {
      console.warn('Failed to fetch translations:', error);
    }

    // 构建映射
    const mediaMap = new Map();
    if (mediaFiles) {
      mediaFiles.forEach(file => {
        if (!mediaMap.has(file.task_id)) {
          mediaMap.set(file.task_id, []);
        }
        mediaMap.get(file.task_id).push(file);
      });
    }

    const translationsMap = new Map();
    if (translations) {
      translations.forEach(t => {
        translationsMap.set(t.task_id, t);
      });
    }

    const result = tasks.map(task => {
      const translation = translationsMap.get(task.id);
      const taskMediaFiles = mediaMap.get(task.id) || [];
      const firstMedia = taskMediaFiles[0];
      const taskMediaType = task.media_type;

      return {
        id: task.id,
        title: translation?.title || task.original_prompt?.substring(0, 100) || '示例',
        description: translation?.description || '从生成任务导入的示例',
        mediaType: taskMediaType,
        videoUrl: taskMediaType === 'video' ? firstMedia?.url : undefined,
        imageUrl: taskMediaType === 'image' ? firstMedia?.url : undefined,
        thumbnailUrl: firstMedia?.thumbnail_url,
        prompt: task.optimized_prompt || task.original_prompt,
        originalPrompt: task.original_prompt,
        optimizedPrompt: task.optimized_prompt,
        aiModel: task.ai_model,
        inputImageUrls: task.input_image_urls || [],
        generationParams: task.generation_params || {},
        targetPage: taskMediaType === 'video' ? 'ai-video' as const : 'ai-image' as const,
        displayLocation: task.display_location,
        displayOrder: task.display_order,
        createdAt: task.created_at,
      };
    });

    // 缓存结果
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Innovation lab fetch error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    // 返回空数据而不是错误，避免页面崩溃
    return { success: true, data: [] };
  }
}

