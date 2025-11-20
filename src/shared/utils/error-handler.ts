/**
 * API 错误处理工具
 * 将错误码转换为用户友好的翻译消息
 */

/**
 * 标准 API 错误响应
 */
export interface ApiError {
  success: false;
  error: string; // 错误码或错误消息
  message?: string; // 可选的英文错误消息
}

/**
 * 检查是否为错误码（全大写加下划线）
 */
export function isErrorCode(error: string): boolean {
  return /^[A-Z_]+$/.test(error);
}

/**
 * 获取错误翻译键
 * 如果是错误码，返回翻译键；否则返回原始消息
 */
export function getErrorTranslationKey(error: string): string {
  if (isErrorCode(error)) {
    return `errors.api.${error}`;
  }
  // 如果不是错误码，直接返回错误消息
  return error;
}

/**
 * 常见的 API 错误码
 */
export const API_ERROR_CODES = {
  // 认证相关
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  
  // Sora 2 相关
  PRO_MODEL_REQUIRES_SUBSCRIPTION: 'PRO_MODEL_REQUIRES_SUBSCRIPTION',
  PRO_MODEL_DURATION_LIMIT: 'PRO_MODEL_DURATION_LIMIT',
  
  // 通用错误
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  
  // 文件上传相关
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // 生成相关
  GENERATION_FAILED: 'GENERATION_FAILED',
  TIMEOUT: 'TIMEOUT',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

