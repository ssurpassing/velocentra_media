'use client';

import { Users, Image, Zap, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Stat {
  labelKey: string;
  value: string;
  icon: React.ReactNode;
  suffix?: string;
}

export function TrustIndicators() {
  const t = useTranslations('trustIndicators');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 展示核心优势，而非具体数字
  const stats: Stat[] = [
    {
      labelKey: 'models',
      value: '9',
      suffix: '+',
      icon: <Zap className="h-6 w-6" />,
    },
    {
      labelKey: 'speed',
      value: '60',
      suffix: t('seconds'),
      // eslint-disable-next-line jsx-a11y/alt-text
      icon: <Image className="h-6 w-6" aria-hidden="true" />,
    },
    {
      labelKey: 'quality',
      value: '4K',
      suffix: '',
      icon: <Shield className="h-6 w-6" />,
    },
    {
      labelKey: 'support',
      value: '24/7',
      suffix: '',
      icon: <Users className="h-6 w-6" />,
    },
  ];

  return (
    <section className="py-12 bg-primary/5 border-y border-primary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* 信任标识 */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              {t('title')}
            </p>
          </div>

          {/* 数据统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.labelKey}
                className={`text-center transform transition-all duration-500 ${
                  mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gradient-primary mb-1">
                  {stat.value}
                  {stat.suffix && <span className="text-xl">{stat.suffix}</span>}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {t(stat.labelKey)}
                </div>
              </div>
            ))}
          </div>

          {/* AI 模型支持 - 真实的技术合作 */}
          <div className="mt-12 pt-8 border-t border-muted">
            <p className="text-center text-sm text-muted-foreground mb-6">
              {t('poweredBy')}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
              <div className="text-lg font-bold text-muted-foreground">Google Veo</div>
              <div className="text-lg font-bold text-muted-foreground">OpenAI Sora</div>
              <div className="text-lg font-bold text-muted-foreground">Nano Banana</div>
              <div className="text-lg font-bold text-muted-foreground">GPT-4o</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

