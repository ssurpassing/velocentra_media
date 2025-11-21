-- ========================================
-- 更新用户创建触发器以支持昵称
-- 日期：2025-11-21
-- 说明：从 Google OAuth 或用户注册中提取昵称
-- ========================================

-- 更新触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    nickname,
    full_name,
    avatar_url,
    locale,
    membership_tier,
    credits,
    free_generations_remaining
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- 优先级：nickname > name > full_name > email前缀
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'zh'),
    'free',
    0,
    3
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = COALESCE(
      EXCLUDED.nickname,
      public.user_profiles.nickname
    ),
    full_name = COALESCE(
      EXCLUDED.full_name,
      public.user_profiles.full_name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      public.user_profiles.avatar_url
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注释
COMMENT ON FUNCTION public.handle_new_user() IS '自动创建用户配置，支持从 OAuth 提供商提取昵称和头像';
