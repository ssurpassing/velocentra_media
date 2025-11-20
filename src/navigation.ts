import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './i18n/config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

