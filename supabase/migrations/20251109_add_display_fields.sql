-- ========================================
-- Migration: 添加展示字段和国际化支持
-- Date: 2025-11-09
-- Description: 
--   1. 为 generation_tasks 添加展示位置和顺序字段
--   2. 创建 generation_tasks_i18n 表用于国际化
--   3. 删除旧的 media_examples 相关表
-- ========================================

-- Step 1: 为 generation_tasks 表添加展示字段
ALTER TABLE public.generation_tasks 
ADD COLUMN IF NOT EXISTS display_location TEXT CHECK (display_location IN ('homepage', 'ai-image', 'ai-video'));

ALTER TABLE public.generation_tasks 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN public.generation_tasks.display_location IS '展示位置：homepage（首页）、ai-image（AI图片页）、ai-video（AI视频页）、null（不展示）';
COMMENT ON COLUMN public.generation_tasks.display_order IS '展示顺序（数字越小越靠前）';

-- Step 2: 创建展示任务索引
CREATE INDEX IF NOT EXISTS idx_generation_tasks_display 
ON public.generation_tasks(display_location, display_order, status) 
WHERE display_location IS NOT NULL AND status = 'completed';

-- Step 3: 创建 generation_tasks_i18n 表
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

-- 为 i18n 表创建索引
CREATE INDEX IF NOT EXISTS idx_generation_tasks_i18n_task_locale 
ON public.generation_tasks_i18n(task_id, locale);

-- Step 4: 删除旧的示例表（如果存在）
DROP TABLE IF EXISTS public.media_examples_i18n CASCADE;
DROP TABLE IF EXISTS public.media_examples CASCADE;

-- Step 5: 清理旧索引（如果存在）
DROP INDEX IF EXISTS idx_media_examples_active;
DROP INDEX IF EXISTS idx_media_examples_display_order;
DROP INDEX IF EXISTS idx_media_examples_i18n_example_locale;

