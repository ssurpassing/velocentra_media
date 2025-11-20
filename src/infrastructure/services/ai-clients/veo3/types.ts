/**
 * Veo3.1 API 类型定义
 * 基于 kie.ai Veo3.1 API 文档
 * https://docs.kie.ai/cn/veo3-api/
 */

// ========================================
// 通用类型
// ========================================

/**
 * Veo3 模型类型
 */
export type Veo3Model = 'veo3' | 'veo3_fast';

/**
 * 宽高比
 */
export type Veo3AspectRatio = '16:9' | '9:16' | 'Auto';

/**
 * 生成类型
 */
export type Veo3GenerationType = 
  | 'TEXT_2_VIDEO'                    // 文本转视频
  | 'FIRST_AND_LAST_FRAMES_2_VIDEO'   // 首尾帧转视频
  | 'REFERENCE_2_VIDEO';              // 参考图转视频

/**
 * 任务状态
 */
export type Veo3TaskState = 
  | 'pending'      // 等待中
  | 'waiting'      // 排队中
  | 'generating'   // 生成中
  | 'success'      // 成功
  | 'failed';      // 失败

/**
 * 客户端配置选项
 */
export interface Veo3ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// ========================================
// API 1: 生成视频 (POST /api/v1/veo/generate)
// ========================================

/**
 * 生成视频请求参数
 */
export interface Veo3GenerateRequest {
  /** 提示词（必填），描述要生成的视频内容 */
  prompt: string;
  
  /** 模型类型（可选），默认 veo3_fast */
  model?: Veo3Model;
  
  /** 宽高比（可选），默认 16:9 */
  aspectRatio?: Veo3AspectRatio;
  
  /** 图片 URLs（可选），用于图生视频 */
  imageUrls?: string[];
  
  /** 生成类型（可选），默认 TEXT_2_VIDEO */
  generationType?: Veo3GenerationType;
  
  /** 种子数（可选），生成视频数量 */
  seeds?: number;
  
  /** 水印文本（可选） */
  watermark?: string;
  
  /** 是否启用翻译（可选），默认 true */
  enableTranslation?: boolean;
  
  /** 回调 URL（可选），任务完成后回调 */
  callBackUrl?: string;
}

/**
 * 生成视频响应
 */
export interface Veo3GenerateResponse {
  code: number;
  msg: string;
  message?: string;
  data?: {
    /** 任务 ID */
    taskId: string;
  };
}

// ========================================
// API 2: 扩展视频 (POST /api/v1/veo/extend)
// ========================================

/**
 * 扩展视频请求参数
 */
export interface Veo3ExtendRequest {
  /** 原视频任务 ID（必填） */
  taskId: string;
  
  /** 扩展提示词（必填），描述如何扩展视频 */
  prompt: string;
  
  /** 是否启用翻译（可选），默认 true */
  enableTranslation?: boolean;
  
  /** 回调 URL（可选） */
  callBackUrl?: string;
}

/**
 * 扩展视频响应
 */
export interface Veo3ExtendResponse {
  code: number;
  msg: string;
  message?: string;
  data?: {
    /** 新任务 ID */
    taskId: string;
  };
}

// ========================================
// API 3: 获取视频详情 (GET /api/v1/veo/record-info)
// ========================================

/**
 * 获取视频详情请求参数
 */
export interface Veo3RecordInfoRequest {
  /** 任务 ID（必填） */
  taskId: string;
}

/**
 * 视频响应信息
 */
export interface Veo3VideoResponse {
  /** 结果视频 URLs */
  resultUrls?: string[];
  
  /** 原始视频 URLs */
  originUrls?: string[];
  
  /** 分辨率信息 */
  resolution?: string;
}

/**
 * 获取视频详情响应
 */
