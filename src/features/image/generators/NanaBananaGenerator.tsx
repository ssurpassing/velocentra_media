/**
 * Nano Banana 图片生成器
 * 支持图生图（Nano Banana）和文生图（Nano Banana Edit）两种模式
 */

'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import { Loader2, Sparkles, Image as ImageIcon, Type, Wand2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { ImageUploadSection } from './ImageUploadSection';
import { useAuth } from '@/shared/contexts/AuthContext';
import { http } from '@/infrastructure/http/client';
import { PromptOptimizeModal } from '@/shared/components/modals/PromptOptimizeModal';
import { IMAGE_MODEL_CREDITS } from '@/shared/config/model-credits';

// v4.1: 重试上下文类型
type RetryContext = {
  taskId: string;
  status: 'completed' | 'failed';
  mediaType: 'image' | 'video';
} | null;

interface NanaBananaGeneratorProps {
  locale?: string;
  retryContext?: RetryContext;
  onClearRetry?: () => void;
}

export interface NanaBananaGeneratorHandle {
  fillFromData: (data: any) => void;
}

type GenerationMode = 'image-to-image' | 'text-to-image';
type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5';

export const NanaBananaGenerator = forwardRef<NanaBananaGeneratorHandle, NanaBananaGeneratorProps>(
  ({ locale = 'zh', retryContext, onClearRetry }, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations();

  // 模式状态
  const [mode, setMode] = useState<GenerationMode>('text-to-image');
  
  // 图片相关（Edit 模式支持多图）
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // 生成参数
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  // 生成状态
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  // 优化模态框
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);

  // Nano Banana 支持的所有比例
  const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: '1:1' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '3:4', label: '3:4' },
    { value: '4:3', label: '4:3' },
    { value: '3:2', label: '3:2' },
    { value: '2:3', label: '2:3' },
    { value: '5:4', label: '5:4' },
    { value: '4:5', label: '4:5' },
  ];

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    fillFromData: (data: any) => {
      // 从任务数据回填表单
      if (data.prompt || data.originalPrompt || data.optimizedPrompt) {
        const promptValue = data.optimizedPrompt || data.prompt || data.originalPrompt || '';
        setPrompt(promptValue);
      }
      
      // 设置宽高比
      if (data.aspectRatio || data.generationParams?.aspectRatio) {
        const ratio = data.generationParams?.aspectRatio || data.aspectRatio;
        if (isValidAspectRatio(ratio)) {
          setAspectRatio(ratio as AspectRatio);
        }
      }
      
      // 如果有输入图片，切换到图生图模式并设置预览
      if (data.inputImageUrls && data.inputImageUrls.length > 0) {
        setMode('image-to-image');
        setImagePreviews(data.inputImageUrls);
        // 清空文件对象，因为这些是从URL加载的
        setImageFiles([]);
      } else {
        setMode('text-to-image');
        setImagePreviews([]);
        setImageFiles([]);
      }
    },
  }));

  // 辅助函数：验证宽高比是否有效
  const isValidAspectRatio = (ratio: string): boolean => {
    return ASPECT_RATIOS.some(ar => ar.value === ratio);
  };

  const isImageMode = mode === 'image-to-image';
  // Nano Banana = 文生图, Nano Banana Edit = 图生图
  const modelId = isImageMode ? 'kie-nano-banana-edit' : 'kie-nano-banana';
  const costPerImage = IMAGE_MODEL_CREDITS[modelId] || 50;
  const totalCost = costPerImage; // Nano Banana 只支持单张生成

  // 处理多图片选择
  const handleImagesSelect = (files: File[]) => {
    setImageFiles(prev => [...prev, ...files]);
    setError('');

    // 为每个文件创建预览
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理移除特定图片
  const handleImageRemoveAt = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 处理生成
  const handleGenerate = async () => {
    if (!user) {
      setError(t('generators.common.pleaseLogin'));
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
      return;
    }

    // 验证参数
    if (!prompt.trim()) {
      setError(t('generators.common.pleaseEnterPrompt'));
      return;
    }

    // 验证图生图模式是否有图片（支持文件上传或URL）
    if (isImageMode && imageFiles.length === 0 && imagePreviews.length === 0) {
      setError(t('generators.common.pleaseUploadImages'));
      return;
    }

    try {
      setError('');
      setGenerating(true);

      // 图生图模式：处理图片URLs
      if (isImageMode) {
        let imageUrls: string[] = [];
        
        // 如果有文件需要上传
        if (imageFiles.length > 0) {
          setUploading(true);
          
          // 上传所有图片，收集所有 URLs
          for (const imageFile of imageFiles) {
            const formData = new FormData();
            formData.append('file', imageFile);
            
            const uploadResponse = await http.post('/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (!uploadResponse.success) {
              throw new Error(uploadResponse.error || 'Upload failed');
            }

            imageUrls.push(uploadResponse.data.url);
          }
          
          setUploading(false);
        } else if (imagePreviews.length > 0) {
          // 直接使用已有的图片URLs（从示例加载的情况）
          imageUrls = imagePreviews;
        }

        // v4.1: 构建重试相关字段
        const retryFields = retryContext && retryContext.mediaType === 'image'
          ? {
              parentTaskId: retryContext.taskId,
              retryFromTaskId: retryContext.status === 'failed' ? retryContext.taskId : undefined,
            }
          : {};

        // 创建多图融合生成任务
        const generateResponse = await http.post('/generate', {
          mode,
          aiModel: modelId,
          prompt: prompt.trim(),
          imageUrls: imageUrls, // 传递多张图片 URLs
          aspectRatio,
          numberOfImages: 1,
          isPromptOptimized: false,
          style: 'custom',
          customPrompt: prompt.trim(),
          ...retryFields,
        });

        if (!generateResponse.success) {
          throw new Error(generateResponse.error || 'Failed to generate');
        }

        const taskId = generateResponse.data.taskId;

        // v4.1: 清空重试上下文
        onClearRetry?.();

        // 触发事件通知
        window.dispatchEvent(
          new CustomEvent('imageGenerating', {
            detail: {
              taskId,
              mode,
              model: modelId,
            },
          })
        );
      } else {
        // v4.1: 构建重试相关字段
        const retryFields = retryContext && retryContext.mediaType === 'image'
          ? {
              parentTaskId: retryContext.taskId,
              retryFromTaskId: retryContext.status === 'failed' ? retryContext.taskId : undefined,
            }
          : {};

        // 文生图模式
        const generateResponse = await http.post('/generate', {
          mode,
          aiModel: modelId,
          prompt: prompt.trim(),
          imageUrl: undefined,
          aspectRatio,
          numberOfImages: 1,
          isPromptOptimized: false,
          style: 'custom',
          customPrompt: prompt.trim(),
          ...retryFields,
        });

        if (!generateResponse.success) {
          throw new Error(generateResponse.error || 'Failed to generate');
        }

        const taskId = generateResponse.data.taskId;

        // v4.1: 清空重试上下文
        onClearRetry?.();

        // 触发事件通知
        window.dispatchEvent(
          new CustomEvent('imageGenerating', {
            detail: {
              taskId,
              mode,
              model: modelId,
            },
          })
        );
      }

      // 不跳转，留在当前页面查看预览
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || t('generators.common.generationFailed'));
    } finally {
      setGenerating(false);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 模式切换 - 优化设计 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t('generators.video.generationMode')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('text-to-image')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
              mode === 'text-to-image'
                ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-gray-900 dark:text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Type className="w-4 h-4" />
            <span className="text-xs">{t('generators.image.textToImage')}</span>
          </button>
          
          <button
            onClick={() => setMode('image-to-image')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
              mode === 'image-to-image'
                ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-gray-900 dark:text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-xs">{t('generators.image.imageToImage')}</span>
          </button>
        </div>
      </div>

      {/* 图片上传（仅图生图模式） */}
      {isImageMode && (
        <ImageUploadSection
          multiple
          imageFiles={imageFiles}
          imagePreviews={imagePreviews}
          onImagesSelect={handleImagesSelect}
          onImageRemoveAt={handleImageRemoveAt}
          disabled={generating}
          imageFile={null}
          imagePreview={null}
          onImageSelect={() => {}}
          onImageRemove={() => {}}
        />
      )}

      {/* 提示词 - 内嵌按钮 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>{t('aiImage.generator.prompt')}</span>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              （Prompt）
            </span>
          </span>
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
            {prompt.length} / 2000
          </span>
        </label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('aiImage.generator.promptPlaceholder')}
            maxLength={2000}
            className="w-full h-36 px-4 py-3.5 pr-28 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
            disabled={generating}
          />
          {/* 优化按钮 - 放在输入框内部右上角 */}
          <button
            onClick={() => setOptimizeModalOpen(true)}
            disabled={!prompt.trim() || generating}
            className={`absolute top-3 right-3 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              prompt.trim() && !generating
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-amber-500/25'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            {t('generators.common.optimize')}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {t('generators.common.promptHint')}
        </p>
      </div>

      {/* Ratio - Nano Banana 支持更多比例选项 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>Ratio</span>
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            （{t('generators.labels.aspectRatio')}）
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = aspectRatio === ratio.value;
            return (
              <button
                key={ratio.value}
                onClick={() => setAspectRatio(ratio.value)}
                className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-gray-900 dark:text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {ratio.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('generators.image.nanaBananaRatioHint')}
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* 生成按钮 */}
      <div className="space-y-3">
        {/* 成本预览卡片 */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('generators.common.cost')}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {totalCost}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('generators.common.credits')}</span>
          </div>
        </div>

        {/* 生成按钮 */}
        <Button
          onClick={handleGenerate}
          disabled={generating || uploading || !prompt.trim() || (isImageMode && imageFiles.length === 0 && imagePreviews.length === 0)}
          loading={generating || uploading}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>{t('generators.common.uploading')}</span>
            </>
          ) : generating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>{t('generators.common.aiGenerating')}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              <span>{t('generators.image.startGeneration')}</span>
            </>
          )}
        </Button>
      </div>

      {/* 优化模态框 */}
      <PromptOptimizeModal
        open={optimizeModalOpen}
        onOpenChange={setOptimizeModalOpen}
        originalPrompt={prompt}
        imagePreviews={imagePreviews.length > 0 ? imagePreviews : undefined}
        imagePreview={imagePreviews[0] || null}
        onFillBack={(optimizedPrompt) => {
          setPrompt(optimizedPrompt);
          setOptimizeModalOpen(false);
        }}
        type="image"
      />
    </div>
  );
});

NanaBananaGenerator.displayName = 'NanaBananaGenerator';

