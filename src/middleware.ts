import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './navigation';

// 创建 next-intl middleware
const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 调试日志
  console.log('🔍 Middleware:', {
    pathname,
    locale: pathname.split('/')[1],
    url: request.url,
  });
  
  // 执行 next-intl middleware
  const response = intlMiddleware(request);
  
  // 如果是重定向，打印日志
  if (response.status === 307 || response.status === 308) {
    console.log('🔄 Redirecting to:', response.headers.get('location'));
  }
  
  return response;
}

export const config = {
  // 匹配所有路径，除了 API 路由、静态文件和特殊文件
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};


