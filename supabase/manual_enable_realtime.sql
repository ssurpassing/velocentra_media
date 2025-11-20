-- 手动启用 Realtime（如果 migration 没有执行）
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 设置 REPLICA IDENTITY
ALTER TABLE public.generation_tasks REPLICA IDENTITY FULL;

-- 2. 添加表到 Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_tasks;

-- 3. 验证配置
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'generation_tasks';

SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'generation_tasks';

-- 4. 输出成功消息
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Realtime 配置完成！';
  RAISE NOTICE '请在浏览器控制台检查 Realtime 连接状态';
END $$;
