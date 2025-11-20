'use client';

import { OptimizedImage } from '@/shared/components/ui/OptimizedImage';
import { useEffect, useRef } from 'react';

interface GalleryImage {
  url: string;
  alt: string;
}

export function InfiniteScrollGallery() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 示例图片 - 实际使用时从 API 获取
  const images: GalleryImage[] = Array.from({ length: 20 }, (_, i) => ({
    url: `/gallery/example-${i + 1}.jpg`,
    alt: `示例 ${i + 1}`,
  }));

  // 自动滚动效果
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          <span className="text-gradient-primary">真实用户作品展示</span>
        </h2>
        <p className="text-xl text-muted-foreground">
          100% AI 生成，效果惊艳
        </p>
      </div>

      {/* 滚动画廊 - 第一行 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide mb-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* 复制两次以实现无缝循环 */}
        {[...images, ...images].map((image, index) => (
          <div
            key={index}
            className="relative flex-shrink-0 w-64 h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group"
          >
            <OptimizedImage
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-medium">AI 专业头像</p>
            </div>
          </div>
        ))}
      </div>

      {/* 滚动画廊 - 第二行（反向滚动）*/}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {[...images.slice().reverse(), ...images.slice().reverse()].map((image, index) => (
          <div
            key={index}
            className="relative flex-shrink-0 w-64 h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group"
            style={{
              animation: `scroll-reverse ${images.length * 3}s linear infinite`,
            }}
          >
            <OptimizedImage
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

