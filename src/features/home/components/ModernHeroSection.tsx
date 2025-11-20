'use client';

import { Sparkles, Play, Image, Video, Palette, Wand2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { OptimizedImage } from '@/shared/components/ui/OptimizedImage';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';

export function ModernHeroSection() {
  const router = useRouter();
  const t = useTranslations('hero');

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 via-background to-orange-500/10" />
        
        {/* 网格背景 */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(var(--primary) / 0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />

        {/* 多彩光晕效果 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-orange-500/15 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      {/* 主内容 */}
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 左侧文字内容 */}
            <div className="text-center lg:text-left space-y-8">
              {/* 标签 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-orange-500/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium bg-gradient-to-r from-primary via-purple-500 to-orange-500 bg-clip-text text-transparent">
                  {t('badge')}
                </span>
              </div>

              {/* 主标题 */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block mb-2">
                  {t('welcomeTo')}
                </span>
                <span className="text-gradient-primary block">
                  {t('aiTownLab')}
                </span>
              </h1>

              {/* 副标题 */}
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                {t('subtitle')}
                <br />
                <span className="text-primary font-semibold">{t('tagline')}</span>
              </p>

              {/* 功能标签 */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('imageGen')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <Video className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-400">{t('videoGen')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <Palette className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-400">{t('creativeDesign')}</span>
                </div>
              </div>

              {/* 按钮组 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => router.push('/create')}
                  className="gradient-primary text-lg px-8 py-6 h-auto hover:scale-105 transition-transform duration-300 shadow-xl hover:shadow-2xl"
                >
                  <Wand2 className="h-5 w-5 mr-2" />
                  {t('startCreating')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const element = document.querySelector('[class*="CreativeGallery"]')?.parentElement;
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-lg px-8 py-6 h-auto border-2 hover:bg-primary/5"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {t('viewShowcase')}
                </Button>
              </div>

              {/* AI 技术展示 */}
              <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start pt-4">
                <div className="text-sm text-muted-foreground">{t('poweredBy')}</div>
                <div className="flex flex-wrap gap-3">
                  {['Veo', 'Sora', 'GPT-4o', 'Nano Banana'].map((model) => (
                    <div
                      key={model}
                      className="px-3 py-1 rounded-lg bg-muted/50 border border-border text-xs font-medium hover:bg-muted transition-colors"
                    >
                      {model}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧多样化展示 */}
            <div className="relative lg:h-[600px]">
              {/* 网格布局展示多样性 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 图片生成 */}
                <div className="space-y-4">
                  {/* 大卡片 - AI 图片生成 */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-emerald-500/30 shadow-2xl transform hover:scale-105 transition-all duration-300 group">
                    <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-emerald-500 backdrop-blur-sm rounded-full text-white text-xs font-bold flex items-center gap-1">
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="h-3 w-3" aria-hidden="true" />
                      {t('imageLabel')}
                    </div>
                    {/* 图片素材 - 如果没有则显示占位符 */}
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 relative">
                      <OptimizedImage
                        src="/hero/image-generation.jpg"
                        alt="AI Image Generation"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        priority
                      />
                    </div>
                  </div>
                  
                  {/* 小卡片 - 人像头像 */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg transform hover:scale-105 transition-all duration-300 group">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 relative">
                      <OptimizedImage
                        src="/hero/portrait.jpg"
                        alt="AI Portrait"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* 视频生成 */}
                <div className="space-y-4 pt-8">
                  {/* 小卡片 - 广告海报 */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-orange-500/30 shadow-lg transform hover:scale-105 transition-all duration-300 group">
                    <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 relative">
                      <OptimizedImage
                        src="/hero/poster.jpg"
                        alt="AI Poster"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        priority
                      />
                    </div>
                  </div>
                  
                  {/* 大卡片 - AI 视频生成 */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-purple-500/30 shadow-2xl transform hover:scale-105 transition-all duration-300 group">
                    <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-purple-500 backdrop-blur-sm rounded-full text-white text-xs font-bold flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      {t('videoLabel')}
                    </div>
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 relative">
                      {/* 可以是视频缩略图或者 GIF */}
                      <OptimizedImage
                        src="/hero/video-generation.jpg"
                        alt="AI Video Generation"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        priority
                      />
                      {/* 播放图标装饰 */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 浮动元素 */}
              <div className="absolute -top-4 -right-4 px-5 py-2 bg-gradient-to-r from-primary via-purple-500 to-orange-500 text-white rounded-full shadow-xl animate-bounce">
                <span className="font-bold">{t('quickBadge')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部波浪装饰 */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-24 fill-muted/30"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C150,80 350,0 600,40 C850,80 1050,20 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}

