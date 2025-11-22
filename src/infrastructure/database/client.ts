'use client';

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 单例模式：确保整个应用使用同一个 Supabase 客户端实例
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;
let plainClientInstance: ReturnType<typeof createSupabaseClient> | null = null;

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

// 纯客户端实例（不使用 SSR，用于 OAuth callback 等场景）
// 这个版本不会触发自动刷新，适合处理 code exchange
// 使用单例模式避免多个实例冲突
export function createPlainClient() {
  if (!plainClientInstance) {
    // 从 URL 中提取 project ID 来构建正确的 storage key
    const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
    plainClientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: `sb-${projectId}-auth-token`, // 使用与 SSR 版本相同的 storage key 格式
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      }
    });
  }
  return plainClientInstance;
}


