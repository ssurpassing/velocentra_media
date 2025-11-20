-- ========================================
-- 添加任务重试/重新生成相关字段
-- 创建日期：2025-11-15
-- ========================================

-- 1. 添加父任务ID字段（记录来源任务）
ALTER TABLE public.generation_tasks
ADD COLUMN IF NOT EXISTS parent_task_id TEXT REFERENCES public.generation_tasks(id) ON DELETE SET NULL;

-- 2. 添加免费重试标记字段（为未来扩展预留）
ALTER TABLE public.generation_tasks
ADD COLUMN IF NOT EXISTS is_free_retry BOOLEAN DEFAULT FALSE;

-- 3. 添加索引，方便根据父任务查子任务
CREATE INDEX IF NOT EXISTS idx_generation_tasks_parent_task_id
ON public.generation_tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- 4. 添加注释
COMMENT ON COLUMN public.generation_tasks.parent_task_id IS '父任务ID：如果是从已有任务重新生成，则记录原任务ID';
COMMENT ON COLUMN public.generation_tasks.is_free_retry IS '是否为免费重试：标记本任务是否属于免费重试';

-- ========================================
-- 完成提示
-- ========================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ 任务重试字段添加完成！';
  RAISE NOTICE '📊 新增字段：parent_task_id, is_free_retry';
  RAISE NOTICE '🔍 新增索引：idx_generation_tasks_parent_task_id';
END $$;

