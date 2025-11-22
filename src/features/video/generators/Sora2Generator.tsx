/**
 * Sora 2 视频生成器组件
 * 支持所有 Sora 2 模型
 */

'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Video, Image as ImageIcon, Crown, Film, Eraser, Wand2 } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { http } from '@/infrastructure/http/client';
import { Button } from '@/shared/components/ui/Button';
import { Sora2Model } from '@/infrastructure/services/ai-clients/sora2/types';
import { calculateVideoCredits } from '@/shared/config/video-models';
import { PromptOptimizeModal } from '@/shared/components/modals/PromptOptimizeModal';
import { UpgradeModal } from '@/shared/components/modals/UpgradeModal';
import {
  BaseVideoGenerator,
  PromptInput,
  AspectRatioSelector,
  DurationSelector,
  ToggleSwitch,
} from './BaseVideoGenerator';
import { ImageUploadSection } from './ImageUploadSection';

type Sora2ModelType = 'basic' | 'pro';
type Sora2Mode = 'text' | 'image' | 'storyboard';
type Sora2Quality = 'standard' | 'high';

const MODEL_TYPES = [
  {
    id: 'basic' as Sora2ModelType,
    translationKey: 'aiVideo.generator.sora2Basic',
    icon: Video,
    color: '#9333EA',
  },
  {
    id: 'pro' as Sora2ModelType,
    translationKey: 'aiVideo.generator.sora2Pro',
    icon: Crown,
    color: '#F59E0B',
  },
];

const MODES = {
  basic: [
    { id: 'text' as Sora2Mode, translationKey: 'generators.video.textToVideo', icon: Video },
    { id: 'image' as Sora2Mode, translationKey: 'generators.video.imageToVideo', icon: ImageIcon },
  ],
  pro: [
    { id: 'text' as Sora2Mode, translationKey: 'generators.video.textToVideo', icon: Video },
    { id: 'image' as Sora2Mode, translationKey: 'generators.video.imageToVideo', icon: ImageIcon },
    { id: 'storyboard' as Sora2Mode, translationKey: 'aiVideo.generator.storyboard', icon: Film },
  ],
};

