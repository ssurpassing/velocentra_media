'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useRouter } from '@/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Coins, CreditCard, Image, Video, Calendar, TrendingUp } from 'lucide-react';
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
  const { user, loading: authLoading } = useAuth();
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome', { name: user.email?.split('@')[0] || 'User' })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Credits Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.credits')}</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.credits || 0}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.availableCredits')}</p>
          </CardContent>
        </Card>

        {/* Images Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.images')}</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.totalGenerated')}</p>
          </CardContent>
        </Card>

        {/* Videos Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.videos')}</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.totalGenerated')}</p>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.subscription')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.subscriptionStatus === 'active' ? t('dashboard.active') : t('dashboard.inactive')}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.subscriptionPlan || t('dashboard.noSubscription')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>{t('dashboard.quickActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => router.push('/ai-image')}>
              <Image className="mr-2 h-4 w-4" />
              {t('dashboard.generateImage')}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push('/ai-video')}>
              <Video className="mr-2 h-4 w-4" />
              {t('dashboard.generateVideo')}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push('/pricing')}>
              <Coins className="mr-2 h-4 w-4" />
              {t('dashboard.buyCredits')}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.accountInfo')}</CardTitle>
            <CardDescription>{t('dashboard.accountInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('dashboard.email')}</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('dashboard.memberSince')}</span>
              <span className="text-sm font-medium">
                {new Date(user.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
            {stats?.subscriptionEndDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('dashboard.subscriptionEnds')}</span>
                <span className="text-sm font-medium">
                  {new Date(stats.subscriptionEndDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>{t('dashboard.recentActivityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('dashboard.noRecentActivity')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
