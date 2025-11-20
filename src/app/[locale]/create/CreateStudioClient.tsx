'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { 
  Image, 
  Video, 
  Sparkles, 
  Wand2,
  Layers,
  History,
  Zap
} from 'lucide-react';
import { LeftSidebar } from './components/LeftSidebar';
import { CreativePanel } from './components/CreativePanel';
import { CanvasArea } from './components/CanvasArea';
import { http } from '@/infrastructure/http/client';
import { useToast } from '@/shared/components/ui/use-toast';

type CreativeType = 'image' | 'video';

// v4.1: 重试上下文类型
type RetryContext = {
  taskId: string;
  status: 'completed' | 'failed';
  mediaType: 'image' | 'video';
} | null;

// 生成器引用类型
export interface GeneratorHandle {
  fillFromData: (data: any) => void;
}

// AI 模型配置类型
interface ModelConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  recommended?: boolean;
}

// AI 模型配置
export const AI_MODELS: {
  image: ModelConfig[];
  video: ModelConfig[];
} = {
  image: [
    {
      id: 'kie-nano-banana-edit',
      name: 'Nano Banana',
      description: 'Professional portrait & image editing',
      icon: '🍌',
      color: 'amber',
      features: ['High Quality', 'Fast', 'Portrait'],
      recommended: true,
    },
    {
      id: 'kie-gpt4o-image',
      name: 'GPT-4o Image',
      description: 'Creative image generation',
      icon: '☁️',
      color: 'emerald',
      features: ['Creative', 'Versatile', 'Smart'],
    },
  ],
  video: [
    {
      id: 'google-veo-3.1',
      name: 'Veo 3.1',
      description: 'Advanced video generation',
      icon: '🍌',
      color: 'amber',
      features: ['4K Quality', 'Long Duration', 'Realistic'],
      recommended: true,
    },
    {
      id: 'sora-2-text-to-video',
      name: 'Sora 2',
      description: 'Text to cinematic video',
      icon: '☁️',
      color: 'emerald',
      features: ['Cinematic', 'High Detail', 'Creative'],
    },
  ],
};

// 数据库模型 ID 到前端选择器模型 ID 的映射
const DB_MODEL_TO_SELECTOR_MODEL: Record<string, string> = {
  // 图片模型
  'kie-nano-banana-edit': 'kie-nano-banana-edit',
  'kie-nano-banana': 'kie-nano-banana-edit',
  'kie-gpt4o-image': 'kie-gpt4o-image',
  
  // 视频模型
  'google-veo-3.1': 'google-veo-3.1',
  'veo-veo3_fast': 'google-veo-3.1', // Veo 3.1 Fast 映射到 google-veo-3.1
  'veo-veo3': 'google-veo-3.1', // Veo 3.1 Quality 也映射到 google-veo-3.1
  'sora-2-text-to-video': 'sora-2-text-to-video',
  'sora-2-image-to-video': 'sora-2-text-to-video',
};

// 将数据库模型 ID 转换为前端选择器模型 ID
function mapDbModelToSelectorModel(dbModelId: string): string {
  return DB_MODEL_TO_SELECTOR_MODEL[dbModelId] || dbModelId;
}

