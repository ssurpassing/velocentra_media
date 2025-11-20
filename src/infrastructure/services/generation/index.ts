/**
 * 生成服务导出
 */

export { BaseGenerationService, baseGenerationService } from './base-generation.service';
export { CreditService, creditService } from './credit.service';
export { VideoGenerationService, videoGenerationService } from './video-generation.service';

export type {
  GenerationTaskParams,
  TaskUpdateParams,
} from './base-generation.service';

export type {
  CreditCheckResult,
  CreditOperationResult,
} from './credit.service';

export type {
  VideoGenerationRequest,
  VideoGenerationResult,
} from './video-generation.service';

