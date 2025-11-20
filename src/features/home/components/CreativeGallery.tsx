'use client';

import { useState, useEffect } from 'react';
import { Image, Video, Sparkles, Play } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useRouter } from '@/navigation';
import { OptimizedImage } from '@/shared/components/ui/OptimizedImage';
import { useTranslations } from 'next-intl';
import { http } from '@/infrastructure/http/client';

interface CreativeItem {
  id: string;
  type: 'image' | 'video';
  category: string;
  title: string;
  description: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  model: string;
  prompt: string;
}

export function CreativeGallery() {
  const t = useTranslations('creativeGallery');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video'>('all');
  const [items, setItems] = useState<CreativeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    loadCreativeItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCreativeItems = async () => {
    try {
      setLoading(true);
      // 从 API 获取展示任务
      const response = await http.get('/innovation-lab?displayLocation=homepage&limit=12');
      
      if (response.success && response.data) {
        const creativeItems = response.data.map((item: any) => ({
          id: item.id,
          type: item.mediaType as 'image' | 'video',
          category: getCategoryFromModel(item.aiModel),
          title: item.title || item.originalPrompt?.substring(0, 50) || t('untitled'),
          description: item.description || item.originalPrompt?.substring(0, 100) || '',
          mediaUrl: item.mediaType === 'video' ? item.videoUrl : item.imageUrl,
          thumbnailUrl: item.thumbnailUrl,
          model: item.aiModel || 'AI',
          prompt: item.originalPrompt || item.optimizedPrompt || '',
        })).filter((item: CreativeItem) => item.mediaUrl); // 只显示有媒体URL的
        
        setItems(creativeItems);
      }
    } catch (error) {
      console.error('[CreativeGallery] Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromModel = (model: string): string => {
    if (model?.includes('nano-banana') || model?.includes('gpt4o')) return 'portrait';
    if (model?.includes('veo') || model?.includes('sora')) return 'animation';
    return 'creative';
  };

  const categories = [
    { id: 'portrait', nameKey: 'portrait', icon: '👤', color: 'from-blue-500 to-cyan-500' },
    { id: 'commercial', nameKey: 'commercial', icon: '📢', color: 'from-purple-500 to-pink-500' },
    { id: 'animation', nameKey: 'animation', icon: '🎬', color: 'from-orange-500 to-red-500' },
    { id: 'creative', nameKey: 'creative', icon: '✨', color: 'from-green-500 to-teal-500' },
  ];

  const filteredItems =
    activeTab === 'all'
      ? items
      : items.filter((item) => item.type === activeTab);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="text-center">
              <p className="text-muted-foreground">{t('loading')}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null; // 没有数据就不显示这个区域
  }

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
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

          {/* 分类标签 */}
          <div className="flex justify-center gap-6 mb-12 flex-wrap">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group cursor-pointer"
              >
                <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${category.color} transition-all duration-300 hover:scale-110 hover:shadow-2xl`}>
                  <div className="text-4xl mb-2 text-white">{category.icon}</div>
                  <div className="text-sm font-bold text-white">{t(category.nameKey)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 类型筛选 */}
          <div className="flex justify-center gap-4 mb-12">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? 'gradient-primary' : ''}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('allWorks')}
            </Button>
            <Button
              variant={activeTab === 'image' ? 'default' : 'outline'}
              onClick={() => setActiveTab('image')}
              className={activeTab === 'image' ? 'gradient-primary' : ''}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4 mr-2" />
              {t('imageWorks')}
            </Button>
            <Button
              variant={activeTab === 'video' ? 'default' : 'outline'}
              onClick={() => setActiveTab('video')}
              className={activeTab === 'video' ? 'gradient-primary' : ''}
            >
              <Video className="h-4 w-4 mr-2" />
              {t('videoWorks')}
            </Button>
          </div>

          {/* 作品网格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="group relative"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-primary/10 shadow-lg group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-300">
                  {/* 媒体内容 */}
                  {item.type === 'video' ? (
                    <div 
                      className="relative w-full h-full bg-black"
                      onMouseEnter={() => {
                        if (item.mediaUrl) {
                          const videoEl = document.getElementById(`video-gallery-${item.id}`) as HTMLVideoElement;
                          if (videoEl) {
                            const playPromise = videoEl.play();
                            if (playPromise !== undefined) {
                              playPromise
                                .then(() => {
                                  setPlayingVideo(item.id);
                                })
                                .catch(() => {
                                  // 视频播放失败，忽略
                                });
                            }
                          }
                        }
                      }}
                      onMouseLeave={() => {
                        if (item.mediaUrl) {
                          const videoEl = document.getElementById(`video-gallery-${item.id}`) as HTMLVideoElement;
                          if (videoEl) {
                            videoEl.pause();
                            videoEl.currentTime = 0;
                            setPlayingVideo(null);
                          }
                        }
                      }}
                    >
                      {item.mediaUrl ? (
                        <video
                          id={`video-gallery-${item.id}`}
                          key={item.id}
                          src={item.mediaUrl}
                          className="w-full h-full object-cover bg-black"
                          loop
                          muted
                          playsInline
                          preload="auto"
                          poster={item.thumbnailUrl && item.thumbnailUrl !== item.mediaUrl ? item.thumbnailUrl : undefined}
                          onError={() => {
                            // 视频加载失败，由UI处理
                          }}
                          style={{ display: 'block', pointerEvents: 'none' }}
                        />
                      ) : item.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1 z-10">
                        <Video className="h-3 w-3" />
                        VIDEO
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      {item.mediaUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Sparkles className="h-16 w-16 text-primary opacity-30" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold flex items-center gap-1 z-10">
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image className="h-3 w-3" aria-hidden="true" />
                        IMAGE
                      </div>
                    </div>
                  )}

                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto">
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-white/80 mb-3">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs">
                          {item.model}
                        </span>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(item.type === 'video' ? '/create?type=video' : '/create?type=image')
                          }
                          className="ml-auto"
                        >
                          {t('createSimilar')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 底部信息 */}
                <div className="mt-4">
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {item.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 查看更多 */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/gallery')}
              className="border-2"
            >
              查看完整作品集
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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

