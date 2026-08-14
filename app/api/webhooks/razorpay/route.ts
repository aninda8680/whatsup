import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { PRICING_TIERS } from '@/lib/pricing';
import { Tier, Entitlement } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // We only care about successful payments
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const { hostId, tierId } = payment.notes;

      if (!hostId || !tierId) {
        console.error('Payment captured without hostId or tierId in notes:', payment.id);
        return NextResponse.json({ received: true });
      }

      const tier = PRICING_TIERS[tierId as Tier];
      if (!tier) {
        console.error('Payment captured for unknown tier:', tierId);
        return NextResponse.json({ received: true });
      }

      const now = Date.now();
      const expiresAt = now + tier.durationDays * 24 * 60 * 60 * 1000;

      const entitlement: Entitlement = {
        hostId,
        tier: tier.id,
        participantCap: tier.participantCap,
        purchasedAt: now,
        expiresAt,
        paymentId: payment.id,
      };

      // Write to Firestore securely via Admin SDK.
      // We use setDoc (which is essentially .set()) to overwrite or create.
      // This is idempotent because Razorpay sends payment.captured only once per payment usually,
      // and if it retries, it writes the same data.
      await adminDb.collection('entitlements').doc(hostId).set(entitlement);

      console.log(`Entitlement granted for ${hostId}: ${tier.name}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
