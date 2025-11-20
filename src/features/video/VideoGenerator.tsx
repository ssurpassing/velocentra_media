/**
 * 视频生成器组件
 * 支持文本转视频、图片转视频、参考视频生成
 * 参考 Veo 官方 Playground 设计
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { Loader2, Upload, X, Sparkles, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { http } from '@/infrastructure/http/client';

type GenerationType = 'text-to-video' | 'image-to-video' | 'reference-to-video';
type VideoModel = 'veo3_fast' | 'veo3';
type AspectRatio = '16:9' | '9:16' | 'Auto';

const GENERATION_TYPES = [
  {
    id: 'text-to-video' as GenerationType,
    label: 'Text to Video', // fallback
    icon: Video,
  },
  {
    id: 'image-to-video' as GenerationType,
    label: 'Image to Video', // fallback
    icon: ImageIcon,
  },
  {
    id: 'reference-to-video' as GenerationType,
    label: 'Reference to Video', // fallback
    icon: Sparkles,
  },
];

const MODELS = [
  {
    value: 'veo3_fast' as VideoModel,
    label: 'Veo 3.1 Fast', // fallback
    credits: 100,
  },
  {
    value: 'veo3' as VideoModel,
    label: 'Veo 3.1 Quality', // fallback
    credits: 300,
  },
];

const ASPECT_RATIOS = [
  { value: 'Auto' as AspectRatio, label: 'Auto' },
  { value: '16:9' as AspectRatio, label: '16:9' },
  { value: '9:16' as AspectRatio, label: '9:16' },
];

export function VideoGenerator() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations();

  // 状态
  const [generationType, setGenerationType] = useState<GenerationType>('text-to-video');
  const [selectedModel, setSelectedModel] = useState<VideoModel>('veo3_fast');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [seeds, setSeeds] = useState<number | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // 图片相关
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsImages = generationType !== 'text-to-video';
  const maxImages = generationType === 'image-to-video' ? 2 : 3;
  const selectedModelInfo = MODELS.find((m) => m.value === selectedModel);

  // 处理图片上传
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 检查数量限制
    if (imageFiles.length + files.length > maxImages) {
      setError(t('generators.upload.maxImages', { max: maxImages }));
      return;
    }

    // 检查文件大小（10MB）
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(t('errors.api.FILE_TOO_LARGE'));
        return;
      }
    }

    // 添加文件和预览
    setImageFiles([...imageFiles, ...files]);
    
    // 生成预览
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setError('');
    e.target.value = ''; // 重置 input
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

    // 验证参数
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

      // 上传图片（如果需要）
      let imageUrls: string[] = [];
      if (needsImages && imageFiles.length > 0) {
        setUploadingImages(true);
        
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await http.post<{ success: boolean; data?: { url: string }; error?: string }>('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (!uploadResponse.success) {
            throw new Error(uploadResponse.error || 'Upload failed');
          }

          imageUrls.push(uploadResponse.data!.url);
        }
        
        setUploadingImages(false);
      }

      // 调用视频生成 API
      const generateResponse = await http.post<{ success: boolean; data?: { taskId: string }; error?: string }>('/generate-video', {
        generationType,
        prompt: prompt.trim(),
        model: selectedModel,
        aspectRatio,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        seeds,
        enableTranslation: true,
      });

      if (!generateResponse.success) {
        throw new Error(generateResponse.error || 'Failed to generate video');
      }

      const taskId = generateResponse.data!.taskId;

      // 触发事件通知（可用于刷新任务列表）
      window.dispatchEvent(
        new CustomEvent('videoGenerating', {
          detail: {
            taskId,
            generationType,
            model: selectedModel,
          },
        })
      );

      // 跳转到任务页面
      router.push(`/tasks/${taskId}`);
    } catch (err: any) {
      console.error('Video generation error:', err);
      setError(err.message || t('generators.common.generationFailed'));
    } finally {
      setGenerating(false);
      setUploadingImages(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：控制面板 */}
        <div className="space-y-6">
          {/* 生成类型 */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t('generators.video.generationType')}
            </label>
            <div className="flex gap-2">
              {GENERATION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setGenerationType(type.id);
                      setImageFiles([]);
                      setImagePreviews([]);
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      generationType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">
                      {type.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t('generators.common.model')}
            </label>
            <div className="flex gap-2">
              {MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => setSelectedModel(model.value)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedModel === model.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {model.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 图片上传（仅非文本转视频） */}
          {needsImages && (
            <div>
              <label className="block text-sm font-medium mb-3">
                {t('generators.common.images')} *
                <span className="text-xs text-gray-500 ml-2">
                  ({imageFiles.length}/{maxImages})
                </span>
              </label>

              {/* 已上传的图片 */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && generationType === 'image-to-video' && (
                        <div className="absolute bottom-1 left-1 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          {t('generators.video.startFrame')}
                        </div>
                      )}
                      {index === 1 && generationType === 'image-to-video' && (
                        <div className="absolute bottom-1 left-1 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          {t('generators.video.endFrame')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 上传按钮 */}
              {imageFiles.length < maxImages && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {t('generators.upload.clickToUpload')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('generators.upload.supportedFormats')}
                    </p>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 提示词 */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t('generators.common.prompt')} *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('generators.video.promptPlaceholder')}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={generating}
            />
            <p className="text-xs text-gray-500 mt-2">
              {t('generators.video.promptHint')}
            </p>
          </div>

          {/* 宽高比 */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t('generators.common.aspectRatio')}
            </label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`flex-1 px-4 py-2.5 rounded-lg border transition-all ${
                    aspectRatio === ratio.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div className="text-sm font-medium">{ratio.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Seed（可选） */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t('generators.common.seed')} ({t('generators.common.optional')})
            </label>
            <input
              type="number"
              value={seeds || ''}
              onChange={(e) => setSeeds(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder={t('generators.common.seedPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={generating}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={generating || uploadingImages || !prompt.trim()}
            loading={generating || uploadingImages}
            className="w-full"
            size="lg"
          >
            {uploadingImages ? (
              <>
                <Upload className="h-5 w-5 mr-2" />
                {t('generators.upload.uploading')}
              </>
            ) : generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t('generators.common.generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                {selectedModelInfo?.credits} | {t('generators.video.generateButton')}
              </>
            )}
          </Button>

          {/* 提示信息 */}
          <p className="text-xs text-gray-500 text-center">
            {t('generators.video.generationTimeHint')}
          </p>
        </div>

        {/* 右侧：预览区域 */}
        <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Video className="h-20 w-20 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {t('generators.video.videoPreview')}
            </p>
            <p className="text-sm">
              {t('generators.video.videoPreviewHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

