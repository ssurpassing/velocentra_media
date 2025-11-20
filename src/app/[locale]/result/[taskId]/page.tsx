/**
 * 结果页面
 * 
 * 更新（v4.0）：
 * 1. 使用 media_files 而不是 generated_photos
 * 2. 删除公开/精选功能（画廊已删除）
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useLocale } from 'next-intl';
import { Download, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { useAuth } from '@/shared/contexts/AuthContext';
import { http } from '@/infrastructure/http/client';

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

interface GenerationTask {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  media_type: 'image' | 'video';
  ai_model: string;
  original_prompt?: string;
  optimized_prompt?: string;
  error_message?: string;
  media_files: MediaFile[];
  created_at: string;
  completed_at?: string;
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const taskId = params.taskId as string;
  const { user, loading: authLoading } = useAuth();
  const [task, setTask] = useState<GenerationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user && taskId) {
      loadTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, taskId, locale]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await http.get(`/tasks/${taskId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load task');
      }

      setTask(response.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-20 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg max-w-md mx-auto">
          {error}
        </div>
        <Button className="mt-4" onClick={() => router.push('/')}>
          返回首页
        </Button>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  // 获取第一个媒体文件
  const mediaFile = task.media_files?.[0];
  const isVideo = task.media_type === 'video';

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">生成结果</h1>
          <p className="text-xl text-muted-foreground">
            {isVideo ? '您的视频已准备好' : '您的图片已准备好'}
          </p>
        </div>

        {task.status === 'completed' && mediaFile ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className={`${isVideo ? 'aspect-video' : 'aspect-square'} relative overflow-hidden bg-muted rounded-lg`}>
                  {isVideo ? (
                    <video
                      src={mediaFile.url}
                      className="w-full h-full object-cover"
                      controls
                      loop
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaFile.url}
                      alt="Generated content"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 提示词信息 */}
            {(task.optimized_prompt || task.original_prompt) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">提示词</h3>
                  <p className="text-sm text-muted-foreground">
                    {task.optimized_prompt || task.original_prompt}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1" size="lg" asChild>
                <a 
                  href={mediaFile.url} 
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-5 w-5" />
                  下载{isVideo ? '视频' : '图片'}
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                size="lg" 
                onClick={() => router.push(isVideo ? '/create?type=video' : '/create?type=image')}
              >
                再生成一个
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push('/')}>
                <Home className="mr-2 h-5 w-5" />
                返回首页
              </Button>
            </div>

            {/* 显示所有媒体文件（如果有多个） */}
            {task.media_files && task.media_files.length > 1 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">所有生成结果</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {task.media_files.map((file, index) => (
                      <div key={file.id} className="relative group">
                        {file.media_type === 'video' ? (
                          <video
                            src={file.url}
                            className="w-full aspect-video object-cover rounded-lg"
                            muted
                            playsInline
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.url}
                            alt={`Result ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button size="sm" asChild>
                            <a 
                              href={file.url} 
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : task.status === 'failed' ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">生成失败: {task.error_message}</p>
              <Button onClick={() => router.push(isVideo ? '/create?type=video' : '/create?type=image')}>
                重试
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">生成中，请稍候...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
