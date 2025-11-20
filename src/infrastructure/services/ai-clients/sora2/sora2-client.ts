/**
 * Sora 2 视频生成客户端
 * 完整实现所有 Sora 2 API 接口
 * 
 * API 文档: https://kie.ai/zh-CN/sora-2
 */

import pino from 'pino';
import { BaseAIClient } from '../base/BaseAIClient';
import { AIClientOptions } from '../base/types';
import {
  Sora2ClientOptions,
  Sora2Model,
  Sora2AspectRatio,
  Sora2Frames,
  Sora2CreateTaskRequest,
  Sora2CreateTaskResponse,
  Sora2QueryTaskRequest,
  Sora2QueryTaskResponse,
  Sora2TaskData,
  Sora2ResultUrls,
  Sora2TextToVideoOptions,
  Sora2ImageToVideoOptions,
  Sora2ProOptions,
  Sora2ProImageOptions,
  Sora2StoryboardOptions,
  Sora2WatermarkRemoverOptions,
} from './types';

const logger = pino({ name: 'sora2-client' });

/**
 * Sora 2 客户端类
 * 提供完整的视频生成功能
 */
export class Sora2Client extends BaseAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: Sora2ClientOptions = {}) {
    super('kie', options as AIClientOptions);
    
    this.apiKey = options.apiKey || process.env.KIE_API_KEY || '';
    this.baseUrl = options.baseUrl || 'https://api.kie.ai';
    
    if (!this.apiKey) {
      throw new Error('KIE_API_KEY is required for Sora2Client');
    }

