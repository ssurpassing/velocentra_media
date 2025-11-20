/**
 * Sora 2 API 客户端模块
 * 
 * 完整实现 kie.ai Sora 2 API
 * 文档: https://kie.ai/zh-CN/sora-2
 */

// 导出客户端类和工厂函数
export { Sora2Client, createSora2Client } from './sora2-client';
export { Sora2QueryClient, createSora2QueryClient } from './sora2-query-client';
export type { Sora2TaskStatus } from './sora2-query-client';

// 导出所有类型
export type {
  // 基础类型
  Sora2Model,
  Sora2AspectRatio,
  Sora2Frames,
  Sora2ProQuality,
  Sora2TaskState,
  Sora2ClientOptions,
  
  // 请求类型
  Sora2TaskInput,
  Sora2CreateTaskRequest,
  Sora2QueryTaskRequest,
  
  // 响应类型
  Sora2CreateTaskResponse,
  Sora2QueryTaskResponse,
  Sora2ApiResponse,
  
  // 数据类型
  Sora2TaskData,
  Sora2ResultUrls,
  Sora2CallbackData,
  
  // 选项类型
  Sora2TextToVideoOptions,
  Sora2ImageToVideoOptions,
  Sora2ProOptions,
  Sora2ProImageOptions,
  Sora2StoryboardOptions,
  Sora2WatermarkRemoverOptions,
} from './types';

