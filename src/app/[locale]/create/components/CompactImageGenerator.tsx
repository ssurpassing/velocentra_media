'use client';

import { useRef, useImperativeHandle } from 'react';
import { NanaBananaGenerator } from '@/features/image/generators/NanaBananaGenerator';
import { GPT4oGenerator } from '@/features/image/generators/GPT4oGenerator';
import type { GeneratorHandle as ImageGeneratorHandle } from '@/features/image/generators/GeneratorSelector';
import type { GeneratorHandle } from '../CreateStudioClient';

// v4.1: 重试上下文类型
type RetryContext = {
  taskId: string;
  status: 'completed' | 'failed';
  mediaType: 'image' | 'video';
} | null;

interface CompactImageGeneratorProps {
  selectedModel: string;
  locale: string;
  retryContext?: RetryContext;
  onClearRetry?: () => void;
  generatorRef?: React.RefObject<GeneratorHandle | null>;
}

export function CompactImageGenerator({ selectedModel, locale, retryContext, onClearRetry, generatorRef }: CompactImageGeneratorProps) {
  const nanaBananaRef = useRef<ImageGeneratorHandle>(null);
  const gpt4oRef = useRef<ImageGeneratorHandle>(null);

  // 暴露方法给父组件
  useImperativeHandle(generatorRef, () => ({
    fillFromData: (data: any) => {
      if (selectedModel === 'kie-nano-banana-edit') {
        nanaBananaRef.current?.fillFromData(data);
      } else if (selectedModel === 'kie-gpt4o-image') {
        gpt4oRef.current?.fillFromData(data);
      }
    },
  }), [selectedModel]);

  // 根据选中的模型渲染对应的生成器
  const renderGenerator = () => {
    if (selectedModel === 'kie-nano-banana-edit') {
      return <NanaBananaGenerator ref={nanaBananaRef} locale={locale} retryContext={retryContext} onClearRetry={onClearRetry} />;
    } else if (selectedModel === 'kie-gpt4o-image') {
      return <GPT4oGenerator ref={gpt4oRef} locale={locale} retryContext={retryContext} onClearRetry={onClearRetry} />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {renderGenerator()}
    </div>
  );
}

