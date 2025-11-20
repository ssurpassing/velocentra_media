import { getTranslations } from 'next-intl/server';
import { generateMetadata as generateSEOMetadata } from '@/shared/lib/seo';
import { locales, type Locale } from '@/i18n/config';
import { PricingClient } from './PricingClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'seo.pricing' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    locale: typedLocale,
    path: '/pricing',
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Enable static generation with revalidation
export const revalidate = 86400; // Revalidate once per day
export const dynamic = 'force-static';

export default function PricingPage() {
  return <PricingClient />;
}


