/**
 * 基础视频生成器组件
 * 提供共享的 UI 和逻辑
 */

'use client';

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export interface BaseVideoGeneratorProps {
  // 状态
  generating: boolean;
  error: string;
  uploadingImages: boolean;
  
  // 回调
  onGenerate: () => void;
  onError: (error: string) => void;
  
  // 子组件
  children: ReactNode;
  
  // UI 配置
  generateButtonText?: string;
  generateButtonTextCn?: string;
  credits?: number;
  locale?: string;
  colorTheme?: 'amber' | 'emerald'; // 颜色主题
}

export function BaseVideoGenerator({
  generating,
  error,
  uploadingImages,
  onGenerate,
  onError,
  children,
  generateButtonText = 'Generate Video',
  generateButtonTextCn = '生成视频',
  credits,
  locale = 'en',
  colorTheme = 'amber',
}: BaseVideoGeneratorProps) {
  const t = useTranslations();
  
  // 颜色映射
  const colorClasses = {
    amber: {
      bg: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    emerald: {
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
  };
  
  const colors = colorClasses[colorTheme];

  return (
    <div className="space-y-5">
      {/* 表单内容（由子组件提供） */}
      <div className="space-y-5">
        {children}
      </div>

      {/* 错误消息 */}
      {error && (
        <div className="relative p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30 border border-red-300 dark:border-red-800 rounded-xl">
          <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* 生成按钮和积分 */}
      <div className="space-y-3">
        {/* 积分预览卡片 */}
        {credits && (
          <div className={`flex items-center justify-between p-3 bg-gradient-to-r ${colors.bg} rounded-lg border ${colors.border}`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 ${colors.iconBg} rounded-lg`}>
                <Sparkles className={`h-4 w-4 ${colors.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('generators.common.cost')}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${colors.textColor}`}>
                {credits}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('generators.common.credits')}
              </span>
            </div>
          </div>
        )}
        
        {/* 生成按钮 */}
        <Button
          onClick={onGenerate}
          disabled={generating || uploadingImages}
          className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${
            colorTheme === 'amber' 
              ? 'from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30'
              : 'from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-600 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30'
          } text-white transition-all duration-200`}
          size="lg"
        >
          {uploadingImages ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>{t('generators.common.uploading')}</span>
            </>
          ) : generating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>{t('generators.common.aiGenerating')}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              <span>{locale === 'zh' ? generateButtonTextCn : generateButtonText}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * 提示词输入组件
 */
interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  labelCn?: string;
  placeholder?: string;
  placeholderCn?: string;
  locale?: string;
  maxLength?: number;
  rows?: number;
  showLabel?: boolean;
  rightElement?: React.ReactNode;
}

export function PromptInput({
  value,
  onChange,
  label = 'Prompt',
  labelCn = '提示词',
  placeholder = 'Describe the video you want to create...',
  placeholderCn = '描述你想生成的视频内容...',
  locale = 'en',
  maxLength = 10000,
  rows = 4,
  showLabel = true,
  rightElement,
}: PromptInputProps) {
  const t = useTranslations();

  return (
    <div>
      {showLabel && (
        <label className="flex items-center justify-between mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          <span className="flex items-center gap-2">
            <span>{locale === 'zh' ? labelCn : label}</span>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              （Prompt）
            </span>
          </span>
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
            {value.length} / {maxLength}
          </span>
        </label>
      )}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={locale === 'zh' ? placeholderCn : placeholder}
          rows={rows}
          maxLength={maxLength}
          className="w-full px-4 py-3.5 pr-28 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
        />
        {/* 优化按钮 - 放在输入框内部右上角 */}
        {rightElement && (
          <div className="absolute top-3 right-3">
            {rightElement}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>
          {t('generators.common.promptHint')}
        </span>
      </p>
    </div>
  );
}

/**
 * 宽高比选择组件
 */
interface AspectRatioSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: string }>;
  label?: string;
  labelCn?: string;
  locale?: string;
}

export function AspectRatioSelector({
  value,
  onChange,
  options,
  label = 'Aspect Ratio',
  labelCn = '宽高比',
  locale = 'en',
}: AspectRatioSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
        {locale === 'zh' ? labelCn : label}
      </label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-gray-900 dark:text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {option.icon && (
                <span className="text-lg">{option.icon}</span>
              )}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 时长选择组件
 */
interface DurationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; credits?: number }>;
  label?: string;
  labelCn?: string;
  locale?: string;
}

export function DurationSelector({
  value,
  onChange,
  options,
  label = 'Duration',
  labelCn = '时长',
  locale = 'en',
}: DurationSelectorProps) {
  const t = useTranslations();
  
  // 根据选项数量动态设置网格列数
  const gridCols = options.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
        {locale === 'zh' ? labelCn : label}
      </label>
      <div className={`grid ${gridCols} gap-2`}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`group relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500 text-blue-700 dark:text-blue-400 shadow-lg shadow-blue-500/20 scale-[1.02]'
                  : 'bg-card border border-border text-foreground hover:border-blue-500/50 hover:shadow-md hover:scale-[1.01]'
              }`}
            >
              <span className="text-sm font-semibold">{option.label}</span>
              {option.credits && (
                <span className={`text-xs font-medium ${
                  isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                }`}>
                  {option.credits} {t('generators.common.credits')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 开关组件
 */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  labelCn?: string;
  description?: string;
  descriptionCn?: string;
  locale?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  labelCn,
  description,
  descriptionCn,
  locale = 'en',
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">
          {locale === 'zh' && labelCn ? labelCn : label}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">
            {locale === 'zh' && descriptionCn ? descriptionCn : description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          checked ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' : 'bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out ${
            checked ? 'translate-x-5 scale-110' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

