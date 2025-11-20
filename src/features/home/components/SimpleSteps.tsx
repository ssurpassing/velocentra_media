'use client';

import { Upload, Sparkles, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/Button';
import { useRouter } from '@/navigation';

export function SimpleSteps() {
  const router = useRouter();
  const t = useTranslations('home.simpleSteps');

  const steps = [
    {
      number: '1',
      icon: <Upload className="h-8 w-8" />,
      titleKey: 'step1.title',
      descriptionKey: 'step1.description',
      image: '/steps/step-upload.png',
    },
    {
      number: '2',
      icon: <Sparkles className="h-8 w-8" />,
      titleKey: 'step2.title',
      descriptionKey: 'step2.description',
      image: '/steps/step-generate.png',
    },
    {
      number: '3',
      icon: <Download className="h-8 w-8" />,
      titleKey: 'step3.title',
      descriptionKey: 'step3.description',
      image: '/steps/step-download.png',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* 标题 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">{t('title')}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* 步骤卡片 */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative group"
              >
                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-24 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-primary/20" />
                )}

                {/* 卡片 */}
                <div className="relative bg-card border-2 border-primary/10 rounded-3xl p-8 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2">
                  {/* 数字徽章 */}
                  <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>

                  {/* 图标 */}
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>

                  {/* 内容 */}
                  <h3 className="text-2xl font-bold mb-3 text-center">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {t(step.descriptionKey)}
                  </p>

                  {/* 装饰性图片占位 */}
                  <div className="mt-6 aspect-video bg-muted/30 rounded-xl flex items-center justify-center border border-primary/10">
                    <span className="text-4xl opacity-20">{step.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA 按钮 */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => router.push('/create?type=image')}
              className="gradient-primary text-lg px-12 py-6 h-auto hover:scale-105 transition-transform duration-300 shadow-xl hover:shadow-2xl"
            >
              <Sparkles className="h-6 w-6 mr-2" />
              {t('cta')}
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('freeTrial')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

