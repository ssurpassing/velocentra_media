# 支付分析 SQL 查询

## 执行步骤

1. 先在 Supabase Dashboard 执行迁移文件：`supabase/migrations/20251121_add_payment_tracking.sql`
2. 然后就可以使用以下查询来分析支付数据

## 常用查询

### 1. 查看所有支付意图（最近7天）

```sql
SELECT 
  pi.created_at,
  up.email,
  pi.plan_name,
  pi.plan_type,
  pi.amount_cents / 100.0 as amount_usd,
  pi.credits_amount,
  pi.status,
  pi.failure_reason
FROM payment_intents pi
LEFT JOIN user_profiles up ON pi.user_id = up.id
WHERE pi.created_at > NOW() - INTERVAL '7 days'
ORDER BY pi.created_at DESC;
```

### 2. 支付转化漏斗

```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM payment_intents
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'initiated' THEN 1
    WHEN 'checkout_created' THEN 2
    WHEN 'redirected' THEN 3
    WHEN 'completed' THEN 4
    WHEN 'failed' THEN 5
    WHEN 'cancelled' THEN 6
    WHEN 'expired' THEN 7
  END;
```

### 3. 每日转化率统计

```sql
SELECT * FROM payment_conversion_stats
WHERE date > CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### 4. 查看特定用户的支付历史

```sql
SELECT 
  pi.created_at,
  pi.plan_name,
  pi.plan_type,
  pi.amount_cents / 100.0 as amount_usd,
  pi.status,
  pi.stripe_session_id,
  pi.failure_reason
FROM payment_intents pi
WHERE pi.user_id = 'YOUR_USER_ID'
ORDER BY pi.created_at DESC;
```

### 5. 失败支付分析

```sql
SELECT 
  failure_reason,
  failure_code,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM payment_intents
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY failure_reason, failure_code
ORDER BY count DESC;
```

### 6. 按计划类型统计

```sql
SELECT 
  plan_name,
  plan_type,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as success_rate_percent,
  SUM(amount_cents) FILTER (WHERE status = 'completed') / 100.0 as total_revenue_usd
FROM payment_intents
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY plan_name, plan_type
ORDER BY total_revenue_usd DESC NULLS LAST;
```

### 7. 用户支付行为分析

```sql
SELECT 
  up.email,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE pi.status = 'completed') as successful_payments,
  COUNT(*) FILTER (WHERE pi.status = 'failed') as failed_payments,
  COUNT(*) FILTER (WHERE pi.status = 'cancelled') as cancelled_payments,
  MAX(pi.created_at) as last_attempt,
  SUM(pi.amount_cents) FILTER (WHERE pi.status = 'completed') / 100.0 as total_spent_usd
FROM payment_intents pi
LEFT JOIN user_profiles up ON pi.user_id = up.id
WHERE pi.created_at > NOW() - INTERVAL '90 days'
GROUP BY up.email
HAVING COUNT(*) > 1  -- 只显示有多次尝试的用户
ORDER BY total_attempts DESC;
```

### 8. 实时监控：最近1小时的支付

```sql
SELECT 
  pi.created_at,
  up.email,
  pi.plan_name,
  pi.status,
  pi.amount_cents / 100.0 as amount_usd,
  EXTRACT(EPOCH FROM (NOW() - pi.created_at)) / 60 as minutes_ago
FROM payment_intents pi
LEFT JOIN user_profiles up ON pi.user_id = up.id
WHERE pi.created_at > NOW() - INTERVAL '1 hour'
ORDER BY pi.created_at DESC;
```

### 9. 未完成支付提醒（潜在客户）

```sql
-- 查找创建了 checkout 但未完成支付的用户（最近24小时）
SELECT 
  up.email,
  pi.plan_name,
  pi.amount_cents / 100.0 as amount_usd,
  pi.created_at,
  EXTRACT(EPOCH FROM (NOW() - pi.created_at)) / 3600 as hours_ago
FROM payment_intents pi
LEFT JOIN user_profiles up ON pi.user_id = up.id
WHERE pi.status = 'checkout_created'
  AND pi.created_at > NOW() - INTERVAL '24 hours'
  AND pi.created_at < NOW() - INTERVAL '1 hour'  -- 至少1小时前
ORDER BY pi.created_at DESC;
```

### 10. 收入统计（按时间段）

```sql
-- 每日收入统计
SELECT 
  DATE(pi.completed_at) as date,
  COUNT(*) as successful_payments,
  SUM(pi.amount_cents) / 100.0 as total_revenue_usd,
  SUM(pi.credits_amount) as total_credits_sold,
  ROUND(AVG(pi.amount_cents) / 100.0, 2) as avg_transaction_usd
FROM payment_intents pi
WHERE pi.status = 'completed'
  AND pi.completed_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(pi.completed_at)
ORDER BY date DESC;
```

## 创建管理员仪表板视图

```sql
-- 创建一个综合仪表板视图
CREATE OR REPLACE VIEW public.admin_payment_dashboard AS
SELECT 
  -- 今日统计
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_attempts,
  COUNT(*) FILTER (WHERE DATE(completed_at) = CURRENT_DATE AND status = 'completed') as today_completed,
  SUM(amount_cents) FILTER (WHERE DATE(completed_at) = CURRENT_DATE AND status = 'completed') / 100.0 as today_revenue,
  
  -- 本周统计
  COUNT(*) FILTER (WHERE created_at > DATE_TRUNC('week', NOW())) as week_attempts,
  COUNT(*) FILTER (WHERE completed_at > DATE_TRUNC('week', NOW()) AND status = 'completed') as week_completed,
  SUM(amount_cents) FILTER (WHERE completed_at > DATE_TRUNC('week', NOW()) AND status = 'completed') / 100.0 as week_revenue,
  
  -- 本月统计
  COUNT(*) FILTER (WHERE created_at > DATE_TRUNC('month', NOW())) as month_attempts,
  COUNT(*) FILTER (WHERE completed_at > DATE_TRUNC('month', NOW()) AND status = 'completed') as month_completed,
  SUM(amount_cents) FILTER (WHERE completed_at > DATE_TRUNC('month', NOW()) AND status = 'completed') / 100.0 as month_revenue,
  
  -- 总体转化率
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('checkout_created', 'completed', 'failed')), 0) * 100,
    2
  ) as overall_conversion_rate
FROM payment_intents;

-- 查询仪表板
SELECT * FROM admin_payment_dashboard;
```

## 导出数据（CSV）

在 Supabase Dashboard 的 SQL Editor 中执行查询后，可以点击 "Download CSV" 按钮导出数据。

## 设置告警

可以创建定时任务来监控异常情况：

```sql
-- 查找异常高的失败率（最近1小时）
SELECT 
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) as total_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as failure_rate
FROM payment_intents
WHERE created_at > NOW() - INTERVAL '1 hour'
HAVING COUNT(*) > 5  -- 至少有5次尝试
  AND COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / NULLIF(COUNT(*), 0) > 0.5;  -- 失败率超过50%
```
