/**
 * Sora2 任务查询客户端
 * 用于主动查询 Sora2 任务状态
 * 
 * API 文档: https://docs.kie.ai/cn/sora2-api/
 */

import pino from 'pino';

const logger = pino({ name: 'sora2-query-client' });

const SORA2_API_BASE = 'https://api.kie.ai/api/v1';

/**
 * Sora2 任务状态响应
 */
interface Sora2RecordInfoResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    model: string;
    state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';
    param: string;
    resultJson: string;
    failCode?: string;
    failMsg?: string;
    completeTime: number;
    createTime: number;
    updateTime: number;
  };
}

/**
 * 解析后的 Sora2 任务状态
 */
export interface Sora2TaskStatus {
  taskId: string;
  state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';
  resultUrls?: string[];
  watermarkUrls?: string[];
  error?: {
    code?: string;
    message: string;
  };
  createdAt?: number;
  completedAt?: number;
}

/**
 * Sora2 查询客户端类
 */
export class Sora2QueryClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: { apiKey?: string; baseUrl?: string } = {}) {
    this.apiKey = options.apiKey || process.env.KIE_API_KEY || '';
    this.baseUrl = options.baseUrl || SORA2_API_BASE;
    
    if (!this.apiKey) {
      logger.warn('KIE_API_KEY not configured for Sora2QueryClient');
    }
    
    logger.info('Sora2QueryClient initialized');
  }

  /**
   * 查询 Sora2 任务状态
   * 
   * GET /api/v1/jobs/recordInfo?taskId={taskId}
   * 
   * @param taskId 任务 ID
   * @returns 解析后的任务状态
   */
  async getTaskStatus(taskId: string): Promise<Sora2TaskStatus> {
    try {
      const url = `${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`;
      
      logger.info({ taskId, url }, '🔍 查询 Sora2 任务状态');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ 
          taskId, 
          status: response.status, 
          error: errorText 
        }, '❌ Sora2 API 请求失败');
        
        throw new Error(`Sora2 API error: ${response.status} ${errorText}`);
      }

      const result: Sora2RecordInfoResponse = await response.json();

      logger.info({ 
        taskId, 
        state: result.data.state,
        code: result.code
      }, '📊 Sora2 任务状态响应');

      // 解析结果
      const parsed: Sora2TaskStatus = {
        taskId: result.data.taskId,
        state: result.data.state,
        createdAt: result.data.createTime,
        completedAt: result.data.completeTime,
      };

      // 如果任务成功，解析 resultJson
      if (result.data.state === 'success' && result.data.resultJson) {
        try {
          const resultData = JSON.parse(result.data.resultJson);
          parsed.resultUrls = resultData.resultUrls || [];
          parsed.watermarkUrls = resultData.resultWaterMarkUrls || [];
          
          logger.info({ 
            taskId, 
            resultCount: parsed.resultUrls?.length || 0,
            watermarkCount: parsed.watermarkUrls?.length || 0
          }, '✅ 成功解析 Sora2 结果');
        } catch (parseError) {
          logger.error({ 
            taskId, 
            error: parseError,
            resultJson: result.data.resultJson
          }, '❌ 解析 resultJson 失败');
        }
      }

      // 如果任务失败，记录错误信息
      if (result.data.state === 'fail') {
        parsed.error = {
          code: result.data.failCode,
          message: result.data.failMsg || result.data.failCode || 'Unknown error',
        };
        
        logger.error({ 
          taskId, 
          failCode: result.data.failCode,
          failMsg: result.data.failMsg
        }, '❌ Sora2 任务失败');
      }

      return parsed;
    } catch (error: any) {
      logger.error({ 
        taskId, 
        error: error.message 
      }, '❌ 查询 Sora2 任务状态失败');
      
      throw error;
    }
  }

  /**
   * 等待任务完成（轮询）
   * 
   * @param taskId 任务 ID
   * @param maxWaitTime 最大等待时间（毫秒），默认 10 分钟
   * @param pollInterval 轮询间隔（毫秒），默认 5 秒
   * @returns 最终任务状态
   */
  async waitForCompletion(
    taskId: string,
    maxWaitTime: number = 600000, // 10分钟
    pollInterval: number = 5000 // 5秒
  ): Promise<Sora2TaskStatus> {
    const startTime = Date.now();
    
    logger.info({ 
      taskId, 
      maxWaitTime, 
      pollInterval 
    }, '⏳ 等待 Sora2 任务完成');

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTaskStatus(taskId);

      // 任务完成
      if (status.state === 'success') {
        logger.info({ 
          taskId, 
          duration: Date.now() - startTime 
        }, '✅ Sora2 任务完成');
        return status;
      }

      // 任务失败
      if (status.state === 'fail') {
        logger.error({ 
          taskId, 
          error: status.error 
        }, '❌ Sora2 任务失败');
        throw new Error(status.error?.message || 'Task failed');
      }

      // 继续等待
      logger.debug({ 
        taskId, 
        state: status.state,
        elapsed: Date.now() - startTime 
      }, '⏳ 任务进行中，继续等待');

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // 超时
    logger.warn({ 
      taskId, 
      maxWaitTime 
    }, '⏰ 等待任务完成超时');
    
    throw new Error(`Task timeout after ${maxWaitTime}ms`);
  }
}

/**
 * 创建 Sora2 查询客户端实例
 * 
 * @param options 客户端配置选项
 * @returns Sora2 查询客户端实例
 */
export function createSora2QueryClient(options?: { apiKey?: string; baseUrl?: string }): Sora2QueryClient {
  return new Sora2QueryClient(options);
}

