import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { ClientLayout } from '@/shared/components/layout/ClientLayout';
import { Toaster } from '@/shared/components/ui/toaster';
import { 
  generateMetadata as generateSEOMetadata,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareApplicationSchema
} from '@/shared/lib/seo';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'seo.home' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    locale: typedLocale,
    path: '',
    keywords: t('keywords').split(','),
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure locale is valid, fallback to 'zh' if not
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  
  // 传入 locale 参数以加载正确的翻译文件
  const messages = await getMessages({ locale: typedLocale });
  
  // 调试：检查 messages 是否包含 aiVideo
  console.log('🌍 Locale:', typedLocale, 'Has aiVideo:', !!messages.aiVideo);

  // Generate structured data for SEO
  const organizationSchema = generateOrganizationSchema(typedLocale);
  const websiteSchema = generateWebSiteSchema(typedLocale);
  const softwareSchema = generateSoftwareApplicationSchema(typedLocale);

  return (
    <html lang={locale}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <NextIntlClientProvider messages={messages} locale={typedLocale}>
          <ClientLayout>
            {children}
          </ClientLayout>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}


