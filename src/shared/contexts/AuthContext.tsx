'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  // 优化：尝试从 localStorage 快速读取初始状态，避免闪烁
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      // 尝试从 Supabase 的 localStorage 快速读取
      const keys = Object.keys(localStorage).filter(key => key.includes('sb-') && key.includes('-auth-token'));
      if (keys.length > 0) {
        const token = localStorage.getItem(keys[0]);
        if (token) {
          const parsed = JSON.parse(token);
          return parsed?.currentSession?.user || null;
        }
      }
    } catch (e) {
      // 忽略错误
    }
    return null;
  });
  
  // 同时尝试从 localStorage 读取缓存的 profile
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cachedProfile = localStorage.getItem('cached_user_profile');
      if (cachedProfile) {
        return JSON.parse(cachedProfile);
      }
    } catch (e) {
      // 忽略错误
    }
    return null;
  });
  
  // 如果已经从缓存读取到 user，初始 loading 为 false
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const keys = Object.keys(localStorage).filter(key => key.includes('sb-') && key.includes('-auth-token'));
      // 如果有缓存的 token，说明可能已登录，初始 loading 为 false
      return keys.length === 0;
    } catch (e) {
      return true;
    }
  });
  
  // 使用全局单例 Supabase 客户端
  const supabase = supabaseClient;

  // 使用 ref 来跟踪是否正在加载，避免重复请求
  const loadingProfileRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    // 如果正在加载同一个用户的 profile，跳过
    if (loadingProfileRef.current === userId) {
      return;
    }

    loadingProfileRef.current = userId;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to load profile:', error);
        loadingProfileRef.current = null;
        return;
      }

      if (data) {
        console.log('✅ Profile loaded:', data);
        const profileData = data as UserProfile;
        setProfile(profileData);
        // 缓存到 localStorage，下次刷新时可以立即显示
        try {
          localStorage.setItem('cached_user_profile', JSON.stringify(profileData));
        } catch (e) {
          // 忽略存储错误
        }
      } else {
        console.warn('⚠️ No profile data found for user:', userId);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      loadingProfileRef.current = null;
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
        // 清除缓存的 profile
        try {
          localStorage.removeItem('cached_user_profile');
        } catch (e) {
          // 忽略错误
        }
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      setUser(null);
      setProfile(null);
      // 清除缓存的 profile
      try {
        localStorage.removeItem('cached_user_profile');
      } catch (e) {
        // 忽略错误
      }
    }
  }, [loadProfile, supabase]);

  useEffect(() => {
    let isSubscribed = true;
    
    // 如果已经有缓存的用户信息，立即结束 loading
    const hasCache = user !== null || profile !== null;
    if (hasCache) {
      setLoading(false);
    }
    
    // 添加超时保护：500ms 后强制结束 loading（缩短时间）
    const timeout = setTimeout(() => {
      if (isSubscribed) {
        setLoading(false);
      }
    }, 500);

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

