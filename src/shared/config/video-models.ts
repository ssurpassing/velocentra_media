/**
 * 视频生成模型配置
 * 注意：displayName 和 description 现在从翻译文件读取
 * 使用 models.video.{modelId}.displayName 和 models.video.{modelId}.description
 */

import { VideoModel, VideoProvider } from '@/shared/types/video';

export interface VideoModelConfig {
  id: VideoModel;
  name: string;
  displayName: string; // fallback，实际从翻译文件读取
  provider: VideoProvider;
  description: string; // fallback，实际从翻译文件读取
  
  // 定价
  credits: {
    '10s'?: number;
    '15s'?: number;
    '25s'?: number;
  };
  
  // 功能支持
  features: {
    supportsImageInput: boolean;
    supportsStoryboard: boolean;
    supportsWatermarkRemoval: boolean;
    maxImages?: number;
  };
  
  // UI 配置
  ui: {
    color: string; // 品牌色
    icon: string; // 图标名称
    badge: string; // 徽章文本
  };
  
  isActive: boolean;
}

// Veo 3.1 模型配置
export const VEO3_MODELS: VideoModelConfig[] = [
  {
    id: 'veo3_fast',
    name: 'veo3_fast',
    displayName: 'Veo 3.1 Fast', // fallback，从翻译读取: models.video.veo3_fast.displayName
    provider: 'veo3',
    description: '', // 从翻译读取: models.video.veo3_fast.description
    credits: {
      '10s': 100,
    },
    features: {
      supportsImageInput: true,
      supportsStoryboard: false,
      supportsWatermarkRemoval: false,
      maxImages: 3,
    },
    ui: {
      color: '#3B82F6', // blue
      icon: 'zap',
      badge: 'Veo Fast',
    },
    isActive: true,
  },
  {
    id: 'veo3',
    name: 'veo3',
    displayName: 'Veo 3.1 Quality', // fallback，从翻译读取: models.video.veo3.displayName
    provider: 'veo3',
    description: '', // 从翻译读取: models.video.veo3.description
    credits: {
      '10s': 300,
    },
    features: {
      supportsImageInput: true,
      supportsStoryboard: false,
      supportsWatermarkRemoval: false,
      maxImages: 3,
    },
    ui: {
      color: '#1D4ED8', // dark blue
      icon: 'sparkles',
      badge: 'Veo Quality',
    },
    isActive: true,
  },
];

