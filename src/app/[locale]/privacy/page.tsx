import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { generateMetadata as generateSEOMetadata } from '@/shared/lib/seo';
import { Shield, Lock, Database, Users, Cookie, Mail } from 'lucide-react';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'privacy' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    locale: typedLocale,
    path: '/privacy',
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'privacy' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
          <p className="text-sm text-muted-foreground mt-4">
            {t('lastUpdated')}: {new Date().toISOString().split('T')[0]}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            
            {/* Introduction */}
            <div className="mb-12 p-6 rounded-xl bg-muted/30 border border-border">
              <p className="text-muted-foreground leading-relaxed m-0">
                {t('intro')}
              </p>
            </div>

            {/* Section 1: Information Collection */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('collection.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('collection.intro')}</p>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong>{t('collection.account.title')}:</strong> {t('collection.account.content')}</li>
                <li><strong>{t('collection.uploads.title')}:</strong> {t('collection.uploads.content')}</li>
                <li><strong>{t('collection.payment.title')}:</strong> {t('collection.payment.content')}</li>
                <li><strong>{t('collection.usage.title')}:</strong> {t('collection.usage.content')}</li>
              </ul>
            </div>

            {/* Section 2: How We Use Information */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('usage.title')}</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li>{t('usage.service')}</li>
                <li>{t('usage.improvement')}</li>
                <li>{t('usage.payment')}</li>
                <li>{t('usage.communication')}</li>
                <li>{t('usage.security')}</li>
              </ul>
            </div>

            {/* Section 3: Data Storage & Security */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Lock className="h-6 w-6 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('storage.title')}</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong>{t('storage.platform.title')}:</strong> {t('storage.platform.content')}</li>
                <li><strong>{t('storage.retention.title')}:</strong> {t('storage.retention.content')}</li>
                <li><strong>{t('storage.generated.title')}:</strong> {t('storage.generated.content')}</li>
                <li><strong>{t('storage.security.title')}:</strong> {t('storage.security.content')}</li>
              </ul>
            </div>

            {/* Section 4: Third-Party Services */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('thirdParty.title')}</h2>
              <p className="text-muted-foreground mb-4">{t('thirdParty.intro')}</p>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong>Stripe:</strong> {t('thirdParty.stripe')}</li>
                <li><strong>AI Providers:</strong> {t('thirdParty.aiProviders')}</li>
                <li><strong>Supabase:</strong> {t('thirdParty.supabase')}</li>
              </ul>
            </div>

            {/* Section 5: Cookies */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Cookie className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('cookies.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('cookies.intro')}</p>
              <ul className="space-y-3 text-muted-foreground">
                <li>{t('cookies.auth')}</li>
                <li>{t('cookies.preferences')}</li>
                <li>{t('cookies.analytics')}</li>
              </ul>
            </div>

            {/* Section 6: Your Rights (GDPR/CCPA) */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('rights.title')}</h2>
              <p className="text-muted-foreground mb-4">{t('rights.intro')}</p>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong>{t('rights.access.title')}:</strong> {t('rights.access.content')}</li>
                <li><strong>{t('rights.deletion.title')}:</strong> {t('rights.deletion.content')}</li>
                <li><strong>{t('rights.export.title')}:</strong> {t('rights.export.content')}</li>
                <li><strong>{t('rights.marketing.title')}:</strong> {t('rights.marketing.content')}</li>
                <li><strong>{t('rights.rectification.title')}:</strong> {t('rights.rectification.content')}</li>
              </ul>
            </div>

            {/* Section 7: Children's Privacy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('children.title')}</h2>
              <p className="text-muted-foreground">{t('children.content')}</p>
            </div>

            {/* Section 8: Changes to Policy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('changes.title')}</h2>
              <p className="text-muted-foreground">{t('changes.content')}</p>
            </div>

            {/* Contact Section */}
            <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-orange-500/10 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-card">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('contact.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('contact.content')}</p>
              <div className="space-y-2">
                <p className="text-sm"><strong>{t('contact.email')}:</strong> support@aitownlab.com</p>
                <p className="text-sm"><strong>{t('contact.company')}:</strong> Velocentra CO</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

