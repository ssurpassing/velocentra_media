import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';
import { createCheckoutSession, createSubscriptionSession } from '@/infrastructure/services/payment';

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
    const { priceId, type = 'payment' } = body;

    if (!priceId) {
      return NextResponse.json({ success: false, error: 'Price ID is required' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/pricing`;

    let result;
    if (type === 'subscription') {
      result = await createSubscriptionSession({
        userId: user.id,
        priceId,
        successUrl,
        cancelUrl,
      });
    } else {
      result = await createCheckoutSession({
        userId: user.id,
        priceId,
        successUrl,
        cancelUrl,
      });
    }

    if (!result.success || !result.url) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create checkout session' },
        { status: 500 }
      );
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


