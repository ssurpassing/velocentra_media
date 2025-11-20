'use client';

import { useState, useEffect } from 'react';
import { OptimizedImage } from '@/shared/components/ui/OptimizedImage';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { http } from '@/infrastructure/http/client';

interface BeforeAfterItem {
  taskId: string;
  before: string; // inputImageUrls[0]
  after: string;  // mediaFiles[0].url
  label: string;
  model: string;
}

interface BeforeAfterShowcaseProps {
  initialExamples?: BeforeAfterItem[];
}

export function BeforeAfterShowcase({ initialExamples = [] }: BeforeAfterShowcaseProps) {
  const t = useTranslations('beforeAfterShowcase');
  const [activeIndex, setActiveIndex] = useState(0);
  const [examples, setExamples] = useState<BeforeAfterItem[]>(initialExamples);
  const [loading, setLoading] = useState(initialExamples.length === 0);

  useEffect(() => {
    if (initialExamples.length === 0) {
      loadExamples();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExamples = async () => {
    try {
      setLoading(true);
      // 从 API 获取有输入图片的任务
      const response = await http.get('/innovation-lab?displayLocation=homepage&mediaType=image&limit=3');
      
      if (response.success && response.data) {
        const items = response.data
          .filter((item: any) => item.inputImageUrls && item.inputImageUrls.length > 0 && item.imageUrl)
          .map((item: any) => ({
            taskId: item.id,
            before: item.inputImageUrls[0],
            after: item.imageUrl,
            label: item.title || t('example'),
            model: item.aiModel || 'AI',
          }))
          .slice(0, 3);
        
        if (items.length > 0) {
          setExamples(items);
        }
      }
    } catch (error) {
      console.error('[BeforeAfterShowcase] Failed to load examples:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || examples.length === 0) {
    return null; // 或者显示骨架屏
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* 标题 */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">{t('title')}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* 大图展示区域 */}
          <div className="mb-8">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Before */}
              <div className="relative group">
                <div className="absolute -top-4 left-4 z-10">
                  <span className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                    {t('uploadedPhoto')}
                  </span>
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border-4 border-muted shadow-2xl">
                  <OptimizedImage
                    src={examples[activeIndex].before}
                    alt={t('altBefore')}
                    fill
                    className="object-cover grayscale-[30%]"
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="p-4 rounded-full bg-primary shadow-2xl animate-pulse">
                  <ArrowRight className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* After */}
              <div className="relative group">
                <div className="absolute -top-4 right-4 z-10">
                  <span className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg">
                    {t('aiGenerated')}
                  </span>
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border-4 border-primary shadow-2xl shadow-primary/20">
                  <OptimizedImage
                    src={examples[activeIndex].after}
                    alt={t('altAfter')}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 缩略图选择器 */}
          <div className="flex justify-center gap-4">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeIndex === index
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

