import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { generateMetadata as generateSEOMetadata } from '@/shared/lib/seo';
import { Sparkles, Zap, Palette, Video, Award, Users } from 'lucide-react';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'about' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    locale: typedLocale,
    path: '/about',
    keywords: t('keywords').split(','),
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (locales.includes(locale as Locale) ? locale : 'zh') as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: 'about' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t('badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-orange-500 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
            <div className="pt-4 text-sm text-muted-foreground">
              {t('operatedBy')}
            </div>
          </div>
        </div>
      </section>

      {/* Company Introduction */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              {t('intro.title')}
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t('intro.content')}
            </p>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">{t('technology.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{t('technology.models.title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('technology.models.content')}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Palette className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-lg">{t('technology.image.title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('technology.image.content')}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Video className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-lg">{t('technology.video.title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('technology.video.content')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-12 text-center">{t('capabilities.title')}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 mt-1">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('capabilities.avatars.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('capabilities.avatars.content')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-purple-500/10 mt-1">
                  <Palette className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('capabilities.images.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('capabilities.images.content')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-orange-500/10 mt-1">
                  <Video className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('capabilities.videos.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('capabilities.videos.content')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10 mt-1">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('capabilities.scenarios.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('capabilities.scenarios.content')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-orange-500/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">{t('vision.title')}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            {t('vision.content')}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="px-6 py-3 rounded-full bg-card border border-border">
              {t('vision.value1')}
            </div>
            <div className="px-6 py-3 rounded-full bg-card border border-border">
              {t('vision.value2')}
            </div>
            <div className="px-6 py-3 rounded-full bg-card border border-border">
              {t('vision.value3')}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">{t('contact.title')}</h2>
          <p className="text-muted-foreground mb-6">{t('contact.content')}</p>
          <a 
            href="mailto:support@aitownlab.com" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            {t('contact.email')}
          </a>
        </div>
      </section>
    </div>
  );
}

