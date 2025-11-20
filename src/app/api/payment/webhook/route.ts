import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/database/server-client';
import { constructWebhookEvent } from '@/infrastructure/services/payment';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = constructWebhookEvent(body, signature);

    if (!event) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (!userId) break;

        // 判断是积分购买还是订阅
        if (session.mode === 'payment') {
          // 积分购买
          const creditsAmount = session.metadata?.credits ? parseInt(session.metadata.credits) : 100;

          // 创建交易记录
          await supabase.from('transactions').insert({
            user_id: userId,
            type: 'credit_purchase',
            amount_cents: session.amount_total || 0,
            credits_amount: creditsAmount,
            currency: session.currency?.toUpperCase() || 'USD',
            stripe_payment_id: session.payment_intent as string,
            status: 'completed',
          });

          // 增加用户积分
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('credits')
            .eq('id', userId)
            .single();

          const newCredits = (profile?.credits || 0) + creditsAmount;

          await supabase
            .from('user_profiles')
            .update({
              credits: newCredits,
              membership_tier: 'credits',
            })
            .eq('id', userId);

          // 记录积分历史
          await supabase.from('credit_history').insert({
            user_id: userId,
            amount: creditsAmount,
            type: 'purchase',
            balance_after: newCredits,
            description: `Purchased ${creditsAmount} credits`,
          });
        } else if (session.mode === 'subscription') {
          // 订阅
          await supabase.from('transactions').insert({
            user_id: userId,
            type: 'subscription',
            amount_cents: session.amount_total || 0,
            currency: session.currency?.toUpperCase() || 'USD',
            stripe_subscription_id: session.subscription as string,
            status: 'completed',
          });

          // 更新用户订阅状态
          const subscriptionEndDate = new Date();
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

          await supabase
            .from('user_profiles')
            .update({
              membership_tier: 'subscription',
              subscription_end_date: subscriptionEndDate.toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // 取消订阅
        await supabase
          .from('user_profiles')
          .update({
            membership_tier: 'free',
            subscription_end_date: null,
          })
          .eq('id', subscription.metadata.userId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


