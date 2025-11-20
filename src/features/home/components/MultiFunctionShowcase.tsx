'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Image as ImageIcon, Video as VideoIcon, Wand2, Sparkles, Play } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useRouter } from '@/navigation';
import Image from 'next/image';

type MediaType = 'image' | 'video';
type UseCase = 'avatar' | 'poster' | 'video-ad' | 'animation';

interface Showcase {
  id: string;
  type: MediaType;
  useCase: UseCase;
  titleKey: string;
  descriptionKey: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  badge: string;
  tagsKey: string;
}

export function MultiFunctionShowcase() {
  const router = useRouter();
  const t = useTranslations('home.multiFunctionShowcase');
  const [activeUseCase, setActiveUseCase] = useState<UseCase>('avatar');

  const useCases = [
    {
      id: 'avatar' as UseCase,
      nameKey: 'useCases.avatar.name',
      icon: '👤',
      descriptionKey: 'useCases.avatar.description',
      type: 'image' as MediaType,
    },
    {
      id: 'poster' as UseCase,
      nameKey: 'useCases.poster.name',
      icon: '🎨',
      descriptionKey: 'useCases.poster.description',
      type: 'image' as MediaType,
    },
    {
      id: 'video-ad' as UseCase,
      nameKey: 'useCases.videoAd.name',
      icon: '🎬',
      descriptionKey: 'useCases.videoAd.description',
      type: 'video' as MediaType,
    },
    {
      id: 'animation' as UseCase,
      nameKey: 'useCases.animation.name',
      icon: '✨',
      descriptionKey: 'useCases.animation.description',
      type: 'video' as MediaType,
    },
  ];

  const showcases: Showcase[] = [
    {
      id: '1',
      type: 'image',
      useCase: 'avatar',
      titleKey: 'showcases.avatar.title',
      descriptionKey: 'showcases.avatar.description',
      mediaUrl: '/showcase/avatar-linkedin.jpg',
      badge: 'Nano Banana',
      tagsKey: 'showcases.avatar.tags',
    },
    {
      id: '2',
      type: 'image',
      useCase: 'poster',
      titleKey: 'showcases.poster.title',
      descriptionKey: 'showcases.poster.description',
      mediaUrl: '/showcase/poster-product.jpg',
      badge: 'GPT-4o',
      tagsKey: 'showcases.poster.tags',
    },
    {
      id: '3',
      type: 'video',
      useCase: 'video-ad',
      titleKey: 'showcases.videoAd.title',
      descriptionKey: 'showcases.videoAd.description',
      mediaUrl: '/showcase/video-brand.mp4',
      thumbnailUrl: '/showcase/video-brand-thumb.jpg',
      badge: 'Veo 3.1',
      tagsKey: 'showcases.videoAd.tags',
    },
    {
      id: '4',
      type: 'video',
      useCase: 'animation',
      titleKey: 'showcases.animation.title',
      descriptionKey: 'showcases.animation.description',
      mediaUrl: '/showcase/animation-character.mp4',
      thumbnailUrl: '/showcase/animation-thumb.jpg',
      badge: 'Sora 2',
      tagsKey: 'showcases.animation.tags',
    },
  ];

  const filteredShowcases = showcases.filter(
    (s) => s.useCase === activeUseCase
  );

  const currentShowcase = filteredShowcases[0];
  const currentUseCase = useCases.find(uc => uc.id === activeUseCase);

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/20 to-background">
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

          {/* 用途分类 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {useCases.map((useCase) => (
              <button
                key={useCase.id}
                onClick={() => setActiveUseCase(useCase.id)}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                  activeUseCase === useCase.id
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-muted hover:border-primary/30 bg-card'
                }`}
              >
                <div className="text-4xl mb-3">{useCase.icon}</div>
                <h3 className="font-bold text-lg mb-2">{t(useCase.nameKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(useCase.descriptionKey)}</p>
              </button>
            ))}
          </div>

          {/* 展示区域 */}
          {currentShowcase && (
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* 左侧：媒体展示 */}
              <div className="relative group">
                <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/10">
                  {currentShowcase.type === 'video' ? (
                    <video
                      key={currentShowcase.id}
                      src={currentShowcase.mediaUrl}
                      className="w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                      preload="auto"
                      poster={currentShowcase.thumbnailUrl}
                      onMouseEnter={(e) => {
                        const video = e.currentTarget;
                        video.play().catch(() => {
                          // 忽略自动播放错误
                        });
                      }}
                      onMouseLeave={(e) => {
                        const video = e.currentTarget;
                        video.pause();
                        video.currentTime = 0;
                      }}
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={currentShowcase.mediaUrl}
                        alt={t(currentShowcase.titleKey)}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {/* 徽章 */}
                  <div className="absolute top-4 left-4 px-4 py-2 bg-gradient-to-r from-primary to-primary/70 text-white rounded-full font-bold text-sm shadow-lg">
                    {currentShowcase.badge}
                  </div>
                </div>

                {/* 标签 */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {t(currentShowcase.tagsKey).split(',').map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* 右侧：内容介绍 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    {t(currentShowcase.titleKey)}
                  </h3>
                  <p className="text-xl text-muted-foreground">
                    {t(currentShowcase.descriptionKey)}
                  </p>
                </div>

                {/* 特性列表 */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('features.aiGeneration.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('features.aiGeneration.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Wand2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('features.multipleStyles.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('features.multipleStyles.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {currentShowcase.type === 'video' ? (
                        <VideoIcon className="h-5 w-5" />
                      ) : (
                        <ImageIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('features.highQuality.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('features.highQuality.description')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex gap-3 pt-4">
                  <Button
                    size="lg"
                    onClick={() =>
                      router.push(currentUseCase?.type === 'video' ? '/create?type=video' : '/create?type=image')
                    }
                    className="gradient-primary flex-1"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    {t('createNow')}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      document.getElementById('innovation-lab')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {t('viewMore')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

