'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Zap, ChevronDown, Check } from 'lucide-react';
import { CompactImageGenerator } from './CompactImageGenerator';
import { CompactVideoGenerator } from './CompactVideoGenerator';
import type { GeneratorHandle } from '../CreateStudioClient';

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  recommended?: boolean;
}

// v4.1: 重试上下文类型
type RetryContext = {
  taskId: string;
  status: 'completed' | 'failed';
  mediaType: 'image' | 'video';
} | null;

interface CreativePanelProps {
  creativeType: 'image' | 'video';
  models: readonly ModelConfig[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  currentModel?: ModelConfig;
  locale: string;
  retryContext?: RetryContext;
  onClearRetry?: () => void;
  generatorRef?: React.RefObject<GeneratorHandle | null>;
}

const colorMap: Record<string, { gradient: string; bg: string; text: string; border: string }> = {
  amber: {
    gradient: 'from-amber-400 via-yellow-500 to-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  emerald: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
};

export function CreativePanel({
  creativeType,
  models,
  selectedModel,
  onSelectModel,
  currentModel,
  locale,
  retryContext,
  onClearRetry,
  generatorRef,
}: CreativePanelProps) {
  const t = useTranslations('createStudio');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题 - 自定义下拉选择器 */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="relative" ref={dropdownRef}>
          {/* 选择器触发按钮 */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full text-left p-3 rounded-xl transition-all cursor-pointer
              ${currentModel ? `${colorMap[currentModel.color]?.bg || colorMap.emerald.bg}` : 'bg-muted/30'}
              hover:shadow-md
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0
                ${currentModel ? `bg-gradient-to-br ${colorMap[currentModel.color]?.gradient || colorMap.emerald.gradient}` : 'bg-muted'}
                shadow-lg
              `}>
                <span className="text-white text-xl">{currentModel?.icon || '🎨'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold text-sm ${currentModel ? colorMap[currentModel.color]?.text || colorMap.emerald.text : 'text-foreground'}`}>
                    {currentModel?.name || t('selectModel')}
                  </span>
                  {currentModel?.recommended && (
                    <Star className={`h-3 w-3 ${colorMap[currentModel.color]?.text || colorMap.emerald.text} fill-current flex-shrink-0`} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {currentModel?.description || (creativeType === 'image' ? t('imageModels') : t('videoModels'))}
                </p>
                
                {/* 特性标签 */}
                {currentModel && (
                  <div className="flex flex-wrap gap-1">
                    {currentModel.features.map((feature, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-0.5 rounded-md ${colorMap[currentModel.color]?.bg || colorMap.emerald.bg} ${colorMap[currentModel.color]?.text || colorMap.emerald.text} border ${colorMap[currentModel.color]?.border || colorMap.emerald.border}`}
                      >
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* 下拉箭头 */}
              <ChevronDown 
                className={`w-5 h-5 flex-shrink-0 ${currentModel ? colorMap[currentModel.color]?.text || colorMap.emerald.text : 'text-muted-foreground'} transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {/* 下拉菜单 */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-[400px] overflow-y-auto">
                {models.map((model) => {
                  const isSelected = selectedModel === model.id;
                  const colors = colorMap[model.color] || colorMap.emerald;

                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full text-left p-3 transition-all
                        ${isSelected 
                          ? `${colors.bg} border-l-4 ${colors.border}` 
                          : 'hover:bg-muted/50 border-l-4 border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0
                          ${isSelected ? `bg-gradient-to-br ${colors.gradient}` : 'bg-muted'}
                          transition-transform
                        `}>
                          <span className={isSelected ? 'text-white text-xl' : 'text-xl'}>{model.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold text-sm ${isSelected ? colors.text : 'text-foreground'}`}>
                              {model.name}
                            </span>
                            {model.recommended && (
                              <Star className={`h-3 w-3 ${isSelected ? colors.text : 'text-muted-foreground'} fill-current flex-shrink-0`} />
                            )}
                            {isSelected && (
                              <Check className={`h-4 w-4 ${colors.text} flex-shrink-0 ml-auto`} />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{model.description}</p>
                          
                          {/* 特性标签 - 始终显示 */}
                          <div className="flex flex-wrap gap-1">
                            {model.features.map((feature, index) => (
                              <span
                                key={index}
                                className={`text-xs px-2 py-0.5 rounded-md ${
                                  isSelected 
                                    ? `${colors.bg} ${colors.text} border ${colors.border}` 
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                ✓ {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 生成器参数区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 直接嵌入生成器 */}
        <div className="space-y-4">
          {creativeType === 'image' ? (
            <CompactImageGenerator 
              selectedModel={selectedModel}
              locale={locale}
              retryContext={retryContext}
              onClearRetry={onClearRetry}
              generatorRef={generatorRef}
            />
          ) : (
            <CompactVideoGenerator 
              selectedModel={selectedModel}
              locale={locale}
              retryContext={retryContext}
              onClearRetry={onClearRetry}
              generatorRef={generatorRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}

