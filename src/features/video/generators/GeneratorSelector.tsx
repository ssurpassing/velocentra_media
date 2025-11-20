/**
 * 视频生成器选择器
 * Tab 切换 Veo 3.1 和 Sora 2，带预览区域
 */

'use client';

import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { Zap, Sparkles, Video, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { http } from '@/infrastructure/http/client';
import { useTranslations } from 'next-intl';
import { Veo3Generator, Veo3GeneratorHandle } from './Veo3Generator';
import { Sora2Generator, Sora2GeneratorHandle } from './Sora2Generator';
import { VideoExample } from '@/shared/types/video';

type Provider = 'veo3' | 'sora2';

export interface GeneratorSelectorHandle {
  fillFromExample: (example: VideoExample | any) => void;
}

interface GeneratorSelectorProps {
  locale?: string;
}

export const GeneratorSelector = forwardRef<GeneratorSelectorHandle, GeneratorSelectorProps>(
  ({ locale = 'en' }, ref) => {
    const [provider, setProvider] = useState<Provider>('veo3');
    const t = useTranslations();
    
    // Refs for child generators
    const veo3Ref = useRef<Veo3GeneratorHandle>(null);
    const sora2Ref = useRef<Sora2GeneratorHandle>(null);
    
    // 预览状态
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const PROVIDERS = [
      {
        id: 'veo3' as Provider,
        label: 'Veo 3.1', // fallback
        description: 'Google Veo 3.1 - Fast & Quality', // fallback
        icon: Zap,
        color: '#3B82F6',
      },
      {
        id: 'sora2' as Provider,
        label: 'Sora 2', // fallback
        description: 'OpenAI Sora 2 - Basic & Pro', // fallback
        icon: Sparkles,
        color: '#9333EA',
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
              const videoFile = task.media_files?.find((f: any) => f.media_type === 'video');
              if (videoFile?.url) {
                setGeneratedVideoUrl(videoFile.url);
              }
              
              window.dispatchEvent(new CustomEvent('videoCompleted'));
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

    // 监听视频生成事件
    useEffect(() => {
      const handleVideoGenerating = (event: any) => {
        const { taskId } = event.detail || {};
        if (taskId) {
          setCurrentTaskId(taskId);
          setGenerating(true);
          setGeneratedVideoUrl(null);
          startPolling(taskId);
        }
      };

      window.addEventListener('videoGenerating', handleVideoGenerating);
      
      return () => {
        window.removeEventListener('videoGenerating', handleVideoGenerating);
      };
    }, []);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      fillFromExample: (example: VideoExample | any) => {
        // 确定使用哪个生成器
        let targetProvider: Provider = 'veo3';
        const modelStr = example.model || example.aiModel || '';
        
        if (modelStr.includes('sora') || modelStr.includes('Sora')) {
          targetProvider = 'sora2';
        } else if (modelStr.includes('veo') || modelStr.includes('Veo')) {
          targetProvider = 'veo3';
        }
        
        // 切换到正确的生成器
        setProvider(targetProvider);
        
        // 等待切换完成后填充数据
        setTimeout(() => {
          if (targetProvider === 'veo3' && veo3Ref.current) {
            veo3Ref.current.fillFromData(example);
          } else if (targetProvider === 'sora2' && sora2Ref.current) {
            sora2Ref.current.fillFromData(example);
          }
        }, 100);
      },
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 左侧：生成器表单 (占 2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Tab 切换 */}
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => {
                const Icon = p.icon;
                const isActive = provider === p.id;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundImage: isActive
                        ? `linear-gradient(135deg, ${p.color}15 0%, ${p.color}25 100%)`
                        : undefined,
                    }}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isActive ? 'shadow-sm' : 'bg-white'
                      }`}
                      style={{
                        backgroundColor: isActive ? `${p.color}20` : undefined,
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: isActive ? p.color : '#6B7280' }}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div
                        className={`text-sm font-semibold ${
                          isActive ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {p.label}
                      </div>
                      <div
                        className={`text-xs ${
                          isActive ? 'text-gray-600' : 'text-gray-500'
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {provider === 'veo3' && <Veo3Generator ref={veo3Ref} locale={locale} />}
            {provider === 'sora2' && <Sora2Generator ref={sora2Ref} locale={locale} />}
          </div>
        </div>

        {/* 右侧：预览区域 (占 3/5) */}
        <div className="lg:col-span-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 flex items-center justify-center min-h-[600px] lg:min-h-[700px]">
          {generating ? (
            // 生成中
            <div className="text-center">
              <Loader2 className="h-20 w-20 mx-auto mb-6 text-blue-500 animate-spin" />
              <p className="text-2xl font-medium mb-3 text-gray-900 dark:text-white">
                {t('generators.common.aiGenerating')}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {t('aiVideo.generator.generating')}
              </p>
              {currentTaskId && (
                <div className="mt-6 p-3 bg-white/50 dark:bg-black/20 rounded-lg inline-block">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {t('generators.common.taskId')}: {currentTaskId.slice(0, 8)}...
                  </p>
                </div>
              )}
            </div>
          ) : generatedVideoUrl ? (
            // 已生成视频
            <div className="w-full flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center mb-6">
                <video 
                  src={generatedVideoUrl} 
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-xl border-4 border-white/20 shadow-2xl"
                  style={{ maxHeight: '550px' }}
                >
                  {t('generators.common.browserNotSupport')}
                </video>
              </div>
              <div className="flex gap-4 px-4">
                <Button
                  onClick={() => {
                    setGeneratedVideoUrl(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="flex-1 text-base py-6"
                >
                  {t('generators.common.regenerate')}
                </Button>
                <Button asChild size="lg" className="flex-1 text-base py-6">
                  <a 
                    href={generatedVideoUrl} 
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
              <Video className="h-24 w-24 mx-auto mb-6 opacity-40" />
              <p className="text-xl font-medium mb-3">
                {t('generators.common.generationResult')}
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {t('aiVideo.generator.uploading')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

GeneratorSelector.displayName = 'GeneratorSelector';

