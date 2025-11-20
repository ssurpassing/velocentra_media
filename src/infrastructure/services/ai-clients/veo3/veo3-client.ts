/**
 * Veo3.1 视频生成客户端
 * 完整实现所有 Veo3.1 API 接口
 * 
 * API 文档: https://docs.kie.ai/cn/veo3-api/
 */

import pino from 'pino';
import { BaseAIClient } from '../base/BaseAIClient';
import { AIClientOptions, TaskStatus } from '../base/types';
import {
  Veo3ClientOptions,
  Veo3GenerateRequest,
  Veo3GenerateResponse,
  Veo3ExtendRequest,
  Veo3ExtendResponse,
  Veo3RecordInfoRequest,
  Veo3RecordInfoResponse,
  Veo31080pRequest,
  Veo31080pResponse,
  Veo3TaskStatus,
  Veo3TaskState,
  Veo3VideoResult,
  Veo3TextToVideoOptions,
  Veo3ImageToVideoOptions,
  Veo3ExtendVideoOptions,
} from './types';

const logger = pino({ name: 'veo3-client' });

/**
 * Veo3.1 客户端类
 * 提供完整的视频生成、扩展、查询、下载功能
 */
export class Veo3Client extends BaseAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: Veo3ClientOptions = {}) {
    super('kie', options as AIClientOptions);
    
    this.apiKey = options.apiKey || process.env.KIE_API_KEY || '';
    this.baseUrl = options.baseUrl || 'https://api.kie.ai';
    
    if (!this.apiKey) {
      throw new Error('KIE_API_KEY is required for Veo3Client');
    }

