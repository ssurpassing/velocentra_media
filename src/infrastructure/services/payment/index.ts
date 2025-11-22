import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// 创建结账会话
export async function createCheckoutSession(params: {
  userId: string;
  priceId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  planId?: string;
  planName?: string;
  credits?: number;
  generationQuota?: number;
}): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: params.priceId,
          quantity: params.quantity || 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
      metadata: {
        userId: params.userId,
        planId: params.planId || '',
        planName: params.planName || '',
        credits: params.credits?.toString() || '0',
        generationQuota: params.generationQuota?.toString() || '0',
        type: 'credit_purchase',
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session',
    };
  }
}

// 创建订阅会话
export async function createSubscriptionSession(params: {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  planId?: string;
  planName?: string;
  credits?: number;
}): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
      metadata: {
        userId: params.userId,
        planId: params.planId || '',
        planName: params.planName || '',
        credits: params.credits?.toString() || '0',
        type: 'subscription',
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error: any) {
    console.error('Create subscription session error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create subscription session',
    };
  }
}

// 验证 Webhook 签名
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

// 取消订阅
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return { success: true };
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel subscription',
    };
  }
}

// 获取订阅详情
export async function getSubscription(
  subscriptionId: string
): Promise<{ success: boolean; subscription?: Stripe.Subscription; error?: string }> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      success: true,
      subscription,
    };
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get subscription',
    };
  }
}


