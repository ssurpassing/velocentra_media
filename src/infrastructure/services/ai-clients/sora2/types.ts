/**
 * Sora 2 视频生成客户端类型定义
 * API 文档: https://kie.ai/zh-CN/sora-2
 */

// ========================================
// 基础类型
// ========================================

/**
 * Sora 2 模型类型
 */
export type Sora2Model =
  | 'sora-2-text-to-video'
  | 'sora-2-image-to-video'
  | 'sora-2-pro-text-to-video'
  | 'sora-2-pro-image-to-video'
  | 'sora-2-pro-storyboard'
  | 'sora-watermark-remover';

/**
 * Sora 2 宽高比
 */
export type Sora2AspectRatio = 'portrait' | 'landscape';

/**
 * Sora 2 视频时长（秒）
 */
export type Sora2Frames = '10' | '15' | '25';

/**
 * Sora 2 Pro 质量级别
 */
export type Sora2ProQuality = 'standard' | 'high';

/**
 * 任务状态
 */
export type Sora2TaskState = 'pending' | 'processing' | 'success' | 'fail';

// ========================================
// 客户端配置
// ========================================

export interface Sora2ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
}

// ========================================
// API 请求: 创建任务
// POST /api/v1/jobs/createTask
// ========================================

/**
 * 创建任务请求 - 输入参数
 */
export interface Sora2TaskInput {
  /** 提示词（文本/图片转视频时必填） */
  prompt?: string;
  
  /** 宽高比（可选） */
  aspect_ratio?: Sora2AspectRatio;
  
  /** 视频时长（可选） */
  n_frames?: Sora2Frames;
  
  /** 是否移除水印（可选） */
  remove_watermark?: boolean;
  
  /** 图片 URLs（图生视频时必填） */
  image_urls?: string[];
  
  /** 质量/尺寸（Pro 模型专用，可选） */
  size?: 'standard' | 'high';
  
  /** 故事板场景列表（Storyboard 专用，可选） */
  shots?: Array<{
    /** 场景描述 */
    Scene: string;
    /** 场景时长（秒） */
    duration: number;
  }>;
}

/**
 * 创建任务完整请求
 */
export interface Sora2CreateTaskRequest {
  /** 模型名称（必填） */
  model: Sora2Model;
  
  /** 回调 URL（可选） */
  callBackUrl?: string;
  
  /** 输入参数 */
  input: Sora2TaskInput;
}

/**
 * 创建任务响应
 */
export interface Sora2CreateTaskResponse {
  /** 状态码，200 为成功 */
  code: number;
  
  /** 响应消息 */
  message: string;
  
  /** 响应数据 */
  data?: {
    /** 任务 ID */
    taskId: string;
  };
}

// ========================================
// API 请求: 查询任务
// GET /api/v1/jobs/queryTask
// ========================================

/**
 * 查询任务请求
 */
export interface Sora2QueryTaskRequest {
  /** 任务 ID */
  taskId: string;
}

/**
 * 任务详情数据
 */
export interface Sora2TaskData {
  /** 任务 ID */
  taskId: string;
  
  /** 模型名称 */
  model: string;
  
  /** 任务状态 */
  state: Sora2TaskState;
  
  /** 创建时间（毫秒时间戳） */
  createTime: number;
  
  /** 更新时间（毫秒时间戳） */
  updateTime: number;
  
  /** 完成时间（毫秒时间戳，可选） */
  completeTime?: number;
  
  /** 消耗时间（秒） */
  costTime?: number;
  
  /** 消耗积分 */
  consumeCredits: number;
  
  /** 剩余积分 */
  remainedCredits: number;
  
  /** 请求参数（JSON 字符串） */
  param: string;
  
  /** 结果 JSON（JSON 字符串，可选） */
  resultJson?: string;
  
  /** 失败代码（可选） */
  failCode?: string;
  
  /** 失败消息（可选） */
  failMsg?: string;
}

/**
 * 查询任务响应
 */
export interface Sora2QueryTaskResponse {
  /** 状态码，200 为成功 */
  code: number;
  
  /** 响应消息 */
  message?: string;
  
  /** 错误消息 */
  msg?: string;
  
  /** 任务数据 */
  data?: Sora2TaskData;
}

// ========================================
// 结果数据结构
// ========================================

/**
 * 视频结果 URLs
 */
export interface Sora2ResultUrls {
  /** 生成的视频 URLs */
  resultUrls: string[];
  
  /** 带水印的视频 URLs（可选） */
  resultWaterMarkUrls?: string[];
}

// ========================================
// 回调数据
// ========================================

/**
 * 回调数据（与查询任务响应相同）
 */
export interface Sora2CallbackData extends Sora2QueryTaskResponse {}

// ========================================
// 便捷方法选项
// ========================================

/**
 * 文本转视频选项
 */
export interface Sora2TextToVideoOptions {
  /** 宽高比 */
  aspectRatio?: Sora2AspectRatio;
  
  /** 视频时长 */
  nFrames?: Sora2Frames;
  
  /** 是否移除水印 */
  removeWatermark?: boolean;
  
  /** 回调 URL */
  callbackUrl?: string;
}

/**
 * 图片转视频选项
 */
export interface Sora2ImageToVideoOptions extends Sora2TextToVideoOptions {
  /** 图片 URLs（必填） */
  imageUrls: string[];
}

/**
 * Pro 版本选项
 */
export interface Sora2ProOptions extends Sora2TextToVideoOptions {
  /** 质量级别 */
  quality?: Sora2ProQuality;
}

/**
 * Pro 图片转视频选项
 */
export interface Sora2ProImageOptions extends Sora2ProOptions {
  /** 图片 URLs（必填） */
  imageUrls: string[];
}

/**
 * 故事板选项
 */
export interface Sora2StoryboardOptions {
  /** 场景描述列表 */
  scenes: Array<{
    /** 场景描述 */
    prompt: string;
    /** 场景时长（秒） */
    duration: number;
  }>;
  
  /** 视频总时长（必填）*/
  nFrames: Sora2Frames;
  
  /** 宽高比 */
  aspectRatio?: Sora2AspectRatio;
  
  /** 是否移除水印 */
  removeWatermark?: boolean;
  
  /** 回调 URL */
  callbackUrl?: string;
  
  /** 参考图片 URLs（可选） */
  imageUrls?: string[];
}

/**
 * 水印移除选项
 */
export interface Sora2WatermarkRemoverOptions {
  /** 输入视频 URL */
  videoUrl: string;
  
  /** 回调 URL */
  callbackUrl?: string;
}

// ========================================
// API 响应通用类型
// ========================================

export interface Sora2ApiResponse<T = any> {
  code: number;
  message?: string;
  msg?: string;
  data?: T;
}