    logger.info('Veo3Client initialized');
  }

  // ========================================
  // API 1: 生成视频
  // POST /api/v1/veo/generate
  // ========================================

  /**
   * 生成视频（通用方法）
   * 支持文本转视频和图片转视频
   * 
   * @param request 生成请求参数
   * @returns 生成响应（包含 taskId）
   */
  async generateVideo(request: Veo3GenerateRequest): Promise<Veo3GenerateResponse> {
    logger.info({ 
      prompt: request.prompt?.substring(0, 100),
      model: request.model,
      aspectRatio: request.aspectRatio,
      hasImages: !!request.imageUrls?.length,
      imageCount: request.imageUrls?.length,
    }, '📤 生成视频请求');

    const payload: any = {
      prompt: request.prompt,
      model: request.model || 'veo3_fast',
      aspectRatio: request.aspectRatio || '16:9',
      enableTranslation: request.enableTranslation !== false,
    };

    // 添加可选参数
    if (request.imageUrls && request.imageUrls.length > 0) {
      payload.imageUrls = request.imageUrls;
    }
    if (request.generationType) {
      payload.generationType = request.generationType;
    }
    if (request.seeds) {
      payload.seeds = request.seeds;
    }
    if (request.watermark) {
      payload.watermark = request.watermark;
    }
    if (request.callBackUrl) {
      payload.callBackUrl = request.callBackUrl;
    }

    const response = await this.withRetry(
      () => this.makeRequest<Veo3GenerateResponse>(
        '/api/v1/veo/generate',
        'POST',
        payload
      ),
      'generateVideo'
    );

    if (response.code !== 200 || !response.data?.taskId) {
      const errorMsg = response.msg || response.message || 'Failed to create video generation task';
      logger.error({ response }, '❌ 生成视频失败');
      throw new Error(errorMsg);
    }

    logger.info({ 
      taskId: response.data.taskId,
      model: payload.model,
    }, '✅ 视频生成任务已创建');

    return response;
  }

  /**
   * 文本转视频（便捷方法）
   * 
   * @param prompt 提示词
   * @param options 可选参数
   * @returns 生成响应
   */
  async generateTextToVideo(
    prompt: string,
    options: Veo3TextToVideoOptions = {}
  ): Promise<Veo3GenerateResponse> {
    return this.generateVideo({
      prompt,
      model: options.model || 'veo3_fast',
      aspectRatio: options.aspectRatio || '16:9',
      generationType: 'TEXT_2_VIDEO',
      seeds: options.seeds,
      watermark: options.watermark,
      enableTranslation: options.enableTranslation,
      callBackUrl: options.callbackUrl,
    });
  }

  /**
   * 图片转视频（便捷方法）
   * 
   * @param prompt 提示词
   * @param imageUrls 图片 URLs（1-2张）
   * @param options 可选参数
   * @returns 生成响应
   */
  async generateImageToVideo(
    prompt: string,
    imageUrls: string[],
    options: Veo3ImageToVideoOptions = {}
  ): Promise<Veo3GenerateResponse> {
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('imageUrls is required for image-to-video generation');
    }

    return this.generateVideo({
      prompt,
      imageUrls,
      model: options.model || 'veo3_fast',
      aspectRatio: options.aspectRatio || '16:9',
      generationType: options.generationType || 'FIRST_AND_LAST_FRAMES_2_VIDEO',
      seeds: options.seeds,
      watermark: options.watermark,
      enableTranslation: options.enableTranslation,
      callBackUrl: options.callbackUrl,
    });
  }

  // ========================================
  // API 2: 扩展视频
  // POST /api/v1/veo/extend
  // ========================================

  /**
   * 扩展视频（延长视频时长）
   * Veo 3.1 视频初始限制为 8 秒，通过此 API 可以扩展
   * 
   * @param request 扩展请求参数
   * @returns 扩展响应（包含新 taskId）
   */
  async extendVideo(request: Veo3ExtendRequest): Promise<Veo3ExtendResponse> {
    logger.info({
      taskId: request.taskId,
      prompt: request.prompt?.substring(0, 100),
    }, '📤 扩展视频请求');

    const payload: any = {
      taskId: request.taskId,
      prompt: request.prompt,
      enableTranslation: request.enableTranslation !== false,
    };

    if (request.callBackUrl) {
      payload.callBackUrl = request.callBackUrl;
    }

    const response = await this.withRetry(
      () => this.makeRequest<Veo3ExtendResponse>(
        '/api/v1/veo/extend',
        'POST',
        payload
      ),
      'extendVideo'
    );

    if (response.code !== 200 || !response.data?.taskId) {
      const errorMsg = response.msg || response.message || 'Failed to extend video';
      logger.error({ response }, '❌ 扩展视频失败');
      throw new Error(errorMsg);
    }

    logger.info({
      originalTaskId: request.taskId,
      newTaskId: response.data.taskId,
    }, '✅ 视频扩展任务已创建');

    return response;
  }

  /**
   * 扩展视频（便捷方法）
   * 
   * @param taskId 原视频任务 ID
   * @param prompt 扩展提示词
   * @param options 可选参数
   * @returns 扩展响应
   */
  async extend(
    taskId: string,
    prompt: string,
    options: Veo3ExtendVideoOptions = {}
  ): Promise<Veo3ExtendResponse> {
    return this.extendVideo({
      taskId,
      prompt,
      enableTranslation: options.enableTranslation,
      callBackUrl: options.callbackUrl,
    });
  }

  // ========================================
  // API 3: 获取视频详情
  // GET /api/v1/veo/record-info
  // ========================================

  /**
   * 获取视频详情
   * 查询任务的完整信息，包括状态、结果 URLs、错误信息等
   * 
   * @param request 查询请求参数
   * @returns 视频详情响应
   */
  async getVideoDetails(request: Veo3RecordInfoRequest): Promise<Veo3RecordInfoResponse> {
    const { taskId } = request;
    
    logger.debug({ taskId }, '🔍 查询视频详情');

    const response = await this.makeRequest<Veo3RecordInfoResponse>(
      `/api/v1/veo/record-info?taskId=${taskId}`,
      'GET'
    );

    // 422 表示任务记录还未准备好（刚创建）
    if (response.code === 422) {
      logger.debug({ taskId, msg: response.msg }, '⏳ 任务记录还未准备好');
      return response;
    }

    if (response.code !== 200) {
      logger.warn({ taskId, response }, '⚠️ 查询视频详情失败');
    }

    return response;
  }

  /**
   * 获取视频详情（便捷方法）
   * 
   * @param taskId 任务 ID
   * @returns 视频详情响应
   */
  async getDetails(taskId: string): Promise<Veo3RecordInfoResponse> {
    return this.getVideoDetails({ taskId });
  }

  // ========================================
  // API 4: 获取 1080P 视频
  // GET /api/v1/veo/get-1080p-video
  // ========================================

  /**
   * 获取 1080P 高清视频
   * 仅支持 16:9 宽高比的视频
   * 
   * @param request 1080P 请求参数
   * @returns 1080P 视频响应
   */
  async get1080pVideo(request: Veo31080pRequest): Promise<Veo31080pResponse> {
    const { taskId } = request;
    
    logger.info({ taskId }, '📤 获取 1080P 视频');

    const response = await this.makeRequest<Veo31080pResponse>(
      `/api/v1/veo/get-1080p-video?taskId=${taskId}`,
      'GET'
    );

    if (response.code !== 200 || !response.data?.url1080p) {
      const errorMsg = response.msg || response.message || 'Failed to get 1080P video';
      logger.error({ response }, '❌ 获取 1080P 视频失败');
      throw new Error(errorMsg);
    }

    logger.info({ 
      taskId,
      url1080p: response.data.url1080p,
    }, '✅ 1080P 视频获取成功');

    return response;
  }

  /**
   * 获取 1080P 视频（便捷方法）
   * 
   * @param taskId 任务 ID
   * @returns 1080P 视频 URL
   */
  async get1080p(taskId: string): Promise<string> {
    const response = await this.get1080pVideo({ taskId });
    return response.data?.url1080p || '';
  }

  // ========================================
  // 辅助方法
  // ========================================

  /**
   * 查询任务状态（实现 BaseAIClient 抽象方法）
   * 
   * @param taskId 任务 ID
   * @returns 任务状态
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    try {
      const response = await this.getVideoDetails({ taskId });

      // 任务记录还未准备好
      if (response.code === 422) {
        return {
          taskId,
          state: 'pending',
          resultUrls: [],
          createdAt: Date.now(),
        };
      }

      if (response.code === 200 && response.data) {
        const data = response.data;
        
        // 转换 successFlag 到 state
        let state: TaskStatus['state'];
        if (data.successFlag === 0) {
          state = 'generating';
        } else if (data.successFlag === 1) {
          state = 'success';
        } else if (data.successFlag === 2 || data.successFlag === 3) {
          state = 'failed';
        } else {
          state = 'pending';
        }

        // 提取结果 URLs
        const resultUrls = data.response?.resultUrls || [];

        return {
          taskId: data.taskId || taskId,
          state,
          resultUrls,
          error: data.errorCode ? {
            code: data.errorCode,
            message: data.errorMessage || 'Unknown error',
          } : undefined,
          createdAt: data.createTime ? new Date(data.createTime).getTime() : Date.now(),
          completedAt: data.completeTime ? new Date(data.completeTime).getTime() : undefined,
          metadata: {
            fallbackFlag: data.fallbackFlag,
            resolution: data.response?.resolution,
          },
          consumeCredits: data.consumeCredits,
        };
      }

      // 其他错误情况
      throw new Error(response.msg || 'Failed to get task status');
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, '❌ 查询任务状态失败');
      throw error;
    }
  }

  /**
   * 等待视频生成完成（重写以提供更长的超时时间）
   * 
   * @param taskId 任务 ID
   * @param maxWaitTime 最大等待时间（毫秒），默认 10 分钟
   * @param pollInterval 轮询间隔（毫秒），默认 5 秒
   * @returns 任务状态
   */
  async waitForCompletion(
    taskId: string,
    maxWaitTime: number = 600000, // 10分钟
    pollInterval: number = 5000 // 5秒
  ): Promise<TaskStatus> {
    logger.info({ taskId, maxWaitTime, pollInterval }, '⏳ 等待视频生成完成');
    
    return super.waitForCompletion(taskId, maxWaitTime, pollInterval);
  }

  /**
   * 生成视频并等待完成（完整流程）
   * 
   * @param request 生成请求
   * @param waitForResult 是否等待结果，默认 true
   * @param include1080p 是否包含 1080P（仅 16:9），默认 false
   * @returns 视频结果
   */
  async generateAndWait(
    request: Veo3GenerateRequest,
    waitForResult: boolean = true,
    include1080p: boolean = false
  ): Promise<Veo3VideoResult> {
    const startTime = Date.now();

    // 如果有回调 URL，不应该等待
    if (request.callBackUrl) {
      logger.warn('callBackUrl is set, will not wait for result');
      waitForResult = false;
    }

    // 1. 创建任务
    const generateResponse = await this.generateVideo(request);
    const taskId = generateResponse.data?.taskId;

    if (!taskId) {
      return {
        taskId: '',
        success: false,
        error: 'Failed to get taskId from generate response',
      };
    }

    // 2. 如果不等待，直接返回
    if (!waitForResult) {
      return {
        taskId,
        success: true,
        duration: Date.now() - startTime,
      };
    }

    // 3. 等待完成
    try {
      const status = await this.waitForCompletion(taskId);
      
      const result: Veo3VideoResult = {
        taskId,
        success: true,
        videoUrls: status.resultUrls,
        fallbackFlag: status.metadata?.fallbackFlag,
        duration: Date.now() - startTime,
        consumeCredits: status.consumeCredits,
      };

      // 4. 如果需要 1080P 且宽高比是 16:9
      if (include1080p && request.aspectRatio === '16:9') {
        try {
          const url1080p = await this.get1080p(taskId);
          result.video1080pUrl = url1080p;
        } catch (error: any) {
          logger.warn({ taskId, error: error.message }, '⚠️ 获取 1080P 失败');
        }
      }

      return result;
    } catch (error: any) {
      return {
        taskId,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 扩展视频并等待完成
   * 
   * @param taskId 原视频任务 ID
   * @param prompt 扩展提示词
   * @param options 可选参数
   * @param waitForResult 是否等待结果，默认 true
   * @returns 扩展结果
   */
  async extendAndWait(
    taskId: string,
    prompt: string,
    options: Veo3ExtendVideoOptions = {},
    waitForResult: boolean = true
  ): Promise<Veo3VideoResult> {
    const startTime = Date.now();

    // 如果有回调 URL，不应该等待
    if (options.callbackUrl) {
      logger.warn('callBackUrl is set, will not wait for result');
      waitForResult = false;
    }

    // 1. 创建扩展任务
    const extendResponse = await this.extend(taskId, prompt, options);
    const newTaskId = extendResponse.data?.taskId;

    if (!newTaskId) {
      return {
        taskId: '',
        success: false,
        error: 'Failed to get taskId from extend response',
      };
    }

    // 2. 如果不等待，直接返回
    if (!waitForResult) {
      return {
        taskId: newTaskId,
        success: true,
        duration: Date.now() - startTime,
      };
    }

    // 3. 等待完成
    try {
      const status = await this.waitForCompletion(newTaskId);
      
      return {
        taskId: newTaskId,
        success: true,
        videoUrls: status.resultUrls,
        fallbackFlag: status.metadata?.fallbackFlag,
        duration: Date.now() - startTime,
        consumeCredits: status.consumeCredits,
      };
    } catch (error: any) {
      return {
        taskId: newTaskId,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 实现 BaseAIClient 的 run 方法（用于统一接口）
   */
  async run<T = any>(request: any): Promise<any> {
    // 这个方法主要是为了满足 BaseAIClient 的抽象方法要求
    // 实际使用时应该调用具体的 generateVideo 等方法
    logger.warn('run() method called, prefer using specific methods like generateVideo()');
    return this.generateVideo(request);
  }

  // ========================================
  // HTTP 请求封装
  // ========================================

  /**
   * 统一的 HTTP 请求方法
   * 
   * @param endpoint API 端点
   * @param method HTTP 方法
   * @param body 请求体
   * @returns 响应数据
   */
  private async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    logger.debug({ 
      method, 
      endpoint, 
      hasBody: !!body 
    }, '📡 发送 HTTP 请求');

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData?.msg || responseData?.message || response.statusText;
      const errorCode = responseData?.code || response.status;
      
      logger.error({ 
        status: response.status,
        errorCode,
        errorMsg,
        endpoint,
        method 
      }, '❌ HTTP 请求失败');
      
      // 特殊错误提示
      let errorHint = '';
      if (response.status === 403) {
        errorHint = ' - 请检查: 1) API Key 是否有效 2) 账户余额是否充足 3) 是否有权限访问此 API';
      } else if (response.status === 402) {
        errorHint = ' - 账户余额不足，请充值';
      }
      
      throw new Error(`Veo3 API ${response.status}: ${errorMsg}${errorHint}`);
    }

    logger.debug({ 
      endpoint, 
      code: responseData?.code 
    }, '✅ HTTP 请求成功');

    return responseData as T;
  }
}

// ========================================
// 工厂函数
// ========================================

/**
 * 创建 Veo3 客户端实例
 * 
 * @param options 客户端配置选项
 * @returns Veo3 客户端实例
 */
export function createVeo3Client(options?: Veo3ClientOptions): Veo3Client {
  return new Veo3Client(options);
}

