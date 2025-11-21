-- ========================================
-- 验证 Google OAuth 配置
-- 在 Supabase SQL Editor 中运行此脚本
-- ========================================

-- 1. 检查 user_profiles 表是否存在 nickname 字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND column_name IN ('nickname', 'full_name', 'avatar_url', 'email');

-- 2. 检查触发器是否存在
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 3. 检查触发器函数
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 4. 测试查询现有用户
SELECT 
  id,
  email,
  nickname,
  full_name,
  avatar_url,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- 5. 检查 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles';

-- ========================================
-- 如果以上查询都返回正确结果，说明配置完成
-- ========================================
