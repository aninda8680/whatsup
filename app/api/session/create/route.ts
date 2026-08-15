import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Entitlement, Session } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const hostId = decodedToken.uid;

    const body = await request.json();
    const { title, code, settings } = body;

    if (!title || !code) {
      return NextResponse.json({ error: 'Missing title or code' }, { status: 400 });
    }

    // Read the host's entitlement
    const entitlementDoc = await adminDb.collection('entitlements').doc(hostId).get();
    
    let tier = 'free';
    let participantCap = 25;

    if (entitlementDoc.exists) {
      const entitlement = entitlementDoc.data() as Entitlement;
      const now = Date.now();
      
      // Lazy check expiry
      if (entitlement.expiresAt && entitlement.expiresAt > now && entitlement.status === 'active') {
        tier = entitlement.tier;
        participantCap = entitlement.participantCap;
      } else if (entitlement.status === 'active') {
        // If it was active but expired, we could technically update it to 'expired' here,
        // but for read-only lazy checking, we just downgrade the limits for this session.
      }
    }

    const newSession = {
      code,
      title,
      ownerUid: hostId,
      status: 'draft',
      currentSlideIndex: 0,
      createdAt: FieldValue.serverTimestamp(),
      tier,
      participantCap,
      participantCount: 0,
      settings: settings || {
        anonymousByDefault: true,
        allowResubmit: false
      }
    };

    const docRef = await adminDb.collection('sessions').add(newSession);

    return NextResponse.json({
      sessionId: docRef.id,
      tier,
      participantCap
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
