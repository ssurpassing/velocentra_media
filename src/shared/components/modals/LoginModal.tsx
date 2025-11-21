'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/Dialog';
import { http } from '@/infrastructure/http/client';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Link } from '@/navigation';
import { Mail, Lock, Chrome } from 'lucide-react';
import { createClient } from '@/infrastructure/database/client';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const t = useTranslations('auth');
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await http.post('/auth/signin', {
        email,
        password,
      });

      if (response.success) {
        await refreshAuth();
        onOpenChange(false);
        window.location.href = '/dashboard';
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

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        setError(error.message || 'Google 登录失败');
        setGoogleLoading(false);
      }
      // 如果成功，用户会被重定向到 Google 登录页面
    } catch (err: any) {
      console.error('❌ Google login error:', err);
      setError(err.message || 'Google 登录失败，请重试');
      setGoogleLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {t('login')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('checkEmail')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-2 hover:bg-accent"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>正在跳转...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Chrome className="h-5 w-5 text-blue-600" />
                <span className="font-medium">使用 Google 登录</span>
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或使用邮箱登录
              </span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t('password')}
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="h-11"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 gradient-primary" 
              loading={loading}
              disabled={googleLoading}
            >
              {t('login')}
            </Button>
          </form>

          {/* Sign up link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t('noAccount')}</span>{' '}
            <Link 
              href="/auth/signup" 
              className="text-primary hover:underline font-medium"
              onClick={() => onOpenChange(false)}
            >
              {t('signupNow')}
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
