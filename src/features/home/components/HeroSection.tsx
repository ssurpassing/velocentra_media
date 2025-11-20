'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export function HeroSection() {
  const t = useTranslations();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden min-h-[600px] md:min-h-[700px] flex items-center">
      {/* Video Background - 播放一次后停止 */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/hero-poster.jpg"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
          {/* Fallback gradient if video fails to load */}
        </video>
        {/* Dark overlay with gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
        {/* Additional gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
            {/* Icon */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-md glow-primary shadow-2xl">
              <Sparkles className="h-12 w-12 text-primary drop-shadow-lg" />
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight drop-shadow-2xl">
              <span className="text-gradient-primary drop-shadow-lg">{t('hero.title')}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl drop-shadow-lg">
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" asChild className="gradient-primary hover:opacity-90 transition-opacity shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all duration-300">
                <Link href="/create?type=image">{t('hero.cta')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/40 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white hover:text-white shadow-xl hover:scale-105 transition-all duration-300">
                <Link href="#innovation-lab">{t('hero.ctaSecondary')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


