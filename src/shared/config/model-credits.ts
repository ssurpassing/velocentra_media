/**
 * 统一模型积分配置
 * 管理所有 AI 模型的积分消耗
 */

// ========================================
// 图片生成模型积分配置
// ========================================

export interface ImageModelCredits {
  [modelId: string]: number;
}

/**
 * 图片生成模型积分成本
 */
export const IMAGE_MODEL_CREDITS: ImageModelCredits = {
  // KIE 模型
  'kie-nano-banana': 10,
  'kie-nano-banana-edit': 12,
  'kie-gpt4o-image': 15,

  
  // 默认值
  'default': 10,
};

/**
 * 图片风格额外积分成本（可选）
 */
export const IMAGE_STYLE_CREDITS: Record<string, number> = {
  'custom': 0,          // 自定义无额外成本
  'realistic': 0,       // 写实风格
  'anime': 0,           // 动漫风格
  'painting': 0,        // 绘画风格（额外成本）
  'sketch': 0,          // 素描风格
  '3d': 0,              // 3D 风格（额外成本）
};

// ========================================
// 视频生成模型积分配置
// ========================================

export interface VideoModelCredits {
  [modelId: string]: {
    '10s'?: number;
    '15s'?: number;
    '25s'?: number;
  };
}

/**
 * 视频生成模型积分成本
 */
export const VIDEO_MODEL_CREDITS: VideoModelCredits = {
  // Veo 3.1
  'veo3_fast': {
    '10s': 100,
  },
  'veo3': {
    '10s': 300,
  },
  
  // Sora 2 基础版
  'sora-2-text-to-video': {
    '10s': 50,
    '15s': 80,
  },
  'sora-2-image-to-video': {
    '10s': 50,
    '15s': 80,
  },
  
  // Sora 2 Pro 版
  'sora-2-pro-text-to-video': {
    '10s': 300,  // Standard
    '15s': 500,  // Standard
  },
  'sora-2-pro-image-to-video': {
    '10s': 300,  // Standard
    '15s': 500,  // Standard
  },
  'sora-2-pro-storyboard': {
    '10s': 300,  // Standard
    '15s': 500,  // Standard
    '25s': 700,  // Standard
  },
  
  // Sora 水印移除
  'sora-watermark-remover': {
    '10s': 3,
  },
};

/**
 * 视频质量倍数
 * Pro 高质量是标准质量的 2.2 倍
 */
export const VIDEO_QUALITY_MULTIPLIERS = {
  'standard': 1.0,
  'high': 2.2,
};

// ========================================
// 统一积分计算函数
// ========================================

/**
 * 计算图片生成积分成本
 */
export function calculateImageCredits(
  modelId: string,
  style: string = 'custom',
  numberOfImages: number = 1
): number {
  const baseCredits = IMAGE_MODEL_CREDITS[modelId] || IMAGE_MODEL_CREDITS['default'];
  const styleCredits = IMAGE_STYLE_CREDITS[style] || 0;
  const totalPerImage = baseCredits + styleCredits;
  
  return totalPerImage * numberOfImages;
}

/**
 * 计算视频生成积分成本
 */
export function calculateVideoCredits(
  modelId: string,
  duration: '10s' | '15s' | '25s' = '10s',
  quality: 'standard' | 'high' = 'standard'
): number {
  const modelCredits = VIDEO_MODEL_CREDITS[modelId];
  
  if (!modelCredits) {
    console.warn(`Unknown video model: ${modelId}, using default credits`);
    return 100; // 默认成本
  }
  
  // 获取基础成本
  let baseCredits = modelCredits[duration] || modelCredits['10s'] || 0;
  
  // 应用质量倍数（仅对 Pro 模型）
  if (modelId.includes('pro') && quality === 'high') {
    const multiplier = VIDEO_QUALITY_MULTIPLIERS[quality];
    baseCredits = Math.round(baseCredits * multiplier);
  }
  
  return baseCredits;
}

/**
 * 获取图片模型积分信息
 */
export function getImageModelCredits(modelId: string): number {
  return IMAGE_MODEL_CREDITS[modelId] || IMAGE_MODEL_CREDITS['default'];
}

/**
 * 获取视频模型积分信息
 */
export function getVideoModelCredits(modelId: string): VideoModelCredits[string] | null {
  return VIDEO_MODEL_CREDITS[modelId] || null;
}

/**
 * 获取所有图片模型列表及其积分
 */
export function getAllImageModels(): Array<{ id: string; credits: number }> {
  return Object.entries(IMAGE_MODEL_CREDITS)
    .filter(([id]) => id !== 'default')
    .map(([id, credits]) => ({ id, credits }));
}

/**
 * 获取所有视频模型列表及其积分
 */
export function getAllVideoModels(): Array<{ 
  id: string; 
  credits: { [duration: string]: number } 
}> {
  return Object.entries(VIDEO_MODEL_CREDITS).map(([id, credits]) => ({
    id,
    credits,
  }));
}

// ========================================
// 导出旧的接口以保持向后兼容
// ========================================

/**
 * @deprecated 使用 VIDEO_MODEL_CREDITS 替代
 */
export const VIDEO_CREDIT_COSTS = VIDEO_MODEL_CREDITS;

/**
 * @deprecated 使用 calculateImageCredits 替代
 */
export function calculateCreditCost(model: string, style: string): number {
  return calculateImageCredits(model, style);
}

