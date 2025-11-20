/**
 * Veo 3.1 视频生成器组件
 * 支持 Veo 3.1 Fast 和 Quality
 */

'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Zap, Sparkles, Video, Image as ImageIcon, Wand2 } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { http } from '@/infrastructure/http/client';
import { Button } from '@/shared/components/ui/Button';
import { calculateVideoCredits } from '@/shared/config/video-models';
import { PromptOptimizeModal } from '@/shared/components/modals/PromptOptimizeModal';
import {
  BaseVideoGenerator,
  PromptInput,
  AspectRatioSelector,
} from './BaseVideoGenerator';
import { ImageUploadSection } from './ImageUploadSection';

type Veo3Mode = 'text-to-video' | 'image-to-video' | 'reference-to-video';
type Veo3Model = 'veo3_fast' | 'veo3';

const MODELS = [
  { id: 'veo3_fast' as Veo3Model, translationKey: 'models.video.veo3_fast.displayName', icon: Zap, credits: 100 },
  { id: 'veo3' as Veo3Model, translationKey: 'models.video.veo3.displayName', icon: Sparkles, credits: 300 },
];

const MODES = [
  { id: 'text-to-video' as Veo3Mode, translationKey: 'generators.video.textToVideo', icon: Video },
  { id: 'image-to-video' as Veo3Mode, translationKey: 'generators.video.imageToVideo', icon: ImageIcon },
  { id: 'reference-to-video' as Veo3Mode, translationKey: 'generators.video.reference', icon: Sparkles },
];

