/**
 * AI客户端工厂
 * 统一管理和创建不同的AI服务客户端
 */

import pino from 'pino';
import { BaseAIClient } from './base/BaseAIClient';
import { AIProvider, AIClientOptions, ModelConfig } from './base/types';
import { KieImageClient, createKieImageClient } from './kie/image-client';
import { Sora2Client, createSora2Client } from './sora2';
import { Veo3Client, createVeo3Client } from './veo3';

const logger = pino({ name: 'model-client-factory' });

// ========================================
// 客户端缓存
// ========================================

const clientCache = new Map<string, BaseAIClient>();

// ========================================
// 工厂类
// ========================================

export class ModelClientFactory {
  /**
   * 获取AI客户端实例（带缓存）
   */
  static getClient(
    provider: AIProvider,
    options?: AIClientOptions
  ): BaseAIClient {
    const cacheKey = `${provider}-${options?.apiKey || 'default'}`;
    
    // 从缓存获取
    if (clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey)!;
    }

    // 创建新客户端
    let client: BaseAIClient;
    
    switch (provider) {
      case 'kie':
        // kie默认返回图片客户端
        client = createKieImageClient(options);
        break;
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    // 缓存客户端
    clientCache.set(cacheKey, client);
    
    logger.info({ provider, cacheKey }, 'Created new AI client');
    
    return client;
  }

  /**
   * 根据模型配置获取客户端
   */
  static getClientForModel(
    modelConfig: ModelConfig,
    options?: AIClientOptions
  ): BaseAIClient {
    return this.getClient(modelConfig.provider, {
      ...options,
      apiKey: modelConfig.apiKey || options?.apiKey,
    });
  }

  /**
   * 获取kie.ai图片客户端
   */
  static getKieImageClient(options?: AIClientOptions): KieImageClient {
    return this.getClient('kie', options) as KieImageClient;
  }

  /**
   * 获取Sora2视频客户端
   */
  static getSora2Client(options?: AIClientOptions): Sora2Client {
    const cacheKey = `sora2-${options?.apiKey || 'default'}`;
    
    if (clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey) as Sora2Client;
    }

    const client = createSora2Client(options);
    clientCache.set(cacheKey, client);
    
    return client;
  }

  /**
   * 获取Veo3视频客户端
   */
  static getVeo3Client(options?: AIClientOptions): Veo3Client {
    const cacheKey = `veo3-${options?.apiKey || 'default'}`;
    
    if (clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey) as Veo3Client;
    }

    const client = createVeo3Client(options);
    clientCache.set(cacheKey, client);
    
    return client;
  }

  /**
   * 清除所有客户端缓存
   */
  static clearCache(): void {
    clientCache.clear();
    logger.info('Cleared all AI client cache');
  }

  /**
   * 清除特定客户端缓存
   */
  static clearCacheForProvider(provider: AIProvider): void {
    const keysToDelete: string[] = [];
    
    for (const key of clientCache.keys()) {
      if (key.startsWith(provider)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => clientCache.delete(key));
    
    logger.info({ provider, count: keysToDelete.length }, 'Cleared AI client cache for provider');
  }

  /**
   * 获取缓存统计
   */
  static getCacheStats(): {
    size: number;
    providers: Record<AIProvider, number>;
  } {
    const providers: Record<string, number> = {
      kie: 0,
      openai: 0,
      custom: 0,
    };

    for (const key of clientCache.keys()) {
      const provider = key.split('-')[0];
      if (provider in providers) {
        providers[provider]++;
      }
    }

    return {
      size: clientCache.size,
      providers: providers as Record<AIProvider, number>,
    };
  }
}

// ========================================
// 便捷导出
// ========================================

export const getClient = ModelClientFactory.getClient.bind(ModelClientFactory);
export const getClientForModel = ModelClientFactory.getClientForModel.bind(ModelClientFactory);
export const getKieImageClient = ModelClientFactory.getKieImageClient.bind(ModelClientFactory);
export const getSora2Client = ModelClientFactory.getSora2Client.bind(ModelClientFactory);
export const getVeo3Client = ModelClientFactory.getVeo3Client.bind(ModelClientFactory);

