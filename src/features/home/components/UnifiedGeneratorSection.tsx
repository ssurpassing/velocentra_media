'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Image as ImageIcon, Video, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Link } from '@/navigation';
import { GeneratorSelector as ImageGeneratorSelector } from '@/features/image/generators/GeneratorSelector';
import { GeneratorSelector as VideoGeneratorSelector } from '@/features/video/generators/GeneratorSelector';

type GenerationType = 'image' | 'video';

export function UnifiedGeneratorSection() {
  const t = useTranslations('quickGenerator');
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [generationType, setGenerationType] = useState<GenerationType>('image');

  return (
    <section className="relative py-24 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-orange-500/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* 标题区域 */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('badge')}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient-primary">{t('title')}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
    
          {!user && !authLoading && (
            <div className="max-w-2xl mx-auto">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-orange-500/10 backdrop-blur-sm border border-primary/20 p-12 text-center">
                {/* 装饰元素 */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                
                <div className="relative">
                  <Sparkles className="h-16 w-16 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-3">{t('loginTitle')}</h3>
                  <p className="text-muted-foreground mb-8">
                    {t('loginSubtitle')}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="min-w-[140px]"
                      onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                    >
                      {t('login')}
                    </Button>
                    <Button 
                      size="lg" 
                      className="gradient-primary min-w-[140px]"
                      onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                    >
                      {t('signup')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {user && (
            <div className="relative">
              {/* 主容器 */}
              <div className="relative overflow-hidden rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
                {/* 顶部渐变条 */}
                <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-orange-500" />
                
                <div className="p-8 lg:p-12">
                  {/* Tab切换 - 重新设计 */}
                  <div className="mb-12">
                    <div className="flex justify-center">
                      <div className="relative inline-flex p-1 rounded-2xl bg-muted/50 backdrop-blur-sm">
                        {/* 滑动背景 */}
                        <div
                          className={`absolute top-1 bottom-1 w-1/2 rounded-xl bg-card shadow-lg border border-border/50 transition-all duration-300 ease-out ${
                            generationType === 'image' ? 'left-1' : 'left-1/2'
                          }`}
                        />
                        
                        {/* 图片按钮 */}
                        <button
                          onClick={() => setGenerationType('image')}
                          className="relative z-10 flex items-center gap-3 px-8 py-4 rounded-xl transition-all"
                        >
                          <div className={`p-2 rounded-lg transition-all ${
                            generationType === 'image' 
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30' 
                              : 'bg-muted'
                          }`}>
                            <ImageIcon className={`w-5 h-5 transition-colors ${
                              generationType === 'image' ? 'text-white' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="text-left">
                            <div className={`text-sm font-semibold transition-colors ${
                              generationType === 'image' ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {t('imageTab')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('imageDesc')}
                            </div>
                          </div>
                        </button>

                        {/* 视频按钮 */}
                        <button
                          onClick={() => setGenerationType('video')}
                          className="relative z-10 flex items-center gap-3 px-8 py-4 rounded-xl transition-all"
                        >
                          <div className={`p-2 rounded-lg transition-all ${
                            generationType === 'video' 
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30' 
                              : 'bg-muted'
                          }`}>
                            <Video className={`w-5 h-5 transition-colors ${
                              generationType === 'video' ? 'text-white' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="text-left">
                            <div className={`text-sm font-semibold transition-colors ${
                              generationType === 'video' ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {t('videoTab')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('videoDesc')}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 生成器内容 */}
                  <div className="min-h-[600px]">
                    <div 
                      className="transition-all duration-300"
                      style={{
                        opacity: 1,
                        transform: 'translateY(0)',
                      }}
                    >
                      {generationType === 'image' ? (
                        <ImageGeneratorSelector locale={locale} />
                      ) : (
                        <VideoGeneratorSelector locale={locale} />
                      )}
                    </div>
                  </div>

                  {/* CTA 按钮区域 */}
                  <div className="mt-12 pt-8 border-t border-border/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      {/* 图片 CTA */}
                      <Link href="/create?type=image" className="block group w-full">
                        <div className={`relative overflow-hidden rounded-2xl p-8 transition-all duration-300 h-full ${
                          generationType === 'image'
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30'
                            : 'bg-muted hover:bg-muted/80'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <ImageIcon className={`h-8 w-8 mb-3 ${
                                generationType === 'image' ? 'text-white' : 'text-muted-foreground'
                              }`} />
                              <h3 className={`text-lg font-bold mb-1 ${
                                generationType === 'image' ? 'text-white' : 'text-foreground'
                              }`}>
                                {t('exploreImages')}
                              </h3>
                              <p className={`text-sm ${
                                generationType === 'image' ? 'text-white/80' : 'text-muted-foreground'
                              }`}>
                                {t('exploreImagesDesc')}
                              </p>
                            </div>
                            <ArrowRight className={`h-6 w-6 group-hover:translate-x-1 transition-transform ${
                              generationType === 'image' ? 'text-white' : 'text-muted-foreground'
                            }`} />
                          </div>
                        </div>
                      </Link>

                      {/* 视频 CTA */}
                      <Link href="/create?type=video" className="block group w-full">
                        <div className={`relative overflow-hidden rounded-2xl p-8 transition-all duration-300 h-full ${
                          generationType === 'video'
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl shadow-purple-500/30'
                            : 'bg-muted hover:bg-muted/80'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <Video className={`h-8 w-8 mb-3 ${
                                generationType === 'video' ? 'text-white' : 'text-muted-foreground'
                              }`} />
                              <h3 className={`text-lg font-bold mb-1 ${
                                generationType === 'video' ? 'text-white' : 'text-foreground'
                              }`}>
                                {t('exploreVideos')}
                              </h3>
                              <p className={`text-sm ${
                                generationType === 'video' ? 'text-white/80' : 'text-muted-foreground'
                              }`}>
                                {t('exploreVideosDesc')}
                              </p>
                            </div>
                            <ArrowRight className={`h-6 w-6 group-hover:translate-x-1 transition-transform ${
                              generationType === 'video' ? 'text-white' : 'text-muted-foreground'
                            }`} />
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}