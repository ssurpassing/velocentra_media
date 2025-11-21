# Supabase 连接超时问题解决方案

## 问题描述
```
TypeError: fetch failed
ConnectTimeoutError: Connect Timeout Error (attempted address: qdvdjokqjegsrmzvitcc.supabase.co:443, timeout: 10000ms)
```

## 原因
1. 网络无法访问 Supabase 服务器（可能是防火墙、代理或网络问题）
2. DNS 解析问题
3. 中国大陆网络环境限制

## 解决方案

### 方案 1：使用代理（推荐）

如果您有代理服务器，可以配置 Node.js 使用代理：

在 `.env.local` 中添加：
```env
HTTP_PROXY=http://your-proxy:port
HTTPS_PROXY=http://your-proxy:port
```

或者在启动命令中设置：
```bash
# Windows PowerShell
$env:HTTP_PROXY="http://your-proxy:port"; $env:HTTPS_PROXY="http://your-proxy:port"; npm run dev

# Windows CMD
set HTTP_PROXY=http://your-proxy:port && set HTTPS_PROXY=http://your-proxy:port && npm run dev
```

### 方案 2：增加超时时间

修改 Supabase 客户端配置，增加超时时间。

编辑 `src/infrastructure/database/server-client.ts`，在创建客户端时添加：

```typescript
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // ... 其他配置
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // 增加超时到 30 秒
        signal: AbortSignal.timeout(30000),
      });
    },
  },
});
```

### 方案 3：使用本地 Supabase（开发环境）

1. 安装 Supabase CLI：
   ```bash
   npm install -g supabase
   ```

2. 初始化本地 Supabase：
   ```bash
   supabase init
   supabase start
   ```

3. 更新 `.env.local` 使用本地 Supabase：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<本地密钥>
   SUPABASE_SERVICE_ROLE_KEY=<本地服务密钥>
   ```

### 方案 4：检查网络和防火墙

1. **测试连接**：
   ```bash
   # 测试是否能访问 Supabase
   curl -I https://qdvdjokqjegsrmzvitcc.supabase.co
   
   # 或使用 PowerShell
   Test-NetConnection -ComputerName qdvdjokqjegsrmzvitcc.supabase.co -Port 443
   ```

2. **检查防火墙**：
   - 确保防火墙允许访问 `*.supabase.co`
   - 检查公司/学校网络是否有限制

3. **检查 DNS**：
   ```bash
   nslookup qdvdjokqjegsrmzvitcc.supabase.co
   ```

### 方案 5：使用 VPN

如果是网络环境限制，使用 VPN 可能是最简单的解决方案。

## 临时绕过（仅用于测试）

如果只是想快速测试支付功能，可以暂时注释掉 webhook 中的某些非关键操作：

**注意：这只是临时方案，生产环境必须修复连接问题！**

在 `src/app/api/payment/webhook/route.ts` 中，可以添加 try-catch 包裹每个 Supabase 操作，失败时记录日志但不中断流程：

```typescript
try {
  // Supabase 操作
} catch (error) {
  console.error('Supabase operation failed, but continuing...', error);
  // 不抛出错误，继续执行
}
```

## 推荐的生产环境配置

1. **使用 Supabase 的 Connection Pooler**（如果可用）
2. **配置重试机制**
3. **设置合理的超时时间**
4. **监控连接状态**
5. **准备降级方案**

## 当前状态

根据错误日志，webhook 处理失败是因为无法连接到 Supabase。这意味着：
- ✅ Stripe 支付成功
- ❌ Webhook 接收到事件
- ❌ 但无法更新数据库（积分未到账）

**解决连接问题后，可以手动触发 webhook 重试，或者手动添加积分。**
