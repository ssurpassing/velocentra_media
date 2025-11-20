/**
 * 模型徽章组件
 * 显示视频生成器来源
 */

'use client';

import { useTranslations } from 'next-intl';
import { Zap, Sparkles, Crown, Video, Film, Eraser } from 'lucide-react';
import { VideoModel } from '@/shared/types/video';
import { getModelBadgeConfig, formatModelDisplayName } from '@/shared/config/video-models';

interface ModelBadgeProps {
  model: VideoModel;
  locale?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function ModelBadge({ 
  model, 
  locale = 'en', 
  size = 'md',
  showIcon = true 
}: ModelBadgeProps) {
  const config = getModelBadgeConfig(model);
  
  if (!config) {
    return null;
  }

  const iconMap: Record<string, any> = {
    'zap': Zap,
    'sparkles': Sparkles,
    'crown': Crown,
    'video': Video,
    'image': Film,
    'film': Film,
    'eraser': Eraser,
  };

  const Icon = iconMap[config.icon] || Video;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // 判断是否是渐变色
  const isGradient = config.color.startsWith('linear-gradient');

  return (
    <div
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        background: isGradient ? config.color : `${config.color}15`,
        color: isGradient ? '#FFFFFF' : config.color,
        border: isGradient ? 'none' : `1px solid ${config.color}40`,
      }}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      <span>{config.text}</span>
    </div>
  );
}

/**
 * 模型信息卡片
 * 用于任务详情页显示完整的模型信息
 */
interface ModelInfoCardProps {
  model: VideoModel;
  params?: any;
  locale?: string;
}

export function ModelInfoCard({ model, params, locale = 'en' }: ModelInfoCardProps) {
  const t = useTranslations();
  const displayName = formatModelDisplayName(model, locale);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            {t('generators.labels.generator')}
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {displayName}
          </div>
        </div>
        <ModelBadge model={model} locale={locale} />
      </div>

      {params && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {params.aspectRatio && (
            <div>
              <div className="text-gray-500">{t('generators.labels.aspectRatio')}</div>
              <div className="font-medium text-gray-900">{params.aspectRatio}</div>
            </div>
          )}
          
          {params.nFrames && (
            <div>
              <div className="text-gray-500">{t('generators.labels.duration')}</div>
              <div className="font-medium text-gray-900">{params.nFrames}s</div>
            </div>
          )}
          
          {params.quality && (
            <div>
              <div className="text-gray-500">{t('generators.labels.quality')}</div>
              <div className="font-medium text-gray-900">
                {params.quality === 'high' 
                  ? t('generators.labels.highQuality')
                  : t('generators.labels.standard')}
              </div>
            </div>
          )}
          
          {params.removeWatermark !== undefined && (
            <div>
              <div className="text-gray-500">{t('generators.labels.watermark')}</div>
              <div className="font-medium text-gray-900">
                {params.removeWatermark 
                  ? t('generators.labels.removed')
                  : t('generators.labels.kept')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

