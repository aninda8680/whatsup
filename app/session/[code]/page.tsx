"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db, rtdb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useSession } from '@/hooks/useSession';
import { useLiveSlide } from '@/hooks/useLiveSlide';
import { useServerTime } from '@/hooks/useServerTime';
import { useLiveTally } from '@/hooks/useLiveTally';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, increment, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ref, runTransaction, set, get } from 'firebase/database';
import { ResponseInput } from '@/components/response-input';
import { Card } from '@/components/ui/card';
import { SlideRenderer } from '@/components/slide-renderer';
import { LiveChart } from '@/components/live-chart';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { session, slides, loading: sessionLoading } = useSession(sessionId);
  const { liveState, loading: liveLoading } = useLiveSlide(sessionId);
  const { tally } = useLiveTally(sessionId, liveState.currentSlideId);
  const { serverTimeOffset, getServerTime } = useServerTime();
  
  const [submitting, setSubmitting] = useState(false);
  const [submittedSlideIds, setSubmittedSlideIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(10);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (liveState.slideStatus !== 'open' || !liveState.slideStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() + serverTimeOffset - liveState.slideStartTime!;
      setTimeLeft(Math.max(0, 10 - Math.floor(elapsed / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [liveState.slideStatus, liveState.slideStartTime, serverTimeOffset]);

  useEffect(() => {
    if (liveState.slideStatus !== 'leaderboard' || !sessionId) return;
    const q = query(collection(db, 'sessions', sessionId, 'participants'));
    const unsub = onSnapshot(q, (snap) => {
      const participants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      participants.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      setLeaderboard(participants.slice(0, 10));
    });
    return () => unsub();
  }, [liveState.slideStatus, sessionId]);

  // 1. Resolve code to sessionId and register participant
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push(`/join?code=${code}`);
        return;
      }

      try {
        const name = sessionStorage.getItem('participantName') || 'Anonymous';

        // Find session by code
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('code', '==', code));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Session not found or has ended.');
          setInitLoading(false);
          return;
        }

        const sessionDoc = querySnapshot.docs[0];
        const sId = sessionDoc.id;
        setSessionId(sId);

        // Register participant in Firestore
        await setDoc(doc(db, 'sessions', sId, 'participants', user.uid), {
          displayName: name,
          lastActive: serverTimestamp()
        }, { merge: true });

        setInitLoading(false);
      } catch (err: any) {
        console.error(err);
        setError('Failed to initialize session.');
        setInitLoading(false);
      }
    });

    return () => unsubscribe();
  }, [code, router]);

  const handleSubmitResponse = async (value: any) => {
    if (!sessionId || !liveState.currentSlideId || !auth.currentUser) return;
    
    setSubmitting(true);
    const slideId = liveState.currentSlideId;
    const uid = auth.currentUser.uid;
    
    try {
      // Check if already responded in RTDB
      const responseRef = ref(rtdb, `live/${sessionId}/slides/${slideId}/responses/${uid}`);
      const responseSnap = await get(responseRef);
      
      if (responseSnap.exists()) {
        setSubmittedSlideIds(prev => new Set(prev).add(slideId));
        setSubmitting(false);
        return; // Already submitted
      }

      // Write to tally in RTDB transactionally
      const tallyRef = ref(rtdb, `live/${sessionId}/slides/${slideId}/tally`);
      
      const currentSlide = slides.find(s => s.id === slideId);
      if (!currentSlide) throw new Error("Slide not found");

      await runTransaction(tallyRef, (currentTally) => {
        let tally = currentTally || {};
        
        if (currentSlide.type === 'mcq_single') {
          tally[value] = (tally[value] || 0) + 1;
        } else if (currentSlide.type === 'mcq_multi') {
          (value as string[]).forEach(v => {
            tally[v] = (tally[v] || 0) + 1;
          });
        } else if (currentSlide.type === 'wordcloud') {
          const word = (value as string).toLowerCase().trim();
          tally[word] = (tally[word] || 0) + 1;
        } else if (currentSlide.type === 'rating') {
          tally[value] = (tally[value] || 0) + 1;
          tally.sum = (tally.sum || 0) + parseInt(value);
          tally.n = (tally.n || 0) + 1;
        }
        
        return tally;
      });

      // Mark as responded
      await set(responseRef, value);
      
      let points = 0;
      if (currentSlide.correctOptionId && value === currentSlide.correctOptionId && liveState.slideStartTime) {
        const timeTaken = getServerTime() - liveState.slideStartTime;
        if (timeTaken <= 10000 && timeTaken > 0) {
           points = Math.round(25 * (10000 - timeTaken) / 10000);
        }
      }

      if (points > 0) {
        const participantRef = doc(db, 'sessions', sessionId, 'participants', uid);
        await setDoc(participantRef, { score: increment(points) }, { merge: true });
      }
      
      setSubmittedSlideIds(prev => new Set(prev).add(slideId));
    } catch (err) {
      console.error("Error submitting response", err);
      alert("Failed to submit response.");
    } finally {
      setSubmitting(false);
    }
  };

  if (initLoading || sessionLoading || liveLoading) {
    return <div className="min-h-screen bg-brand-blue flex items-center justify-center font-black text-2xl border-[8px] border-black m-4 shadow-brutal-lg">LOADING...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-brand-pink p-8 flex flex-col items-center justify-center">
      <Card className="p-8 text-center max-w-md">
        <h1 className="text-4xl font-black mb-4">Oops!</h1>
        <p className="text-xl font-bold">{error}</p>
        <button onClick={() => router.push('/join')} className="mt-8 px-6 py-3 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black hover:shadow-brutal transition-all">Go Back</button>
      </Card>
    </div>;
  }

  if (session?.status !== 'live') {
    return <div className="min-h-screen bg-brand-yellow p-8 flex flex-col items-center justify-center">
      <Card className="p-12 text-center shadow-brutal-lg bg-white border-[4px] border-black">
        <h1 className="text-5xl font-black mb-4 animate-pulse">Session Not Active</h1>
        <p className="text-xl font-bold text-gray-700">Waiting for host to start...</p>
      </Card>
    </div>;
  }

  const currentSlide = slides.find(s => s.id === liveState.currentSlideId);

  if (liveState.slideStatus === 'leaderboard') {
    return (
      <div className="min-h-screen bg-brand-yellow p-4 md:p-8 flex flex-col">
        <h1 className="text-4xl md:text-6xl font-black mb-8 border-[4px] border-black p-4 bg-white shadow-brutal text-center transform -rotate-1">🏆 Leaderboard</h1>
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
          {leaderboard.map((p, idx) => (
            <div key={p.id} className="flex justify-between items-center bg-white p-4 border-[3px] border-black shadow-brutal text-xl font-bold hover:translate-x-1 transition-transform">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <span className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-full text-sm sm:text-lg shrink-0">{idx + 1}</span>
                <span className="truncate flex-1">{p.displayName}</span>
              </div>
              <span className="text-brand-pink font-black shrink-0 text-base sm:text-xl" style={{ textShadow: '1px 1px 0px black' }}>{p.score || 0} pts</span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center font-bold text-xl p-8 bg-white border-[3px] border-black">No scores yet!</div>
          )}
        </div>
      </div>
    );
  }

  if (liveState.slideStatus === 'results_shown' && currentSlide) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
          <SlideRenderer slide={currentSlide} showCorrectAnswer={true} />
          
          <div className="w-full bg-white border-[4px] border-black shadow-brutal-lg p-6 mt-4">
            <LiveChart slide={currentSlide} tally={tally} />
          </div>
        </div>
      </div>
    );
  }

  if (!currentSlide || liveState.slideStatus !== 'open') {
    return <div className="min-h-screen bg-brand-blue p-8 flex flex-col items-center justify-center">
      <Card className="p-12 text-center shadow-brutal-lg bg-white border-[4px] border-black">
        <h1 className="text-4xl font-black mb-6">Eyes on the screen!</h1>
        <p className="text-xl font-bold text-gray-700">Waiting for the next question...</p>
      </Card>
    </div>;
  }

  const hasSubmitted = submittedSlideIds.has(currentSlide.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-black text-white p-4 font-bold border-b-[4px] border-black flex justify-between items-center">
        <div>{session.title}</div>
        <div className="bg-white text-black px-3 py-1 text-sm border-2 border-black">Code: {code}</div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 flex flex-col max-w-2xl mx-auto w-full">
        {/* We reuse SlideRenderer for the prompt, maybe we don't need the options rendered there for participant */}
        <div className="mb-8 mt-4">
           <h2 className="text-2xl md:text-3xl font-black mb-4 bg-white border-[3px] border-black p-4 shadow-brutal leading-tight w-full">
            {currentSlide.prompt}
          </h2>
        </div>

        {hasSubmitted ? (
          <Card className="p-12 text-center shadow-brutal-lg bg-brand-green border-[4px] border-black mt-8">
            <h1 className="text-4xl font-black mb-4 text-black">Got it!</h1>
            <p className="text-xl font-bold text-black">Waiting for everyone else...</p>
          </Card>
        ) : timeLeft === 0 ? (
          <Card className="p-12 text-center shadow-brutal-lg bg-brand-yellow border-[4px] border-black mt-8">
            <h1 className="text-4xl font-black mb-4 text-black">Time's Up!</h1>
            <p className="text-xl font-bold text-black">You didn't answer in time.</p>
          </Card>
        ) : (
          <>
            <div className="w-full bg-gray-200 border-2 border-black h-6 mb-4">
              <div className="bg-brand-pink h-full transition-all duration-200" style={{ width: `${(timeLeft / 10) * 100}%` }}></div>
            </div>
            <div className="text-center font-black mb-4">{timeLeft} seconds left!</div>
            <ResponseInput 
              slide={currentSlide} 
              onSubmit={handleSubmitResponse} 
              isSubmitting={submitting} 
            />
          </>
        )}
      </div>
    </div>
  );
}
