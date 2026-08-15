import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { code, displayName } = await request.json();

    if (!code || !displayName) {
      return NextResponse.json({ error: 'Missing code or name' }, { status: 400 });
    }

    // 1. Look up session by code (must be outside transaction because it's a query)
    const sessionsSnap = await adminDb
      .collection('sessions')
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (sessionsSnap.empty) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionDoc = sessionsSnap.docs[0];
    const sessionId = sessionDoc.id;
    const sessionRef = adminDb.collection('sessions').doc(sessionId);

    // Generate a Firebase Auth Custom Token for this participant
    const uid = `anon_${sessionId}_${Math.random().toString(36).substring(2, 9)}`;
    const participantRef = sessionRef.collection('participants').doc(uid);

    try {
      // 2. Transactional check and increment
      await adminDb.runTransaction(async (t) => {
        const snap = await t.get(sessionRef);
        if (!snap.exists) {
          throw new Error('NOT_FOUND');
        }

        const data = snap.data()!;
        if (data.status !== 'live' && data.status !== 'draft') {
          throw new Error('ENDED');
        }

        const cap = data.participantCap || 25;
        const currentCount = data.participantCount || 0;

        if (currentCount >= cap) {
          throw new Error('SESSION_FULL');
        }

        t.update(sessionRef, {
          participantCount: FieldValue.increment(1)
        });

        t.set(participantRef, {
          id: uid,
          displayName,
          score: 0,
          lastActive: FieldValue.serverTimestamp()
        });
      });
    } catch (e: any) {
      if (e.message === 'SESSION_FULL') {
        return NextResponse.json({ error: 'SESSION_FULL' }, { status: 403 });
      } else if (e.message === 'ENDED') {
        return NextResponse.json({ error: 'Session has ended' }, { status: 403 });
      }
      throw e;
    }

    const customToken = await adminAuth.createCustomToken(uid, {
      allowedSession: sessionId,
      role: 'participant'
    });

    return NextResponse.json({
      token: customToken,
      sessionId,
      displayName
    });

  } catch (error) {
    console.error('Join error:', error);
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
  }
}

