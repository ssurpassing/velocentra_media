/**
 * Auth Callback 页面
 * 处理 Supabase 邮箱确认后的回调
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { createBrowserSupabaseClient } from '@/infrastructure/database/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        
        // 从 URL 获取 code
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          // 交换 code 获取 session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Exchange code error:', exchangeError);
            setError(exchangeError.message);
            return;
          }

          // 成功后重定向到首页
          router.push('/');
        } else {
          setError('No code provided');
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              认证失败
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          正在验证您的账号...
        </h2>
        <p className="text-gray-600">
          请稍候，马上就好
        </p>
      </div>
    </div>
  );
}

