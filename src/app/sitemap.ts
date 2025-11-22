import { MetadataRoute } from 'next';
import { locales, type Locale } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bod-avatars.com';

// Locale mapping for hreflang
const localeMapping: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
};

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [];

  // Main routes
  const mainRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/pricing', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/create', priority: 0.9, changeFrequency: 'daily' as const },
  ];

  // Generate alternates for all languages
  const generateAlternates = (path: string) => {
    const languages: Record<string, string> = {};
    locales.forEach((locale) => {
      const hreflangCode = localeMapping[locale];
      languages[hreflangCode] = `${SITE_URL}/${locale}${path}`;
    });
    return { languages };
  };

  // Add main routes for all locales
  locales.forEach((locale) => {
    mainRoutes.forEach(({ path, priority, changeFrequency }) => {
      staticPages.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: generateAlternates(path),
      });
    });
  });

  return staticPages;
}

