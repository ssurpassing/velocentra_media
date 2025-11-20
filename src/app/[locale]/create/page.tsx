/**
 * AI 创作工作室 - 统一入口
 * 整合图片生成和视频创作功能
 */

import { getTranslations } from 'next-intl/server';
import { generateMetadata as generateSEOMetadata } from '@/shared/lib/seo';
import { locales, type Locale } from '@/i18n/config';
import { CreateStudioClient } from './CreateStudioClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'seo.create' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    locale: typedLocale,
    path: '/create',
    keywords: t('keywords').split(','),
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function CreatePage() {
  return <CreateStudioClient />;
}

