'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { OptimizedImage } from '@/shared/components/ui/OptimizedImage';
import { Sparkles, Play, Image as ImageIcon, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface InnovationExample {
  id: string;
  title: string;
  description: string;
  mediaType: 'video' | 'image';
  videoUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  targetPage: 'ai-image' | 'ai-video';
  tutorialUrl?: string;
  tutorialText?: string;
  aspectRatioParam?: string;
  styleParam?: string;
  referenceImageUrl?: string;
  seoKeywords?: string[];
}

interface InnovationLabSectionProps {
  initialExamples: InnovationExample[];
}

export function InnovationLabSection({ initialExamples }: InnovationLabSectionProps) {
  const t = useTranslations();
  const router = useRouter();
  const [examples] = useState<InnovationExample[]>(initialExamples);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handleCreateSimilar = (example: InnovationExample) => {
    // 使用taskId导航，让目标页面通过API获取完整参数
    const targetPath = example.targetPage === 'ai-image' ? '/create?type=image' : '/create?type=video';
    router.push(`${targetPath}?taskId=${example.id}`);
  };

  const handleTutorialClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (examples.length === 0) {
    return (
      <section id="innovation-lab" className="py-20 bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-gradient-primary">{t('innovationLab.title')}</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('innovationLab.subtitle')}
              </p>
            </div>
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <p className="text-muted-foreground">{t('innovationLab.noExamples')}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="innovation-lab" className="py-20 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">{t('innovationLab.title')}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('innovationLab.subtitle')}
            </p>
          </div>

          {/* Examples Grid */}
          <div className="space-y-12">
            {examples.map((example, index) => (
              <Card 
                key={example.id}
                className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
              >
                <CardContent className="p-0">
                  <div className={`grid grid-cols-1 lg:grid-cols-5 gap-0`}>
                    {/* Media Section - 占3列 */}
                    <div className={`relative bg-muted ${index % 2 === 1 ? 'lg:order-2' : ''} lg:col-span-3 flex items-center justify-center`}>
                      <div 
                        className={`${example.mediaType === 'video' ? 'aspect-video' : 'aspect-[4/3]'} w-full relative overflow-hidden group`}
                        onMouseEnter={() => {
                          if (example.mediaType === 'video' && example.videoUrl) {
                            const videoEl = document.getElementById(`video-${example.id}`) as HTMLVideoElement;
                            if (videoEl) {
                              videoEl.play().catch(() => {
                                // 忽略自动播放错误
                              });
                              setPlayingVideo(example.id);
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          if (example.mediaType === 'video' && example.videoUrl) {
                            const videoEl = document.getElementById(`video-${example.id}`) as HTMLVideoElement;
                            if (videoEl) {
                              videoEl.pause();
                              videoEl.currentTime = 0;
                              setPlayingVideo(null);
                            }
                          }
                        }}
                        onClick={() => {
                          if (example.mediaType === 'video' && example.videoUrl) {
                            const videoEl = document.getElementById(`video-${example.id}`) as HTMLVideoElement;
                            if (videoEl) {
                              if (playingVideo === example.id) {
                                videoEl.pause();
                                setPlayingVideo(null);
                              } else {
                                videoEl.play().catch(() => {
                                  // 忽略自动播放错误
                                });
                                setPlayingVideo(example.id);
                              }
                            }
                          }
                        }}
                      >
                        {example.mediaType === 'video' ? (
                          <>
                            {example.videoUrl && (
                              <video
                                id={`video-${example.id}`}
                                src={example.videoUrl}
                                className="w-full h-full object-cover"
                                loop
                                muted
                                playsInline
                                preload="metadata"
                              />
                            )}
                            {playingVideo !== example.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none">
                                <div className="p-4 rounded-full bg-white/90 backdrop-blur-sm group-hover:scale-110 transition-transform">
                                  <Play className="h-8 w-8 text-primary" fill="currentColor" />
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {example.imageUrl && (
                              <OptimizedImage
                                src={example.imageUrl}
                                alt={example.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                            <div className="absolute top-4 right-4">
                              <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium">{t('innovationLab.imageExample')}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content Section - 占2列 */}
                    <div className={`p-6 md:p-8 lg:p-10 flex flex-col justify-center lg:col-span-2 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                      {/* Title */}
                      <h3 className="text-xl md:text-2xl font-bold mb-3 text-gradient-primary line-clamp-2">
                        {example.title}
                      </h3>

                      {/* Description */}
                      {example.description && (
                        <p className="text-muted-foreground mb-4 text-base leading-relaxed">
                          {example.description}
                        </p>
                      )}

                      {/* Prompt */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">
                            {t('innovationLab.prompt')}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 border border-primary/10">
                          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                            {example.prompt}
                          </p>
                        </div>
                      </div>

                      {/* SEO Keywords (if available) */}
                      {example.seoKeywords && example.seoKeywords.length > 0 && (
                        <div className="mb-5">
                          <div className="flex flex-wrap gap-2">
                            {example.seoKeywords.slice(0, 5).map((keyword, idx) => (
                              <span 
                                key={idx}
                                className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <Button
                          size="default"
                          onClick={() => handleCreateSimilar(example)}
                          className="gradient-primary hover:opacity-90 transition-opacity flex-1 h-11"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {t('innovationLab.createSimilar')}
                        </Button>
                        
                        {example.tutorialUrl && (
                          <Button
                            size="default"
                            variant="outline"
                            onClick={() => handleTutorialClick(example.tutorialUrl!)}
                            className="border-primary/30 hover:bg-primary/10 h-11"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('innovationLab.viewTutorial')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

