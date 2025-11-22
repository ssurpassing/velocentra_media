import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // 创建响应并清除所有认证相关的 cookies
    const response = NextResponse.json({ success: true });
    
    // 清除 Supabase 的认证 cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    return response;
  } catch (error: any) {
    console.error('Signout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Signout failed' },
      { status: 500 }
    );
  }
}


