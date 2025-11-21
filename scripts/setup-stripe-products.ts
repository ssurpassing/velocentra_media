/**
 * Stripe 产品和价格自动创建脚本
 * 
 * 使用方法：
 * 1. 确保 .env.local 中已配置 STRIPE_SECRET_KEY
 * 2. 运行: npm run setup-stripe
 * 3. 脚本会自动创建所有产品和价格，并输出 Price IDs
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

// 加载 .env.local 文件
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

// 从环境变量读取 Stripe Secret Key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ 错误: 请先在 .env.local 中配置 STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
});

// 产品配置
const products = [
  // 月度订阅
  {
    name: 'Basic Monthly',
    description: '1000 credits per month - Perfect for casual users',
    price: 9.99,
    interval: 'month' as const,
    credits: 1000,
    envKey: 'STRIPE_PRICE_ID_MONTHLY_1000',
  },
  {
    name: 'Pro Monthly',
    description: '5000 credits per month - Best for regular users',
    price: 49.99,
    interval: 'month' as const,
    credits: 5000,
    envKey: 'STRIPE_PRICE_ID_MONTHLY_5000',
  },
  {
    name: 'Premium Monthly',
    description: '10000 credits per month - For power users',
    price: 99.99,
    interval: 'month' as const,
    credits: 10000,
    envKey: 'STRIPE_PRICE_ID_MONTHLY_10000',
  },
  // 年度订阅 (20% 折扣)
  {
    name: 'Basic Annual',
    description: '1000 credits per month - Save 20% with annual billing',
    price: 95.88,
    interval: 'year' as const,
    credits: 1000,
    envKey: 'STRIPE_PRICE_ID_YEARLY_1000',
  },
  {
    name: 'Pro Annual',
    description: '5000 credits per month - Save 20% with annual billing',
    price: 479.88,
    interval: 'year' as const,
    credits: 5000,
    envKey: 'STRIPE_PRICE_ID_YEARLY_5000',
  },
  {
    name: 'Premium Annual',
    description: '10000 credits per month - Save 20% with annual billing',
    price: 959.88,
    interval: 'year' as const,
    credits: 10000,
    envKey: 'STRIPE_PRICE_ID_YEARLY_10000',
  },
  // 一次性积分包
  {
    name: 'Starter Pack',
    description: '1000 credits - One-time purchase, never expires',
    price: 9.99,
    interval: null,
    credits: 1000,
    envKey: 'STRIPE_PRICE_ID_CREDITS_1000',
  },
  {
    name: 'Pro Pack',
    description: '5000 credits - One-time purchase, never expires',
    price: 49.99,
    interval: null,
    credits: 5000,
    envKey: 'STRIPE_PRICE_ID_CREDITS_5000',
  },
  {
    name: 'Premium Pack',
    description: '10000 credits - One-time purchase, never expires',
    price: 99.99,
    interval: null,
    credits: 10000,
    envKey: 'STRIPE_PRICE_ID_CREDITS_10000',
  },
];

async function createStripeProducts() {
  console.log('🚀 开始创建 Stripe 产品和价格...\n');

  const envUpdates: string[] = [];
  const results: Array<{ name: string; priceId: string; envKey: string }> = [];

  for (const productConfig of products) {
    try {
      console.log(`📦 创建产品: ${productConfig.name}`);

      // 创建产品
      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: {
          credits: productConfig.credits.toString(),
        },
      });

      console.log(`   ✅ 产品已创建: ${product.id}`);

      // 创建价格
      const priceParams: Stripe.PriceCreateParams = {
        product: product.id,
        unit_amount: Math.round(productConfig.price * 100), // 转换为分
        currency: 'usd',
        metadata: {
          credits: productConfig.credits.toString(),
        },
      };

      // 根据类型设置计费周期
      if (productConfig.interval) {
        priceParams.recurring = {
          interval: productConfig.interval,
        };
      }

      const price = await stripe.prices.create(priceParams);

      console.log(`   ✅ 价格已创建: ${price.id}`);
      console.log(`   💰 价格: $${productConfig.price} ${productConfig.interval ? `/ ${productConfig.interval}` : '(一次性)'}`);
      console.log('');

      results.push({
        name: productConfig.name,
        priceId: price.id,
        envKey: productConfig.envKey,
      });

      envUpdates.push(`${productConfig.envKey}=${price.id}`);
    } catch (error: any) {
      console.error(`   ❌ 创建失败: ${error.message}\n`);
    }
  }

  // 生成环境变量配置
  console.log('\n' + '='.repeat(80));
  console.log('✅ 所有产品创建完成！\n');
  console.log('📋 请将以下内容添加到你的 .env.local 文件中：\n');
  console.log('# Stripe Price IDs (自动生成)');
  console.log(envUpdates.join('\n'));
  console.log('\n' + '='.repeat(80));

  // 保存到文件
  const outputPath = path.join(process.cwd(), 'stripe-price-ids.txt');
  const output = [
    '# Stripe Price IDs',
    `# 生成时间: ${new Date().toLocaleString('zh-CN')}`,
    '',
    ...envUpdates,
    '',
    '# 产品详情:',
    ...results.map(r => `# ${r.name}: ${r.priceId}`),
  ].join('\n');

  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`\n💾 Price IDs 已保存到: ${outputPath}\n`);

  // 生成表格
  console.log('📊 产品列表:\n');
  console.log('| 产品名称 | Price ID | 环境变量 |');
  console.log('|---------|----------|---------|');
  results.forEach(r => {
    console.log(`| ${r.name} | ${r.priceId} | ${r.envKey} |`);
  });
  console.log('');
}

// 执行脚本
createStripeProducts()
  .then(() => {
    console.log('✨ 完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
