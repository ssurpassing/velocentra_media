/**
 * Auth Callback API Route
 * 处理 Supabase 邮箱确认后的服务端回调
 * 这个路由在根目录，不在 [locale] 下，因为 Supabase 的回调 URL 是固定的
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabaseClient();
    
    // 交换 code 获取 session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Exchange code error:', error);
      // 重定向到错误页面
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
    }
  }

  // 成功后重定向到首页（带上 locale）
  const locale = requestUrl.searchParams.get('locale') || 'zh';
  return NextResponse.redirect(new URL(`/${locale}`, requestUrl.origin));
}

