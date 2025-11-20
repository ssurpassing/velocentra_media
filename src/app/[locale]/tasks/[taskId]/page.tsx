'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { http } from '@/infrastructure/http/client';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { ArrowLeft, Clock, Sparkles, Image as ImageIcon, Copy, Check } from 'lucide-react';

interface MediaFile {
  id: string;
  url: string;
  thumbnail_url?: string;
  media_type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  result_index: number;
}

interface TaskDetails {
  id: string;
  status: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  completedAt: string | null;
  prompts?: {
    userInput?: string | null;
    original?: string | null;
    optimized?: string | null;
    promptOptimized?: boolean;
    llmOptimizationUsed?: boolean;
    negative?: string | null;
  };
  generation?: {
    aiModel?: string;
    params?: Record<string, any>;
    inputImageUrls?: string[];
    style?: string;
    originalPhotoUrl?: string;
  };
  performance?: {
    promptOptimizationTimeMs?: number | null;
    llmOptimizationTimeMs?: number | null;
    generationTimeMs?: number | null;
    totalTimeMs?: number | null;
  };
  cost?: {
    credits?: number;
  };
  workflow?: {
    name?: string;
    icon?: string;
    formData?: any;
    steps?: any[];
  };
  error: string | null;
  mediaFiles: MediaFile[];
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadTaskDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.taskId]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await http.get(`/tasks/${params.taskId}/details`);
      
      if (response.success) {
        setTask(response.data);
      } else {
        setError(response.error || 'Failed to load task details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载任务详情...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <p className="text-red-500 mb-4">{error || '任务未找到'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold mb-2">任务详情</h1>
          <p className="text-muted-foreground">查看完整的生成流程和提示词信息</p>
        </div>

        {/* 基本信息 */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            基本信息
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">任务ID</p>
              <p className="font-mono text-sm">{task.id.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">状态</p>
              <p className={`font-semibold ${
                task.status === 'completed' ? 'text-green-500' :
                task.status === 'failed' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {task.status === 'completed' ? '✅ 已完成' :
                 task.status === 'failed' ? '❌ 失败' :
                 '⏳ 处理中'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">创建时间</p>
              <p className="text-sm">{formatDate(task.createdAt)}</p>
            </div>
          </div>
        </Card>

        {/* 工作流信息 */}
        {task.workflow && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">{task.workflow.icon}</span>
              工作流配置
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">工作流类型</p>
                <p className="font-semibold">{task.workflow.name ? t(task.workflow.name) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">表单数据</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(task.workflow.formData, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        )}

        {/* 提示词详情 */}
        {task.prompts && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              提示词详情
            </h2>
            
            <div className="space-y-4">
              {/* 用户输入 */}
              {task.prompts?.userInput && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-muted-foreground">用户输入的提示词</p>
                  <button
                    onClick={() => task.prompts?.userInput && copyToClipboard(task.prompts.userInput, 'userInput')}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    {copiedField === 'userInput' ? (
                      <><Check className="h-4 w-4" /> 已复制</>
                    ) : (
                      <><Copy className="h-4 w-4" /> 复制</>
                    )}
                  </button>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{task.prompts.userInput}</p>
                </div>
              </div>
            )}

              {/* 优化前的提示词 */}
              {task.prompts?.original && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {task.prompts?.llmOptimizationUsed ? '优化前的提示词' : '最终提示词'}
                    </p>
                    <button
                      onClick={() => task.prompts?.original && copyToClipboard(task.prompts.original, 'original')}
                      className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      {copiedField === 'original' ? (
                        <><Check className="h-4 w-4" /> 已复制</>
                      ) : (
                        <><Copy className="h-4 w-4" /> 复制</>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{task.prompts.original}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      长度: {task.prompts.original.length} 字符
                    </p>
                  </div>
                </div>
              )}

              {/* AI优化后的提示词 */}
              {task.prompts?.optimized && task.prompts?.llmOptimizationUsed && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI 优化后的提示词 ({task.generation?.aiModel === 'deepseek-chat' ? 'DeepSeek' : 'GPT-4o-mini'})
                    </p>
                    <button
                      onClick={() => task.prompts?.optimized && copyToClipboard(task.prompts.optimized, 'optimized')}
                      className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      {copiedField === 'optimized' ? (
                        <><Check className="h-4 w-4" /> 已复制</>
                      ) : (
                        <><Copy className="h-4 w-4" /> 复制</>
                      )}
                    </button>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{task.prompts.optimized}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      长度: {task.prompts.optimized.length} 字符
                      {task.prompts?.original && (
                        <span className="ml-2">
                          (增加了 {task.prompts.optimized.length - task.prompts.original.length} 字符)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* 负面提示词 */}
              {task.prompts?.negative && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-muted-foreground">负面提示词 (Negative Prompt)</p>
                    <button
                      onClick={() => task.prompts?.negative && copyToClipboard(task.prompts.negative, 'negative')}
                      className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      {copiedField === 'negative' ? (
                        <><Check className="h-4 w-4" /> 已复制</>
                      ) : (
                        <><Copy className="h-4 w-4" /> 复制</>
                      )}
                    </button>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{task.prompts.negative}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 生成参数 */}
        {task.generation && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">生成参数</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">AI 模型</p>
                <p className="font-semibold">{task.generation?.aiModel}</p>
              </div>
              {task.generation?.style && (
                <div>
                  <p className="text-sm text-muted-foreground">风格</p>
                  <p className="font-semibold">{task.generation.style}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">宽高比</p>
                <p className="font-semibold">{task.generation?.params?.aspectRatio || 'auto'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* 性能指标 */}
        {task.performance && (task.performance.llmOptimizationTimeMs !== null || task.performance.generationTimeMs !== null || task.performance.totalTimeMs !== null) && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              性能指标
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {task.performance?.llmOptimizationTimeMs !== null && task.performance?.llmOptimizationTimeMs !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">LLM 优化耗时</p>
                  <p className="font-semibold text-green-600">{formatTime(task.performance.llmOptimizationTimeMs!)}</p>
                </div>
              )}
              {task.performance?.generationTimeMs !== null && task.performance?.generationTimeMs !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {task.generation?.aiModel?.includes('veo') ? '视频' : '图片'}生成耗时
                  </p>
                  <p className="font-semibold text-blue-600">{formatTime(task.performance.generationTimeMs!)}</p>
                </div>
              )}
              {task.performance?.totalTimeMs !== null && task.performance?.totalTimeMs !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">总耗时</p>
                  <p className="font-semibold">{formatTime(task.performance.totalTimeMs!)}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 生成结果 */}
        {task.mediaFiles && task.mediaFiles.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">生成结果</h2>
            {task.mediaType === 'video' ? (
              // 视频任务
              <div>
                <p className="text-sm text-muted-foreground mb-2">生成的视频</p>
                {task.mediaFiles.filter(f => f.media_type === 'video').map((videoFile, index) => (
                  <video 
                    key={videoFile.id}
                    src={videoFile.url} 
                    controls
                    className="w-full rounded-lg border border-border mb-4"
                    style={{ maxHeight: '600px' }}
                  >
                    您的浏览器不支持视频播放
                  </video>
                ))}
                <div className="mt-4">
                  <Button asChild>
                    <a 
                      href={task.mediaFiles[0]?.url} 
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      下载视频
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              // 图片任务
              <div>
                {task.generation?.originalPhotoUrl ? (
                  // 有原始图片，显示原图和生成结果
                  <div className="space-y-6">
                    {/* 原始图片 */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">原始图片</p>
                      <div className="flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={task.generation.originalPhotoUrl} 
                          alt="Original" 
                          className="max-w-full h-auto rounded-lg border border-border object-contain"
                          style={{ maxHeight: '500px' }}
                        />
                      </div>
                    </div>
                    
                    {/* 生成的图片 */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        生成的图片 {task.mediaFiles.length > 1 && `(${task.mediaFiles.length} 张)`}
                      </p>
                      {task.mediaFiles.length === 1 ? (
                        // 单张结果
                        <div className="flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={task.mediaFiles[0].url} 
                            alt="Generated" 
                            className="max-w-full h-auto rounded-lg border border-border object-contain"
                            style={{ maxHeight: '500px' }}
                          />
                        </div>
                      ) : (
                        // 多张结果：网格展示
                        <div className={`grid gap-4 ${
                          task.mediaFiles.length === 2 
                            ? 'grid-cols-1 md:grid-cols-2' 
                            : 'grid-cols-2 md:grid-cols-2'
                        }`}>
                          {task.mediaFiles.map((mediaFile, index) => (
                            <div key={mediaFile.id} className="space-y-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={mediaFile.url} 
                                alt={`Generated ${index + 1}`} 
                                className="w-full rounded-lg border border-border object-contain"
                                style={{ maxHeight: '400px' }}
                              />
                              <Button asChild className="w-full">
                                <a 
                                  href={mediaFile.url} 
                                  download={`generated-${index + 1}.png`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  下载图片 {index + 1}
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // 只有生成的图片
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      生成的图片 {task.mediaFiles.length > 1 && `(${task.mediaFiles.length} 张)`}
                    </p>
                    {task.mediaFiles.length === 1 ? (
                      // 单张图片：居中展示
                      <div>
                        <div className="flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={task.mediaFiles[0].url} 
                            alt="Generated" 
                            className="max-w-full h-auto rounded-lg border border-border"
                            style={{ maxHeight: '70vh' }}
                          />
                        </div>
                        <div className="mt-4">
                          <Button asChild>
                            <a 
                              href={task.mediaFiles[0].url} 
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              下载图片
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 多张图片：网格展示
                      <div>
                        <div className={`grid gap-4 ${
                          task.mediaFiles.length === 2 
                            ? 'grid-cols-1 md:grid-cols-2' 
                            : 'grid-cols-2 md:grid-cols-2'
                        }`}>
                          {task.mediaFiles.map((mediaFile, index) => (
                            <div key={mediaFile.id} className="space-y-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={mediaFile.url} 
                                alt={`Generated ${index + 1}`} 
                                className="w-full rounded-lg border border-border object-contain"
                                style={{ maxHeight: '500px' }}
                              />
                              <Button asChild className="w-full">
                                <a 
                                  href={mediaFile.url} 
                                  download={`generated-${index + 1}.png`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  下载图片 {index + 1}
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

