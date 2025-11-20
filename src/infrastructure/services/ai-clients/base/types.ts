/**
 * AI客户端基础类型定义
 * 支持多种AI服务提供商（kie.ai等）
 */

// ========================================
// 服务提供商类型
// ========================================

export type AIProvider = 'kie' | 'openai' | 'custom';

// ========================================
// 模型配置
// ========================================

export interface ModelConfig {
  provider: AIProvider;
  name: string; // 模型名称，如 "google/nano-banana"
  version?: string; // 可选的版本号
  apiKey?: string; // 可选的API密钥（如果需要特定密钥）
  endpoint?: string; // 可选的自定义端点
}

export interface ModelConfigWithFallback extends ModelConfig {
  fallback?: ModelConfig; // 备用模型配置
}

// ========================================
// 请求和响应类型
// ========================================

export interface AIClientRequest {
  model: ModelConfig;
  input: Record<string, any>;
  callbackUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface AIClientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  taskId?: string; // 异步任务ID
  metadata?: {
    provider: AIProvider;
    model: string;
    duration?: number;
    cost?: number;
  };
}

// ========================================
// 任务状态
// ========================================

export type TaskState = 
  | 'pending'
  | 'waiting' 
  | 'queuing'
  | 'processing'
  | 'generating'
  | 'success'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskStatus {
  taskId: string;
  state: TaskState;
  resultUrls?: string[];
  resultWaterMarkUrls?: string[];
  error?: {
    code: string;
    message: string;
  };
  createdAt?: number;
  completedAt?: number;
  costTime?: number;
  consumeCredits?: number;
  metadata?: Record<string, any>; // 额外的元数据信息
}

// ========================================
// 图片生成专用类型
// ========================================

export interface ImageGenerationInput {
  prompt?: string;
  image?: string; // 输入图片URL
  images?: string[]; // 多张输入图片URLs
  filesUrl?: string[];
  maskUrl?: string;
  negativePrompt?: string;
  size?: string; // "1:1", "3:2", "2:3", "16:9", etc.
  aspectRatio?: string;
  imageSize?: string;
  width?: number;
  height?: number;
  numOutputs?: number;
  nVariants?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  outputFormat?: string; // "png", "jpg", "webp"
  outputQuality?: number;
  [key: string]: any; // 允许其他自定义参数
}

export interface ImageGenerationOutput {
  url: string; // 主要输出图片URL
  urls?: string[]; // 多张输出图片URLs
  width?: number;
  height?: number;
  format?: string;
}

// ========================================
// 视频生成专用类型
// ========================================

export interface VideoGenerationInput {
  prompt: string;
  imageUrls?: string[]; // 参考图片
  model?: string; // 视频模型类型
  aspectRatio?: string; // "16:9", "9:16", "Auto"
  nFrames?: string; // "10", "15"
  duration?: number;
  removeWatermark?: boolean;
  watermark?: string;
  seeds?: number;
  generationType?: 'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO';
  enableTranslation?: boolean;
  [key: string]: any;
}

export interface VideoGenerationOutput {
  url: string; // 主要输出视频URL
  urls?: string[]; // 多个输出视频URLs
  watermarkUrl?: string; // 带水印的视频URL
  originUrl?: string; // 原始视频URL
  duration?: number;
  resolution?: string;
  format?: string;
}

// ========================================
// 客户端选项
// ========================================

export interface AIClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  debug?: boolean;
}

