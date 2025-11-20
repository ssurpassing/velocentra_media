/**
 * 图片生成器选择器
 * Tab 切换 Nano Banana 和 GPT-4o，带预览区域
 * 参考 video/generators/GeneratorSelector.tsx
 */

'use client';

import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { http } from '@/infrastructure/http/client';
import { useTranslations } from 'next-intl';
import { NanaBananaGenerator } from './NanaBananaGenerator';
import { GPT4oGenerator } from './GPT4oGenerator';
import { ImageExample } from '@/shared/types';

type Provider = 'nano-banana' | 'gpt4o';

export interface GeneratorSelectorHandle {
  fillFromExample: (example: ImageExample) => void;
}

interface GeneratorSelectorProps {
  locale?: string;
}

export interface GeneratorHandle {
  fillFromData: (data: any) => void;
}

export const GeneratorSelector = forwardRef<GeneratorSelectorHandle, GeneratorSelectorProps>(
  ({ locale = 'zh' }, ref) => {
    const [provider, setProvider] = useState<Provider>('nano-banana');
    const nanaBananaRef = useRef<GeneratorHandle>(null);
    const gpt4oRef = useRef<GeneratorHandle>(null);
    const t = useTranslations();
    
    // 预览状态
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const PROVIDERS = [
      {
        id: 'nano-banana' as Provider,
        label: 'Nano Banana', // fallback
        description: 'Google - Fast & Edit Modes', // fallback
        icon: '🍌',
        color: '#F59E0B',
      },
      {
        id: 'gpt4o' as Provider,
        label: 'GPT-4o Image', // fallback
        description: 'OpenAI - Text to Image', // fallback
        icon: '🤖',
        color: '#10B981',
      },
    ];

    // 轮询任务状态
    const startPolling = (taskId: string) => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      const poll = async () => {
        try {
          const response = await http.get(`/tasks/${taskId}`);
          
          if (response.success && response.data) {
            const task = response.data;
            
            if (task.status === 'completed') {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setGenerating(false);
              setCurrentTaskId(null);
              
              // 使用新的 media_files 数组
              const imageFiles = task.media_files?.filter((f: any) => f.media_type === 'image') || [];
              const imageUrls = imageFiles.map((f: any) => f.url);
              if (imageUrls.length > 0) {
                setGeneratedImages(imageUrls);
              }
              
              window.dispatchEvent(new CustomEvent('imageCompleted'));
            } else if (task.status === 'failed') {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setGenerating(false);
              setCurrentTaskId(null);
            }
          }
        } catch (err) {
          console.error('Poll error:', err);
        }
      };

      poll();
      pollingIntervalRef.current = setInterval(poll, 5000);
    };

    // 清理轮询
    useEffect(() => {
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }, []);

    // 监听图片生成事件
    useEffect(() => {
      const handleImageGenerating = (event: any) => {
        const { taskId } = event.detail || {};
        if (taskId) {
          setCurrentTaskId(taskId);
          setGenerating(true);
          setGeneratedImages([]);
          startPolling(taskId);
        }
      };

      window.addEventListener('imageGenerating', handleImageGenerating);
      
      return () => {
        window.removeEventListener('imageGenerating', handleImageGenerating);
      };
    }, []);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      fillFromExample: (example: ImageExample) => {
        // 根据示例的模型切换 provider
        let targetProvider: Provider = 'nano-banana';
        
        if (example.model?.includes('gpt4o')) {
          targetProvider = 'gpt4o';
        } else if (example.model?.includes('nano-banana')) {
          targetProvider = 'nano-banana';
        }
        
        setProvider(targetProvider);
        
        // 等待provider切换完成后，调用对应生成器的fillFromData方法
        setTimeout(() => {
          if (targetProvider === 'nano-banana' && nanaBananaRef.current) {
            nanaBananaRef.current.fillFromData(example);
          } else if (targetProvider === 'gpt4o' && gpt4oRef.current) {
            gpt4oRef.current.fillFromData(example);
          }
        }, 100);
      },
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 左侧：生成器表单 (占 2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Tab 切换 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => {
                const isActive = provider === p.id;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    style={{
                      backgroundImage: isActive
                        ? `linear-gradient(135deg, ${p.color}15 0%, ${p.color}25 100%)`
                        : undefined,
                    }}
                  >
                    <div
                      className={`p-2 rounded-lg text-2xl ${
                        isActive ? 'shadow-sm' : 'bg-white dark:bg-gray-700'
                      }`}
                      style={{
                        backgroundColor: isActive ? `${p.color}20` : undefined,
                      }}
                    >
                      {p.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div
                        className={`text-sm font-semibold ${
                          isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {p.label}
                      </div>
                      <div
                        className={`text-xs ${
                          isActive ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
                        }`}
                      >
                        {p.description}
                      </div>
                    </div>
                    {isActive && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 生成器内容 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {provider === 'nano-banana' && <NanaBananaGenerator ref={nanaBananaRef} locale={locale} />}
            {provider === 'gpt4o' && <GPT4oGenerator ref={gpt4oRef} locale={locale} />}
          </div>
        </div>

        {/* 右侧：预览区域 (占 3/5) */}
        <div className="lg:col-span-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 flex items-center justify-center min-h-[400px] lg:min-h-[450px]">
          {generating ? (
            // 生成中
            <div className="text-center">
              <Loader2 className="h-20 w-20 mx-auto mb-6 text-blue-500 animate-spin" />
              <p className="text-2xl font-medium mb-3 text-gray-900 dark:text-white">
                {t('generators.common.aiGenerating')}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {t('generators.common.estimatedTime')}: 10-30{t('common.seconds', { defaultValue: 's' })}
              </p>
              {currentTaskId && (
                <div className="mt-6 p-3 bg-white/50 dark:bg-black/20 rounded-lg inline-block">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {t('generators.common.taskId')}: {currentTaskId.slice(0, 8)}...
                  </p>
                </div>
              )}
            </div>
          ) : generatedImages.length > 0 ? (
            // 已生成图片
            <div className="w-full h-full flex flex-col p-6">
              <div className="flex-1 flex items-center justify-center mb-6 overflow-hidden">
                {generatedImages.length === 1 ? (
                  // 单张图片：完整显示，保持比例
                  <div className="flex items-center justify-center w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={generatedImages[0]} 
                      alt="Generated image"
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                    />
                  </div>
                ) : (
                  // 多张图片：横向并排显示，每张图片带下载按钮
                  <div className="flex gap-4 w-full h-full items-center justify-center">
                    {generatedImages.map((imageUrl, index) => (
                      <div key={index} className="relative flex-1 h-full flex items-center justify-center group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imageUrl} 
                          alt={`Generated ${index + 1}`}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        />
                        {/* 悬浮下载按钮 */}
                        <a
                          href={imageUrl}
                          download={`generated-${index + 1}.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-4 right-4 p-3 bg-gray-900/80 hover:bg-gray-900 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title={t('generators.common.download')}
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4 px-4">
                <Button
                  onClick={() => {
                    setGeneratedImages([]);
                  }}
                  variant="outline"
                  size="lg"
                  className="flex-1 text-base py-6"
                >
                  {t('generators.common.regenerate')}
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="flex-1 text-base py-6"
                >
                  <a 
                    href={generatedImages[0]} 
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('generators.common.download')}
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            // 占位符
            <div className="text-center text-gray-400">
              <ImageIcon className="h-24 w-24 mx-auto mb-6 opacity-40" />
              <p className="text-xl font-medium mb-3">
                {t('generators.common.generationResult')}
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {t('aiImage.generator.promptPlaceholder')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

GeneratorSelector.displayName = 'GeneratorSelector';

