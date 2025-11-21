import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/infrastructure/database/server-client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { nickname, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          nickname: nickname || email.split('@')[0],
        },
      },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // 创建用户配置记录（使用 admin 客户端绕过 RLS）
    if (data.user) {
      const adminSupabase = createAdminClient();
      const userNickname = nickname || email.split('@')[0];
      const { error: profileError } = await adminSupabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          nickname: userNickname,
          full_name: null,
          avatar_url: null,
          locale: 'zh',
          membership_tier: 'free',
          credits: 0,
          free_generations_remaining: 3,
        });

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        // 不要阻止注册流程，只记录错误
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}


