# 🧪 Stripe 支付测试指南

## ✅ 前置条件检查

确保以下内容已完成：

- [x] Stripe 产品和价格已创建（9个产品）
- [x] `.env.local` 配置完成（包含所有 Price IDs）
- [x] 开发服务器正在运行 (`npm run dev`)
- [x] Stripe Webhook 监听已启动
- [x] Webhook Secret 已添加到 `.env.local`

## 🚀 当前运行状态

### 1. 开发服务器
- **地址**: http://localhost:3000
- **状态**: ✅ 运行中

### 2. Stripe Webhook 监听
- **转发地址**: localhost:3000/api/payment/webhook
- **Webhook Secret**: `whsec_77c798a3086137747090b9b48b8ed28a76e366f1525e69e64207037bb28625a6`
- **状态**: ✅ 运行中

## 📋 测试步骤

### 步骤 1：访问定价页面

打开浏览器访问：
```
http://localhost:3000/pricing
```

或者如果需要登录：
```
http://localhost:3000/auth/login
```

### 步骤 2：选择套餐

页面上有三个标签：
- **Monthly** - 月度订阅（3个套餐）
- **Yearly** - 年度订阅（3个套餐，享20%折扣）
- **Credits** - 一次性积分包（3个套餐）

选择任意一个套餐，点击 "Subscribe" 或 "Buy Now" 按钮。

### 步骤 3：使用测试卡号支付

Stripe 会重定向到支付页面，使用以下测试卡号：

#### ✅ 成功支付
```
卡号: 4242 4242 4242 4242
过期日期: 12/34 (任何未来日期)
CVC: 123 (任意3位数字)
邮编: 12345 (任意)
```

#### 🔐 需要 3D 验证（测试 3D Secure）
```
卡号: 4000 0025 0000 3155
```

#### ❌ 支付失败（测试错误处理）
```
卡号: 4000 0000 0000 9995
```

### 步骤 4：验证支付结果

#### 在浏览器中：
1. 支付成功后会重定向到：`http://localhost:3000/payment/success`
2. 页面显示支付成功信息

#### 在 Webhook 终端中：
查看 Stripe CLI 终端，应该看到类似输出：
```
→ POST /api/payment/webhook [200]
  evt_xxx checkout.session.completed
```

#### 在数据库中：
检查 Supabase 数据库：
1. `transactions` 表 - 应该有新的交易记录
2. `user_profiles` 表 - 用户积分应该增加
3. `credit_history` 表 - 应该有积分历史记录

## 🔍 测试场景

### 场景 1：一次性积分购买
1. 选择 "Credits" 标签
2. 选择 "Starter Pack" ($9.99 - 1000 credits)
3. 完成支付
4. 验证：用户积分 +1000

### 场景 2：月度订阅
1. 选择 "Monthly" 标签
2. 选择 "Pro Monthly" ($49.99/月 - 5000 credits)
3. 完成支付
4. 验证：
   - 用户积分 +5000
   - `membership_tier` = 'subscription'
   - `subscription_end_date` 设置为下个月

### 场景 3：年度订阅
1. 选择 "Yearly" 标签
2. 选择 "Pro Annual" ($479.88/年)
3. 完成支付
4. 验证：
   - 用户积分 +5000
   - `membership_tier` = 'subscription'
   - `subscription_end_date` 设置为明年

## 🐛 常见问题排查

### 问题 1：点击购买按钮没有反应
**原因**: 未登录
**解决**: 先登录账号

### 问题 2：支付后没有跳转到成功页面
**原因**: 
- Webhook 未正确配置
- Webhook Secret 不正确

**检查**:
1. Stripe CLI 是否正在运行
2. `.env.local` 中的 `STRIPE_WEBHOOK_SECRET` 是否正确
3. 查看 Webhook 终端是否收到事件

### 问题 3：积分没有增加
**原因**: Webhook 处理失败

**检查**:
1. 查看 Next.js 开发服务器终端的错误日志
2. 查看 Stripe CLI 终端的响应状态码
3. 检查 Supabase 数据库连接

### 问题 4：Price ID 未找到
**原因**: 环境变量配置错误

**解决**:
1. 确认 `.env.local` 中所有 Price IDs 都已配置
2. 重启开发服务器 (`npm run dev`)

## 📊 验证清单

测试完成后，确认以下内容：

- [ ] 一次性积分购买正常工作
- [ ] 月度订阅正常工作
- [ ] 年度订阅正常工作
- [ ] Webhook 事件正确接收
- [ ] 数据库记录正确创建
- [ ] 用户积分正确增加
- [ ] 支付成功页面正常显示
- [ ] 测试失败卡号能正确处理错误

## 🎯 下一步

测试通过后：

1. **生产环境配置**:
   - 在 Stripe Dashboard 创建生产环境的 Webhook
   - 更新生产环境的环境变量
   - 使用真实的 API 密钥（`sk_live_` 和 `pk_live_`）

2. **安全检查**:
   - 确保 `.env.local` 不会被提交到 Git
   - 验证 Webhook 签名验证正常工作
   - 测试错误处理和边界情况

3. **用户体验优化**:
   - 添加加载状态
   - 添加错误提示
   - 优化支付成功页面

## 📞 需要帮助？

如果遇到问题：
1. 查看 Stripe Dashboard 的 Logs
2. 查看 Next.js 开发服务器日志
3. 查看 Stripe CLI 终端输出
4. 检查 Supabase 数据库

---

**测试愉快！** 🚀
