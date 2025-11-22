'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useRouter } from '@/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Coins, CreditCard, Image, Video, Calendar, TrendingUp, Sparkles, Zap, ArrowRight, Mail, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { http } from '@/infrastructure/http/client';

interface UserStats {
  credits: number;
  totalImages: number;
  totalVideos: number;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionEndDate?: string;
}

interface CreditHistoryItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  balance_after: number;
  created_at: string;
  task_id?: string;
  generation_tasks?: {
    id: string;
    original_prompt: string;
    optimized_prompt: string | null;
    status: string;
    media_type: string;
    ai_model: string;
    cost_credits: number;
    media_files: Array<{
      url: string;
      thumbnail_url: string;
    }>;
  };
}

export function DashboardClient() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      // 打开登录弹窗而不是跳转
      window.dispatchEvent(new CustomEvent('openLoginModal'));
      return;
    }

    if (user) {
      loadUserStats();
      loadCreditHistory();
    }
  }, [user, authLoading]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const response = await http.get('/user/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreditHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await http.get('/user/credit-history');
      if (response.success) {
        setCreditHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load credit history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {t('dashboard.welcome', { name: profile?.nickname || user.email?.split('@')[0] || 'User' })}
          </p>
        </div>

        {/* Stats Grid - Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Credits Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.credits')}</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Coins className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                {stats?.credits || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.availableCredits')}</p>
            </CardContent>
          </Card>

          {/* Images Card */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.images')}</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Image className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                {stats?.totalImages || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.totalGenerated')}</p>
            </CardContent>
          </Card>

          {/* Videos Card */}
          <Card className="border-purple-500/20 bg-gradient-to-br from-card to-purple-500/5 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.videos')}</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Video className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                {stats?.totalVideos || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.totalGenerated')}</p>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="border-green-500/20 bg-gradient-to-br from-card to-green-500/5 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.subscription')}</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CreditCard className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.subscriptionStatus === 'active' ? (
                  <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                    {t('dashboard.active')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t('dashboard.inactive')}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.subscriptionPlan || t('dashboard.noSubscription')}
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            </div>
            <CardDescription>{t('dashboard.quickActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full h-12 gradient-primary group" 
              onClick={() => router.push('/create?tab=image')}
            >
              <Image className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              {t('dashboard.generateImage')}
              <ArrowRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              className="w-full h-12 border-purple-500/30 hover:bg-purple-500/10 group" 
              variant="outline" 
              onClick={() => router.push('/create?tab=video')}
            >
              <Video className="mr-2 h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
              {t('dashboard.generateVideo')}
              <ArrowRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              className="w-full h-12 border-amber-500/30 hover:bg-amber-500/10 group" 
              variant="outline" 
              onClick={() => router.push('/pricing')}
            >
              <Coins className="mr-2 h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
              {t('dashboard.buyCredits')}
              <ArrowRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <span className="text-lg">👤</span>
              </div>
              <CardTitle>{t('dashboard.accountInfo')}</CardTitle>
            </div>
            <CardDescription>{t('dashboard.accountInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('dashboard.email')}
              </span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('dashboard.memberSince')}
              </span>
              <span className="text-sm font-medium">
                {new Date(user.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
            {stats?.subscriptionEndDate && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  {t('dashboard.subscriptionEnds')}
                </span>
                <span className="text-sm font-medium text-green-600">
                  {new Date(stats.subscriptionEndDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit History */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>积分消耗历史</CardTitle>
          </div>
          <CardDescription>查看您的积分使用记录和生成任务详情</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
            </div>
          ) : creditHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="p-4 rounded-full bg-primary/5 w-fit mx-auto mb-4">
                <TrendingUp className="h-12 w-12 opacity-50" />
              </div>
              <p className="text-lg">暂无消耗记录</p>
              <p className="text-sm mt-2">开始创作，这里将显示您的活动记录</p>
            </div>
          ) : (
            <div className="overflow-visible">
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">时间</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">类型</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">任务详情</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">提示词</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">积分</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">状态</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {creditHistory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm">
                        {new Date(item.created_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {item.generation_tasks?.media_type === 'image' ? (
                            <Image className="h-4 w-4 text-blue-500" />
                          ) : item.generation_tasks?.media_type === 'video' ? (
                            <Video className="h-4 w-4 text-purple-500" />
                          ) : (
                            <Coins className="h-4 w-4 text-amber-500" />
                          )}
                          <span className="text-sm">
                            {item.generation_tasks?.media_type === 'image' ? '图片' : 
                             item.generation_tasks?.media_type === 'video' ? '视频' : 
                             item.type === 'purchase' ? '充值' : '其他'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm max-w-xs">
                        {item.generation_tasks ? (
                          <div className="space-y-1">
                            <p className="font-medium">{item.generation_tasks.ai_model}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{item.description}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm max-w-md">
                        {item.generation_tasks?.original_prompt ? (
                          <p className="truncate" title={item.generation_tasks.original_prompt}>
                            {item.generation_tasks.original_prompt}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.generation_tasks ? (
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-red-500">
                              -{item.generation_tasks.cost_credits || 0}
                            </span>
                            {item.amount !== -(item.generation_tasks.cost_credits || 0) && (
                              <span className="text-xs text-muted-foreground">
                                (实际: {item.amount})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={`font-medium ${item.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {item.amount > 0 ? '+' : ''}{item.amount}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.generation_tasks ? (
                          <div className="flex items-center justify-center gap-1">
                            {item.generation_tasks.status === 'completed' ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-green-600">成功</span>
                              </>
                            ) : item.generation_tasks.status === 'failed' ? (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-xs text-red-600">失败</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="text-xs text-amber-600">处理中</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.generation_tasks?.media_files && item.generation_tasks.media_files.length > 0 ? (
                          <div className="relative inline-block group">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3"
                              onClick={() => {
                                const file = item.generation_tasks!.media_files[0];
                                window.open(file.url || file.thumbnail_url, '_blank');
                              }}
                            >
                              查看
                            </Button>
                            {/* 悬浮预览 */}
                            <div className="fixed z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200" style={{ left: 'auto', right: '100%', top: '50%', transform: 'translate(-1rem, -50%)' }}>
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-primary/20 p-3 pointer-events-auto">
                                <div className="text-xs text-muted-foreground mb-2 font-medium">结果预览:</div>
                                {item.generation_tasks.media_type === 'image' ? (
                                  <img
                                    src={item.generation_tasks.media_files[0].thumbnail_url || item.generation_tasks.media_files[0].url}
                                    alt="预览"
                                    className="w-80 h-auto max-h-96 object-contain rounded"
                                  />
                                ) : (
                                  <video
                                    src={item.generation_tasks.media_files[0].url}
                                    poster={item.generation_tasks.media_files[0].thumbnail_url}
                                    className="w-80 h-auto max-h-96 object-contain rounded"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