const ASPECT_RATIOS = [
  { value: 'Auto', label: 'Auto' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
];

export interface Veo3GeneratorHandle {
  fillFromData: (data: any) => void;
}

// v4.1: 重试上下文类型
type RetryContext = {
  taskId: string;
  status: 'completed' | 'failed';
  mediaType: 'image' | 'video';
} | null;

interface Veo3GeneratorProps {
  locale?: string;
  retryContext?: RetryContext;
  onClearRetry?: () => void;
}

export const Veo3Generator = forwardRef<Veo3GeneratorHandle, Veo3GeneratorProps>(
  ({ locale = 'en', retryContext, onClearRetry }, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations();

  // 模型和模式
  const [model, setModel] = useState<Veo3Model>('veo3_fast');
  const [mode, setMode] = useState<Veo3Mode>('text-to-video');

  // 参数
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // 图片
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // 状态
  const [generating, setGenerating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);

  const credits = calculateVideoCredits(model, '10s');
  const needsImages = mode !== 'text-to-video';
  const maxImages = mode === 'image-to-video' ? 2 : 3;

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    fillFromData: (data: any) => {
      // 设置模型
      if (data.aiModel) {
        if (data.aiModel.includes('veo3_fast')) {
          setModel('veo3_fast');
        } else if (data.aiModel.includes('veo3')) {
          setModel('veo3');
        }
      }
      
      // 设置模式
      if (data.inputImageUrls && data.inputImageUrls.length > 0) {
        if (data.inputImageUrls.length <= 2) {
          setMode('image-to-video');
        } else {
          setMode('reference-to-video');
        }
      } else {
        setMode('text-to-video');
      }
      
      // 设置提示词 - 支持多种数据结构，按优先级尝试
      const promptValue = data.prompt || data.optimizedPrompt || data.originalPrompt || '';
      
      if (promptValue && promptValue.trim()) {
        setPrompt(promptValue.trim());
      }
      
      // 设置宽高比
      const ratioValue = data.aspectRatio 
        || data.generationParams?.aspectRatio 
        || data.generationParams?.aspect_ratio
        || '16:9';
      setAspectRatio(ratioValue);
    },
  }));

  // 处理图片添加
  const handleAddImages = (files: File[]) => {
    const remainingSlots = maxImages - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    setImageFiles(prev => [...prev, ...filesToAdd]);

    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理图片移除
  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 生成视频
  const handleGenerate = async () => {
    if (!user) {
      setError(t('generators.common.pleaseLogin'));
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
      return;
    }

    if (!prompt.trim()) {
      setError(t('generators.common.pleaseEnterPrompt'));
      return;
    }

    if (needsImages && imageFiles.length === 0) {
      setError(t('generators.common.pleaseUploadImages'));
      return;
    }

    try {
      setError('');
      setGenerating(true);

      // 上传图片
      let imageUrls: string[] = [];
      if (needsImages && imageFiles.length > 0) {
        setUploadingImages(true);

        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await http.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (!uploadResponse.success) {
            throw new Error(uploadResponse.error || 'Upload failed');
          }

          imageUrls.push(uploadResponse.data.url);
        }

        setUploadingImages(false);
      }

      // v4.1: 构建重试相关字段
      const retryFields = retryContext && retryContext.mediaType === 'video'
        ? {
            parentTaskId: retryContext.taskId,
            retryFromTaskId: retryContext.status === 'failed' ? retryContext.taskId : undefined,
          }
        : {};

      // 调用 Veo 3 API
      const generateResponse = await http.post('/generate-video', {
        generationType: mode,
        prompt: prompt.trim(),
        model,
        aspectRatio,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        enableTranslation: true,
        ...retryFields,
      });

      if (!generateResponse.success) {
        throw new Error(generateResponse.error || 'Failed to generate video');
      }

      const taskId = generateResponse.data.taskId;

      // v4.1: 清空重试上下文
      onClearRetry?.();

      // 触发事件，在当前页面显示进度（不跳转）
      window.dispatchEvent(
        new CustomEvent('videoGenerating', {
          detail: {
            taskId,
            generationType: mode,
            model,
          },
        })
      );

      // 不跳转，留在当前页面
      setGenerating(false);
      setUploadingImages(false);

    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
      setGenerating(false);
      setUploadingImages(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
      {/* 模型选择 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Model
        </label>
        <div className="grid grid-cols-2 gap-3">
          {MODELS.map((m) => {
            const isSelected = model === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-gray-900 dark:text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {t(m.translationKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 模式选择 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t('generators.video.generationMode')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-gray-900 dark:text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate text-xs">
                  {t(m.translationKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <BaseVideoGenerator
        generating={generating}
        error={error}
        uploadingImages={uploadingImages}
        onGenerate={handleGenerate}
        onError={setError}
        credits={credits}
        locale={locale}
        colorTheme="amber"
      >
        {/* 图片上传 */}
        {needsImages && (
          <ImageUploadSection
            images={imageFiles}
            imagePreviews={imagePreviews}
            maxImages={maxImages}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            label="Upload Images"
            labelCn="上传图片"
            description={`Upload ${maxImages} images for video generation`}
            descriptionCn={`上传 ${maxImages} 张图片用于视频生成`}
            locale={locale}
            disabled={generating || uploadingImages}
          />
        )}

        {/* 提示词 */}
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          locale={locale}
          rightElement={
            <button
              onClick={() => setOptimizeModalOpen(true)}
              disabled={!prompt.trim() || generating}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                prompt.trim() && !generating
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-amber-500/25'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Wand2 className="h-3.5 w-3.5" />
              {t('generators.common.optimize')}
            </button>
          }
        />

        {/* 宽高比 */}
        <AspectRatioSelector
          value={aspectRatio}
          onChange={setAspectRatio}
          options={ASPECT_RATIOS}
          locale={locale}
        />
      </BaseVideoGenerator>
      </div>

      {/* 优化弹窗 */}
      <PromptOptimizeModal
        open={optimizeModalOpen}
        onOpenChange={setOptimizeModalOpen}
        originalPrompt={prompt}
        imagePreviews={imagePreviews}
        onFillBack={(optimizedPrompt) => {
          setPrompt(optimizedPrompt);
          setOptimizeModalOpen(false);
        }}
        type="video"
      />
    </>
  );
});

Veo3Generator.displayName = 'Veo3Generator';

