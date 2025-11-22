# Stripe 生产环境配置指南

本文档说明如何在生产环境中配置 Stripe 支付系统。

## 📋 前置准备

### 1. Stripe 账户设置
- [ ] 完成 Stripe 账户注册和验证
- [ ] 完成银行账户绑定
- [ ] 激活生产模式（Live Mode）

### 2. 获取生产环境密钥
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 切换到 **Live Mode**（右上角开关）
3. 进入 **Developers** → **API keys**
4. 复制以下密钥：
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

⚠️ **安全提示**: 
- 生产密钥绝对不能提交到 Git
- 只在服务器环境变量中配置
- 定期轮换密钥

---

## 🛠️ 步骤 1: 创建生产环境商品

### 1.1 准备环境变量

创建临时文件 `.env.production.local`（不要提交到 Git）:

```bash
# Stripe 生产环境密钥
STRIPE_SECRET_KEY=sk_live_你的生产密钥
```

### 1.2 运行商品创建脚本

```bash
# 使用生产环境密钥运行脚本
npx tsx scripts/setup-stripe-products-v2.ts
```

脚本会创建以下商品：

#### 月付订阅（3个）
- Basic Monthly: $9.99/月 - 1000 积分/月
- Pro Monthly: $49.99/月 - 5000 积分/月
- Premium Monthly: $99.99/月 - 10000 积分/月

#### 年付订阅（3个）
- Basic Annual: $95.88/年 - 12000 积分（一次性）
- Pro Annual: $479.88/年 - 60000 积分（一次性）
- Premium Annual: $959.88/年 - 120000 积分（一次性）

#### 积分包（3个）
- Starter Pack: $9.99 - 1000 积分 + 300 次
- Pro Pack: $49.99 - 5000 积分 + 1000 次
- Premium Pack: $99.99 - 10000 积分 + 3000 次

### 1.3 保存 Price IDs

脚本运行后会输出所有的 Price ID，格式如下：

```bash
# Monthly Subscriptions
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_1000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_5000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_10000=price_xxx

# Annual Subscriptions
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_1000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_5000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_10000=price_xxx

# Credit Packs
STRIPE_PRICE_ID_CREDITS_1000=price_xxx
STRIPE_PRICE_ID_CREDITS_5000=price_xxx
STRIPE_PRICE_ID_CREDITS_10000=price_xxx
```

**请妥善保存这些 Price ID！**

---

## 🔗 步骤 2: 配置 Webhook

### 2.1 获取生产环境域名

确保你的应用已部署到生产环境，并获取域名，例如：
```
https://yourdomain.com
```

### 2.2 在 Stripe Dashboard 添加 Webhook

