/**
 * 视频生成相关类型定义
 */

export type VideoGenerationType = 'text-to-video' | 'image-to-video' | 'reference-to-video' | 'storyboard';
export type VideoModel = 
  // Veo 3.1
  | 'veo3' 
  | 'veo3_fast'
  // Sora 2
  | 'sora-2-text-to-video'
  | 'sora-2-image-to-video'
  | 'sora-2-pro-text-to-video'
  | 'sora-2-pro-image-to-video'
  | 'sora-2-pro-storyboard'
  | 'sora-watermark-remover';

export type VideoAspectRatio = '16:9' | '9:16' | 'Auto' | 'portrait' | 'landscape';
export type VideoTaskStatus = 'pending' | 'processing' | 'generating' | 'completed' | 'failed';
export type VideoProvider = 'veo3' | 'sora2';

/**
 * 视频生成请求
 */
export interface VideoGenerationRequest {
  /** 生成类型 */
  generationType: VideoGenerationType;
  
  /** 提示词 */
  prompt: string;
  
  /** 模型 */
  model: VideoModel;
  
  /** 宽高比 */
  aspectRatio: VideoAspectRatio;
  
  /** 图片 URLs（图生视频时使用） */
  imageUrls?: string[];
  
  /** 种子数（可选） */
  seeds?: number;
  
  /** 是否启用翻译 */
  enableTranslation?: boolean;
}

/**
 * 视频生成任务
 */
export interface VideoGenerationTask {
  id: string;
  userId: string;
  status: VideoTaskStatus;
  
  /** KIE API 返回的外部任务 ID */
  externalTaskId?: string;
  
  /** 生成参数 */
  generationType: VideoGenerationType;
  prompt: string;
  model: VideoModel;
  aspectRatio: VideoAspectRatio;
  imageUrls?: string[];
  
  /** 结果 */
  videoUrl?: string;
  video1080pUrl?: string;
  thumbnailUrl?: string;
  
  /** 错误信息 */
  errorMessage?: string;
  
  /** 消耗积分 */
  costCredits: number;
  
  /** 时间戳 */
  createdAt: string;
  completedAt?: string;
}

/**
 * 视频生成响应
 */
export interface VideoGenerationResponse {
  success: boolean;
  data?: {
    taskId: string;
    externalTaskId?: string;
    message?: string;
  };
  error?: string;
}

/**
 * 视频示例
 */
export interface VideoExample {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  aspectRatio: VideoAspectRatio;
  model: VideoModel;
  generationType: VideoGenerationType;
  imageUrls?: string[];
  templateId?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 提示词优化请求
 */
export interface PromptOptimizeRequest {
  originalPrompt: string;
  templateId: string;
  images?: string[];
}

/**
 * 提示词优化响应
 */
export interface PromptOptimizeResponse {
  success: boolean;
  data?: {
    originalPrompt: string;
    optimizedPrompt: string;
  };
  error?: string;
}

