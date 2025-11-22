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
import { Mail, Lock, Chrome, User } from 'lucide-react';
import { createClient } from '@/infrastructure/database/client';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const t = useTranslations('auth');
  const { refreshAuth } = useAuth();
  const supabase = createClient();
  const [isSignUp, setIsSignUp] = useState(false); // 切换登录/注册
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 注册时的额外验证
    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('密码不匹配');
        return;
      }
      if (password.length < 6) {
        setError('密码长度至少为 6 个字符');
        return;
      }
      if (!nickname.trim()) {
        setError('请输入昵称');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? '/auth/signup' : '/auth/signin';
      const payload = isSignUp 
        ? { nickname, email, password }
        : { email, password };
      
      const response = await http.post(endpoint, payload);

      if (response.success) {
        console.log(`✅ ${isSignUp ? 'Signup' : 'Login'} successful`);
        // 获取当前语言
        const locale = window.location.pathname.split('/')[1] || 'zh';
        // 直接跳转到首页，触发完整的页面加载和 AuthContext 初始化
        window.location.href = `/${locale}`;
      } else {
        setError(response.error || (isSignUp ? '注册失败' : '登录失败'));
      }
    } catch (err: any) {
      console.error(`❌ ${isSignUp ? 'Signup' : 'Login'} error:`, err);
      setError(err.message || (isSignUp ? '注册失败，请重试' : '登录失败，请重试'));
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
            {isSignUp ? '注册账号' : t('login')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSignUp ? '创建您的账号，开始 AI 创作之旅' : t('checkEmail')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Google Login Button - 仅登录模式显示 */}
          {!isSignUp && (
            <>
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
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
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
            </>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 昵称字段 - 仅注册时显示 */}
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="nickname" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  昵称
                </label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="请输入昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  disabled={loading || googleLoading}
                  maxLength={50}
                  className="h-11"
                />
              </div>
            )}

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
                placeholder={isSignUp ? "至少 6 个字符" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || googleLoading}
                minLength={6}
                className="h-11"
              />
            </div>

            {/* 确认密码字段 - 仅注册时显示 */}
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || googleLoading}
                  minLength={6}
                  className="h-11"
                />
              </div>
            )}

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
              {isSignUp ? '注册' : t('login')}
            </Button>
          </form>

          {/* Toggle between login/signup */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? '已有账号？' : t('noAccount')}
            </span>{' '}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
            >
              {isSignUp ? '立即登录' : t('signupNow')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
