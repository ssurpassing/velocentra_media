/**
 * kie.ai 图片生成客户端
 * 支持 GPT-4o Image 和 Nano Banana
 */

import pino from 'pino';
import { BaseAIClient } from '../base/BaseAIClient';
import {
  AIClientRequest,
  AIClientResponse,
  AIClientOptions,
  TaskStatus,
  ImageGenerationInput,
  ImageGenerationOutput,
} from '../base/types';

const logger = pino({ name: 'kie-image-client' });

// ========================================
// kie.ai API 响应类型
// ========================================

interface KieAPIResponse {
  code: number;
  msg: string;
  message?: string;
  data?: {
    taskId?: string;
    info?: {
      result_urls?: string[];
      resultUrls?: string[];
    };
  };
}

interface KieTaskResponse {
  code: number;
  msg: string;
  message?: string;
  data?: {
    taskId: string;
    model: string;
    state: string;
    param?: string;
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
    completeTime?: number;
    createTime?: number;
    updateTime?: number;
    costTime?: number;
    consumeCredits?: number;
  };
}

// ========================================
// kie.ai 图片生成客户端
// ========================================

export class KieImageClient extends BaseAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: AIClientOptions = {}) {
    super('kie', options);
    
    this.apiKey = options.apiKey || process.env.KIE_API_KEY || '';
    this.baseUrl = options.baseUrl || 'https://api.kie.ai';
    
