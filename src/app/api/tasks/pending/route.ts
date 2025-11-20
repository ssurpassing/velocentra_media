import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

export const dynamic = 'force-dynamic';

/**
 * 获取用户正在进行的任务
 * 用于页面刷新后恢复占位图片
 */
export async function GET(request: NextRequest) {
  try {
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
    const style = searchParams.get('style');

    // 构建查询
    let query = supabase
      .from('generation_tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(10);

    // 如果指定了风格，只返回该风格的任务
    if (style && style !== 'all') {
      query = query.eq('style', style);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      throw tasksError;
    }

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasks || [],
      },
    });
  } catch (error: any) {
    console.error('Get pending tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get pending tasks' },
      { status: 500 }
    );
  }
}