// Sora 2 模型配置
export const SORA2_MODELS: VideoModelConfig[] = [
  {
    id: 'sora-2-text-to-video',
    name: 'sora-2-text-to-video',
    displayName: 'Sora 2 Text To Video', // fallback
    provider: 'sora2',
    description: '', // 从翻译读取: models.video.sora-2-text-to-video.description
    credits: {
      '10s': 6,
      '15s': 6,
    },
    features: {
      supportsImageInput: false,
      supportsStoryboard: false,
      supportsWatermarkRemoval: false,
    },
    ui: {
      color: '#9333EA', // purple
      icon: 'video',
      badge: 'Sora 2',
    },
    isActive: true,
  },
  {
    id: 'sora-2-image-to-video',
    name: 'sora-2-image-to-video',
    displayName: 'Sora 2 Image To Video', // fallback
    provider: 'sora2',
    description: '', // 从翻译读取: models.video.sora-2-image-to-video.description
    credits: {
      '10s': 6,
      '15s': 6,
    },
    features: {
      supportsImageInput: true,
      supportsStoryboard: false,
      supportsWatermarkRemoval: false,
      maxImages: 2,
    },
    ui: {
      color: '#9333EA', // purple
      icon: 'image',
      badge: 'Sora 2',
    },
    isActive: true,
  },
  {
    id: 'sora-2-pro-text-to-video',
    name: 'sora-2-pro-text-to-video',
    displayName: 'Sora 2 Pro Text To Video', // fallback
    provider: 'sora2',
    description: '', // 从翻译读取: models.video.sora-2-pro-text-to-video.description
    credits: {
      '10s': 150, // Standard
      '15s': 270, // Standard
    },
    features: {
      supportsImageInput: false,
      supportsStoryboard: false,
      supportsWatermarkRemoval: false,
    },
    ui: {
      color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // gold gradient
      icon: 'crown',
      badge: 'Sora 2 Pro',
    },
    isActive: true,
  },
  {
    id: 'sora-2-pro-image-to-video',
    name: 'sora-2-pro-image-to-video',
    displayName: 'Sora 2 Pro Image To Video', // fallback
    provider: 'sora2',
    description: '', // 从翻译读取: models.video.sora-2-pro-image-to-video.description
    credits: {
      '10s': 150, // Standard
      '15s': 270, // Standard
    },
    features: {
      supportsImageInput: true,
      supportsStoryboard: false,
      supportsWatermarkRemoval: false,
      maxImages: 2,
    },
    ui: {
      color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // gold gradient
      icon: 'crown',
      badge: 'Sora 2 Pro',
    },
    isActive: true,
  },
  {
    id: 'sora-2-pro-storyboard',
    name: 'sora-2-pro-storyboard',
    displayName: 'Sora 2 Pro Storyboard', // fallback
    provider: 'sora2',
    description: '', // 从翻译读取: models.video.sora-2-pro-storyboard.description
    credits: {
      '10s': 150, // Standard
      '15s': 270, // Standard
      '25s': 450, // Standard
    },
    features: {
      supportsImageInput: true,
      supportsStoryboard: true,
      supportsWatermarkRemoval: false,
      maxImages: 5,
    },
    ui: {
      color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // gold gradient
      icon: 'film',
      badge: 'Sora 2 Pro',
    },
    isActive: true,
  },
  {
    id: 'sora-watermark-remover',
    name: 'sora-watermark-remover',
    displayName: 'Sora Watermark Remover', // fallback
    provider: 'sora2',
    description: '', // 从翻译读取: models.video.sora-watermark-remover.description
    credits: {
      '10s': 3,
    },
    features: {
      supportsImageInput: false,
      supportsStoryboard: false,
      supportsWatermarkRemoval: true,
    },
    ui: {
      color: '#6B7280', // gray
      icon: 'eraser',
      badge: 'Watermark',
    },
    isActive: true,
  },
];

// 所有视频模型
export const VIDEO_MODELS: VideoModelConfig[] = [
  ...VEO3_MODELS,
  ...SORA2_MODELS,
];

/**
 * 获取模型配置
 */
export function getVideoModelConfig(modelId: VideoModel): VideoModelConfig | undefined {
  return VIDEO_MODELS.find(m => m.id === modelId);
}

/**
 * 获取所有激活的模型
 */
export function getActiveVideoModels(): VideoModelConfig[] {
  return VIDEO_MODELS.filter(m => m.isActive);
}

/**
 * 按提供商分组模型
 */
export function getVideoModelsByProvider(provider: VideoProvider): VideoModelConfig[] {
  return VIDEO_MODELS.filter(m => m.provider === provider && m.isActive);
}

/**
 * 计算视频生成积分成本
 * @deprecated 使用 model-credits.ts 中的 calculateVideoCredits 替代
 */
export function calculateVideoCredits(
  modelId: VideoModel,
  duration: '10s' | '15s' | '25s' = '10s',
  quality: 'standard' | 'high' = 'standard'
): number {
  // 导入统一配置
  const { calculateVideoCredits: calcCredits } = require('./model-credits');
  return calcCredits(modelId, duration, quality);
}

/**
 * 格式化模型显示名称
 * @deprecated 请在组件中使用 useTranslations 和 models.video.{modelId}.displayName
 */
export function formatModelDisplayName(modelId: VideoModel, locale: string = 'en'): string {
  const model = getVideoModelConfig(modelId);
  if (!model) {
    return modelId;
  }
  return model.displayName;
}

/**
 * 获取模型徽章配置
 */
export function getModelBadgeConfig(modelId: VideoModel): { color: string; icon: string; text: string } | null {
  const model = getVideoModelConfig(modelId);
  if (!model) {
    return null;
  }
  return {
    color: model.ui.color,
    icon: model.ui.icon,
    text: model.ui.badge,
  };
}

