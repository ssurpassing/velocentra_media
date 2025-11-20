import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { generateMetadata as generateSEOMetadata } from '@/shared/lib/seo';
import { FileText, CreditCard, Scale, Shield, AlertCircle, Ban } from 'lucide-react';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'terms' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    locale: typedLocale,
    path: '/terms',
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'terms' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <FileText className="h-4 w-4 text-primary" />
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

            {/* Section 1: Service Description */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('service.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('service.description')}</p>
              <ul className="space-y-3 text-muted-foreground">
                <li>{t('service.image')}</li>
                <li>{t('service.video')}</li>
                <li>{t('service.models')}</li>
                <li>{t('service.availability')}</li>
              </ul>
            </div>

            {/* Section 2: Account Responsibilities */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('account.title')}</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>{t('account.age')}</li>
                <li>{t('account.security')}</li>
                <li>{t('account.sharing')}</li>
                <li>{t('account.accuracy')}</li>
              </ul>
            </div>

            {/* Section 3: Payment & Subscription */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <CreditCard className="h-6 w-6 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('payment.title')}</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong>{t('payment.processor.title')}:</strong> {t('payment.processor.content')}</li>
                <li><strong>{t('payment.subscription.title')}:</strong> {t('payment.subscription.content')}</li>
                <li><strong>{t('payment.refund.title')}:</strong> {t('payment.refund.content')}</li>
                <li><strong>{t('payment.credits.title')}:</strong> {t('payment.credits.content')}</li>
              </ul>
            </div>

            {/* Section 4: Acceptable Use */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Ban className="h-6 w-6 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('usage.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('usage.intro')}</p>
              <ul className="space-y-3 text-muted-foreground">
                <li>{t('usage.illegal')}</li>
                <li>{t('usage.impersonation')}</li>
                <li>{t('usage.infringement')}</li>
                <li>{t('usage.abuse')}</li>
                <li>{t('usage.harmful')}</li>
              </ul>
            </div>

            {/* Section 5: Content Ownership */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Scale className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('ownership.title')}</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong>{t('ownership.uploads.title')}:</strong> {t('ownership.uploads.content')}</li>
                <li><strong>{t('ownership.generated.title')}:</strong> {t('ownership.generated.content')}</li>
                <li><strong>{t('ownership.commercial.title')}:</strong> {t('ownership.commercial.content')}</li>
                <li><strong>{t('ownership.showcase.title')}:</strong> {t('ownership.showcase.content')}</li>
              </ul>
            </div>

            {/* Section 6: Service Changes */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('changes.title')}</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>{t('changes.features')}</li>
                <li>{t('changes.pricing')}</li>
                <li>{t('changes.termination')}</li>
              </ul>
            </div>

            {/* Section 7: Disclaimer */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold m-0">{t('disclaimer.title')}</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li>{t('disclaimer.aiQuality')}</li>
                <li>{t('disclaimer.responsibility')}</li>
                <li>{t('disclaimer.thirdParty')}</li>
                <li>{t('disclaimer.asIs')}</li>
              </ul>
            </div>

            {/* Section 8: Limitation of Liability */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('liability.title')}</h2>
              <p className="text-muted-foreground">{t('liability.content')}</p>
            </div>

            {/* Section 9: Dispute Resolution */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('dispute.title')}</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong>{t('dispute.law.title')}:</strong> {t('dispute.law.content')}</li>
                <li><strong>{t('dispute.negotiation.title')}:</strong> {t('dispute.negotiation.content')}</li>
              </ul>
            </div>

            {/* Section 10: Changes to Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{t('termsChanges.title')}</h2>
              <p className="text-muted-foreground">{t('termsChanges.content')}</p>
            </div>

            {/* Contact Section */}
            <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-orange-500/10 border border-border">
              <h2 className="text-2xl font-bold mb-4">{t('contact.title')}</h2>
              <p className="text-muted-foreground mb-4">{t('contact.content')}</p>
              <div className="space-y-2">
                <p className="text-sm"><strong>{t('contact.email')}:</strong> support@aitownlab.com</p>
                <p className="text-sm"><strong>{t('contact.company')}:</strong> Velocentra CO</p>
              </div>
            </div>

            {/* Acceptance */}
            <div className="mt-12 p-6 rounded-xl bg-muted border border-border">
              <p className="text-center text-muted-foreground font-medium m-0">
                {t('acceptance')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

