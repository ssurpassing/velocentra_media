export interface PricingPlan {
  id: string;
  name: string; // fallback，组件中应使用: pricing.plans.{id}.name
  description: string; // fallback，组件中应使用: pricing.plans.{id}.description
  price: number;
  currency: string;
  interval?: 'month' | 'year';
  credits?: number;
  features: string[]; // fallback，组件中应使用: pricing.plans.{id}.features
  popular?: boolean;
  stripePriceId?: string;
  discount?: string; // e.g., "20%"
  originalPrice?: number; // Original price before discount
}

export const PRICING_PLANS: PricingPlan[] = [
  // Monthly Subscriptions
  {
    id: 'subscription-monthly-1000',
    name: 'Basic Monthly',
    description: '1000 credits per month',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    credits: 1000,
    features: [
      '1000 credits monthly',
      'High quality images',
      'All styles available',
      'Permanent storage',
      'Premium member access',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY_1000,
  },
  {
    id: 'subscription-monthly-5000',
    name: 'Pro Monthly',
    description: '5000 credits per month',
    price: 49.99,
    currency: 'USD',
    interval: 'month',
    credits: 5000,
    features: [
      '5000 credits monthly',
      'High quality images',
      'All styles available',
      'Permanent storage',
      'Priority processing',
      'Premium member access',
    ],
    popular: true,
    stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY_5000,
  },
  {
    id: 'subscription-monthly-10000',
    name: 'Premium Monthly',
    description: '10000 credits per month',
    price: 99.99,
    currency: 'USD',
    interval: 'month',
    credits: 10000,
    features: [
      '10000 credits monthly',
      'Highest quality images',
      'All styles available',
      'Permanent storage',
      'Priority processing',
      'Dedicated support',
      'Premium member access',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY_10000,
  },
  // Annual Subscriptions (20% discount)
  {
    id: 'subscription-yearly-1000',
    name: 'Basic Annual',
    description: '1000 credits per month',
    price: 95.88, // $7.99 × 12 months
    originalPrice: 119.88, // $9.99 × 12 months
    discount: '20%',
    currency: 'USD',
    interval: 'year',
    credits: 1000,
    features: [
      '1000 credits monthly',
      'High quality images',
      'All styles available',
      'Permanent storage',
      'Premium member access',
      'Save $24/year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_YEARLY_1000,
  },
  {
    id: 'subscription-yearly-5000',
    name: 'Pro Annual',
    description: '5000 credits per month',
    price: 479.88, // $39.99 × 12 months
    originalPrice: 599.88, // $49.99 × 12 months
    discount: '20%',
    currency: 'USD',
    interval: 'year',
    credits: 5000,
    features: [
      '5000 credits monthly',
      'High quality images',
      'All styles available',
      'Permanent storage',
      'Priority processing',
      'Premium member access',
      'Save $120/year',
    ],
    popular: true,
    stripePriceId: process.env.STRIPE_PRICE_ID_YEARLY_5000,
  },
  {
    id: 'subscription-yearly-10000',
    name: 'Premium Annual',
    description: '10000 credits per month',
    price: 959.88, // $79.99 × 12 months
    originalPrice: 1199.88, // $99.99 × 12 months
    discount: '20%',
    currency: 'USD',
    interval: 'year',
    credits: 10000,
    features: [
      '10000 credits monthly',
      'Highest quality images',
      'All styles available',
      'Permanent storage',
      'Priority processing',
      'Dedicated support',
      'Premium member access',
      'Save $240/year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_YEARLY_10000,
  },
  // One-time Credit Packages
  {
    id: 'credits-1000',
    name: 'Starter Pack',
    description: 'One-time credit package',
    price: 9.99,
    currency: 'USD',
    credits: 1000,
    features: [
      '1000 credits',
      'Never expires',
      'High quality images',
      'All styles available',
      'Permanent storage',
      'Premium member access',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_CREDITS_1000,
  },
  {
    id: 'credits-5000',
    name: 'Pro Pack',
    description: 'One-time credit package',
    price: 49.99,
    currency: 'USD',
    credits: 5000,
    features: [
      '5000 credits',
      'Never expires',
      'High quality images',
      'All styles available',
      'Permanent storage',
      'Priority processing',
      'Premium member access',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_CREDITS_5000,
  },
  {
    id: 'credits-10000',
    name: 'Premium Pack',
    description: 'One-time credit package',
    price: 99.99,
    currency: 'USD',
    credits: 10000,
    features: [
      '10000 credits',
      'Never expires',
      'Highest quality images',
      'All styles available',
      'Permanent storage',
      'Priority processing',
      'Dedicated support',
      'Premium member access',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_CREDITS_10000,
  },
];

// 获取定价计划
export function getPricingPlan(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

// 积分成本管理已迁移到 model-credits.ts
// 这些函数保留以保持向后兼容性
import { 
  calculateImageCredits, 
  VIDEO_MODEL_CREDITS 
} from './model-credits';

/**
 * @deprecated 使用 model-credits.ts 中的 calculateImageCredits 替代
 */
export function calculateCreditCost(model: string, style: string): number {
  return calculateImageCredits(model, style);
}

/**
 * @deprecated 使用 model-credits.ts 中的 VIDEO_MODEL_CREDITS 替代
 */
export const VIDEO_CREDIT_COSTS = VIDEO_MODEL_CREDITS;