export interface Veo3RecordInfoResponse {
  code: number;
  msg: string;
  message?: string;
  data?: {
    /** 任务 ID */
    taskId: string;
    
    /** 成功标志：0=生成中, 1=成功, 2=失败, 3=生成失败 */
    successFlag: 0 | 1 | 2 | 3;
    
    /** 视频响应信息 */
    response?: Veo3VideoResponse;
    
    /** 是否使用托底模型 */
    fallbackFlag?: boolean;
    
    /** 错误码 */
    errorCode?: string;
    
    /** 错误消息 */
    errorMessage?: string;
    
    /** 创建时间 */
    createTime?: string;
    
    /** 完成时间 */
    completeTime?: string;
    
    /** 消耗积分 */
    consumeCredits?: number;
  };
}

// ========================================
// API 4: 获取 1080P 视频 (GET /api/v1/veo/get-1080p-video)
// ========================================

/**
 * 获取 1080P 视频请求参数
 */
export interface Veo31080pRequest {
  /** 任务 ID（必填） */
  taskId: string;
}

/**
 * 获取 1080P 视频响应
 */
export interface Veo31080pResponse {
  code: number;
  msg: string;
  message?: string;
  data?: {
    /** 1080P 视频 URL */
    url1080p: string;
  };
}

// ========================================
// 通用响应类型
// ========================================

/**
 * 通用 API 响应
 */
export interface Veo3ApiResponse<T = any> {
  code: number;
  msg: string;
  message?: string;
  data?: T;
}

/**
 * 任务状态信息
 */
export interface Veo3TaskStatus {
  /** 任务 ID */
  taskId: string;
  
  /** 任务状态 */
  state: Veo3TaskState;
  
  /** 结果视频 URLs */
  resultUrls?: string[];
  
  /** 原始视频 URLs */
  originUrls?: string[];
  
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
  };
  
  /** 创建时间戳 */
  createdAt?: number;
  
  /** 完成时间戳 */
  completedAt?: number;
  
  /** 是否使用托底模型 */
  fallbackFlag?: boolean;
  
  /** 分辨率 */
  resolution?: string;
  
  /** 消耗积分 */
  consumeCredits?: number;
}

// ========================================
// 回调类型
// ========================================

/**
 * Veo3 回调数据
 */
export interface Veo3CallbackData {
  /** 任务 ID */
  taskId: string;
  
  /** 成功标志：0=生成中, 1=成功, 2=失败, 3=生成失败 */
  successFlag: 0 | 1 | 2 | 3;
  
  /** 结果视频 URLs */
  resultUrls?: string[];
  
  /** 错误码 */
  errorCode?: string;
  
  /** 错误消息 */
  errorMessage?: string;
  
  /** 是否使用托底模型 */
  fallbackFlag?: boolean;
  
  /** 创建时间 */
  createTime?: string;
  
  /** 完成时间 */
  completeTime?: string;
}

// ========================================
// 便捷方法参数类型
// ========================================

/**
 * 文本转视频选项
 */
export interface Veo3TextToVideoOptions {
  model?: Veo3Model;
  aspectRatio?: Veo3AspectRatio;
  seeds?: number;
  watermark?: string;
  enableTranslation?: boolean;
  callbackUrl?: string;
}

/**
 * 图片转视频选项
 */
export interface Veo3ImageToVideoOptions {
  model?: Veo3Model;
  aspectRatio?: Veo3AspectRatio;
  generationType?: 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO';
  seeds?: number;
  watermark?: string;
  enableTranslation?: boolean;
  callbackUrl?: string;
}

/**
 * 扩展视频选项
 */
export interface Veo3ExtendVideoOptions {
  enableTranslation?: boolean;
  callbackUrl?: string;
}

/**
 * 视频生成结果
 */
export interface Veo3VideoResult {
  /** 任务 ID */
  taskId: string;
  
  /** 是否成功 */
  success: boolean;
  
  /** 视频 URLs */
  videoUrls?: string[];
  
  /** 1080P 视频 URL（仅 16:9） */
  video1080pUrl?: string;
  
  /** 错误信息 */
  error?: string;
  
  /** 是否使用托底模型 */
  fallbackFlag?: boolean;
  
  /** 生成耗时（毫秒） */
  duration?: number;
  
  /** 消耗积分 */
  consumeCredits?: number;
}

