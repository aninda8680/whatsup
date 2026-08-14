import { NextResponse } from 'next/server';
import { adminDb, adminRtdb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { sessionId, slideId, uid, value, slideStartTime } = await request.json();

    if (!sessionId || !slideId || !uid || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify session and slide
    const slideDoc = await adminDb.doc(`sessions/${sessionId}/slides/${slideId}`).get();
    if (!slideDoc.exists) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }
    const currentSlide = slideDoc.data()!;

    // Verify RTDB state (are we open?)
    const liveStateSnap = await adminRtdb.ref(`live/${sessionId}`).once('value');
    const liveState = liveStateSnap.val();

    if (!liveState || liveState.currentSlideId !== slideId || liveState.slideStatus !== 'open') {
      return NextResponse.json({ error: 'Voting is closed for this slide' }, { status: 403 });
    }

    // Single-transaction check on response
    const responseRef = adminRtdb.ref(`live/${sessionId}/slides/${slideId}/responses/${uid}`);
    const txResult = await responseRef.transaction((currentValue) => {
      if (currentValue !== null) {
        return; // Abort: already submitted
      }
      return value;
    });

    if (!txResult.committed) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
    }

    // Calculate Score (only for MCQ with correct option)
    let points = 0;
    if (currentSlide.correctOptionId && value === currentSlide.correctOptionId && slideStartTime) {
      const timeTaken = Date.now() - slideStartTime;
      if (timeTaken <= 10000 && timeTaken > 0) {
        points = Math.round(25 * (10000 - timeTaken) / 10000);
      }
    }

    if (points > 0) {
      await adminDb.doc(`sessions/${sessionId}/participants/${uid}`).set({
        score: FieldValue.increment(points)
      }, { merge: true });
    }

    // Update Tally in RTDB
    const tallyRef = adminRtdb.ref(`live/${sessionId}/slides/${slideId}/tally`);
    await tallyRef.transaction((currentTally) => {
      let t = currentTally || {};
      
      if (currentSlide.type === 'mcq_single') {
        t[value] = (t[value] || 0) + 1;
      } else if (currentSlide.type === 'mcq_multi') {
        (value as string[]).forEach(v => {
          t[v] = (t[v] || 0) + 1;
        });
      } else if (currentSlide.type === 'wordcloud') {
        const word = (value as string).toLowerCase().trim();
        t[word] = (t[word] || 0) + 1;
      } else if (currentSlide.type === 'rating') {
        t[value] = (t[value] || 0) + 1;
        t.sum = (t.sum || 0) + parseInt(value);
        t.n = (t.n || 0) + 1;
      }
      
      return t;
    });

    return NextResponse.json({ success: true, points });
  } catch (error) {
    console.error('Response submit error:', error);
    return NextResponse.json({ error: 'Failed to process response' }, { status: 500 });
  }
}
