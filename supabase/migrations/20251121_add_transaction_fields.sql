-- 添加 transactions 表缺失的字段
-- 用于支持完整的支付处理流程

-- 添加 stripe_session_id 字段（用于幂等性检查）
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;

-- 添加 plan_id 字段
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- 添加 plan_name 字段
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS plan_name TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session_id 
ON public.transactions(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
ON public.transactions(user_id, created_at DESC);

-- 添加注释
COMMENT ON COLUMN public.transactions.stripe_session_id IS 'Stripe Checkout Session ID（用于幂等性检查）';
COMMENT ON COLUMN public.transactions.plan_id IS '购买的计划ID';
COMMENT ON COLUMN public.transactions.plan_name IS '购买的计划名称';

-- 为 credit_history 表添加 metadata 字段
ALTER TABLE public.credit_history 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.credit_history.metadata IS '额外的元数据（JSON格式）';
