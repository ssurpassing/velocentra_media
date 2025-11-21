import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';
import { createCheckoutSession, createSubscriptionSession } from '@/infrastructure/services/payment';
import { PRICING_PLANS } from '@/shared/config/pricing';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 验证用户登录
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, priceId: directPriceId, type = 'payment' } = body;

    // 支持两种方式：直接传 priceId（向后兼容）或传 planId（新方式）
    let priceId = directPriceId;
    
    if (!priceId && planId) {
      // 从 planId 查找对应的 stripePriceId
      const plan = PRICING_PLANS.find(p => p.id === planId);
      if (!plan || !plan.stripePriceId) {
        return NextResponse.json({ 
          success: false, 
          error: `Invalid plan ID or missing Stripe Price ID for plan: ${planId}` 
        }, { status: 400 });
      }
      priceId = plan.stripePriceId;
    }

    if (!priceId) {
      return NextResponse.json({ success: false, error: 'Price ID or Plan ID is required' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/pricing`;

    // 获取计划详情
    const plan = planId ? PRICING_PLANS.find(p => p.id === planId) : null;

    // 记录支付意图（用户点击了订阅按钮）
    const { data: paymentIntent, error: intentError } = await supabase
      .from('payment_intents')
      .insert({
        user_id: user.id,
        plan_id: planId || '',
        plan_name: plan?.name || 'Unknown',
        plan_type: type === 'subscription' ? 'subscription' : 'credit_purchase',
        amount_cents: 0, // 暂时为0，后续从 Stripe 获取
        credits_amount: plan?.credits || 0,
        status: 'initiated',
        initiated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (intentError) {
      console.error('Failed to create payment intent record:', intentError);
      // 不阻断流程，继续执行
    }

    let result;
    if (type === 'subscription') {
      result = await createSubscriptionSession({
        userId: user.id,
        priceId,
        successUrl,
        cancelUrl,
        planId: planId || '',
        planName: plan?.name || '',
        credits: plan?.credits || 0,
      });
    } else {
      result = await createCheckoutSession({
        userId: user.id,
        priceId,
        successUrl,
        cancelUrl,
        planId: planId || '',
        planName: plan?.name || '',
        credits: plan?.credits || 0,
      });
    }

    if (!result.success || !result.url) {
      // 更新支付意图状态为失败
      if (paymentIntent?.id) {
        await supabase
          .from('payment_intents')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            failure_reason: result.error || 'Failed to create checkout session',
          })
          .eq('id', paymentIntent.id);
      }
      
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    // 更新支付意图状态为 checkout_created
    if (paymentIntent?.id && result.sessionId) {
      await supabase
        .from('payment_intents')
        .update({
          stripe_session_id: result.sessionId,
          status: 'checkout_created',
          checkout_created_at: new Date().toISOString(),
        })
        .eq('id', paymentIntent.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        url: result.url,
      },
    });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}


