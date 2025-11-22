# 快速开始指南

## 🚀 开发环境配置

### 1. 创建 Stripe 测试商品

```bash
# 确保 .env.local 中有 STRIPE_SECRET_KEY (测试密钥)
npx tsx scripts/setup-stripe-products-v2.ts
```

脚本会输出所有 Price ID，复制并添加到 `.env.local`:

```bash
# Stripe Price IDs
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_1000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_5000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_MONTHLY_10000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_1000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_5000=price_xxx
STRIPE_PRICE_ID_SUBSCRIPTION_YEARLY_10000=price_xxx
STRIPE_PRICE_ID_CREDITS_1000=price_xxx
STRIPE_PRICE_ID_CREDITS_5000=price_xxx
STRIPE_PRICE_ID_CREDITS_10000=price_xxx
```

### 2. 配置 Webhook（开发环境）

#### 方式 A: 使用 Stripe CLI（推荐）

```bash
# 安装 Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe
# Linux: 见 https://stripe.com/docs/stripe-cli

# 登录
stripe login

# 转发 webhook
stripe listen --forward-to http://localhost:3000/api/payment/webhook
```

复制输出的 `whsec_xxx` 到 `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### 方式 B: 使用 ngrok

```bash
# 启动 ngrok
ngrok http 3000

# 在 Stripe Dashboard 添加 webhook endpoint:
# https://your-ngrok-url.ngrok.io/api/payment/webhook
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 测试支付

1. 访问: `http://localhost:3000/zh/pricing`
2. 选择套餐并点击购买
3. 使用测试卡: `4242 4242 4242 4242`
4. 查看控制台日志确认 webhook 处理

---

## 🌐 生产环境部署

详见: [Stripe 生产环境配置指南](./stripe-production-setup.md)

**简要步骤**:

1. 切换到 Stripe Live Mode
2. 运行 `setup-stripe-products-v2.ts` 创建生产商品
3. 在 Stripe Dashboard 配置生产 webhook
4. 在部署平台配置环境变量
5. 部署并测试

---

## 📚 相关文档

- [会员规则说明](./membership-rules.md) - 详细的会员规则和逻辑
- [Stripe 生产环境配置](./stripe-production-setup.md) - 生产部署完整指南
- [i18n 迁移指南](./i18n-migration-guide.md) - 国际化配置

---

## ✅ 检查清单

开发环境:
- [ ] `.env.local` 配置了所有必需的环境变量
- [ ] Stripe CLI 或 ngrok 正在运行
- [ ] 开发服务器正在运行
- [ ] 测试支付成功且积分正确增加

生产环境:
- [ ] 生产商品已创建
- [ ] Webhook endpoint 已配置
- [ ] 环境变量已配置
- [ ] 测试支付流程正常
- [ ] 监控和日志已设置

---

## 🆘 常见问题

### Q: Webhook 没有收到事件？
**A**: 
1. 检查 Stripe CLI 或 ngrok 是否在运行
2. 确认 `STRIPE_WEBHOOK_SECRET` 配置正确
3. 重启开发服务器

### Q: 积分没有增加？
**A**:
1. 查看 `npm run dev` 控制台日志
2. 检查 Stripe CLI 是否显示 200 响应
3. 确认 webhook 中的 `console.log` 是否输出

### Q: 年付积分不对？
**A**:
1. 确认购买的是年付套餐（URL 包含 `yearly`）
2. 检查 webhook 日志中的 `isYearly` 判断
3. 年付应该一次性发放 12 个月的积分

---

**开始使用吧！** 🎉
