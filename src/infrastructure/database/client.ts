'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 单例模式：确保整个应用使用同一个 Supabase 客户端实例
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

// 客户端 Supabase 实例（用于浏览器环境）
export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// 别名：createBrowserSupabaseClient
export function createBrowserSupabaseClient() {
  return createClient();
}


