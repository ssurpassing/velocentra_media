'use client';

import { Header } from './Header';
import { Footer } from './Footer';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  // 不再阻塞整个页面，让页面内容正常渲染（对 SEO 友好）
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
