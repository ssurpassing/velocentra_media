import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/database/server-client';
import { constructWebhookEvent } from '@/infrastructure/services/payment';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] No signature provided');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = constructWebhookEvent(body, signature);

    if (!event) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Webhook] Received event: ${event.type}, ID: ${event.id}`);

    const supabase = createAdminClient();

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const sessionId = session.id;

        console.log(`[Webhook] Processing checkout.session.completed for user: ${userId}, session: ${sessionId}`);

        if (!userId) {
          console.error('[Webhook] No userId in session');
          break;
        }

        // 幂等性检查：检查是否已经处理过这个 session
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .single();

        if (existingTransaction) {
          console.log(`[Webhook] Session ${sessionId} already processed, skipping`);
          break;
        }

        // 判断是积分购买还是订阅
        if (session.mode === 'payment') {
          // 积分包购买
          const creditsAmount = session.metadata?.credits ? parseInt(session.metadata.credits) : 0;
          const generationQuota = session.metadata?.generationQuota ? parseInt(session.metadata.generationQuota) : 0;
          const planId = session.metadata?.planId || '';
          const planName = session.metadata?.planName || 'Unknown Plan';

          console.log(`[Webhook] Credit pack purchase: ${creditsAmount} credits + ${generationQuota} generations for user ${userId}`);

          if (creditsAmount === 0) {
            console.error('[Webhook] Invalid credits amount: 0');
            break;
          }

          // 创建交易记录
          const { error: transactionError } = await supabase.from('transactions').insert({
            user_id: userId,
            type: 'credit_purchase',
            amount_cents: session.amount_total || 0,
            credits_amount: creditsAmount,
            currency: session.currency?.toUpperCase() || 'USD',
            stripe_payment_id: session.payment_intent as string,
            stripe_session_id: sessionId,
            plan_id: planId,
            plan_name: planName,
            status: 'completed',
          });

          if (transactionError) {
            console.error('[Webhook] Failed to create transaction:', transactionError);
            throw transactionError;
          }

          console.log('[Webhook] Transaction record created');

          // 获取当前用户信息
          const { data: profile, error: profileFetchError } = await supabase
            .from('user_profiles')
            .select('credits, free_generations_remaining')
            .eq('id', userId)
            .single();

          if (profileFetchError) {
            console.error('[Webhook] Failed to fetch user profile:', profileFetchError);
            throw profileFetchError;
          }

          const oldCredits = profile?.credits || 0;
          const oldQuota = profile?.free_generations_remaining || 0;
          const newCredits = oldCredits + creditsAmount;
          const newQuota = oldQuota + generationQuota;

          console.log(`[Webhook] Updating credits: ${oldCredits} -> ${newCredits}`);
          console.log(`[Webhook] Updating generation quota: ${oldQuota} -> ${newQuota}`);

          // 更新积分和生成次数（积分会员）
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              credits: newCredits,
              free_generations_remaining: newQuota,
              membership_tier: 'credits', // 积分会员
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (updateError) {
            console.error('[Webhook] Failed to update user credits:', updateError);
            throw updateError;
          }

          console.log('[Webhook] User credits and quota updated successfully');

          // 更新支付意图状态为 completed
          await supabase
            .from('payment_intents')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq('stripe_session_id', sessionId);

          // 记录积分历史
          const { error: historyError } = await supabase.from('credit_history').insert({
            user_id: userId,
            amount: creditsAmount,
            type: 'purchase',
            balance_after: newCredits,
            description: `Purchased ${creditsAmount} credits - ${planName}`,
            metadata: {
              sessionId,
              planId,
              planName,
            },
          });

          if (historyError) {
            console.error('[Webhook] Failed to create credit history:', historyError);
            // 不抛出错误，因为积分已经添加成功
          } else {
            console.log('[Webhook] Credit history recorded');
          }

          console.log(`[Webhook] ✅ Credit purchase completed successfully for user ${userId}`);
        } else if (session.mode === 'subscription') {
          // 订阅（月付或年付）
          const planId = session.metadata?.planId || '';
          const planName = session.metadata?.planName || 'Unknown Plan';
          const creditsPerMonth = session.metadata?.credits ? parseInt(session.metadata.credits) : 0;
          const isYearly = planId.includes('yearly');
          
          // 年付一次性发放全年积分，月付发放一个月积分
          const creditsToAdd = isYearly ? creditsPerMonth * 12 : creditsPerMonth;
          const subscriptionMonths = isYearly ? 12 : 1;

          console.log(`[Webhook] Subscription: ${planName} for user ${userId} (${isYearly ? 'Yearly' : 'Monthly'})`);
          console.log(`[Webhook] Credits to add: ${creditsToAdd}`);

          const { error: transactionError } = await supabase.from('transactions').insert({
            user_id: userId,
            type: 'subscription',
            amount_cents: session.amount_total || 0,
            currency: session.currency?.toUpperCase() || 'USD',
            stripe_subscription_id: session.subscription as string,
            stripe_session_id: sessionId,
            plan_id: planId,
            plan_name: planName,
            status: 'completed',
          });

          if (transactionError) {
            console.error('[Webhook] Failed to create subscription transaction:', transactionError);
            throw transactionError;
          }

          // 获取当前用户信息
          const { data: profile, error: profileFetchError } = await supabase
            .from('user_profiles')
            .select('credits, subscription_end_date')
            .eq('id', userId)
            .single();

          if (profileFetchError) {
            console.error('[Webhook] Failed to fetch user profile:', profileFetchError);
            throw profileFetchError;
          }

          const oldCredits = profile?.credits || 0;
          const newCredits = oldCredits + creditsToAdd;

          // 计算新的订阅结束时间（累加）
          const now = new Date();
          let currentEndDate = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : now;
          
          // 如果订阅已过期，从现在开始计算
          if (currentEndDate < now) {
            currentEndDate = now;
          }
          
          // 累加订阅时间
          const newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + subscriptionMonths);

          console.log(`[Webhook] Subscription credits: ${oldCredits} -> ${newCredits}`);
          console.log(`[Webhook] Subscription end date: ${currentEndDate.toISOString()} -> ${newEndDate.toISOString()}`);

          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              membership_tier: 'subscription', // 订阅会员
              subscription_end_date: newEndDate.toISOString(),
              credits: newCredits, // 累加积分
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (updateError) {
            console.error('[Webhook] Failed to update subscription status:', updateError);
            throw updateError;
          }

          // 记录积分历史
          const { error: historyError } = await supabase.from('credit_history').insert({
            user_id: userId,
            amount: creditsToAdd,
            type: 'subscription',
            balance_after: newCredits,
            description: `Subscription activated - ${planName} (${isYearly ? 'Yearly' : 'Monthly'})`,
            metadata: {
              sessionId,
              planId,
              planName,
              isYearly,
              subscriptionMonths,
            },
          });

          if (historyError) {
            console.error('[Webhook] Failed to create credit history:', historyError);
          }

          // 更新支付意图状态为 completed
          await supabase
            .from('payment_intents')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              stripe_subscription_id: session.subscription as string,
            })
            .eq('stripe_session_id', sessionId);

          console.log(`[Webhook] ✅ Subscription activated successfully for user ${userId}`);
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


