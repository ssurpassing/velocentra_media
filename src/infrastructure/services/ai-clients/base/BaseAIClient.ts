/**
 * AI客户端基类
 * 所有AI服务客户端都继承此类
 */

import pino from 'pino';
import {
  AIClientRequest,
  AIClientResponse,
  AIClientOptions,
  TaskStatus,
  AIProvider,
} from './types';

const logger = pino({ name: 'base-ai-client' });

export abstract class BaseAIClient {
  protected provider: AIProvider;
  protected options: AIClientOptions;

  constructor(provider: AIProvider, options: AIClientOptions = {}) {
    this.provider = provider;
    this.options = {
      timeout: options.timeout || 120000,
      maxRetries: options.maxRetries || 2,
      retryDelay: options.retryDelay || 1000,
      debug: options.debug || false,
      ...options,
    };
  }

  /**
   * 运行模型 - 子类可以选择实现
   */
  async run<T = any>(request: AIClientRequest): Promise<AIClientResponse<T>> {
    throw new Error('run() method not implemented in this client');
  }

  /**
   * 查询任务状态 - 子类可以选择实现
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    throw new Error('getTaskStatus() method not implemented in this client');
  }

  /**
   * 等待任务完成
   */
  async waitForCompletion(
    taskId: string,
    maxWaitTime: number = 300000, // 5分钟
    pollInterval: number = 3000 // 3秒
  ): Promise<TaskStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTaskStatus(taskId);
      
      if (status.state === 'success' || status.state === 'completed') {
        logger.info(
          { taskId, duration: Date.now() - startTime },
          'Task completed successfully'
        );
        return status;
      }
      
      if (status.state === 'failed' || status.state === 'cancelled') {
        logger.error(
          { taskId, error: status.error },
          'Task failed'
        );
        throw new Error(status.error?.message || 'Task failed');
      }
      
      // 继续等待
      await this.sleep(pollInterval);
    }
    
    throw new Error(`Task ${taskId} timeout after ${maxWaitTime}ms`);
  }

  /**
   * 重试逻辑包装器
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.options.maxRetries!; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        logger.warn(
          { context, error: error.message, attempt },
          `Attempt ${attempt + 1}/${this.options.maxRetries! + 1} failed`
        );
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.options.maxRetries!) {
          const waitTime = Math.min(
            this.options.retryDelay! * Math.pow(2, attempt),
            5000
          );
          await this.sleep(waitTime);
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * 提取图片URL（处理不同的输出格式）
   */
  protected extractImageUrl(output: any): string {
    // 字符串类型 - 直接返回
    if (typeof output === 'string') {
      return output;
    }
    
    // 对象类型 - 尝试调用 url() 方法或访问 url 属性
    if (output && typeof output === 'object') {
      if ('url' in output && typeof output.url === 'function') {
        return output.url();
      }
      if ('url' in output && typeof output.url === 'string') {
        return output.url;
      }
    }
    
    // 数组类型 - 取第一个元素
    if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      if (typeof first === 'string') {
        return first;
      }
      if (first && typeof first === 'object') {
        if ('url' in first && typeof first.url === 'function') {
          return first.url();
        }
        if ('url' in first && typeof first.url === 'string') {
          return first.url;
        }
      }
    }
    
    logger.error({ output }, 'Unable to extract image URL from output');
    throw new Error('Unable to extract image URL from output');
  }

  /**
   * 提取多个图片URLs
   */
  protected extractImageUrls(output: any): string[] {
    // 数组类型
    if (Array.isArray(output)) {
      return output.map(item => {
        if (typeof item === 'string') return item;
        if (item?.url) {
          return typeof item.url === 'function' ? item.url() : item.url;
        }
        return '';
      }).filter(url => url !== '');
    }
    
    // 单个URL
    return [this.extractImageUrl(output)];
  }

  /**
   * 睡眠函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 日志辅助方法
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    if (this.options.debug || level === 'error') {
      logger[level]({ provider: this.provider, ...data }, message);
    }
  }
}

