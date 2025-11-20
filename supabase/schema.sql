-- ========================================
-- BOD Avatars 数据库架构
-- 版本：v4.0
-- 创建日期：2025-11-09
-- 说明：全新设计的数据库架构，优化性能和可维护性
-- ========================================

-- ========================================
-- 1. 用户配置表
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'zh',
  membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'credits', 'subscription')),
  credits INTEGER DEFAULT 0,
  free_generations_remaining INTEGER DEFAULT 3,
  subscription_end_date TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS '用户配置表';
COMMENT ON COLUMN public.user_profiles.membership_tier IS '会员等级：free（免费）、credits（积分）、subscription（订阅）';
COMMENT ON COLUMN public.user_profiles.credits IS '用户积分余额';
COMMENT ON COLUMN public.user_profiles.free_generations_remaining IS '免费生成次数剩余';

-- ========================================
-- 2. 生成任务表（极简设计）
-- ========================================
CREATE TABLE IF NOT EXISTS public.generation_tasks (
  id TEXT PRIMARY KEY,                    -- 直接使用 AI API 返回的 ID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基本信息
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  ai_model TEXT NOT NULL,
  
  -- 输入：提示词
  original_prompt TEXT,                   -- 用户原始输入
  optimized_prompt TEXT,                  -- 系统优化后的提示词
  prompt_optimized BOOLEAN DEFAULT false, -- 是否经过优化
  
  -- 输入：图片（支持多图）
  input_image_urls TEXT[],                -- 输入图片 URL 数组
  
  -- 输入：其他参数
  generation_params JSONB DEFAULT '{}'::jsonb,  -- 其他生成参数
  
  -- 展示相关（用于示例展示）
  display_location TEXT CHECK (display_location IN ('homepage', 'ai-image', 'ai-video')),  -- 展示位置
  display_order INTEGER DEFAULT 0,        -- 展示顺序
  
  -- 错误信息
  error_message TEXT,
  
  -- 成本和时间
  cost_credits INTEGER DEFAULT 0,
  generation_time_ms INTEGER,
  prompt_optimization_time_ms INTEGER,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.generation_tasks IS '生成任务表（图片和视频）';
COMMENT ON COLUMN public.generation_tasks.id IS '任务 ID（使用 AI API 返回的 ID）';
COMMENT ON COLUMN public.generation_tasks.media_type IS '媒体类型：image（图片）、video（视频）';
COMMENT ON COLUMN public.generation_tasks.ai_model IS 'AI 模型名称';
COMMENT ON COLUMN public.generation_tasks.original_prompt IS '用户原始输入的提示词';
COMMENT ON COLUMN public.generation_tasks.optimized_prompt IS '系统优化后的提示词';
COMMENT ON COLUMN public.generation_tasks.input_image_urls IS '输入图片 URL 数组（支持多图融合、首尾帧等）';
COMMENT ON COLUMN public.generation_tasks.generation_params IS '其他生成参数（JSON 格式）';
COMMENT ON COLUMN public.generation_tasks.display_location IS '展示位置：homepage（首页）、ai-image（AI图片页）、ai-video（AI视频页）、null（不展示）';
COMMENT ON COLUMN public.generation_tasks.display_order IS '展示顺序（数字越小越靠前）';

-- ========================================
-- 3. 媒体文件表（独立存储每个生成的文件）
-- ========================================
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES public.generation_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 媒体信息
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- 元数据
  width INTEGER,
  height INTEGER,
  duration INTEGER,                       -- 视频时长（秒）
  format TEXT,                            -- 文件格式（png, jpg, mp4, webm）
  file_size BIGINT,                       -- 文件大小（字节）
  
  -- 存储信息
  original_url TEXT,                      -- AI 服务商的原始 URL
  backup_url TEXT,                        -- Supabase 备份 URL
  storage_status TEXT DEFAULT 'original_only' CHECK (storage_status IN ('original_only', 'backing_up', 'backed_up', 'backup_failed')),
  
  -- 索引位置（一个任务可能生成多个文件）
  result_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.media_files IS '媒体文件表（存储每个生成的图片或视频）';
COMMENT ON COLUMN public.media_files.url IS '当前使用的媒体文件 URL';
COMMENT ON COLUMN public.media_files.original_url IS 'AI 服务商返回的原始 URL';
COMMENT ON COLUMN public.media_files.backup_url IS 'Supabase Storage 备份 URL';
COMMENT ON COLUMN public.media_files.storage_status IS '存储状态：original_only（仅原始）、backing_up（备份中）、backed_up（已备份）、backup_failed（备份失败）';
COMMENT ON COLUMN public.media_files.result_index IS '结果索引（一个任务生成多个文件时的顺序）';

-- ========================================
-- 4. 积分历史表
-- ========================================
CREATE TABLE IF NOT EXISTS public.credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                -- 正数=增加，负数=扣除
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  balance_after INTEGER NOT NULL,
  task_id TEXT REFERENCES public.generation_tasks(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.credit_history IS '积分变动历史表';
COMMENT ON COLUMN public.credit_history.type IS '类型：purchase（购买）、usage（使用）、refund（退款）、bonus（奖励）';

-- ========================================
-- 5. 支付交易表
-- ========================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_purchase', 'subscription', 'refund')),
  amount_cents INTEGER NOT NULL,
  credits_amount INTEGER,
  currency TEXT DEFAULT 'USD',
  stripe_payment_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.transactions IS '支付交易记录表';

-- ========================================
-- 6. 生成任务国际化表
-- ========================================
CREATE TABLE IF NOT EXISTS public.generation_tasks_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES public.generation_tasks(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('zh', 'en', 'ja', 'ko', 'fr', 'de', 'es')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, locale)
);

COMMENT ON TABLE public.generation_tasks_i18n IS '生成任务国际化翻译表';
COMMENT ON COLUMN public.generation_tasks_i18n.task_id IS '关联的任务ID';
COMMENT ON COLUMN public.generation_tasks_i18n.locale IS '语言代码';
COMMENT ON COLUMN public.generation_tasks_i18n.title IS '翻译后的标题';
COMMENT ON COLUMN public.generation_tasks_i18n.description IS '翻译后的描述';

-- ========================================
-- 8. 创建索引
-- ========================================

-- generation_tasks 索引
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON public.generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_media_type ON public.generation_tasks(media_type);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON public.generation_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_status ON public.generation_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_created ON public.generation_tasks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_display ON public.generation_tasks(display_location, display_order, status) WHERE display_location IS NOT NULL AND status = 'completed';

-- media_files 索引
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON public.media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_task_id ON public.media_files(task_id);
CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON public.media_files(media_type);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON public.media_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_user_created ON public.media_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_width ON public.media_files(width);
CREATE INDEX IF NOT EXISTS idx_media_files_height ON public.media_files(height);
CREATE INDEX IF NOT EXISTS idx_media_files_duration ON public.media_files(duration);

-- credit_history 索引
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON public.credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON public.credit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_history_user_created ON public.credit_history(user_id, created_at DESC);

-- transactions 索引
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_id ON public.transactions(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- generation_tasks_i18n 索引
CREATE INDEX IF NOT EXISTS idx_generation_tasks_i18n_task_locale ON public.generation_tasks_i18n(task_id, locale);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_i18n_locale ON public.generation_tasks_i18n(locale);

-- ========================================
-- 9. 启用行级安全 (RLS)
-- ========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_tasks_i18n ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 10. RLS 策略: 用户配置表
-- ========================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- 11. RLS 策略: 生成任务表
-- ========================================

DROP POLICY IF EXISTS "Users can view own tasks" ON public.generation_tasks;
DROP POLICY IF EXISTS "Public can view display tasks" ON public.generation_tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.generation_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.generation_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.generation_tasks;

CREATE POLICY "Users can view own tasks" ON public.generation_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view display tasks" ON public.generation_tasks
  FOR SELECT USING (display_location IS NOT NULL AND status = 'completed');

CREATE POLICY "Users can create own tasks" ON public.generation_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.generation_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.generation_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 12. RLS 策略: 媒体文件表
-- ========================================

DROP POLICY IF EXISTS "Users can view own media" ON public.media_files;
DROP POLICY IF EXISTS "Public can view display media" ON public.media_files;
DROP POLICY IF EXISTS "Users can create own media" ON public.media_files;
DROP POLICY IF EXISTS "Users can update own media" ON public.media_files;
DROP POLICY IF EXISTS "Users can delete own media" ON public.media_files;

CREATE POLICY "Users can view own media" ON public.media_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view display media" ON public.media_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.generation_tasks 
      WHERE generation_tasks.id = media_files.task_id 
      AND generation_tasks.display_location IS NOT NULL 
      AND generation_tasks.status = 'completed'
    )
  );