const ASPECT_RATIOS = [
  { value: 'Auto', label: 'Auto' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
];

export interface Sora2GeneratorHandle {
  fillFromData: (data: any) => void;
}

// v4.1: 重试上下文类型
type RetryContext = {
  taskId: string;
  status: 'completed' | 'failed';
  mediaType: 'image' | 'video';
} | null;

interface Sora2GeneratorProps {
  locale?: string;
  retryContext?: RetryContext;
  onClearRetry?: () => void;
}

export const Sora2Generator = forwardRef<Sora2GeneratorHandle, Sora2GeneratorProps>(
  ({ locale = 'en', retryContext, onClearRetry }, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const t = useTranslations();

  // 模型类型和模式
  const [modelType, setModelType] = useState<Sora2ModelType>('basic');
  const [mode, setMode] = useState<Sora2Mode>('text');
  const [quality, setQuality] = useState<Sora2Quality>('standard');

  // 参数
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [nFrames, setNFrames] = useState('10');
  const [removeWatermark, setRemoveWatermark] = useState(false);

  // 图片
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Storyboard 场景列表
  type Scene = {
    id: string;
    prompt: string;
    duration: number;
  };
  const [scenes, setScenes] = useState<Scene[]>([
    { id: '1', prompt: '', duration: 5 }
  ]);

  // 状态
  const [generating, setGenerating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // 根据模型类型和模式确定完整模型名称
  const getModelName = (): Sora2Model => {
    const prefix = modelType === 'pro' ? 'sora-2-pro' : 'sora-2';
    const suffix = mode === 'text' ? 'text-to-video' 
                 : mode === 'image' ? 'image-to-video'
                 : 'storyboard';
    
    return `${prefix}-${suffix}` as Sora2Model;
  };

  // 计算积分
  const model = getModelName();
  const duration = nFrames === '10' ? '10s' : nFrames === '15' ? '15s' : '25s';
  const credits = calculateVideoCredits(model, duration, quality);

  // 是否需要图片
  const needsImages = mode === 'image' || mode === 'storyboard';
  const maxImages = mode === 'storyboard' ? 5 : 2;

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    fillFromData: (data: any) => {
      // 设置模型类型
      if (data.aiModel && data.aiModel.includes('pro')) {
        setModelType('pro');
      } else {
        setModelType('basic');
      }
      
      // 设置模式
      if (data.aiModel) {
        if (data.aiModel.includes('storyboard')) {
          setMode('storyboard');
        } else if (data.inputImageUrls && data.inputImageUrls.length > 0) {
          setMode('image');
        } else {
          setMode('text');
        }
      }
      
      // 设置提示词 - 支持多种数据结构，按优先级尝试
      const promptValue = data.prompt || data.optimizedPrompt || data.originalPrompt || '';
      
      if (promptValue && promptValue.trim()) {
        setPrompt(promptValue.trim());
      }
      
      // 设置宽高比
      let ratioValue = 'Auto';
      if (data.aspectRatio) {
        ratioValue = data.aspectRatio;
      } else if (data.generationParams?.aspectRatio) {
        const ratio = data.generationParams.aspectRatio.toLowerCase();
        if (ratio.includes('portrait') || ratio === '9:16') {
          ratioValue = '9:16';
        } else if (ratio === '16:9' || ratio.includes('landscape')) {
          ratioValue = '16:9';
        } else {
          ratioValue = 'Auto';
        }
      }
      setAspectRatio(ratioValue);
      
      // 设置时长
      if (data.generationParams?.duration || data.generationParams?.n_frames) {
        const frames = data.generationParams.n_frames || data.generationParams.duration;
        const framesStr = String(frames);
        setNFrames(framesStr);
      }
      
      // 设置质量
      if (data.generationParams?.quality) {
        setQuality(data.generationParams.quality);
      }
    },
  }));

  // 处理图片添加
  const handleAddImages = (files: File[]) => {
    const remainingSlots = maxImages - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    setImageFiles(prev => [...prev, ...filesToAdd]);

    // 生成预览
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

  // Storyboard 场景管理
  const handleAddScene = () => {
    const newId = String(Date.now());
    setScenes(prev => [...prev, { id: newId, prompt: '', duration: 5 }]);
  };

  const handleRemoveScene = (id: string) => {
    if (scenes.length <= 1) return; // 至少保留一个场景
    setScenes(prev => prev.filter(scene => scene.id !== id));
  };

  const handleUpdateScene = (id: string, field: 'prompt' | 'duration', value: string | number) => {
    setScenes(prev =>
      prev.map(scene =>
        scene.id === id ? { ...scene, [field]: value } : scene
      )
    );
  };

  // 计算总时长
  const getTotalDuration = () => {
    return scenes.reduce((sum, scene) => sum + scene.duration, 0);
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

    // 验证
    if (mode === 'storyboard') {
      // Storyboard 模式：验证场景
      const hasEmptyScene = scenes.some(scene => !scene.prompt.trim());
      if (hasEmptyScene) {
        setError(t('generators.common.pleaseFillAllScenes'));
        return;
      }
      
      const totalDuration = getTotalDuration();
      if (totalDuration > parseFloat(nFrames)) {
        setError(`${t('generators.common.totalSceneDuration')} (${totalDuration}s) ${t('generators.common.exceedsVideoDuration')} (${nFrames}s)`);
        return;
      }
    } else if (!prompt.trim()) {
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

      // 调用 Sora 2 API
      const generateResponse = await http.post('/generate-video-sora2', {
        model,
        prompt: mode === 'storyboard' ? scenes[0]?.prompt || '' : prompt.trim(),
        aspectRatio,
        nFrames,
        removeWatermark,
        ...retryFields,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        quality,
        // Storyboard 专用：传递场景列表
        ...(mode === 'storyboard' && {
          scenes: scenes.map(scene => ({
            prompt: scene.prompt.trim(),
            duration: scene.duration,
          })),
        }),
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

  const currentModes = MODES[modelType];

  return (
    <>
      <div className="space-y-5">
      {/* 模型类型选择 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Model
        </label>
        <div className="grid grid-cols-2 gap-3">
          {MODEL_TYPES.map((type) => {
            const isSelected = modelType === type.id;
            const isPro = type.id === 'pro';
            const hasProAccess = profile && (
              profile.membership_tier === 'subscription' || 
              profile.membership_tier === 'credits'
            );
            
            return (
              <button
                key={type.id}
                onClick={() => {
                  // 如果是 Pro 且用户没有权限，打开升级弹窗
                  if (isPro && !hasProAccess) {
                    setUpgradeModalOpen(true);
                    return;
                  }
                  
                  setModelType(type.id);
                  // 重置模式（如果当前模式在新类型中不可用）
                  const newModes = MODES[type.id];
                  if (!newModes.some(m => m.id === mode)) {
                    setMode(newModes[0].id);
                  }
                }}
                className={`relative px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-gray-900 dark:text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {t(type.translationKey)}
                {isPro && !hasProAccess && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 items-center justify-center">
                      <Crown className="h-3 w-3 text-white" />
                    </span>
                  </span>
                )}
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
        <div className={`grid ${currentModes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
          {currentModes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
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

      {/* Pro 质量选择 - 仅文本转视频和图片转视频支持 */}
      {modelType === 'pro' && mode !== 'storyboard' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t('generators.video.qualityLevel')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setQuality('standard')}
              className={`group relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                quality === 'standard'
                  ? 'border-2 border-blue-500 text-blue-700 dark:text-blue-400'
                  : 'bg-card border border-border text-foreground hover:border-blue-500/50'
              }`}
            >
              {t('generators.video.standard')}
            </button>
            <button
              onClick={() => setQuality('high')}
              className={`group relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                quality === 'high'
                  ? 'border-2 border-blue-500 text-blue-700 dark:text-blue-400'
                  : 'bg-card border border-border text-foreground hover:border-blue-500/50'
              }`}
            >
              {t('generators.video.highQuality')}
            </button>
          </div>
        </div>
      )}

      <BaseVideoGenerator
        generating={generating}
        error={error}
        uploadingImages={uploadingImages}
        onGenerate={handleGenerate}
        onError={setError}
        credits={credits}
        locale={locale}
        colorTheme="emerald"
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
            description={
              mode === 'storyboard'
                ? `Upload reference images for your storyboard (max ${maxImages})`
                : `Upload ${maxImages} images for video generation`
            }
            descriptionCn={
              mode === 'storyboard'
                ? `上传故事板的参考图片（最多 ${maxImages} 张）`
                : `上传 ${maxImages} 张图片用于视频生成`
            }
            locale={locale}
            disabled={generating || uploadingImages}
          />
        )}

        {/* Storyboard 场景列表 */}
        {mode === 'storyboard' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('generators.video.sceneList')}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                  （{t('generators.video.total')} {getTotalDuration()}{t('generators.video.seconds')}）
                </span>
              </label>
              <button
                onClick={handleAddScene}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg leading-none">+</span>
                {t('generators.video.addScene')}
              </button>
            </div>

            <div className="space-y-3">
              {scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  className="relative p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl"
                >
                  {/* 场景标题和删除按钮 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t('generators.video.scene')} {index + 1}
                    </span>
                    {scenes.length > 1 && (
                      <button
                        onClick={() => handleRemoveScene(scene.id)}
                        disabled={generating}
                        className="text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* 场景描述 */}
                  <textarea
                    value={scene.prompt}
                    onChange={(e) => handleUpdateScene(scene.id, 'prompt', e.target.value)}
                    placeholder={t('generators.video.describeScene')}
                    rows={3}
                    disabled={generating}
                    className="w-full px-3 py-2 mb-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all text-sm disabled:opacity-50"
                  />

                  {/* 场景时长 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t('generators.video.duration')}:
                    </label>
                    <input
                      type="number"
                      value={scene.duration}
                      onChange={(e) => handleUpdateScene(scene.id, 'duration', parseFloat(e.target.value) || 0)}
                      min="1"
                      max="25"
                      step="0.5"
                      disabled={generating}
                      className="w-20 px-2 py-1 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('generators.video.seconds')}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('generators.common.totalSceneDuration')} {nFrames}{t('generators.video.seconds')}
            </p>
          </div>
        )}

        {/* 提示词（非 Storyboard 模式） */}
        {mode !== 'storyboard' && (
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            locale={locale}
            placeholder='Describe the video you want to create...'
            placeholderCn='描述你想生成的视频内容...'
            rightElement={
              <button
                onClick={() => setOptimizeModalOpen(true)}
                disabled={!prompt.trim() || generating}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                  prompt.trim() && !generating
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <Wand2 className="h-3.5 w-3.5" />
                {t('generators.common.optimize')}
              </button>
            }
          />
        )}

        {/* 宽高比 */}
        <AspectRatioSelector
          value={aspectRatio}
          onChange={setAspectRatio}
          options={ASPECT_RATIOS}
          locale={locale}
        />

        {/* 时长 */}
        <DurationSelector
          value={nFrames}
          onChange={setNFrames}
          options={
            mode === 'storyboard'
              ? [
                  { value: '10', label: '10s' },
                  { value: '15', label: '15s' },
                  { value: '25', label: '25s' },
                ]
              : [
                  { value: '10', label: '10s' },
                  { value: '15', label: '15s' },
                ]
          }
          locale={locale}
        />

        {/* 移除水印选项 - 仅文本转视频和图片转视频支持 */}
        {(mode === 'text' || mode === 'image') && (
          <ToggleSwitch
            checked={removeWatermark}
            onChange={setRemoveWatermark}
            label="Remove Watermark"
            labelCn="移除水印"
            description="Remove watermark from generated video (recommended)"
            descriptionCn="从生成的视频中移除水印（推荐）"
            locale={locale}
          />
        )}
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

      {/* 升级弹窗 */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        feature="Sora 2 Pro"
      />
    </>
  );
});

Sora2Generator.displayName = 'Sora2Generator';