    logger.info('Sora2Client initialized');
  }

  // ========================================
  // API 1: 创建任务
  // POST /api/v1/jobs/createTask
  // ========================================

  /**
   * 创建任务（通用方法）
   * 
   * @param request 创建任务请求参数
   * @returns 创建响应（包含 taskId）
   */
  async createTask(request: Sora2CreateTaskRequest): Promise<Sora2CreateTaskResponse> {
    logger.info({ 
      model: request.model,
      prompt: request.input.prompt?.substring(0, 100),
      aspect_ratio: request.input.aspect_ratio,
      n_frames: request.input.n_frames,
      hasCallback: !!request.callBackUrl,
      fullInput: request.input,
    }, '📤 创建 Sora 2 任务');

    const response = await this.withRetry(
      () => this.makeRequest<Sora2CreateTaskResponse>(
        '/api/v1/jobs/createTask',
        'POST',
        request
      ),
      'createTask'
    );

    if (response.code !== 200 || !response.data?.taskId) {
      const errorMsg = response.message || 'Failed to create Sora 2 task';
      logger.error({ response }, '❌ 创建任务失败');
      throw new Error(errorMsg);
    }

    logger.info({ 
      taskId: response.data.taskId,
      model: request.model,
    }, '✅ Sora 2 任务已创建');

    return response;
  }

  // ========================================
  // API 2: 查询任务
  // GET /api/v1/jobs/queryTask
  // ========================================

  /**
   * 查询任务状态
   * 
   * @param taskId 任务 ID
   * @returns 任务详情
   */
  async queryTask(taskId: string): Promise<Sora2QueryTaskResponse> {
    logger.info({ taskId }, '🔍 查询 Sora 2 任务');

    const response = await this.withRetry(
      () => this.makeRequest<Sora2QueryTaskResponse>(
        '/api/v1/jobs/queryTask',
        'GET',
        undefined,
        { taskId }
      ),
      'queryTask'
    );

    if (response.code !== 200) {
      const errorMsg = response.message || response.msg || 'Failed to query task';
      logger.error({ response, taskId }, '❌ 查询任务失败');
      throw new Error(errorMsg);
    }

    logger.info({ 
      taskId,
      state: response.data?.state,
    }, '✅ 任务查询成功');

    return response;
  }

  /**
   * 轮询任务直到完成
   * 
   * @param taskId 任务 ID
   * @param maxAttempts 最大尝试次数（默认 60，即 5 分钟）
   * @param intervalMs 轮询间隔（默认 5000ms）
   * @returns 完成的任务数据
   */
  async pollTaskUntilComplete(
    taskId: string,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<Sora2TaskData> {
    logger.info({ taskId, maxAttempts, intervalMs }, '🔄 开始轮询任务');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await this.queryTask(taskId);
      const task = response.data;

      if (!task) {
        throw new Error('Task not found');
      }

      logger.info({ 
        taskId, 
        attempt, 
        state: task.state,
      }, `轮询进度 ${attempt}/${maxAttempts}`);

      // 任务完成
      if (task.state === 'success') {
        logger.info({ taskId }, '✅ 任务成功完成');
        return task;
      }

      // 任务失败
      if (task.state === 'fail') {
        const errorMsg = task.failMsg || 'Task failed';
        logger.error({ taskId, failCode: task.failCode, failMsg: task.failMsg }, '❌ 任务失败');
        throw new Error(errorMsg);
      }

      // 继续等待
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    // 超时
    throw new Error(`Task polling timeout after ${maxAttempts} attempts`);
  }

  /**
   * 解析结果 JSON
   * 
   * @param resultJson 结果 JSON 字符串
   * @returns 解析后的结果对象
   */
  parseResultJson(resultJson: string): Sora2ResultUrls {
    try {
      return JSON.parse(resultJson) as Sora2ResultUrls;
    } catch (error) {
      logger.error({ error, resultJson }, '❌ 解析结果 JSON 失败');
      throw new Error('Failed to parse result JSON');
    }
  }

  // ========================================
  // 便捷方法
  // ========================================

  /**
   * 文本转视频（Sora 2 基础版）
   * 
   * @param prompt 提示词
   * @param options 可选参数
   * @returns 任务 ID
   */
  async textToVideo(
    prompt: string,
    options: Sora2TextToVideoOptions = {}
  ): Promise<string> {
    const response = await this.createTask({
      model: 'sora-2-text-to-video',
      callBackUrl: options.callbackUrl,
      input: {
        prompt,
        aspect_ratio: options.aspectRatio,
        n_frames: options.nFrames,
        remove_watermark: options.removeWatermark,
      },
    });

    return response.data!.taskId;
  }

  /**
   * 图片转视频（Sora 2 基础版）
   * 
   * @param prompt 提示词
   * @param options 必须包含 imageUrls
   * @returns 任务 ID
   */
  async imageToVideo(
    prompt: string,
    options: Sora2ImageToVideoOptions
  ): Promise<string> {
    if (!options.imageUrls || options.imageUrls.length === 0) {
      throw new Error('imageUrls is required for image-to-video');
    }

    const response = await this.createTask({
      model: 'sora-2-image-to-video',
      callBackUrl: options.callbackUrl,
      input: {
        prompt,
        image_urls: options.imageUrls,
        aspect_ratio: options.aspectRatio,
        n_frames: options.nFrames,
        remove_watermark: options.removeWatermark,
      },
    });

    return response.data!.taskId;
  }

  /**
   * Pro 文本转视频
   * 
   * @param prompt 提示词
   * @param options 可选参数（含质量级别）
   * @returns 任务 ID
   */
  async proTextToVideo(
    prompt: string,
    options: Sora2ProOptions = {}
  ): Promise<string> {
    const model = 'sora-2-pro-text-to-video';
    
    const response = await this.createTask({
      model,
      callBackUrl: options.callbackUrl,
      input: {
        prompt,
        aspect_ratio: options.aspectRatio,
        n_frames: options.nFrames,
        remove_watermark: options.removeWatermark,
        size: options.quality, // Pro 模型使用 size 参数
      },
    });

    return response.data!.taskId;
  }

  /**
   * Pro 图片转视频
   * 
   * @param prompt 提示词
   * @param options 必须包含 imageUrls
   * @returns 任务 ID
   */
  async proImageToVideo(
    prompt: string,
    options: Sora2ProImageOptions
  ): Promise<string> {
    if (!options.imageUrls || options.imageUrls.length === 0) {
      throw new Error('imageUrls is required for pro-image-to-video');
    }

    const response = await this.createTask({
      model: 'sora-2-pro-image-to-video',
      callBackUrl: options.callbackUrl,
      input: {
        prompt,
        image_urls: options.imageUrls,
        aspect_ratio: options.aspectRatio,
        n_frames: options.nFrames,
        remove_watermark: options.removeWatermark,
        size: options.quality, // Pro 模型使用 size 参数
      },
    });

    return response.data!.taskId;
  }

  /**
   * Pro 故事板生成
   * 
   * @param options 故事板选项（包含场景列表）
   * @returns 任务 ID
   */
  async proStoryboard(options: Sora2StoryboardOptions): Promise<string> {
    if (!options.scenes || options.scenes.length === 0) {
      throw new Error('scenes is required for storyboard');
    }

    // 转换场景格式：{ prompt, duration } -> { Scene, duration }
    const shots = options.scenes.map((scene) => ({
      Scene: scene.prompt,
      duration: scene.duration,
    }));

    const response = await this.createTask({
      model: 'sora-2-pro-storyboard',
      callBackUrl: options.callbackUrl,
      input: {
        n_frames: options.nFrames, // 必填：视频总时长
        shots, // 必填：场景数组
        aspect_ratio: options.aspectRatio,
        image_urls: options.imageUrls,
        // 注意：Storyboard 不支持 remove_watermark 参数
      },
    });

    return response.data!.taskId;
  }

  /**
   * 水印移除
   * 
   * @param options 水印移除选项（包含视频 URL）
   * @returns 任务 ID
   */
  async removeWatermark(options: Sora2WatermarkRemoverOptions): Promise<string> {
    if (!options.videoUrl) {
      throw new Error('videoUrl is required for watermark removal');
    }

    const response = await this.createTask({
      model: 'sora-watermark-remover',
      callBackUrl: options.callbackUrl,
      input: {
        prompt: 'Remove watermark from video',
        image_urls: [options.videoUrl], // 使用 image_urls 传递视频 URL
      },
    });

    return response.data!.taskId;
  }

  // ========================================
  // 工具方法
  // ========================================

  /**
   * 获取视频 URL（从完成的任务）
   * 
   * @param task 完成的任务数据
   * @returns 视频 URL 列表
   */
  getVideoUrls(task: Sora2TaskData): string[] {
    if (!task.resultJson) {
      return [];
    }

    try {
      const result = this.parseResultJson(task.resultJson);
      return result.resultUrls || [];
    } catch (error) {
      logger.error({ error, taskId: task.taskId }, '获取视频 URL 失败');
      return [];
    }
  }

  /**
   * 获取带水印的视频 URL
   * 
   * @param task 完成的任务数据
   * @returns 带水印的视频 URL 列表
   */
  getWatermarkedVideoUrls(task: Sora2TaskData): string[] {
    if (!task.resultJson) {
      return [];
    }

    try {
      const result = this.parseResultJson(task.resultJson);
      return result.resultWaterMarkUrls || [];
    } catch (error) {
      logger.error({ error, taskId: task.taskId }, '获取带水印视频 URL 失败');
      return [];
    }
  }

  // ========================================
  // HTTP 请求方法
  // ========================================

  /**
   * 发送 HTTP 请求
   * 
   * @param endpoint API 端点
   * @param method HTTP 方法
   * @param body 请求体
   * @param queryParams 查询参数
   * @returns API 响应
   */
  private async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    // 添加查询参数
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }
    
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
      hasBody: !!body,
      hasParams: !!queryParams,
    }, '📡 发送 HTTP 请求');

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData?.message || responseData?.msg || response.statusText;
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
      
      throw new Error(`Sora 2 API ${response.status}: ${errorMsg}${errorHint}`);
    }

    logger.debug({ 
      endpoint, 
      code: responseData?.code 
    }, '✅ HTTP 请求成功');

    return responseData as T;
  }
}

/**
 * 创建 Sora 2 客户端实例（工厂函数）
 * 
 * @param options 客户端选项
 * @returns Sora 2 客户端实例
 */
export function createSora2Client(options?: Sora2ClientOptions): Sora2Client {
  return new Sora2Client(options);
}