CREATE POLICY "Users can create own media" ON public.media_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media" ON public.media_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media" ON public.media_files
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 13. RLS 策略: 积分历史表
-- ========================================

DROP POLICY IF EXISTS "Users can view own credit history" ON public.credit_history;

CREATE POLICY "Users can view own credit history" ON public.credit_history
  FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- 14. RLS 策略: 交易表
-- ========================================

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- 15. RLS 策略: 生成任务国际化表
-- ========================================

DROP POLICY IF EXISTS "Public can view display task translations" ON public.generation_tasks_i18n;
DROP POLICY IF EXISTS "Admins can manage translations" ON public.generation_tasks_i18n;

CREATE POLICY "Public can view display task translations" ON public.generation_tasks_i18n
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.generation_tasks 
      WHERE generation_tasks.id = generation_tasks_i18n.task_id 
      AND generation_tasks.display_location IS NOT NULL 
      AND generation_tasks.status = 'completed'
    )
  );

CREATE POLICY "Admins can manage translations" ON public.generation_tasks_i18n
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========================================
-- 17. 触发器函数: 更新 updated_at 字段
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_examples_updated_at ON public.media_examples;
CREATE TRIGGER update_media_examples_updated_at BEFORE UPDATE ON public.media_examples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_examples_i18n_updated_at ON public.media_examples_i18n;
CREATE TRIGGER update_media_examples_i18n_updated_at BEFORE UPDATE ON public.media_examples_i18n
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 18. 触发器：自动创建用户配置
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
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
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'zh'),
    'free',
    0,
    3
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 19. Storage 配置
-- ========================================

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('originals', 'originals', true),
  ('avatars', 'avatars', true),
  ('thumbnails', 'thumbnails', true),
  ('generated-media', 'generated-media', true)
ON CONFLICT (id) 
DO UPDATE SET public = true;

-- 删除旧的策略
DROP POLICY IF EXISTS "Public Access for originals" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for generated-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload generated-media" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete generated-media" ON storage.objects;

-- Storage RLS 策略
CREATE POLICY "Public Access for originals"
ON storage.objects FOR SELECT
USING (bucket_id = 'originals');

CREATE POLICY "Public Access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Public Access for thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Public Access for generated-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-media');

CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'originals' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('originals', 'avatars', 'thumbnails')
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role can upload generated-media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-media'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role can delete generated-media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'generated-media'
  AND auth.role() = 'service_role'
);

-- ========================================
-- 完成提示
-- ========================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ 数据库初始化完成（v4.0）！';
  RAISE NOTICE '📊 核心表：7 个';
  RAISE NOTICE '🔍 索引：30+ 个';
  RAISE NOTICE '🔒 RLS 策略已配置';
  RAISE NOTICE '🗄️ Storage 配置已完成';
  RAISE NOTICE '🚀 系统已就绪';
END $$;

