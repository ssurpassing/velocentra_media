/**
 * API 错误处理 Hook
 * 自动将 API 错误码转换为翻译的错误消息
 */

import { useTranslations } from 'next-intl';
import { isErrorCode } from '@/shared/utils/error-handler';

export function useApiError() {
  const t = useTranslations();

  /**
   * 将 API 错误转换为本地化的错误消息
   * @param error 错误码或错误消息
   * @returns 翻译后的错误消息
   */
  const translateError = (error: string): string => {
    if (!error) return '';
    
    // 如果是错误码（全大写加下划线），使用翻译
    if (isErrorCode(error)) {
      const translationKey = `errors.api.${error}`;
      const translated = t(translationKey);
      
      // 如果翻译键不存在，返回原始错误码的友好版本
      if (translated === translationKey) {
        return error.split('_').map(word => 
          word.charAt(0) + word.slice(1).toLowerCase()
        ).join(' ');
      }
      
      return translated;
    }
    
    // 否则直接返回原始错误消息
    return error;
  };

  return {
    translateError,
  };
}

