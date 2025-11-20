/**
 * GPT-4o 图片生成器
 * 支持文生图和图生图（图片为可选）
 */

'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { ImageUploadSection } from './ImageUploadSection';
import { useAuth } from '@/shared/contexts/AuthContext';
import { http } from '@/infrastructure/http/client';
import { PromptOptimizeModal } from '@/shared/components/modals/PromptOptimizeModal';

// v4.1: 重试上下文类型
type RetryContext = {
  taskId: string;
  status: 'completed' | 'failed';
  mediaType: 'image' | 'video';
} | null;

interface GPT4oGeneratorProps {
  locale?: string;
  retryContext?: RetryContext;
  onClearRetry?: () => void;
}

export interface GPT4oGeneratorHandle {
  fillFromData: (data: any) => void;
}

type AspectRatio = '1:1' | '3:2' | '2:3';

export const GPT4oGenerator = forwardRef<GPT4oGeneratorHandle, GPT4oGeneratorProps>(
  ({ locale = 'zh', retryContext, onClearRetry }, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations();

  // 图片相关（可选）
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // 生成参数
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  
  // 生成状态
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  // 优化模态框
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);

  const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
    { value: '3:2', label: '3:2' },
    { value: '2:3', label: '2:3' },
    { value: '1:1', label: '1:1' },
  ];

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    fillFromData: (data: any) => {
      // 从任务数据回填表单
      if (data.prompt || data.originalPrompt || data.optimizedPrompt) {
        setPrompt(data.optimizedPrompt || data.prompt || data.originalPrompt || '');
      }
      
      // 设置宽高比
      if (data.aspectRatio || data.generationParams?.size) {
        const ratio = data.generationParams?.size || data.aspectRatio;
        if (isValidAspectRatio(ratio)) {
          setAspectRatio(ratio as AspectRatio);
        }
      }
      
      // 设置生成数量
      if (data.numberOfImages || data.generationParams?.numberOfImages) {
        const num = data.generationParams?.numberOfImages || data.numberOfImages;
        if (num >= 1 && num <= 4) {
          setNumberOfImages(num);
        }
      }
      
      // 如果有输入图片URL，设置预览
      if (data.inputImageUrls && data.inputImageUrls.length > 0) {
        setImagePreview(data.inputImageUrls[0]);
        // 清空文件对象，因为这是从URL加载的
        setImageFile(null);
      } else {
        setImagePreview(null);
        setImageFile(null);
      }
    },
  }));

  // 辅助函数：验证宽高比是否有效
  const isValidAspectRatio = (ratio: string): boolean => {
    return ASPECT_RATIOS.some(ar => ar.value === ratio);
  };

  const IMAGE_COUNTS = [1, 2, 4];

  const costPerImage = 80;
  const totalCost = costPerImage * numberOfImages;

  // 处理图片选择
  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 处理图片移除
  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
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

    try {
      setError('');
      setGenerating(true);

      // 处理图片（如果有）
      let imageUrl = '';
      if (imageFile) {
        // 有文件需要上传
        setUploading(true);
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const uploadResponse = await http.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (!uploadResponse.success) {
          throw new Error(uploadResponse.error || 'Upload failed');
        }

        imageUrl = uploadResponse.data.url;
        setUploading(false);
      } else if (imagePreview) {
        // 直接使用已有的图片URL（从示例加载的情况）
        imageUrl = imagePreview;
      }

      // v4.1: 构建重试相关字段
      const retryFields = retryContext && retryContext.mediaType === 'image'
        ? {
            parentTaskId: retryContext.taskId,
            retryFromTaskId: retryContext.status === 'failed' ? retryContext.taskId : undefined,
          }
        : {};

      // 调用生成 API
      // GPT-4o 支持文生图和图生图，根据是否有图片自动判断
      const generateResponse = await http.post('/generate', {
        mode: imageUrl ? 'image-to-image' : 'text-to-image',
        aiModel: 'kie-gpt4o-image',
        prompt: prompt.trim(),
        imageUrl: imageUrl || undefined,
        aspectRatio,
        numberOfImages,
        isPromptOptimized: false,
        style: 'custom', // 自定义模式，不使用预设风格
        customPrompt: prompt.trim(), // 直接使用用户输入的提示词
        ...retryFields,
      });

      if (!generateResponse.success) {
        throw new Error(generateResponse.error || 'Failed to generate');
      }

      const taskId = generateResponse.data.taskId;

      // v4.1: 清空重试上下文
      onClearRetry?.();

      // 触发事件通知（不跳转，留在当前页面）
      window.dispatchEvent(
        new CustomEvent('imageGenerating', {
          detail: {
            taskId,
            mode: imageUrl ? 'image-to-image' : 'text-to-image',
            model: 'kie-gpt4o-image',
          },
        })
      );

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
      {/* 图片上传（可选） */}
      <ImageUploadSection
        imageFile={imageFile}
        imagePreview={imagePreview}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        disabled={generating}
        label="上传图片（可选）"
        hint="支持 PNG、JPG、WEBP，最大 5MB。上传图片可进行图生图或编辑。"
      />

      {/* 提示词 - 内嵌按钮 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>提示词</span>
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
            className="w-full h-36 px-4 py-3.5 pr-28 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
            disabled={generating}
          />
          {/* 优化按钮 - 放在输入框内部右上角 */}
          <button
            onClick={() => setOptimizeModalOpen(true)}
            disabled={!prompt.trim() || generating}
            className={`absolute top-3 right-3 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              prompt.trim() && !generating
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-emerald-500/25'
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
          详细描述能获得更好的生成效果，可使用 AI 优化提示词
        </p>
      </div>

      {/* Ratio */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>Ratio</span>
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            （宽高比）
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
      </div>

      {/* 生成数量 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>生成数量</span>
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            （Number of Images）
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {IMAGE_COUNTS.map((count) => {
            const isSelected = numberOfImages === count;
            return (
              <button
                key={count}
                onClick={() => setNumberOfImages(count)}
                className={`group relative px-3 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-semibold ${
                  isSelected
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-800/20 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                {isSelected && (
                  <div className="absolute inset-0 rounded-lg bg-emerald-500/10 animate-pulse" />
                )}
                <span className="relative">{count} 张</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          每次生成消耗 {costPerImage} 积分/张，共 {totalCost} 积分
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
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              本次生成消耗
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalCost}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">积分</span>
          </div>
        </div>

        {/* 生成按钮 */}
        <Button
          onClick={handleGenerate}
          disabled={generating || uploading || !prompt.trim()}
          loading={generating || uploading}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>上传图片中...</span>
            </>
          ) : generating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>AI 生成中...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              <span>开始生成图片</span>
            </>
          )}
        </Button>
      </div>

      {/* 优化模态框 */}
      <PromptOptimizeModal
        open={optimizeModalOpen}
        onOpenChange={setOptimizeModalOpen}
        originalPrompt={prompt}
        imagePreview={imagePreview}
        onFillBack={(optimizedPrompt) => {
          setPrompt(optimizedPrompt);
          setOptimizeModalOpen(false);
        }}
        type="image"
      />
    </div>
  );
});

GPT4oGenerator.displayName = 'GPT4oGenerator';

