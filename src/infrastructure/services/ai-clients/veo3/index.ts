/**
 * Veo3.1 API 客户端模块
 * 
 * 完整实现 kie.ai Veo3.1 API
 * 文档: https://docs.kie.ai/cn/veo3-api/
 */

// 导出客户端类和工厂函数
export { Veo3Client, createVeo3Client } from './veo3-client';

// 导出所有类型
export type {
  // 通用类型
  Veo3Model,
  Veo3AspectRatio,
  Veo3GenerationType,
  Veo3TaskState,
  Veo3ClientOptions,
  
  // 请求类型
  Veo3GenerateRequest,
  Veo3ExtendRequest,
  Veo3RecordInfoRequest,
  Veo31080pRequest,
  
  // 响应类型
  Veo3GenerateResponse,
  Veo3ExtendResponse,
  Veo3RecordInfoResponse,
  Veo31080pResponse,
  Veo3ApiResponse,
  
  // 数据类型
  Veo3TaskStatus,
  Veo3VideoResponse,
  Veo3VideoResult,
  Veo3CallbackData,
  
  // 选项类型
  Veo3TextToVideoOptions,
  Veo3ImageToVideoOptions,
  Veo3ExtendVideoOptions,
} from './types';

