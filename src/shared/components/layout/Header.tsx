'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useAuth } from '@/shared/contexts/AuthContext';
import { http } from '@/infrastructure/http/client';
import { LanguageSwitcher } from '@/shared/components/ui/LanguageSwitcher';
import { Link, usePathname, useRouter } from '@/navigation';
import { LoginModal } from '@/shared/components/modals/LoginModal';

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { user, profile, refreshAuth, loading } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  // 调试日志
  console.log('🎯 Header locale:', locale, 'pathname:', pathname);

  const handleSignOut = async () => {
    try {
      await http.post('/auth/signout', {});
      // 使用 window.location.href 强制完整页面刷新，清除所有客户端状态
      window.location.href = `/${locale}`;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">AI Town Lab</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-all hover:text-primary relative ${
              pathname === '/' ? 'text-primary font-semibold' : 'text-muted-foreground'
            }`}
          >
            {pathname === '/' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
            {t('home')}
          </Link>
          
          {/* 创作工作室 - 突出显示 */}
          <Link
            href="/create"
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
              pathname.includes('/create')
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
            }`}
          >
            <Wand2 className="h-4 w-4" />
            {t('createStudio')}
            {!pathname.includes('/create') && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </Link>
          
          <Link
            href="/pricing"
            className={`text-sm font-medium transition-all hover:text-primary relative ${
              pathname === '/pricing' ? 'text-primary font-semibold' : 'text-muted-foreground'
            }`}
          >
            {pathname === '/pricing' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
            {t('pricing')}
          </Link>
        </nav>

        {/* Language Switcher & Auth buttons */}
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />
          {loading ? (
            // 骨架屏 - 避免闪烁
            <div className="flex items-center space-x-2">
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          ) : user ? (
            <div className="flex items-center space-x-2 animate-in fade-in duration-200">
              <span className="text-sm text-muted-foreground">
                {profile?.nickname || user.email?.split('@')[0] || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-primary/30 hover:bg-primary/10">
                {t('logout')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 animate-in fade-in duration-200">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLoginModalOpen(true)}
                className="hover:bg-primary/10"
              >
                {t('login')}
              </Button>
              <Button size="sm" asChild className="gradient-primary">
                <Link href="/auth/signup">{t('signup')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </header>
  );
}


