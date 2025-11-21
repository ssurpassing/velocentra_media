'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useRouter } from '@/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Coins, CreditCard, Image, Video, Calendar, TrendingUp, Sparkles, Zap, ArrowRight, Mail } from 'lucide-react';
import { http } from '@/infrastructure/http/client';

interface UserStats {
  credits: number;
  totalImages: number;
  totalVideos: number;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionEndDate?: string;
}

export function DashboardClient() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadUserStats();
    }
  }, [user, authLoading, router]);

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
              onClick={() => router.push('/ai-image')}
            >
              <Image className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              {t('dashboard.generateImage')}
              <ArrowRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              className="w-full h-12 border-purple-500/30 hover:bg-purple-500/10 group" 
              variant="outline" 
              onClick={() => router.push('/ai-video')}
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

      {/* Recent Activity Placeholder */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </div>
          <CardDescription>{t('dashboard.recentActivityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="p-4 rounded-full bg-primary/5 w-fit mx-auto mb-4">
              <TrendingUp className="h-12 w-12 opacity-50" />
            </div>
            <p className="text-lg">{t('dashboard.noRecentActivity')}</p>
            <p className="text-sm mt-2">开始创作，这里将显示您的活动记录</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