export function CreateStudioClient() {
  const t = useTranslations('createStudio');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [creativeType, setCreativeType] = useState<CreativeType>('image');
  const [selectedModel, setSelectedModel] = useState<string>('kie-nano-banana-edit');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // v4.1: 重试上下文状态
  const [retryContext, setRetryContext] = useState<RetryContext>(null);
  const generatorRef = useRef<GeneratorHandle | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // URL 参数检测 - 自动切换类型
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'video' || typeParam === 'image') {
      setCreativeType(typeParam as CreativeType);
    }
  }, [searchParams]);

  // 登录检查
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // 切换类型时自动选择推荐模型
  useEffect(() => {
    const models = AI_MODELS[creativeType];
    const recommendedModel = models.find(m => m.recommended);
    if (recommendedModel) {
      setSelectedModel(recommendedModel.id);
    }
  }, [creativeType]);

  // v4.1: 处理从任务列表的"重新生成"请求
  const handleRetryFromTask = async (taskId: string, status: 'completed' | 'failed' | 'pending' | 'processing', mediaType: 'image' | 'video') => {
    try {
      // 1. 请求任务详情（先获取，因为需要知道模型）
      const res = await http.get(`/tasks/${taskId}/details`, {
        params: { locale },
      });
      
      if (!res.success || !res.data) {
        toast({
          title: '❌ 加载失败',
          description: '无法加载任务详情，请稍后再试',
          variant: 'destructive',
        });
        return;
      }

      const data = res.data;

      // 2. 构建填充数据（提前准备，确保所有字段都正确提取）
      const fillData = {
        prompt: data.prompts?.userInput || data.optimizedPrompt || data.originalPrompt || '',
        originalPrompt: data.originalPrompt || '',
        optimizedPrompt: data.optimizedPrompt || '',
        aspectRatio: data.generationParams?.aspectRatio || data.generation?.params?.aspectRatio || '16:9',
        inputImageUrls: data.inputImageUrls || data.generation?.inputImageUrls || [],
        generationParams: data.generationParams || data.generation?.params || {},
        aiModel: data.aiModel || '',
        numberOfImages: data.generationParams?.numberOfImages,
      };

      // 3. 根据任务的 aiModel 切换到对应的模型
      if (data.aiModel) {
        const selectorModelId = mapDbModelToSelectorModel(data.aiModel);
        setSelectedModel(selectorModelId);
      }

      // 4. 切换到对应类型
      if (mediaType !== creativeType) {
        setCreativeType(mediaType);
      }

      // 5. 记录重试上下文（提前设置，这样生成器初始化时就能获取到）
      setRetryContext({
        taskId,
        status: status === 'completed' || status === 'failed' ? status : 'completed',
        mediaType: data.mediaType || mediaType,
      });

      // 6. 展开左侧面板
      setLeftPanelOpen(true);

      // 7. 等待类型和模型切换完成后，多次尝试调用生成器的 fillFromData
      // 使用指数退避策略，确保 ref 已准备好
      const tryFillData = (attempt: number = 0, maxAttempts: number = 5) => {
        setTimeout(() => {
          if (generatorRef.current) {
            generatorRef.current.fillFromData(fillData);
          } else if (attempt < maxAttempts - 1) {
            tryFillData(attempt + 1, maxAttempts);
          } else {
            console.error('Failed to load task data after multiple attempts');
          }
        }, 100 * Math.pow(2, attempt)); // 100ms, 200ms, 400ms, 800ms, 1600ms
      };

      tryFillData();
    } catch (error: any) {
      console.error('Retry from task error:', error);
      toast({
        title: '❌ 加载失败',
        description: error.message || '加载任务详情失败',
        variant: 'destructive',
      });
    }
  };

  if (!mounted || authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-purple-500/5">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const currentModels = AI_MODELS[creativeType];
  const currentModel = currentModels.find(m => m.id === selectedModel);

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-background via-muted/10 to-background">
      {/* 最左侧：垂直图标菜单 */}
      <div className="w-16 bg-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col items-center py-4 gap-4">
        {/* Logo */}
        <div className="mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-8 h-px bg-border/50" />

        {/* 创作类型切换 */}
        <button
          onClick={() => setCreativeType('image')}
          className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            creativeType === 'image'
              ? 'bg-primary/10 border-2 border-primary'
              : 'bg-muted hover:bg-muted/80'
          }`}
          title={t('imageTab')}
          aria-label={t('imageTab')}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className={`h-6 w-6 ${
            creativeType === 'image' ? 'text-primary' : 'text-muted-foreground'
          }`} aria-hidden="true" />
          {creativeType === 'image' && (
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={() => setCreativeType('video')}
          className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            creativeType === 'video'
              ? 'bg-primary/10 border-2 border-primary'
              : 'bg-muted hover:bg-muted/80'
          }`}
          title={t('videoTab')}
        >
          <Video className={`h-6 w-6 ${
            creativeType === 'video' ? 'text-primary' : 'text-muted-foreground'
          }`} />
          {creativeType === 'video' && (
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full" />
          )}
        </button>

        {/* 分隔线 */}
        <div className="w-8 h-px bg-border/50 mt-auto" />

        {/* 历史记录（占位） */}
        <button
          onClick={() => router.push('/tasks')}
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 hover:shadow-md transition-all"
          title={t('myWorks')}
        >
          <History className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* 左侧面板：生成器参数 */}
      <LeftSidebar
        isOpen={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
      >
        <CreativePanel
          creativeType={creativeType}
          models={currentModels}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          currentModel={currentModel}
          locale={locale}
          retryContext={retryContext}
          onClearRetry={() => setRetryContext(null)}
          generatorRef={generatorRef}
        />
      </LeftSidebar>

      {/* 右侧画布：任务预览和历史 */}
      <CanvasArea
        creativeType={creativeType}
        locale={locale}
        onRetryFromTask={handleRetryFromTask}
      />
    </div>
  );
}
