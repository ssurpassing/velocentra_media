import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  quality = 85,
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 如果图片加载失败，显示占位符
  if (error) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <svg
          className="w-12 h-12 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  const imageProps = {
    src,
    alt,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    onLoad: handleLoad,
    onError: handleError,
    quality,
    priority,
    ...(fill
      ? { fill: true, sizes: sizes || '100vw' }
      : { width: width || 500, height: height || 500 }),
  };

  return (
    <>
      {isLoading && (
        <div className={`absolute inset-0 bg-muted animate-pulse ${className}`} />
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image {...imageProps} />
    </>
  );
}

