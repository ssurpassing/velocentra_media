'use client';

import { useLocale } from 'next-intl';
import { usePathname as useNextPathname } from 'next/navigation';
import { usePathname, useRouter } from '@/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect, useTransition } from 'react';

export function LanguageSwitcher() {
  const localeFromHook = useLocale() as Locale;
  const fullPathname = useNextPathname(); // 获取完整路径，包含 locale
  // 从完整路径中提取 locale
  const localeFromPath = fullPathname?.split('/')[1] as Locale;
  const currentLocale = (locales.includes(localeFromPath) ? localeFromPath : localeFromHook) as Locale;
  
  const pathname = usePathname(); // next-intl 的 pathname，应该不带 locale
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 关闭下拉菜单当点击外部时
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const switchLanguage = (newLocale: Locale) => {
    setIsOpen(false);
    
    // 使用 startTransition 进行客户端路由切换
    startTransition(() => {
      // 从完整路径中移除当前 locale，得到纯路径
      const pathWithoutLocale = fullPathname.replace(`/${currentLocale}`, '') || '/';
      
      router.replace(
        pathWithoutLocale,
        { locale: newLocale }
      );
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="选择语言"
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline text-muted-foreground">{localeNames[currentLocale]}</span>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-background border border-primary/10 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLanguage(locale)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-primary/10 ${
                  locale === currentLocale
                    ? 'text-primary font-semibold bg-primary/5'
                    : 'text-muted-foreground'
                }`}
              >
                {localeNames[locale]}
                {locale === currentLocale && (
                  <span className="ml-2 text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

