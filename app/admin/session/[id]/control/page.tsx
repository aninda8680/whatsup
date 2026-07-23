"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, rtdb } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp as firestoreServerTimestamp, collection, getDocs } from 'firebase/firestore';
import { ref, set, update, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';
import { useLiveSlide } from '@/hooks/useLiveSlide';
import Link from 'next/link';
import { SlideRenderer } from '@/components/slide-renderer';
import { LiveChart } from '@/components/live-chart';
import { useLiveTally } from '@/hooks/useLiveTally';

export default function SessionControlPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { session, slides, loading: sessionLoading } = useSession(sessionId);
  const { liveState, loading: liveLoading } = useLiveSlide(sessionId);
  const { tally } = useLiveTally(sessionId, liveState.currentSlideId);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (liveState.slideStatus !== 'leaderboard' || !sessionId) return;
    const fetchLeaderboard = async () => {
      try {
        const snap = await getDocs(collection(db, 'sessions', sessionId, 'participants'));
        const participants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        participants.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
        setLeaderboard(participants.slice(0, 10));
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      }
    };
    fetchLeaderboard();
  }, [liveState.slideStatus, sessionId]);

  const handleStartSession = async () => {
    if (!session || slides.length === 0) return;
    
    // Set RTDB state
    const liveRef = ref(rtdb, `live/${sessionId}`);
    await set(liveRef, {
      currentSlideId: slides[0].id,
      slideStatus: 'open',
      participantCount: 0,
      slideStartTime: rtdbServerTimestamp()
    });

    // Set Firestore state
    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'live',
      currentSlideIndex: 0,
      startedAt: firestoreServerTimestamp()
    });
  };

  const handleEndSession = async () => {
    if (!session) return;
    
    // Set Firestore state
    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'ended',
      endedAt: firestoreServerTimestamp()
    });

    // Clear RTDB live state
    const liveRef = ref(rtdb, `live/${sessionId}`);
    await set(liveRef, null);
    
    router.push('/admin/dashboard');
  };

  const handleChangeSlide = async (newIndex: number) => {
    if (!session || newIndex < 0 || newIndex >= slides.length) return;
    
    const newSlideId = slides[newIndex].id;
    
    // Update RTDB
    await update(ref(rtdb, `live/${sessionId}`), {
      currentSlideId: newSlideId,
      slideStatus: 'open',
      slideStartTime: rtdbServerTimestamp()
    });
    
    // Update Firestore
    await updateDoc(doc(db, 'sessions', sessionId), {
      currentSlideIndex: newIndex
    });
  };

  const handleToggleStatus = async (newStatus: "open" | "locked" | "results_shown" | "leaderboard") => {
    const updates: any = { slideStatus: newStatus };
    if (newStatus === 'open') {
      updates.slideStartTime = rtdbServerTimestamp();
    }
    await update(ref(rtdb, `live/${sessionId}`), updates);
  };

  if (sessionLoading || liveLoading) return <div className="p-8">Loading control panel...</div>;
  if (!session) return <div className="p-8">Session not found.</div>;

  const currentIndex = session.currentSlideIndex;
  const currentSlide = slides[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-black text-white p-4 font-bold flex justify-between items-center border-b-[4px] border-black">
        <div className="flex gap-4 items-center">
          <Link href={`/admin/session/${sessionId}/build`}>
            <Button variant="default" size="sm" className="bg-white text-black">Edit</Button>
          </Link>
          <span className="text-xl">Control Panel: {session.title}</span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-brand-yellow text-black px-4 py-1 border-2 border-black">Code: {session.code}</div>
          {session.status === 'live' ? (
            <Button variant="danger" size="sm" onClick={handleEndSession}>End Session</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleStartSession}>Start Session</Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Preview Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col">
          {session.status !== 'live' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-2xl font-bold bg-white p-8 border-[4px] border-black shadow-brutal text-center">
                Session is not live.<br/>Click 'Start Session' to broadcast.
              </div>
            </div>
          ) : liveState.slideStatus === 'leaderboard' ? (
            <div className="flex-1 flex flex-col items-center p-8 bg-brand-yellow overflow-y-auto border-[4px] border-black shadow-brutal">
              <h1 className="text-4xl font-black mb-8 border-[4px] border-black p-4 bg-white shadow-brutal transform -rotate-1">🏆 Leaderboard</h1>
              <div className="w-full max-w-2xl flex flex-col gap-4">
                {leaderboard.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center bg-white p-4 border-[3px] border-black shadow-brutal text-2xl font-bold">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full text-xl">{idx + 1}</span>
                      <span>{p.displayName}</span>
                    </div>
                    <span className="text-brand-pink font-black" style={{ textShadow: '1px 1px 0px black' }}>{p.score || 0} pts</span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center font-bold text-xl p-8 bg-white border-[3px] border-black">No scores yet!</div>
                )}
              </div>
            </div>
          ) : currentSlide ? (
            <div className="flex-1 flex flex-col">
              <SlideRenderer 
                slide={currentSlide} 
                showCorrectAnswer={liveState.slideStatus === 'results_shown'} 
              />
              <div className="mt-8 flex-1">
                <LiveChart slide={currentSlide} tally={tally} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Sidebar Controls */}
        <div className="w-80 bg-white border-l-[4px] border-black flex flex-col">
          <div className="p-4 border-b-[4px] border-black bg-gray-100 font-black text-xl">
            Live Controls
          </div>
          
          <div className="p-4 flex flex-col gap-6 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-gray-500">Navigation</span>
              <div className="flex justify-between items-center bg-gray-50 border-2 border-black p-2 font-bold">
                <Button 
                  variant="default" size="sm" 
                  disabled={currentIndex === 0 || session.status !== 'live'}
                  onClick={() => handleChangeSlide(currentIndex - 1)}
                >
                  Prev
                </Button>
                <span>{currentIndex + 1} / {slides.length}</span>
                <Button 
                  variant="default" size="sm"
                  disabled={currentIndex === slides.length - 1 || session.status !== 'live'}
                  onClick={() => handleChangeSlide(currentIndex + 1)}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold text-gray-500">Slide Actions</span>
              <Button 
                variant={liveState.slideStatus === 'open' ? 'danger' : 'primary'} 
                className="w-full"
                disabled={session.status !== 'live'}
                onClick={() => handleToggleStatus(liveState.slideStatus === 'open' ? 'locked' : 'open')}
              >
                {liveState.slideStatus === 'open' ? 'Lock Voting' : 'Open Voting'}
              </Button>
              
              <Button 
                variant="secondary" 
                className="w-full"
                disabled={session.status !== 'live'}
                onClick={() => handleToggleStatus(liveState.slideStatus === 'results_shown' ? 'open' : 'results_shown')}
              >
                {liveState.slideStatus === 'results_shown' ? 'Hide Results' : 'Show Results'}
              </Button>
              
              <Button 
                variant="secondary" 
                className="w-full bg-brand-yellow"
                disabled={session.status !== 'live'}
                onClick={() => handleToggleStatus(liveState.slideStatus === 'leaderboard' ? 'open' : 'leaderboard')}
              >
                {liveState.slideStatus === 'leaderboard' ? 'Hide Leaderboard' : 'Show Leaderboard'}
              </Button>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-4 border-t-2 border-dashed border-gray-300">
              <span className="font-bold text-gray-500">Live Data</span>
              <div className="text-3xl font-black">
                {Object.keys(tally).filter(k => k !== 'sum' && k !== 'n').reduce((acc, k) => {
                  const val = tally[k];
                  const count = Array.isArray(val) ? val.length : (typeof val === 'number' ? val : 0);
                  return acc + count;
                }, 0)}
              </div>
              <div className="font-bold text-sm text-gray-600">Total Votes on this slide</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
