import { NextResponse } from 'next/server';
import { adminDb, adminRtdb, adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { code, displayName } = await request.json();

    if (!code || !displayName) {
      return NextResponse.json({ error: 'Missing code or name' }, { status: 400 });
    }

    // 1. Look up session by code
    const sessionsSnap = await adminDb
      .collection('sessions')
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (sessionsSnap.empty) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionDoc = sessionsSnap.docs[0];
    const sessionData = sessionDoc.data();
    const sessionId = sessionDoc.id;

    if (sessionData.status !== 'live' && sessionData.status !== 'draft') {
      return NextResponse.json({ error: 'Session has ended' }, { status: 403 });
    }

    // 2. Check participant cap
    const participantCap = sessionData.participantCap || 25;
    
    // Read current presence count from RTDB
    const presenceSnap = await adminRtdb.ref(`live/${sessionId}/presence`).once('value');
    const presenceData = presenceSnap.val() || {};
    const currentCount = Object.keys(presenceData).length;

    if (currentCount >= participantCap) {
      return NextResponse.json({ 
        error: `Session is full (Limit: ${participantCap} participants)` 
      }, { status: 403 });
    }

    // 3. Generate a Firebase Auth Custom Token for this participant
    // We embed the sessionId into the token claims so security rules can lock them to this session.
    // We create a deterministic UID based on session + random ID to keep it unique but identifiable.
    const uid = `anon_${sessionId}_${Math.random().toString(36).substring(2, 9)}`;
    
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
