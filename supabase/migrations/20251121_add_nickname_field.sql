-- ========================================
-- 添加 nickname 字段到 user_profiles 表
-- 日期：2025-11-21
-- 说明：支持用户昵称，优先显示昵称而非邮箱
-- ========================================

-- 添加 nickname 字段
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 添加注释
COMMENT ON COLUMN public.user_profiles.nickname IS '用户昵称（优先显示）';

-- 为现有用户从 full_name 或 email 生成默认昵称
UPDATE public.user_profiles 
SET nickname = COALESCE(
  full_name,
  SPLIT_PART(email, '@', 1)
)
WHERE nickname IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON public.user_profiles(nickname);
