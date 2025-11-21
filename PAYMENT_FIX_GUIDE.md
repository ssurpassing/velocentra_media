# 支付积分到账修复指南

## 问题描述
支付成功后，用户积分没有到账，用户类型没有更新。

## 已修复的问题

### 1. ✅ Checkout Session 创建
- 添加了 `planId`, `planName`, `credits` 到 metadata
- 确保 `client_reference_id` 正确传递用户ID

### 2. ✅ Webhook 处理逻辑
- 添加了详细的日志记录
- 添加了幂等性检查（防止重复处理）
- 添加了完整的错误处理
- 确保积分正确添加到用户账户
- 记录完整的交易历史和积分历史

### 3. ✅ 数据库迁移
创建了新的迁移文件来添加必要的字段。

## 需要执行的步骤

### 步骤 1：运行数据库迁移

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL：

```sql
-- 添加 transactions 表缺失的字段
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS plan_id TEXT;

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS plan_name TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session_id 
ON public.transactions(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
ON public.transactions(user_id, created_at DESC);

-- 为 credit_history 表添加 metadata 字段
ALTER TABLE public.credit_history 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

或者直接在项目根目录运行：
```bash
# 如果使用 Supabase CLI
supabase db push
```

### 步骤 2：重启开发服务器

```bash
npm run dev
```

### 步骤 3：配置 Stripe Webhook（生产环境）

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. 添加 Webhook 端点：`https://your-domain.com/api/payment/webhook`
3. 选择以下事件：
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. 复制 Webhook 签名密钥到 `.env.local`：
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### 步骤 4：测试支付流程

#### 本地测试（使用 Stripe CLI）

1. 安装 Stripe CLI：
   ```bash
   # Windows
   scoop install stripe
   
   # macOS
   brew install stripe/stripe-cli/stripe
   ```

2. 登录 Stripe：
   ```bash
   stripe login
   ```

3. 转发 webhook 到本地：
   ```bash
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```

4. 复制显示的 webhook 签名密钥到 `.env.local`

5. 在浏览器中测试支付：
   - 访问 `http://localhost:3000/pricing`
   - 选择任意套餐
   - 使用测试卡号：`4242 4242 4242 4242`
   - 完成支付

6. 查看控制台日志，应该看到：
   ```
   [Webhook] Received event: checkout.session.completed
   [Webhook] Processing checkout.session.completed for user: xxx
   [Webhook] Credit purchase: 1000 credits for user xxx
   [Webhook] Transaction record created
   [Webhook] Updating credits: 0 -> 1000
   [Webhook] User credits updated successfully
   [Webhook] Credit history recorded
   [Webhook] ✅ Credit purchase completed successfully
   ```

7. 检查数据库：
   ```sql
   -- 查看用户积分
   SELECT id, email, credits, membership_tier 
   FROM user_profiles 
   WHERE email = 'your-test-email@example.com';
   
   -- 查看交易记录
   SELECT * FROM transactions 
   WHERE user_id = 'your-user-id' 
   ORDER BY created_at DESC;
   
   -- 查看积分历史
   SELECT * FROM credit_history 
   WHERE user_id = 'your-user-id' 
   ORDER BY created_at DESC;
   ```

## 安全特性

### 1. 幂等性保护
- 使用 `stripe_session_id` 作为唯一标识
- 防止同一支付被重复处理

### 2. 错误处理
- 所有数据库操作都有错误检查
- 失败时抛出异常，Stripe 会自动重试

### 3. 详细日志
- 记录所有关键步骤
- 便于调试和追踪问题

### 4. 数据一致性
- 使用事务确保数据一致性
- 积分历史完整记录

## 常见问题

### Q1: Webhook 没有被调用？
**A:** 
- 检查 Stripe Dashboard 的 Webhook 日志
- 确保 webhook URL 可以从外网访问
- 本地开发使用 Stripe CLI 转发

### Q2: 积分没有到账？
**A:** 
1. 检查服务器日志，查看 webhook 是否收到
2. 检查 `transactions` 表是否有记录
3. 检查 `user_profiles` 表的 `credits` 字段
4. 查看是否有错误日志

### Q3: 重复支付问题？
**A:** 
- 已实现幂等性检查
- 同一 `session_id` 只会处理一次

### Q4: 如何手动添加积分？
**A:** 
```sql
-- 手动为用户添加积分
UPDATE user_profiles 
SET credits = credits + 1000,
    membership_tier = 'credits',
    updated_at = NOW()
WHERE id = 'user-id';

-- 记录积分历史
INSERT INTO credit_history (user_id, amount, type, balance_after, description)
SELECT id, 1000, 'bonus', credits, 'Manual credit adjustment'
FROM user_profiles 
WHERE id = 'user-id';
```

## 监控建议

1. **设置 Webhook 监控**
   - 监控 webhook 失败率
   - 设置告警通知

2. **定期检查数据一致性**
   ```sql
   -- 检查是否有支付成功但积分未到账的情况
   SELECT t.*, up.credits 
   FROM transactions t
   LEFT JOIN user_profiles up ON t.user_id = up.id
   WHERE t.status = 'completed' 
   AND t.type = 'credit_purchase'
   AND t.created_at > NOW() - INTERVAL '7 days';
   ```

3. **日志分析**
   - 定期查看 webhook 处理日志
   - 关注错误和异常情况
