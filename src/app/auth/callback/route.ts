/**
 * Auth Callback API Route
 * 处理 Supabase OAuth 回调（包括 Google OAuth 和邮箱确认）
 * 这个路由在根目录，不在 [locale] 下，因为 Supabase 的回调 URL 是固定的
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // 处理 OAuth 错误
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const locale = requestUrl.searchParams.get('locale') || 'zh';
    return NextResponse.redirect(
      new URL(`/${locale}?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    
    // 交换 code 获取 session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Exchange code error:', exchangeError);
      const locale = requestUrl.searchParams.get('locale') || 'zh';
      return NextResponse.redirect(
        new URL(`/${locale}?error=auth_failed`, requestUrl.origin)
      );
    }
  }

  // 成功后重定向到 dashboard
  const locale = requestUrl.searchParams.get('locale') || 'zh';
  return NextResponse.redirect(new URL(`/${locale}/dashboard`, requestUrl.origin));
}

