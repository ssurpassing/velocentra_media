import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 获取积分历史记录，关联任务信息
    const { data: history, error: historyError } = await supabase
      .from('credit_history')
      .select(`
        *,
        generation_tasks (
          id,
          original_prompt,
          optimized_prompt,
          status,
          media_type,
          ai_model,
          cost_credits,
          media_files (
            url,
            thumbnail_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('Failed to fetch credit history:', historyError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch credit history' 
      }, { status: 500 });
    }

    console.log(`📊 Credit history count: ${history?.length || 0}`);
    console.log('📊 Sample record:', history?.[0]);

    return NextResponse.json({ 
      success: true, 
      data: history || [] 
    });

  } catch (error: any) {
    console.error('Credit history API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
