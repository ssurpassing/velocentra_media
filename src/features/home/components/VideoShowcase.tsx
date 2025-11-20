'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Zap, Sparkles, Video, ImageIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useRouter } from '@/navigation';

export function VideoShowcase() {
  const router = useRouter();
  const t = useTranslations('home.videoShowcase');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const videoFeatures = [
    {
      icon: <Video className="h-6 w-6" />,
      titleKey: 'features.textToVideo.title',
      descriptionKey: 'features.textToVideo.description',
      exampleKey: 'features.textToVideo.example',
      badge: 'Veo 3.1',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <ImageIcon className="h-6 w-6" />,
      titleKey: 'features.imageToVideo.title',
      descriptionKey: 'features.imageToVideo.description',
      exampleKey: 'features.imageToVideo.example',
      badge: 'Sora 2',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      titleKey: 'features.reference.title',
      descriptionKey: 'features.reference.description',
      exampleKey: 'features.reference.example',
      badge: 'Veo 3.1',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const useCases = [
    {
      titleKey: 'useCases.shortForm.title',
      icon: '📱',
      descriptionKey: 'useCases.shortForm.description',
      ratio: '9:16',
    },
    {
      titleKey: 'useCases.branding.title',
      icon: '📺',
      descriptionKey: 'useCases.branding.description',
      ratio: '16:9',
    },
    {
      titleKey: 'useCases.animation.title',
      icon: '🎬',
      descriptionKey: 'useCases.animation.description',
      ratio: 'Auto',
    },
    {
      titleKey: 'useCases.advertising.title',
      icon: '💡',
      descriptionKey: 'useCases.advertising.description',
      ratio: '1:1',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {/* 标题 */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('badge')}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">{t('title')}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* 功能卡片 */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {videoFeatures.map((feature, index) => (
              <div
                key={feature.titleKey}
                className="group relative"
                style={{
                  animation: `slideInUp 0.6s ease-out ${index * 0.2}s both`,
                }}
              >
                <div className="relative p-8 rounded-3xl border-2 border-primary/10 bg-card hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2">
                  {/* 渐变背景 */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} rounded-full filter blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />

                  {/* 图标 */}
                  <div className="relative mb-6">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-bold text-primary border-2 border-primary">
                      {feature.badge}
                    </div>
                  </div>

                  {/* 内容 */}
                  <h3 className="text-2xl font-bold mb-3 relative">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-muted-foreground mb-4 relative">
                    {t(feature.descriptionKey)}
                  </p>

                  {/* 示例 */}
                  <div className="relative p-4 rounded-xl bg-muted/50 border border-primary/10">
                    <div className="text-xs text-muted-foreground mb-2">{t('examplePrompt')}</div>
                    <div className="text-sm font-medium">{t(feature.exampleKey)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 大型展示区域 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            {/* 左侧：视频演示 */}
            <div className="relative">
              <div 
                className="relative aspect-video rounded-3xl overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/20"
                onMouseEnter={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                    setIsPlaying(true);
                  }
                }}
                onMouseLeave={() => {
                  if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                    setIsPlaying(false);
                  }
                }}
              >
                {/* 实际视频 */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  poster="/showcase/video-brand-thumb.jpg"
                >
                  <source src="/showcase/video-brand.mp4" type="video/mp4" />
                  {t('videoPlaybackNotSupported')}
                </video>
                
                {/* 播放按钮（视频未播放时显示） */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <button 
                      onClick={handlePlayVideo}
                      className="p-6 rounded-full bg-white/90 backdrop-blur-sm shadow-2xl hover:scale-110 transition-transform duration-300"
                    >
                      <Play className="h-12 w-12 text-primary" fill="currentColor" />
                    </button>
                  </div>
                )}

                {/* 时长标签 */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-bold">
                  {t('videoDuration', { duration: '5' })}
                </div>
              </div>

              {/* 浮动标签 */}
              <div className="absolute -bottom-4 -left-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-xl font-bold animate-bounce">
                {t('generateTime', { time: '3' })}
              </div>
            </div>

            {/* 右侧：应用场景 */}
            <div className="space-y-6">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                {t('wideApplications')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {useCases.map((useCase) => (
                  <div
                    key={useCase.titleKey}
                    className="p-6 rounded-2xl bg-card border border-primary/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="text-4xl mb-3">{useCase.icon}</div>
                    <h4 className="font-bold mb-2">{t(useCase.titleKey)}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t(useCase.descriptionKey)}
                    </p>
                    <div className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold">
                      {useCase.ratio}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => router.push('/create?type=video')}
                className="gradient-primary w-full text-lg h-14 mt-6"
              >
                <Video className="h-5 w-5 mr-2" />
                {t('startCreating')}
              </Button>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="text-center p-8 rounded-3xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-lg font-medium mb-2">
              {t('modelSupport')}
            </p>
            <p className="text-muted-foreground">
              {t('multipleRatios')}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

