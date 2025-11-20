'use client';

import { useRef, useImperativeHandle } from 'react';
import { Veo3Generator, type Veo3GeneratorHandle } from '@/features/video/generators/Veo3Generator';
import { Sora2Generator, type Sora2GeneratorHandle } from '@/features/video/generators/Sora2Generator';
import type { GeneratorHandle } from '../CreateStudioClient';

// v4.1: 重试上下文类型
type RetryContext = {
  taskId: string;
  status: 'completed' | 'failed';
  mediaType: 'image' | 'video';
} | null;

interface CompactVideoGeneratorProps {
  selectedModel: string;
  locale: string;
  retryContext?: RetryContext;
  onClearRetry?: () => void;
  generatorRef?: React.RefObject<GeneratorHandle | null>;
}

export function CompactVideoGenerator({ selectedModel, locale, retryContext, onClearRetry, generatorRef }: CompactVideoGeneratorProps) {
  const veo3Ref = useRef<Veo3GeneratorHandle>(null);
  const sora2Ref = useRef<Sora2GeneratorHandle>(null);

  // 暴露方法给父组件
  useImperativeHandle(generatorRef, () => ({
    fillFromData: (data: any) => {
      console.log('[CompactVideoGenerator] fillFromData:', data);
      console.log('[CompactVideoGenerator] selectedModel:', selectedModel);
      if (selectedModel === 'google-veo-3.1') {
        veo3Ref.current?.fillFromData(data);
      } else if (selectedModel.includes('sora-2')) {
        sora2Ref.current?.fillFromData(data);
      }
    },
  }), [selectedModel]);

  // 根据选中的模型渲染对应的生成器
  const renderGenerator = () => {
    // Veo 3.1
    if (selectedModel === 'google-veo-3.1') {
      return <Veo3Generator ref={veo3Ref} locale={locale} retryContext={retryContext} onClearRetry={onClearRetry} />;
    }
    // Sora 2 (包含所有 Sora 模型)
    else if (selectedModel.includes('sora-2')) {
      return <Sora2Generator ref={sora2Ref} locale={locale} retryContext={retryContext} onClearRetry={onClearRetry} />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {renderGenerator()}
    </div>
  );
}

