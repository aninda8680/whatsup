import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    // Basic security to ensure only cron or authorized clients can run this.
    // In Vercel, you'd use a CRON_SECRET env variable.
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    
    // Query active entitlements that have expired
    const expiredSnap = await adminDb
      .collection('entitlements')
      .where('status', '==', 'active')
      .where('expiresAt', '<', now)
      .get();

    if (expiredSnap.empty) {
      return NextResponse.json({ message: 'No expired entitlements found', count: 0 });
    }

    const batch = adminDb.batch();
    
    expiredSnap.docs.forEach((doc) => {
      // Revert to free tier limits
      batch.update(doc.ref, {
        status: 'expired',
        tier: 'free',
        participantCap: 25
      });
    });

    await batch.commit();

    return NextResponse.json({
      message: 'Successfully processed expired entitlements',
      count: expiredSnap.size
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed to process expirations' }, { status: 500 });
  }
}
