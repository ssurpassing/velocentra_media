import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 服务端 Supabase 实例 (用于 API 路由和 Server Components)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // 确保 cookie 在所有 locale 路径下可用
            cookieStore.set(name, value, {
              ...options,
              path: '/', // 明确设置为根路径
            });
          });
        } catch {
          // 在 Server Component 中可能无法设置 cookie
        }
      },
    },
  });
}

// Admin 客户端单例（性能优化：复用连接）
let adminClientInstance: SupabaseClient | null = null;

// 服务端管理员客户端 (使用 service role key)
// 使用单例模式复用连接，提升性能
export function createAdminClient() {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  adminClientInstance = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
}

// 为公开数据查询提供专用的 Admin 客户端（绕过 RLS，性能更好）
export function getPublicDataClient() {
  return createAdminClient();
}

