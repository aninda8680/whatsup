import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { PRICING_TIERS } from '@/lib/pricing';
import { Tier, Entitlement, Payment } from '@/lib/types';

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

    // Verify signature using constant-time comparison
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      console.warn('Webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // We only care about successful payments
    if (event.event === 'payment.captured') {
      const paymentData = event.payload.payment.entity;
      const orderId = paymentData.order_id;
      
      if (!orderId) {
         console.error('Webhook payload missing order_id');
         return NextResponse.json({ received: true });
      }

      // Idempotency check
      const paymentRef = adminDb.collection('payments').doc(orderId);
      const paymentSnap = await paymentRef.get();
      
      if (paymentSnap.exists) {
        const p = paymentSnap.data() as Payment;
        if (p.status === 'verified') {
          console.log(`Order ${orderId} already verified. Ignoring duplicate webhook.`);
          return NextResponse.json({ received: true });
        }
      }

      const { hostId, tierId } = paymentData.notes;

      if (!hostId || !tierId) {
        console.error('Payment captured without hostId or tierId in notes:', paymentData.id);
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
        status: 'active',
        lastPaymentId: paymentData.id,
      };

      // Batch write to update both payment and entitlement transactionally (or atomically)
      const batch = adminDb.batch();
      
      batch.update(paymentRef, {
        status: 'verified',
        razorpayPaymentId: paymentData.id,
        verifiedAt: now
      });

      const entitlementRef = adminDb.collection('entitlements').doc(hostId);
      batch.set(entitlementRef, entitlement);

      await batch.commit();

      console.log(`Entitlement granted for ${hostId}: ${tier.name} via order ${orderId}`);
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