1. 访问 [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. 确保切换到 **Live Mode**
3. 点击 **Add endpoint**
4. 填写信息：
   - **Endpoint URL**: `https://yourdomain.com/api/payment/webhook`
   - **Description**: Production Webhook
   - **Events to send**: 选择以下事件
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.deleted`
     - ✅ `customer.subscription.updated`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`

5. 点击 **Add endpoint**

### 2.3 获取 Webhook Signing Secret

1. 点击刚创建的 webhook endpoint
2. 在 **Signing secret** 部分点击 **Reveal**
3. 复制 `whsec_...` 开头的密钥

---

## ⚙️ 步骤 3: 配置生产环境变量

### 3.1 Vercel 部署

如果使用 Vercel 部署：

1. 进入项目设置: `https://vercel.com/your-project/settings/environment-variables`
2. 添加以下环境变量（选择 **Production** 环境）:

```bash
# Stripe 生产密钥
STRIPE_SECRET_KEY=sk_live_你的生产密钥
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_你的生产公钥
STRIPE_WEBHOOK_SECRET=whsec_你的webhook密钥

# Stripe Price IDs - Monthly
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_1000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_5000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_10000=price_xxx

# Stripe Price IDs - Annual
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_1000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_5000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_10000=price_xxx

# Stripe Price IDs - Credit Packs
STRIPE_PRICE_ID_CREDITS_1000=price_xxx
STRIPE_PRICE_ID_CREDITS_5000=price_xxx
STRIPE_PRICE_ID_CREDITS_10000=price_xxx

# 应用 URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

3. 重新部署应用

### 3.2 其他平台

根据你的部署平台，在相应的环境变量配置页面添加上述变量。

---

## ✅ 步骤 4: 测试生产环境

### 4.1 测试支付流程

⚠️ **重要**: 生产环境使用真实信用卡，会产生真实费用！

建议先使用小额套餐测试：

1. 访问 `https://yourdomain.com/pricing`
2. 选择最便宜的套餐（$9.99）
3. 使用真实信用卡完成支付
4. 检查：
   - [ ] 支付成功页面正常显示
   - [ ] 用户积分正确增加
   - [ ] 订阅状态正确更新
   - [ ] Stripe Dashboard 显示支付记录
   - [ ] 数据库记录正确

### 4.2 测试 Webhook

1. 在 Stripe Dashboard 查看 Webhook 日志
2. 确认 `checkout.session.completed` 事件被正确接收
3. 检查响应状态为 `200 OK`

### 4.3 测试退款（可选）

1. 在 Stripe Dashboard 找到测试订单
2. 点击 **Refund** 进行退款
3. 检查用户积分是否正确处理

---

## 🔒 安全检查清单

部署前请确认：

- [ ] 所有生产密钥都配置在服务器环境变量中
- [ ] `.env.local` 和 `.env.production.local` 已添加到 `.gitignore`
- [ ] Webhook endpoint 使用 HTTPS
- [ ] Webhook signature 验证已启用
- [ ] 数据库连接使用 SSL
- [ ] 敏感日志已移除或脱敏

---

## 📊 监控和维护

### 日常监控

1. **Stripe Dashboard**
   - 每日检查支付成功率
   - 监控失败支付原因
   - 查看 Webhook 错误日志

2. **应用日志**
   - 监控 webhook 处理错误
   - 检查积分更新异常
   - 追踪用户投诉

### 定期维护

- **每周**: 检查 Webhook 日志，确保无错误
- **每月**: 审查支付数据，分析转化率
- **每季度**: 更新 Stripe API 版本

---

## 🆘 常见问题

### Q1: Webhook 返回 401 错误
**原因**: Webhook signature 验证失败

**解决**:
1. 确认 `STRIPE_WEBHOOK_SECRET` 配置正确
2. 检查是否使用了测试环境的 secret
3. 重新创建 webhook endpoint

### Q2: 积分没有增加
**原因**: Webhook 未被正确处理

**排查步骤**:
1. 检查 Stripe Dashboard 的 Webhook 日志
2. 查看应用服务器日志
3. 确认 `metadata` 中包含 `credits` 和 `generationQuota`
4. 检查数据库连接

### Q3: 订阅时间不正确
**原因**: 时区或日期计算错误

**解决**:
1. 确认服务器时区设置
2. 检查 webhook 中的日期计算逻辑
3. 使用 UTC 时间存储

### Q4: 年付积分不对
**原因**: Webhook 未正确识别年付套餐

**排查**:
1. 检查 `planId` 是否包含 `yearly`
2. 确认 webhook 中的 `isYearly` 判断逻辑
3. 查看 `metadata.credits` 是否正确

---

## 📞 支持

如遇到问题：

1. **Stripe 官方支持**: https://support.stripe.com/
2. **Stripe API 文档**: https://stripe.com/docs/api
3. **项目文档**: `/docs/membership-rules.md`

---

## 📝 版本历史

- **V2.0** (2025-11-23): 新会员规则实施
  - 年付一次性发放全年积分
  - 订阅会员无限次生成
  - 积分包增加生成次数配额
  - 订阅时间累加

- **V1.0** (2025-11-21): 初始版本

---

**祝部署顺利！** 🚀
