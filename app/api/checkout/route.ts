import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { PRICING_TIERS } from '@/lib/pricing';
import { Tier } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hostId, tierId } = body;

    if (!hostId || !tierId) {
      return NextResponse.json({ error: 'Missing hostId or tierId' }, { status: 400 });
    }

    const tier = PRICING_TIERS[tierId as Tier];
    if (!tier || tier.priceInr <= 0) {
      return NextResponse.json({ error: 'Invalid or free tier requested' }, { status: 400 });
    }

    // Create order in Razorpay
    const options = {
      amount: tier.priceInr * 100, // Razorpay works in paise
      currency: 'INR',
      receipt: `rcpt_${hostId}_${Date.now()}`,
      notes: {
        hostId,
        tierId,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
