'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { http } from '@/infrastructure/http/client';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Link, useRouter } from '@/navigation';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await http.post('/auth/signin', {
        email,
        password,
      });

      if (response.success) {
        console.log('✅ Login successful, refreshing auth...');
        // 手动刷新认证状态
        await refreshAuth();
        console.log('✅ Auth refreshed, redirecting to home...');
        // 使用 window.location.href 强制刷新页面，确保 session 正确加载
        window.location.href = '/';
      } else {
        setError(response.error || t('loginNow'));
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('login')}</CardTitle>
            <CardDescription>
              {t('checkEmail')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  {t('password')}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                {t('login')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{t('noAccount')}</span>{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                {t('signupNow')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