    if (!this.apiKey) {
      throw new Error('KIE_API_KEY is required');
    }
  }

  /**
   * 运行图片生成模型
   */
  async run<T = ImageGenerationOutput>(
    request: AIClientRequest
  ): Promise<AIClientResponse<T>> {
    const startTime = Date.now();
    const modelName = request.model.name;

    this.log('info', `Running kie.ai model: ${modelName}`, { input: request.input });

    try {
      // 根据模型类型选择不同的API端点和参数格式
      let taskId: string;
      
      if (modelName.includes('gpt') || modelName.includes('4o-image')) {
        // GPT-4o Image API
        taskId = await this.createGPT4oImageTask(request);
      } else {
        // Universal Jobs API (Nano Banana等)
        taskId = await this.createJobTask(request);
      }

      // 如果有回调URL，直接返回taskId
      if (request.callbackUrl) {
        return {
          success: true,
          taskId,
          metadata: {
            provider: 'kie',
            model: modelName,
            duration: Date.now() - startTime,
          },
        };
      }

      // 否则等待任务完成
      const status = await this.waitForCompletion(taskId, request.timeout);
      
      return {
        success: true,
        data: {
          url: status.resultUrls?.[0] || '',
          urls: status.resultUrls,
        } as T,
        taskId,
        metadata: {
          provider: 'kie',
          model: modelName,
          duration: Date.now() - startTime,
          cost: status.consumeCredits,
        },
      };
    } catch (error: any) {
      this.log('error', 'Model run failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        metadata: {
          provider: 'kie',
          model: modelName,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 创建 GPT-4o Image 生成任务
   */
  private async createGPT4oImageTask(request: AIClientRequest): Promise<string> {
    const input = request.input as ImageGenerationInput;
    
    const payload: any = {
      prompt: input.prompt,
      size: input.size || input.aspectRatio || '1:1',
      nVariants: input.nVariants || input.numOutputs || 1,
      isEnhance: false,
      uploadCn: false,
      enableFallback: false,
    };

    // 添加可选参数
    if (input.filesUrl || input.images) {
      payload.filesUrl = input.filesUrl || input.images;
    }
    if (input.image) {
      payload.filesUrl = [input.image];
    }
    if (input.maskUrl) {
      payload.maskUrl = input.maskUrl;
    }
    if (request.callbackUrl) {
      payload.callBackUrl = request.callbackUrl;
    }

    logger.info({ 
      prompt: payload.prompt?.substring(0, 100),
      size: payload.size,
      hasFilesUrl: !!payload.filesUrl,
      filesUrlCount: payload.filesUrl?.length 
    }, '📤 创建 GPT-4o 任务请求');

    const response = await this.withRetry(
      () => this.makeRequest<KieAPIResponse>(
        '/api/v1/gpt4o-image/generate',
        'POST',
        payload
      ),
      'createGPT4oImageTask'
    );

    logger.info({ 
      code: response.code,
      taskId: response.data?.taskId,
      msg: response.msg 
    }, '📥 GPT-4o 任务创建响应');

    if (response.code !== 200 || !response.data?.taskId) {
      throw new Error(response.msg || response.message || 'Failed to create task');
    }

    const taskId = response.data.taskId;
    logger.info({ taskId }, '✅ GPT-4o 任务创建成功');

    return taskId;
  }

  /**
   * 创建通用任务（Nano Banana等）
   */
  private async createJobTask(request: AIClientRequest): Promise<string> {
    const payload = {
      model: request.model.name,
      callBackUrl: request.callbackUrl,
      input: request.input,
    };

    const response = await this.withRetry(
      () => this.makeRequest<KieAPIResponse>(
        '/api/v1/jobs/createTask',
        'POST',
        payload
      ),
      'createJobTask'
    );

    if (response.code !== 200 || !response.data?.taskId) {
      throw new Error(response.msg || response.message || 'Failed to create task');
    }

    return response.data.taskId;
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    try {
      // 先尝试 GPT-4o Image 专用API
      try {
        const gptResponse = await this.makeRequest<any>(
          `/api/v1/gpt4o-image/record-info?taskId=${taskId}`,
          'GET'
        );

        // 422 可能是任务记录还没准备好
        if (gptResponse.code === 422) {
          logger.debug({ taskId, msg: gptResponse.msg }, 'GPT-4o 任务记录还未准备好');
          return {
            taskId,
            state: 'pending',
            resultUrls: [],
            createdAt: Date.now(),
          };
        }

        if (gptResponse.code === 200 && gptResponse.data) {
          const data = gptResponse.data;
          
          // 详细日志：查看完整响应结构
          logger.info({ 
            taskId: data.taskId,
            status: data.status,
            hasResponse: !!data.response,
            responseKeys: data.response ? Object.keys(data.response) : [],
            resultUrls: data.response?.resultUrls,
            fullData: JSON.stringify(data).substring(0, 500) // 前500字符
          }, '🔍 GPT-4o 任务详情');
          
          // GPT-4o Image 返回格式
          // response.resultUrls 是实际的字段
          let resultUrls: string[] = [];
          if (data.response?.resultUrls) {
            resultUrls = data.response.resultUrls;
            logger.info({ taskId, resultUrls }, '✅ 找到图片URLs');
          } else {
            logger.warn({ taskId, response: data.response }, '⚠️ 未找到 resultUrls');
          }

          return {
            taskId: data.taskId || taskId,
            state: this.normalizeGPT4oState(data.status), // 使用 status 字段
            resultUrls,
            error: data.errorCode ? {
              code: data.errorCode,
              message: data.errorMessage || 'Unknown error',
            } : undefined,
            createdAt: data.createTime,
            completedAt: data.completeTime,
            costTime: data.completeTime && data.createTime 
              ? data.completeTime - data.createTime 
              : undefined,
            consumeCredits: undefined, // GPT-4o 响应中没有这个字段
          };
        }
      } catch (gptError: any) {
        // GPT-4o API 失败，尝试通用 API
        logger.debug({ taskId, error: gptError.message }, 'GPT-4o API failed, trying universal API');
      }

      // 尝试通用任务查询API（Nano Banana等）
      const response = await this.makeRequest<KieTaskResponse>(
        `/api/v1/jobs/recordInfo?taskId=${taskId}`,
        'GET'
      );

      // 422 "recordInfo is null" 说明任务刚创建，记录还没准备好
      // 返回 pending 状态，让轮询继续
      if ((response as any).code === 422 && (response as any).msg === 'recordInfo is null') {
        logger.debug({ taskId }, '任务记录还未准备好，返回 pending 状态');
        return {
          taskId,
          state: 'pending',
          resultUrls: [],
          createdAt: Date.now(),
        };
      }

      if (response.code === 200 && response.data) {
        const data = response.data;
        
        // 解析结果JSON
        let resultUrls: string[] = [];
        if (data.resultJson) {
          try {
            const result = JSON.parse(data.resultJson);
            resultUrls = result.resultUrls || result.result_urls || [];
          } catch (e) {
            logger.warn({ taskId, resultJson: data.resultJson }, 'Failed to parse resultJson');
          }
        }

        return {
          taskId: data.taskId,
          state: this.normalizeState(data.state),
          resultUrls,
          error: data.failMsg ? {
            code: data.failCode || 'unknown',
            message: data.failMsg,
          } : undefined,
          createdAt: data.createTime,
          completedAt: data.completeTime,
          costTime: data.costTime,
          consumeCredits: data.consumeCredits,
        };
      }

      throw new Error('Task not found in both APIs');
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Failed to get task status');
      throw error;
    }
  }

  /**
   * GPT-4o Image 生成（简化接口）
   */
  async generateGPT4oImage(
    prompt: string,
    options: {
      filesUrl?: string[];
      size?: string;
      nVariants?: number;
      maskUrl?: string;
      callbackUrl?: string;
    } = {}
  ): Promise<AIClientResponse<ImageGenerationOutput>> {
    return this.run<ImageGenerationOutput>({
      model: {
        provider: 'kie',
        name: 'gpt-4o-image',
      },
      input: {
        prompt,
        filesUrl: options.filesUrl,
        size: options.size || '1:1',
        nVariants: options.nVariants || 1,
        maskUrl: options.maskUrl,
      },
      callbackUrl: options.callbackUrl,
    });
  }

  /**
   * Nano Banana 生成（简化接口）
   */
  async generateNanoBanana(
    prompt: string,
    options: {
      outputFormat?: string;
      imageSize?: string;
      imageUrls?: string[]; // 支持传入多张图片URLs（多图融合）
      callbackUrl?: string;
    } = {}
  ): Promise<AIClientResponse<ImageGenerationOutput>> {
    const input: any = {
      prompt,
      output_format: options.outputFormat || 'png',
      image_size: options.imageSize || '1:1',
    };
    
    // 如果有图片URLs，使用 nano-banana-edit 模型（图生图/多图融合）
    // 否则使用 nano-banana 模型（文生图）
    const hasImages = options.imageUrls && options.imageUrls.length > 0;
    const modelName = hasImages 
      ? 'google/nano-banana-edit'  // 图片编辑/多图融合模型
      : 'google/nano-banana';       // 图片生成模型
    
    // 如果有图片URLs，添加到input中（使用 image_urls 数组，支持多图）
    if (hasImages) {
      input.image_urls = options.imageUrls;
    }
    
    return this.run<ImageGenerationOutput>({
      model: {
        provider: 'kie',
        name: modelName,
      },
      input,
      callbackUrl: options.callbackUrl,
    });
  }

  /**
   * 统一的HTTP请求方法
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

    const response = await fetch(url, options);
    
    // 先解析响应体
    const responseData = await response.json();

    if (!response.ok) {
      // 提取详细错误信息
      const errorMsg = responseData?.msg || responseData?.message || response.statusText;
      const errorCode = responseData?.code || response.status;
      
      // 记录详细错误
      logger.error({ 
        status: response.status,
        errorCode,
        errorMsg,
        endpoint,
        method 
      }, '❌ kie.ai API 错误');
      
      // 特殊错误提示
      let errorHint = '';
      if (response.status === 403) {
        errorHint = ' - 请检查: 1) API Key 是否有效 2) 账户余额是否充足 3) 是否有权限访问此模型';
      } else if (response.status === 402) {
        errorHint = ' - 账户余额不足';
      }
      
      throw new Error(`kie.ai API ${response.status}: ${errorMsg}${errorHint}`);
    }

    return responseData as T;
  }

  /**
   * 规范化任务状态（通用）
   */
  private normalizeState(state: string): TaskStatus['state'] {
    const stateMap: Record<string, TaskStatus['state']> = {
      'waiting': 'waiting',
      'queuing': 'queuing',
      'generating': 'generating',
      'processing': 'processing',
      'success': 'success',
      'completed': 'completed',
      'fail': 'failed',
      'failed': 'failed',
      'cancelled': 'cancelled',
    };

    return stateMap[state.toLowerCase()] || 'pending';
  }

  /**
   * 规范化 GPT-4o Image 任务状态
   */
  private normalizeGPT4oState(state: string): TaskStatus['state'] {
    const stateMap: Record<string, TaskStatus['state']> = {
      'GENERATING': 'generating',
      'SUCCESS': 'success',
      'CREATE_TASK_FAILED': 'failed',
      'GENERATE_FAILED': 'failed',
    };

    return stateMap[state] || this.normalizeState(state);
  }
}

// ========================================
// 工厂函数
// ========================================

export function createKieImageClient(options?: AIClientOptions): KieImageClient {
  return new KieImageClient(options);
}

