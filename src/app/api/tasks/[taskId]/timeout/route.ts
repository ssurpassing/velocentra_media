/**
 * 任务超时处理 API
 * 前端轮询3分钟后调用此API标记任务为超时失败
 * 
 * 更新（v4.0）：
 * 1. 删除 generated_photos 表的更新（不再需要）
 * 2. 简化积分退还逻辑
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

export async function POST(
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

    // 只处理pending或processing状态的任务
    if (task.status !== 'pending' && task.status !== 'processing') {
      return NextResponse.json(
        { success: false, error: 'Task is not in pending or processing state' },
        { status: 400 }
      );
    }

    // 更新任务状态为失败
    await supabase
      .from('generation_tasks')
      .update({
        status: 'failed',
        error_message: 'Generation timed out after 3 minutes',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    // 返还积分
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('credits, membership_tier, free_generations_remaining')
      .eq('id', user.id)
      .single();

    if (profile) {
      if (profile.membership_tier === 'free' && task.cost_credits === 0) {
        // 返还免费次数
        await supabase
          .from('user_profiles')
          .update({
            free_generations_remaining: profile.free_generations_remaining + 1,
          })
          .eq('id', user.id);

        await supabase.from('credit_history').insert({
          user_id: user.id,
          amount: 0,
          type: 'refund',
          balance_after: profile.credits,
          task_id: taskId,
          description: 'Generation timed out - free attempt refunded',
        });
      } else if (task.cost_credits > 0) {
        // 返还积分
        const creditCost = task.cost_credits;
        const newBalance = profile.credits + creditCost;
        
        await supabase
          .from('user_profiles')
          .update({ credits: newBalance })
          .eq('id', user.id);

        await supabase.from('credit_history').insert({
          user_id: user.id,
          amount: creditCost,
          type: 'refund',
          balance_after: newBalance,
          task_id: taskId,
          description: `Generation timed out - ${creditCost} credits refunded`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Task marked as timed out',
        refundedCredits: task.cost_credits,
      },
    });
  } catch (error: any) {
    console.error('Timeout task error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark task as timed out' },
      { status: 500 }
    );
  }
}
