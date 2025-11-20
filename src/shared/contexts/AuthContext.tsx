'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/infrastructure/database/client';
import { UserProfile } from '@/shared/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 在组件外部创建单例，确保全局只有一个实例
const supabaseClient = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 使用全局单例 Supabase 客户端
  const supabase = supabaseClient;

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // supabase 是单例，不需要作为依赖

  const refreshAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        setUser(null);
        setProfile(null);
        return;
      }
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      setUser(null);
      setProfile(null);
    }
  }, [loadProfile, supabase]);

  useEffect(() => {
    let isSubscribed = true;
    
    // 添加超时保护：3秒后强制结束 loading
    const timeout = setTimeout(() => {
      if (isSubscribed) {
        setLoading(false);
      }
    }, 3000);

    // 获取初始会话
    refreshAuth()
      .catch((error) => {
        if (isSubscribed) {
          console.error('Auth refresh error:', error);
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        if (isSubscribed) {
          setLoading(false);
        }
      });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isSubscribed) return;
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // 监听跨标签页的会话变化（通过 localStorage 事件）
    const handleStorageChange = (e: StorageEvent) => {
      if (!isSubscribed) return;
      // Supabase 使用 localStorage 存储会话
      // 当其他标签页登录/登出时，localStorage 会变化
      if (e.key?.startsWith('sb-') && e.key?.includes('-auth-token')) {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isSubscribed = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshAuth, loadProfile]); // supabase.auth 是稳定引用，不需要作为依赖

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

