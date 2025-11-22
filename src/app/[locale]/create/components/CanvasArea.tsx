'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Image,
  Video,
  Download,
  Share2,
  Trash2,
  Play,
  RefreshCw,
  Copy
} from 'lucide-react';
import { http } from '@/infrastructure/http/client';
import { Button } from '@/shared/components/ui/Button';
import { useRouter } from '@/navigation';
import { useToast } from '@/shared/components/ui/use-toast';
import { createBrowserSupabaseClient } from '@/infrastructure/database/client';

interface Task {
  id: string;
  media_type: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_model: string;
  original_prompt: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  aspect_ratio?: string;
  n_frames?: string;
  media_files?: Array<{
    url: string;
    media_type: 'image' | 'video';
    thumbnail_url?: string;
  }>;
  generated_photos?: string[]; // 向后兼容旧数据结构
}

interface CanvasAreaProps {
  creativeType: 'image' | 'video';
  locale: string;
  onRetryFromTask?: (taskId: string, status: Task['status'], mediaType: Task['media_type']) => void;
}

// 模型显示配置映射
const MODEL_DISPLAY_CONFIG: Record<string, { name: string; color: string; bgClass: string; textClass: string; borderClass: string }> = {
  'kie-nano-banana-edit': {
    name: 'Nano Banana',
    color: 'amber',
    bgClass: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  'kie-nano-banana': {
    name: 'Nano Banana',
    color: 'amber',
    bgClass: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  'kie-gpt4o-image': {
    name: 'GPT-4o Image',
    color: 'emerald',
    bgClass: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/20',
  },
  'google-veo-3.1': {
    name: 'Veo 3.1',
    color: 'amber',
    bgClass: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  'veo-veo3_fast': {
    name: 'Veo 3.1',
    color: 'amber',
    bgClass: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  'veo-veo3': {
    name: 'Veo 3.1',
    color: 'amber',
    bgClass: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  'sora-2-text-to-video': {
    name: 'Sora 2',
    color: 'blue',
    bgClass: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/20',
  },
  'sora-2-image-to-video': {
    name: 'Sora 2',
    color: 'blue',
    bgClass: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/20',
  },
};

// 获取模型显示信息
function getModelDisplayInfo(aiModel: string) {
  return MODEL_DISPLAY_CONFIG[aiModel] || {
    name: aiModel,
    color: 'gray',
    bgClass: 'bg-gradient-to-r from-gray-500/10 to-gray-600/10',
    textClass: 'text-gray-600 dark:text-gray-400',
    borderClass: 'border-gray-500/20',
  };
}

export function CanvasArea({ creativeType, locale, onRetryFromTask }: CanvasAreaProps) {
  const t = useTranslations('createStudio');
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取任务列表（仅首次进入或类型/语言变化时查询一次）
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await http.get('/tasks', {
          params: {
            mediaType: creativeType,
            page: 1,
            limit: 50,
          },
        });
        setTasks(response.data.tasks || []);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [creativeType, locale]);

  // 监听图片生成事件
  useEffect(() => {
    const handleImageGenerating = () => {
      // 有新任务时，立即刷新列表
      const fetchTasks = async () => {
        try {
          const response = await http.get('/tasks', {
            params: {
              mediaType: creativeType,
              page: 1,
              limit: 50,
            },
          });
          setTasks(response.data.tasks || []);
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
        }
      };
      fetchTasks();
    };

    const handleVideoGenerating = () => {
      // 有新任务时，立即刷新列表
      const fetchTasks = async () => {
        try {
          const response = await http.get('/tasks', {
            params: {
              mediaType: creativeType,
              page: 1,
              limit: 50,
            },
          });
          setTasks(response.data.tasks || []);
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
        }
      };
      fetchTasks();
    };

    window.addEventListener('imageGenerating', handleImageGenerating);
    window.addEventListener('videoGenerating', handleVideoGenerating);
    
    return () => {
      window.removeEventListener('imageGenerating', handleImageGenerating);
      window.removeEventListener('videoGenerating', handleVideoGenerating);
    };
  }, [creativeType]);

  // 筛选任务：正在执行的任务和历史任务
  const currentTasks = tasks.filter(t => t.status === 'pending' || t.status === 'processing');
  const historyTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');

  // 使用轮询监听任务状态变化（Realtime 有问题时的备用方案）
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isActive = true;
    let lastTasksJson = '';
    let currentTasks: Task[] = [];

    const fetchTasks = async () => {
      if (!isActive) return;
      
      try {
        const response = await http.get('/tasks', {
          params: {
            mediaType: creativeType,
            page: 1,
            limit: 50,
            _t: Date.now(),
          },
        });
        
        const newTasks = response.data.tasks || [];
        const newTasksJson = JSON.stringify(newTasks);
        
        // 只在真正有变化时更新和打印日志
        if (newTasksJson !== lastTasksJson) {
          lastTasksJson = newTasksJson;
          currentTasks = newTasks;
          setTasks(newTasks);
          
          // 只在有实际变化时打印日志
          const activeTasks = newTasks.filter((t: Task) => t.status === 'pending' || t.status === 'processing');
          const completedTasks = newTasks.filter((t: Task) => t.status === 'completed');
          console.log(`[Polling] ✅ Tasks updated - Active: ${activeTasks.length}, Completed: ${completedTasks.length}, Total: ${newTasks.length}`);
          
          // 根据活跃任务数量调整轮询间隔
          const hasActive = activeTasks.length > 0;
          const newInterval = hasActive ? 3000 : 10000;
          
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = setInterval(fetchTasks, newInterval);
          }
        }
      } catch (error) {
        console.error('[Polling] ❌ Failed to fetch tasks:', error);
      }
    };

    // 初始加载
    fetchTasks();

    // 固定间隔轮询（初始 5 秒）
    pollInterval = setInterval(fetchTasks, 5000);

    return () => {
      isActive = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [creativeType]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
      {/* 顶部标题栏 */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-1 rounded-full ${
              creativeType === 'image' 
                ? 'bg-gradient-to-b from-emerald-500 to-emerald-600' 
                : 'bg-gradient-to-b from-purple-500 to-purple-600'
            }`} />
            <h2 className="text-lg font-semibold text-foreground">
              {creativeType === 'image' ? t('aiImageGen') : t('aiVideoGen')}
            </h2>
          </div>
          
          {/* 类型指示器 */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            creativeType === 'image' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
          }`}>
          {creativeType === 'image' ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Video className="h-4 w-4" aria-hidden="true" />
          )}
            <span className="text-sm font-medium">
              {creativeType === 'image' ? t('aiImageGeneration') : t('aiVideoGeneration')}
            </span>
          </div>
        </div>
      </div>

      {/* 内容区域 - 单列布局 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className={`h-20 w-20 rounded-2xl ${
              creativeType === 'image' 
                ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20' 
                : 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20'
            } flex items-center justify-center mb-4`}>
              {creativeType === 'image' ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image className="h-10 w-10 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <Video className="h-10 w-10 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('noTasks')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {t('noTasksDesc')}
            </p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* 正在执行的任务 */}
            {currentTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-1.5 rounded-lg ${
                    creativeType === 'image' 
                      ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10' 
                      : 'bg-gradient-to-br from-purple-500/10 to-purple-600/10'
                  }`}>
                    <Clock className={`h-4 w-4 ${
                      creativeType === 'image' ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <h3 className="text-base font-semibold">
                    {t('inProgress')}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    creativeType === 'image' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}>
                    {currentTasks.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {currentTasks.map((task) => (
                    <TaskCard key={task.id} task={task} locale={locale} creativeType={creativeType} toast={toast} onRetryFromTask={onRetryFromTask} />
                  ))}
                </div>
              </div>
            )}

            {/* 历史任务 */}
            {historyTasks.length > 0 && (
              <div className={currentTasks.length > 0 ? 'mt-8' : ''}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold">
                    {t('history')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                    {historyTasks.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {historyTasks.map((task) => (
                    <TaskCard key={task.id} task={task} locale={locale} creativeType={creativeType} toast={toast} onRetryFromTask={onRetryFromTask} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 任务卡片组件 - 圆润的展示形式
function TaskCard({ 
  task, 
  locale, 
  creativeType,
  toast,
  onRetryFromTask 
}: { 
  task: Task; 
  locale: string; 
  creativeType: 'image' | 'video';
  toast: ReturnType<typeof useToast>['toast'];
  onRetryFromTask?: (taskId: string, status: Task['status'], mediaType: Task['media_type']) => void;
}) {
  const t = useTranslations('createStudio');
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const isProcessing = task.status === 'pending' || task.status === 'processing';
  const isFailed = task.status === 'failed';
  const isVideo = task.media_type === 'video';

  // v4.1: 重新生成功能 - 只负责填充表单，不直接发起请求
  const handleRetry = () => {
    if (onRetryFromTask) {
      onRetryFromTask(task.id, task.status, task.media_type);
    }
  };

  // 从 media_files 中提取图片/视频 URL
  const findMediaByType = (
    files: Task['media_files'],
    type: 'image' | 'video'
  ) => {
    return files?.find(
      (file) =>
        file.media_type === type ||
        file.media_type?.toLowerCase().startsWith(`${type}/`)
    );
  };

  const videoFile = findMediaByType(task.media_files, 'video');
  const imageFile = findMediaByType(task.media_files, 'image');
  
  // 提取 URL，支持新旧数据结构
  const videoUrl = isVideo 
    ? (videoFile?.url || task.generated_photos?.find((url) => url?.endsWith('.mp4')))
    : null;
  const imageUrl = !isVideo 
    ? (imageFile?.url || task.media_files?.[0]?.url || task.generated_photos?.[0])
    : null;
  const thumbnailUrl = videoFile?.thumbnail_url 
    || imageFile?.url 
    || task.generated_photos?.find((url) => !url?.endsWith('.mp4'));

  // 只在有问题时输出警告
  if (task.status === 'completed' && !videoUrl && !imageUrl) {
    console.error('Task completed but no media URL found:', task.id);
  }

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-border/50 hover:border-primary/30">
      {/* 预览图区域 - 更大更突出 */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
        {isProcessing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-purple-500/5 to-orange-500/5 backdrop-blur-sm">
            <div className={`relative mb-4 ${
              creativeType === 'image' ? 'text-emerald-600' : 'text-purple-600'
            }`}>
              {/* 外圈装饰 */}
              <div className="absolute inset-0 rounded-full border-4 border-current opacity-20 animate-ping" />
              <Loader2 className="h-16 w-16 animate-spin relative z-10" />
            </div>
            <span className={`text-sm font-semibold ${
              creativeType === 'image' ? 'text-emerald-600' : 'text-purple-600'
            }`}>
              {task.status === 'pending' ? t('queueing') : t('aiGenerating')}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
            {t('mayTakeSomeTime')}
          </span>
        </div>
      ) : imageUrl || videoUrl ? (
        <>
          {isVideo ? (
            <div className="relative w-full h-full bg-black">
              {videoUrl ? (
                <video
                  key={task.id}
                  src={videoUrl}
                  className="w-full h-full object-cover bg-black"
                  loop
                  muted
                  playsInline
                  preload="auto"
                  poster={thumbnailUrl && thumbnailUrl !== videoUrl ? thumbnailUrl : undefined}
                  onMouseEnter={(e) => {
                    const video = e.currentTarget;
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                      playPromise
                        .then(() => {
                          setPlaying(true);
                        })
                        .catch(() => {
                          // 视频播放失败，忽略
                        });
                    }
                  }}
                  onMouseLeave={(e) => {
                    const video = e.currentTarget;
                    video.pause();
                    video.currentTime = 0;
                    setPlaying(false);
                  }}
                  onError={() => {
                    // 视频加载失败，由UI处理
                  }}
                  style={{ display: 'block', pointerEvents: 'auto' }}
                />
              ) : thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl || ''}
              alt="Generated image"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
            
            {/* 状态徽章 */}
            {task.status === 'completed' && (
              <div className="absolute top-3 right-3 p-2 rounded-full bg-emerald-500/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            )}
            
            {/* 失败状态覆盖层 */}
            {task.status === 'failed' && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                <div className="p-3 rounded-full bg-red-500/90 backdrop-blur-sm shadow-lg mb-3">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <span className="text-sm font-semibold text-white mb-2">
                  {t('generationFailed')}
                </span>
                {task.error_message && (
                  <span className="text-xs text-white/90 text-center max-w-[90%] line-clamp-3">
                    {task.error_message}
                  </span>
                )}
              </div>
            )}

          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isVideo ? (
              <Video className="h-16 w-16 text-muted-foreground/50" aria-hidden="true" />
            ) : (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image className="h-16 w-16 text-muted-foreground/50" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {/* 信息区域 - 更紧凑优雅 */}
      <div className="p-4 space-y-3">
        {/* 提示词 */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold line-clamp-2 flex-1">
            {task.original_prompt || t('generationTask')}
          </h4>
        </div>
        
        {/* 元信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(() => {
              const modelInfo = getModelDisplayInfo(task.ai_model);
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${modelInfo.bgClass} ${modelInfo.textClass} border ${modelInfo.borderClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-${modelInfo.color}-500`} />
                  {modelInfo.name}
                </span>
              );
            })()}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(task.created_at).toLocaleString('zh-CN', { 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {/* 操作按钮 - 完成和失败任务都显示 */}
        {(task.status === 'completed' || task.status === 'failed') && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            {/* 下载按钮 - 失败任务或无URL时禁用 */}
            {task.status === 'completed' && (imageUrl || videoUrl) ? (
              <a
                href={videoUrl || imageUrl || ''}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                {t('download')}
              </a>
            ) : (
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                title={t('failedNoDownload')}
              >
                <Download className="h-3.5 w-3.5" />
                {t('download')}
              </button>
            )}
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(task.original_prompt || '');
                toast({
                  title: `✅ ${t('copied')}`,
                  description: t('promptCopied'),
                  variant: "success",
                });
              }}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
              title={t('copyPrompt')}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={handleRetry}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
              title={t('regenerate')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

