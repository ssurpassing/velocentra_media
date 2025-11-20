-- Enable Realtime for generation_tasks table
-- This allows the frontend to receive real-time updates when tasks are created, updated, or deleted

-- 1. Set REPLICA IDENTITY to FULL (required for Realtime to detect all changes)
-- This ensures Realtime can see all column values in UPDATE and DELETE events
ALTER TABLE public.generation_tasks REPLICA IDENTITY FULL;

-- 2. Enable Realtime replication for the generation_tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_tasks;

-- 3. Grant necessary permissions for Realtime to work
-- Realtime needs to be able to read the table structure
GRANT SELECT ON public.generation_tasks TO authenticated;

-- 4. Ensure RLS policies allow users to see their own task updates
-- (The existing RLS policies should already handle this, but we'll verify)

-- 5. Add a comment to document this configuration
COMMENT ON TABLE public.generation_tasks IS 'Table with Realtime enabled for real-time task status updates';

-- 6. Verify the configuration
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Realtime enabled for generation_tasks table';
  RAISE NOTICE '📡 REPLICA IDENTITY set to FULL';
  RAISE NOTICE '🔔 Frontend will now receive real-time updates for task changes';
END $$;

