/**
 * 查询任务状态 API
 * 
 * 重要变更（v4.0）：
 * 1. JOIN media_files 表获取媒体文件
 * 2. 删除 generated_photos、current_stage、stage_progress 等字段
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = await params;

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

    // 获取任务信息（JOIN media_files）
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select(`
        id,
        user_id,
        status,
        media_type,
        ai_model,
        original_prompt,
        optimized_prompt,
        prompt_optimized,
        input_image_urls,
        generation_params,
        cost_credits,
        error_message,
        generation_time_ms,
        prompt_optimization_time_ms,
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
          format,
          file_size,
          storage_status,
          result_index,
          created_at
        )
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

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get task' },
      { status: 500 }
    );
  }
}

/**
 * 删除任务 API
 * 只能删除未完成的任务（pending、processing、failed状态）
 * 删除时会退还积分
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = await params;

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

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 只能删除未完成的任务（不能删除已完成的任务）
    if (task.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete completed tasks' },
        { status: 400 }
      );
    }

    // 删除任务（CASCADE 会自动删除关联的 media_files）
    const { error: deleteError } = await supabase
      .from('generation_tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error(`[DELETE] Failed to delete task ${taskId}:`, deleteError);
      throw deleteError;
    }

    // 退还积分
    if (task.cost_credits > 0) {
      // 获取用户当前积分
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('credits, free_generations_remaining, membership_tier')
        .eq('id', user.id)
        .single();

      if (profile) {
        // 判断是否是免费用户
        const isFreeUser = profile.membership_tier === 'free';
        
        if (isFreeUser && task.cost_credits === 0) {
          // 退还免费次数
          const newFreeGenerations = profile.free_generations_remaining + 1;
          await supabase
            .from('user_profiles')
            .update({ free_generations_remaining: newFreeGenerations })
            .eq('id', user.id);
        } else {
          // 退还积分
          const newCredits = profile.credits + task.cost_credits;
          await supabase
            .from('user_profiles')
            .update({ credits: newCredits })
            .eq('id', user.id);

          // 记录积分历史
          await supabase.from('credit_history').insert({
            user_id: user.id,
            amount: task.cost_credits,
            type: 'refund',
            balance_after: newCredits,
            task_id: taskId,
            description: `Task cancelled - refund ${task.cost_credits} credits`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Task deleted successfully',
        refundedCredits: task.cost_credits,
      },
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete task' },
      { status: 500 }
    );
  }
}
