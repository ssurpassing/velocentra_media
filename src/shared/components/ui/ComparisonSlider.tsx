'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MoveHorizontal } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
}: ComparisonSliderProps) {
  const t = useTranslations('comparisonSlider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden group"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* 原图（后面） */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeImage}
          alt="Before"
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* 原图标签 */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium">
          {beforeLabel || t('beforeLabel')}
        </div>
      </div>

      {/* 生成图（前面，通过 clip-path 裁剪） */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterImage}
          alt="After"
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* 生成图标签 */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium">
          {afterLabel || t('afterLabel')}
        </div>
      </div>

      {/* 滑动条 */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* 滑块手柄 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <MoveHorizontal className="h-5 w-5 text-gray-700" />
        </div>
      </div>

      {/* 提示文字（首次显示） */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {t('dragToCompare')}
      </div>
    </div>
  );
}

