/**
 * 任务列表 API
 * 
 * 重要变更（v4.0）：
 * 1. JOIN media_files 表获取媒体文件
 * 2. 简化返回字段
 * 3. 添加缓存和性能优化
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

// 强制动态渲染（因为需要读取 cookies）
export const dynamic = 'force-dynamic';

// 内存缓存（5分钟有效期）
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const supabase = await createServerSupabaseClient();

    // 验证用户登录
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const mediaType = searchParams.get('mediaType'); // 'image' | 'video'
    const status = searchParams.get('status'); // 'pending' | 'processing' | 'completed' | 'failed'
    const offset = (page - 1) * limit;

    // 检查缓存（但如果有 _t 参数则跳过缓存）
    const skipCache = searchParams.has('_t');
    const cacheKey = `${user.id}-${page}-${limit}-${mediaType || 'all'}-${status || 'all'}`;
    
    if (!skipCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
      }
    }

    // 构建查询 - 使用 count: 'estimated' 提升性能
    let query = supabase
      .from('generation_tasks')
      .select(`
        id,
        user_id,
        status,
        media_type,
        ai_model,
        original_prompt,
        optimized_prompt,
        cost_credits,
        error_message,
        created_at,
        completed_at,
        media_files (
          id,
          url,
          thumbnail_url,
          media_type,
          width,
          height,
          duration,
          result_index
        )
      `, { count: 'estimated' }) // 使用 estimated 替代 exact，性能更好
      .eq('user_id', user.id);

    // 添加过滤条件
    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // 排序和分页
    const { data: tasks, error: tasksError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tasksError) {
      throw tasksError;
    }


    const result = {
      success: true,
      data: {
        tasks: tasks || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    };

    // 缓存结果
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get tasks' },
      { status: 500 }
    );
  }
}
