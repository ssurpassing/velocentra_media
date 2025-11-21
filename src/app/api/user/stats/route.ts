import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

export const dynamic = 'force-dynamic';

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

    // 获取用户积分和订阅信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits, membership_tier, subscription_end_date')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // 获取图片生成数量
    const { count: imageCount, error: imageError } = await supabase
      .from('generation_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('media_type', 'image');

    if (imageError) {
      console.error('Image count error:', imageError);
    }

    // 获取视频生成数量
    const { count: videoCount, error: videoError } = await supabase
      .from('generation_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('media_type', 'video');

    if (videoError) {
      console.error('Video count error:', videoError);
    }

    // 判断订阅状态
    const isSubscriptionActive = profile?.membership_tier === 'subscription' && 
      profile?.subscription_end_date && 
      new Date(profile.subscription_end_date) > new Date();

    return NextResponse.json({
      success: true,
      data: {
        credits: profile?.credits || 0,
        totalImages: imageCount || 0,
        totalVideos: videoCount || 0,
        subscriptionStatus: isSubscriptionActive ? 'active' : 'inactive',
        subscriptionPlan: profile?.membership_tier || 'free',
        subscriptionEndDate: profile?.subscription_end_date || null,
      },
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get user stats' },
      { status: 500 }
    );
  }
}
