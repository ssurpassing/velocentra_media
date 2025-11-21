-- 支付追踪表：记录所有支付意图，包括未完成的
-- 用于分析转化率和支付流程

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 支付意图信息
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('subscription', 'credit_purchase')),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  credits_amount INTEGER,
  
  -- Stripe 信息
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  
  -- 状态追踪
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (
    status IN (
      'initiated',      -- 用户点击了订阅按钮
      'checkout_created', -- Stripe Checkout Session 已创建
      'redirected',     -- 用户已跳转到 Stripe
      'completed',      -- 支付成功
      'failed',         -- 支付失败
      'cancelled',      -- 用户取消
      'expired'         -- Session 过期
    )
  ),
  
  -- 失败原因
  failure_reason TEXT,
  failure_code TEXT,
  
  -- 时间追踪
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  checkout_created_at TIMESTAMPTZ,
  redirected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- 额外信息
  user_agent TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id 
ON public.payment_intents(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_intents_status 
ON public.payment_intents(status);

CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_session 
ON public.payment_intents(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_payment_intents_created_at 
ON public.payment_intents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user_status 
ON public.payment_intents(user_id, status);

-- 触发器：自动更新 updated_at
CREATE TRIGGER update_payment_intents_updated_at 
BEFORE UPDATE ON public.payment_intents 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 注释
COMMENT ON TABLE public.payment_intents IS '支付意图追踪表：记录所有支付流程，包括未完成的';
COMMENT ON COLUMN public.payment_intents.status IS '状态：initiated（点击按钮）、checkout_created（创建Session）、redirected（跳转）、completed（成功）、failed（失败）、cancelled（取消）、expired（过期）';
COMMENT ON COLUMN public.payment_intents.failure_reason IS '失败原因描述';
COMMENT ON COLUMN public.payment_intents.failure_code IS 'Stripe 错误代码';

-- 创建视图：支付转化率分析
CREATE OR REPLACE VIEW public.payment_conversion_stats AS
SELECT 
  DATE(created_at) as date,
  plan_type,
  COUNT(*) as total_intents,
  COUNT(*) FILTER (WHERE status = 'checkout_created') as checkout_created_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status = 'checkout_created'), 0) * 100, 
    2
  ) as conversion_rate_percent
FROM public.payment_intents
GROUP BY DATE(created_at), plan_type
ORDER BY date DESC;

COMMENT ON VIEW public.payment_conversion_stats IS '支付转化率统计视图';
