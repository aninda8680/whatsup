"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db, rtdb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useSession } from '@/hooks/useSession';
import { useLiveSlide } from '@/hooks/useLiveSlide';
import { useServerTime } from '@/hooks/useServerTime';
import { useLiveTally } from '@/hooks/useLiveTally';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, increment, getDoc } from 'firebase/firestore';
import { ref, runTransaction, set, onDisconnect, onValue } from 'firebase/database';
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
  // Ref to track if we've set up presence for this session (avoid duplicate setup on re-renders)
  const presenceSetupRef = useRef<string | null>(null);
  
  const { session, slides, loading: sessionLoading } = useSession(sessionId);
  const { liveState, loading: liveLoading } = useLiveSlide(sessionId);
  const { tally } = useLiveTally(sessionId, liveState.currentSlideId);
  const { serverTimeOffset, getServerTime } = useServerTime();
  
  const [submitting, setSubmitting] = useState(false);
  const [submittedSlideIds, setSubmittedSlideIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(10);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Timer — 250ms interval is plenty for a 1-second display resolution
  useEffect(() => {
    if (liveState.slideStatus !== 'open' || !liveState.slideStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() + serverTimeOffset - liveState.slideStartTime!;
      setTimeLeft(Math.max(0, 10 - Math.floor(elapsed / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [liveState.slideStatus, liveState.slideStartTime, serverTimeOffset]);

  // Leaderboard — use a one-time getDocs instead of onSnapshot to avoid
  // 90 participant docs re-firing every time any participant doc changes
  useEffect(() => {
    if (liveState.slideStatus !== 'leaderboard' || !sessionId) return;
    
    const fetchLeaderboard = async () => {
      try {
        const snap = await getDocs(collection(db, 'sessions', sessionId, 'participants'));
        const participants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        participants.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
        setLeaderboard(participants.slice(0, 10));
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      }
    };
    fetchLeaderboard();
  }, [liveState.slideStatus, sessionId]);

  // 1. Resolve code → sessionId, register participant, set up presence
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push(`/join?code=${code}`);
        return;
      }

      try {
        // Recover name from localStorage (survives refresh, unlike sessionStorage)
        const name = localStorage.getItem('participantName') || 'Anonymous';

        // --- SESSION ID CACHING ---
        // Check localStorage cache first to avoid a Firestore query on every page load.
        // Cache key includes the code so different sessions don't conflict.
        const cacheKey = `sessionId_${code}`;
        let sId = localStorage.getItem(cacheKey);

        if (!sId) {
          // Cache miss — query Firestore (only happens once per student per session)
          const sessionsRef = collection(db, 'sessions');
          const q = query(sessionsRef, where('code', '==', code));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            setError('Session not found or has ended.');
            setInitLoading(false);
            return;
          }
          sId = querySnapshot.docs[0].id;
          localStorage.setItem(cacheKey, sId);
        } else {
          // Cache hit — validate the session still exists (lightweight single-doc read)
          const sessionDoc = await getDoc(doc(db, 'sessions', sId));
          if (!sessionDoc.exists()) {
            // Session was deleted — clear cache and show error
            localStorage.removeItem(cacheKey);
            setError('Session not found or has ended.');
            setInitLoading(false);
            return;
          }
        }

        setSessionId(sId);

        // Register / update participant in Firestore (merge so we don't overwrite score)
        await setDoc(doc(db, 'sessions', sId, 'participants', user.uid), {
          displayName: name,
          lastActive: serverTimestamp(),
        }, { merge: true });

        // --- PRESENCE TRACKING ---
        // Only set up presence once per session to avoid duplicate count increments
        if (presenceSetupRef.current !== sId) {
          presenceSetupRef.current = sId;

          const userPresenceRef = ref(rtdb, `live/${sId}/presence/${user.uid}`);
          const connectedRef = ref(rtdb, '.info/connected');

          // When connected: write presence node; on disconnect: auto-remove it (server-side)
          const unsubConnected = onValue(connectedRef, async (snap) => {
            if (snap.val() === true) {
              await onDisconnect(userPresenceRef).remove();
              await set(userPresenceRef, true);
            }
          });

          // Count the presence nodes and keep participantCount in sync
          const presenceRef = ref(rtdb, `live/${sId}/presence`);
          const unsubPresence = onValue(presenceRef, async (snap) => {
            const presenceData = snap.val() || {};
            const count = Object.keys(presenceData).length;
            try {
              await set(ref(rtdb, `live/${sId}/participantCount`), count);
            } catch {
              // Non-critical — presenter counter might lag slightly
            }
          });

          // Cleanup presence listeners when this component unmounts
          return () => {
            unsubConnected();
            unsubPresence();
          };
        }

        setInitLoading(false);
      } catch (err: any) {
        console.error(err);
        setError('Failed to initialize session. Please refresh.');
        setInitLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [code, router]);

  // Clear initLoading once sessionId is confirmed
  useEffect(() => {
    if (sessionId) setInitLoading(false);
  }, [sessionId]);

  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});

  const handleSubmitResponse = useCallback(async (value: any) => {
    if (!sessionId || !liveState.currentSlideId || !auth.currentUser) return;
    
    setSubmitting(true);
    const slideId = liveState.currentSlideId;
    const uid = auth.currentUser.uid;
    const participantName = localStorage.getItem('participantName') || 'Anonymous';
    
    try {
      const currentSlide = slides.find(s => s.id === slideId);
      if (!currentSlide) throw new Error("Slide not found");

      // --- SINGLE-TRANSACTION DEDUP + RESPONSE SET ---
      const responseRef = ref(rtdb, `live/${sessionId}/slides/${slideId}/responses/${uid}`);
      let alreadySubmitted = false;

      await runTransaction(responseRef, (currentValue) => {
        if (currentValue !== null) {
          alreadySubmitted = true;
          return currentValue; // Abort: return existing value unchanged
        }
        return value; // Commit: write the response
      });

      if (alreadySubmitted) {
        setSubmittedSlideIds(prev => new Set(prev).add(slideId));
        setUserAnswers(prev => ({ ...prev, [slideId]: value }));
        setSubmitting(false);
        return;
      }

      // Update tally in RTDB transactionally
      const tallyRef = ref(rtdb, `live/${sessionId}/slides/${slideId}/tally`);
      await runTransaction(tallyRef, (currentTally) => {
        let t = currentTally || {};
        
        if (currentSlide.type === 'mcq_single') {
          t[value] = t[value] || [];
          if (Array.isArray(t[value])) {
            t[value].push(participantName);
          } else {
            t[value] = [participantName]; // Fallback if it was a number
          }
        } else if (currentSlide.type === 'mcq_multi') {
          (value as string[]).forEach(v => {
            t[v] = t[v] || [];
            if (Array.isArray(t[v])) {
              t[v].push(participantName);
            } else {
              t[v] = [participantName];
            }
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

      // Score calculation (correct MCQ answers within time limit)
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
      setUserAnswers(prev => ({ ...prev, [slideId]: value }));
    } catch (err) {
      console.error("Error submitting response", err);
      // Non-blocking inline error — no alert() which freezes mobile browsers
      setError('Failed to submit. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, liveState.currentSlideId, liveState.slideStartTime, slides, getServerTime]);

  if (initLoading || sessionLoading || liveLoading) {
    return <div className="min-h-screen bg-brand-blue flex items-center justify-center font-black text-2xl border-[8px] border-black m-4 shadow-brutal-lg">LOADING...</div>;
  }

  if (error && !sessionId) {
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
          <SlideRenderer 
            slide={currentSlide} 
            showCorrectAnswer={true} 
            userAnswer={userAnswers[currentSlide.id]}
          />
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
      
      {/* Inline submission error — non-blocking, auto-clears after 3s */}
      {error && (
        <div className="bg-brand-pink text-black font-bold text-center py-2 px-4 border-b-2 border-black">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 flex flex-col max-w-2xl mx-auto w-full">
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
            <h1 className="text-4xl font-black mb-4 text-black">Time&apos;s Up!</h1>
            <p className="text-xl font-bold text-black">You didn&apos;t answer in time.</p>
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
