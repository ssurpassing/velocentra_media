/**
 * Stripe 商品和价格创建脚本 V2
 * 
 * 根据新的会员规则创建 Stripe 商品和价格
 * 
 * 使用方法:
 * 1. 确保 .env.local 中配置了 STRIPE_SECRET_KEY
 * 2. 运行: npx tsx scripts/setup-stripe-products-v2.ts
 * 3. 将输出的 Price ID 更新到 .env.local
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// 定义商品配置
interface ProductConfig {
  id: string;
  name: string;
  description: string;
  type: 'one_time' | 'recurring';
  interval?: 'month' | 'year';
  price: number;
  credits: number;
  generationQuota?: number;
  metadata: Record<string, string>;
}

const products: ProductConfig[] = [
  // ==================== 月付订阅 ====================
  {
    id: 'subscription-monthly-1000',
    name: 'Basic Monthly Subscription',
    description: '1000 credits per month with unlimited generations',
    type: 'recurring',
    interval: 'month',
    price: 9.99,
    credits: 1000,
    metadata: {
      type: 'subscription',
      interval: 'month',
      credits: '1000',
      unlimited_generations: 'true',
    },
  },
  {
    id: 'subscription-monthly-5000',
    name: 'Pro Monthly Subscription',
    description: '5000 credits per month with unlimited generations',
    type: 'recurring',
    interval: 'month',
    price: 49.99,
    credits: 5000,
    metadata: {
      type: 'subscription',
      interval: 'month',
      credits: '5000',
      unlimited_generations: 'true',
      popular: 'true',
    },
  },
  {
    id: 'subscription-monthly-10000',
    name: 'Premium Monthly Subscription',
    description: '10000 credits per month with unlimited generations',
    type: 'recurring',
    interval: 'month',
    price: 99.99,
    credits: 10000,
    metadata: {
      type: 'subscription',
      interval: 'month',
      credits: '10000',
      unlimited_generations: 'true',
    },
  },

  // ==================== 年付订阅 ====================
  {
    id: 'subscription-yearly-1000',
    name: 'Basic Annual Subscription',
    description: '12000 credits upfront (1000/month × 12) with unlimited generations',
    type: 'recurring',
    interval: 'year',
    price: 95.88, // $7.99 × 12
    credits: 1000, // 每月积分（webhook 会 × 12）
    metadata: {
      type: 'subscription',
      interval: 'year',
      credits: '1000',
      total_credits: '12000',
      unlimited_generations: 'true',
      discount: '20%',
    },
  },
  {
    id: 'subscription-yearly-5000',
    name: 'Pro Annual Subscription',
    description: '60000 credits upfront (5000/month × 12) with unlimited generations',
    type: 'recurring',
    interval: 'year',
    price: 479.88, // $39.99 × 12
    credits: 5000,
    metadata: {
      type: 'subscription',
      interval: 'year',
      credits: '5000',
      total_credits: '60000',
      unlimited_generations: 'true',
      discount: '20%',
      popular: 'true',
    },
  },
  {
    id: 'subscription-yearly-10000',
    name: 'Premium Annual Subscription',
    description: '120000 credits upfront (10000/month × 12) with unlimited generations',
    type: 'recurring',
    interval: 'year',
    price: 959.88, // $79.99 × 12
    credits: 10000,
    metadata: {
      type: 'subscription',
      interval: 'year',
      credits: '10000',
      total_credits: '120000',
      unlimited_generations: 'true',
      discount: '20%',
    },
  },

  // ==================== 积分包（一次性购买）====================
  {
    id: 'credits-1000',
    name: 'Starter Credit Pack',
    description: '1000 credits + 300 generation quota (never expires)',
    type: 'one_time',
    price: 9.99,
    credits: 1000,
    generationQuota: 300,
    metadata: {
      type: 'credit_pack',
      credits: '1000',
      generation_quota: '300',
      never_expires: 'true',
    },
  },
  {
    id: 'credits-5000',
    name: 'Pro Credit Pack',
    description: '5000 credits + 1000 generation quota (never expires)',
    type: 'one_time',
    price: 49.99,
    credits: 5000,
    generationQuota: 1000,
    metadata: {
      type: 'credit_pack',
      credits: '5000',
      generation_quota: '1000',
      never_expires: 'true',
    },
  },
  {
    id: 'credits-10000',
    name: 'Premium Credit Pack',
    description: '10000 credits + 3000 generation quota (never expires)',
    type: 'one_time',
    price: 99.99,
    credits: 10000,
    generationQuota: 3000,
    metadata: {
      type: 'credit_pack',
      credits: '10000',
      generation_quota: '3000',
      never_expires: 'true',
    },
  },
];

async function createProducts() {
  console.log('🚀 Starting Stripe product creation...\n');
  
  const results: Array<{
    id: string;
    name: string;
    productId: string;
    priceId: string;
    envKey: string;
  }> = [];

  for (const config of products) {
    try {
      console.log(`📦 Creating: ${config.name}`);
      
      // 创建商品
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: config.metadata,
      });
      
      console.log(`   ✅ Product created: ${product.id}`);

      // 创建价格
      const priceData: Stripe.PriceCreateParams = {
        product: product.id,
        currency: 'usd',
        unit_amount: Math.round(config.price * 100), // 转换为分
        metadata: {
          ...config.metadata,
          credits: config.credits.toString(),
          ...(config.generationQuota && { generation_quota: config.generationQuota.toString() }),
        },
      };

      // 如果是订阅，添加 recurring 参数
      if (config.type === 'recurring') {
        priceData.recurring = {
          interval: config.interval!,
        };
      }

      const price = await stripe.prices.create(priceData);
      
      console.log(`   ✅ Price created: ${price.id}`);
      console.log(`   💰 Amount: $${config.price}`);
      if (config.generationQuota) {
        console.log(`   🎫 Generation Quota: ${config.generationQuota}`);
      }
      console.log('');

      // 生成环境变量名
      const envKey = `STRIPE_PRICE_ID_${config.id.toUpperCase().replace(/-/g, '_')}`;
      
      results.push({
        id: config.id,
        name: config.name,
        productId: product.id,
        priceId: price.id,
        envKey,
      });
      
    } catch (error: any) {
      console.error(`   ❌ Error creating ${config.name}:`, error.message);
    }
  }

  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Stripe Product & Price Setup Script V2');
  console.log('  New Membership Rules Implementation');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY not found in .env.local');
    process.exit(1);
  }

  const results = await createProducts();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ All products and prices created successfully!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 Environment Variables to add to .env.local:\n');
  console.log('# Stripe Price IDs (Generated by setup-stripe-products-v2.ts)');
  console.log('# Monthly Subscriptions');
  results
    .filter(r => r.id.includes('monthly'))
    .forEach(r => {
      console.log(`${r.envKey}=${r.priceId}`);
    });
  
  console.log('\n# Annual Subscriptions');
  results
    .filter(r => r.id.includes('yearly'))
    .forEach(r => {
      console.log(`${r.envKey}=${r.priceId}`);
    });
  
  console.log('\n# Credit Packs');
  results
    .filter(r => r.id.includes('credits-'))
    .forEach(r => {
      console.log(`${r.envKey}=${r.priceId}`);
    });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  📝 Next Steps:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('1. Copy the environment variables above');
  console.log('2. Add them to your .env.local file');
  console.log('3. Restart your development server: npm run dev');
  console.log('4. Test the payment flow');
  console.log('\n💡 For production deployment, see: docs/stripe-production-setup.md\n');
}

main().catch(console.error);
