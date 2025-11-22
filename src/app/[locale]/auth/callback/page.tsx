/**
 * Auth Callback 页面
 * 处理 Supabase 邮箱确认后的回调
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from '@/navigation';
import { createPlainClient } from '@/infrastructure/database/client';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 防止重复执行
    if (hasProcessed.current) return;
    
    const handleCallback = async () => {
      try {
        console.log('🔐 Starting auth callback...');
        console.log('👤 Current user from AuthContext:', user?.email || 'null');
        
        // 等待一小段时间让 AuthContext 完成初始化
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 获取当前语言
        const locale = window.location.pathname.split('/')[1] || 'zh';
        console.log('🌍 Locale detected:', locale);
        console.log('🔄 Redirecting to homepage...');
        
        // 标记已处理，防止重复执行
        hasProcessed.current = true;
        
        // 直接重定向到首页，让 AuthContext 处理认证状态
        window.location.replace(`/${locale}`);
      } catch (err: any) {
        console.error('❌ Callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只在组件挂载时执行一次

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

