/**
 * AI客户端统一导出
 */

// 基础类型和接口
export * from './base/types';
export { BaseAIClient } from './base/BaseAIClient';

// 客户端实现
export { KieImageClient, createKieImageClient } from './kie/image-client';
export { Sora2Client, createSora2Client } from './sora2';
export { Veo3Client, createVeo3Client } from './veo3';

// 工厂
export {
  ModelClientFactory,
  getClient,
  getClientForModel,
  getKieImageClient,
  getSora2Client,
  getVeo3Client,
} from './ModelClientFactory';

