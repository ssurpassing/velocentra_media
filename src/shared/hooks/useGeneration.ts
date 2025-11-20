/**
 * useGeneration Hook
 * 统一管理图片生成流程：上传、生成、轮询状态
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { http } from '@/infrastructure/http/client';

interface UseGenerationOptions {
  onSuccess?: (taskId: string, photoId?: string) => void;
  onError?: (error: string) => void;
  onProgress?: (taskId: string, status: string) => void;
}

interface GenerationParams {
  imageUrl?: string;
  style: string;
  aiModel: string;
  customPrompt?: string;
  aspectRatio?: string;
  isPromptOptimized?: boolean;
}

interface ProfessionalGenerationParams {
  imageUrl: string;
  style: string;
  pipelineMode?: string;
  customPrompt?: string;
  parentTaskId?: string;
  workflowData?: Record<string, any>;
}

interface UseGenerationReturn {
  generating: boolean;
  uploading: boolean;
  error: string;
  uploadImage: (file: File) => Promise<string | null>;
  startGeneration: (params: GenerationParams) => Promise<void>;
  startProfessionalGeneration: (params: ProfessionalGenerationParams) => Promise<void>;
  clearError: () => void;
}

/**
 * 生成管理 Hook
 */
export function useGeneration(options: UseGenerationOptions = {}): UseGenerationReturn {
  const { onSuccess, onError, onProgress } = options;

  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // 防止重复提交
  const generatingRef = useRef(false);

  /**
   * 上传图片
   */
  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading(true);
      setError('');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await http.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (!response.success) {
          throw new Error(response.error || 'Upload failed');
        }

        return response.data.url;
      } catch (err: any) {
        const errorMsg = err.message || 'Upload failed';
        setError(errorMsg);
        onError?.(errorMsg);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [onError]
  );

  /**
   * 开始生成（AI 模型）
   */
  const startGeneration = useCallback(
    async (params: GenerationParams) => {
      if (generatingRef.current) {
        return;
      }

      generatingRef.current = true;
      setGenerating(true);
      setError('');

      try {
        const response = await http.post('/generate', params);

        if (!response.success) {
          throw new Error(response.error || 'Generation failed');
        }

        const { taskId, photoId } = response.data;

        // 触发成功回调
        onSuccess?.(taskId, photoId);

        // 触发生成事件（用于刷新列表）
        window.dispatchEvent(
          new CustomEvent('photoGenerating', {
            detail: {
              taskId,
              isProfessional: false,
              styleKey: params.style,
            },
          })
        );
      } catch (err: any) {
        const errorMsg = err.message || 'Generation failed';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setGenerating(false);
        generatingRef.current = false;
      }
    },
    [onSuccess, onError]
  );

  /**
   * 开始专业生成（管线）
   */
  const startProfessionalGeneration = useCallback(
    async (params: ProfessionalGenerationParams) => {
      if (generatingRef.current) {
        return;
      }

      generatingRef.current = true;
      setGenerating(true);
      setError('');

      try {
        const response = await http.post('/generate-professional', params);

        if (!response.success) {
          throw new Error(response.error || 'Generation failed');
        }

        const { taskId } = response.data;

        // 触发成功回调
        onSuccess?.(taskId);

        // 触发生成事件（用于刷新列表）
        window.dispatchEvent(
          new CustomEvent('photoGenerating', {
            detail: {
              taskId,
              isProfessional: true,
              styleKey: params.style,
            },
          })
        );
      } catch (err: any) {
        const errorMsg = err.message || 'Generation failed';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setGenerating(false);
        generatingRef.current = false;
      }
    },
    [onSuccess, onError]
  );

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    generating,
    uploading,
    error,
    uploadImage,
    startGeneration,
    startProfessionalGeneration,
    clearError,
  };
}

/**
 * 任务轮询 Hook
 */
export function useTaskPolling(taskId: string | null, onComplete?: () => void, onError?: () => void) {
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  const startPolling = useCallback(() => {
    if (!taskId || polling) return;

    setPolling(true);
    attemptsRef.current = 0;

    const poll = async () => {
      try {
        const response = await http.get(`/tasks/${taskId}`);

        if (response.success) {
          const { task } = response.data;

          if (task.status === 'completed') {
            setPolling(false);
            if (pollingRef.current) {
              clearTimeout(pollingRef.current);
            }
            onComplete?.();
            return;
          }

          if (task.status === 'failed') {
            setPolling(false);
            if (pollingRef.current) {
              clearTimeout(pollingRef.current);
            }
            onError?.();
            return;
          }
        }

        // 继续轮询
        attemptsRef.current++;
        if (attemptsRef.current < 90) {
          // 最多轮询 90 次（3分钟）
          pollingRef.current = setTimeout(poll, 2000);
        } else {
          // 超时
          setPolling(false);
          onError?.();
        }
      } catch (error) {
        console.error('Poll error:', error);
        setPolling(false);
        onError?.();
      }
    };

    poll();
  }, [taskId, polling, onComplete, onError]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
  }, []);

  return {
    polling,
    startPolling,
    stopPolling,
  };
}

