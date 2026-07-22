"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { useSession } from '@/hooks/useSession';
import { useLiveSlide } from '@/hooks/useLiveSlide';
import { useLiveTally } from '@/hooks/useLiveTally';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { useServerTime } from '@/hooks/useServerTime';
import { SlideRenderer } from '@/components/slide-renderer';
import { LiveChart } from '@/components/live-chart';

export default function PresentPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { session, slides, loading: sessionLoading } = useSession(sessionId);
  const { liveState, loading: liveLoading } = useLiveSlide(sessionId);
  const { tally } = useLiveTally(sessionId, liveState.currentSlideId);
  const { serverTimeOffset } = useServerTime();
  
  const [timeLeft, setTimeLeft] = useState(10);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Timer Effect
  useEffect(() => {
    if (liveState.slideStatus !== 'open' || !liveState.slideStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() + serverTimeOffset - liveState.slideStartTime!;
      setTimeLeft(Math.max(0, 10 - Math.floor(elapsed / 1000)));
    }, 100);
    return () => clearInterval(interval);
  }, [liveState.slideStatus, liveState.slideStartTime, serverTimeOffset]);

  // Leaderboard Effect
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

  useEffect(() => {
    const initDisplay = async () => {
      try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('code', '==', code));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Session not found.');
          setInitLoading(false);
          return;
        }

        setSessionId(querySnapshot.docs[0].id);
        setInitLoading(false);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load session.');
        setInitLoading(false);
      }
    };

    initDisplay();
  }, [code]);

  if (initLoading || sessionLoading || liveLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black text-4xl">LOADING PRESENTATION...</div>;
  }

  if (error || !session) {
    return <div className="min-h-screen bg-brand-pink flex items-center justify-center font-black text-4xl">{error || 'Session not found'}</div>;
  }

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${code}` : '';

  if (session.status !== 'live') {
    return (
      <div className="min-h-screen bg-brand-yellow flex flex-col items-center justify-center p-8">
        <h1 className="text-6xl md:text-8xl font-black mb-12 text-center border-[6px] border-black p-8 bg-white shadow-brutal-lg">
          {session.title}
        </h1>
        
        <div className="flex flex-col md:flex-row items-center gap-12 bg-white border-[4px] border-black p-12 shadow-brutal-lg">
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-3xl font-bold">Join at</h2>
            <div className="text-4xl font-black bg-gray-100 px-6 py-3 border-[3px] border-black">
              {typeof window !== 'undefined' ? window.location.host : ''}/join
            </div>
            <h2 className="text-3xl font-bold">with code</h2>
            <div className="text-7xl font-black tracking-widest text-brand-blue" style={{ textShadow: '4px 4px 0px black' }}>
              {code}
            </div>
          </div>
          
          <div className="border-[6px] border-black p-4 bg-white">
            <QRCodeSVG value={joinUrl} size={250} />
          </div>
        </div>
        
        <div className="mt-16 text-2xl font-bold bg-black text-white px-8 py-4 border-[3px] border-black">
          Waiting for host to start...
        </div>
      </div>
    );
  }

  const currentSlide = slides.find(s => s.id === liveState.currentSlideId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="h-20 bg-white border-b-[4px] border-black flex justify-between items-center px-8 shadow-sm z-10 shrink-0">
        <div className="text-2xl font-black truncate max-w-md">{session.title}</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-brand-yellow px-4 py-2 border-[3px] border-black shadow-brutal-sm">
            <span className="font-bold">Join with code:</span>
            <span className="text-3xl font-black tracking-widest">{code}</span>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 border-[3px] border-black shadow-brutal-sm">
            <div className="w-4 h-4 bg-brand-green rounded-full border-2 border-black animate-pulse"></div>
            <span className="font-bold text-xl">{liveState.participantCount} <span className="text-gray-500 text-base">online</span></span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {liveState.slideStatus === 'leaderboard' ? (
          <div className="flex-1 flex flex-col items-center p-12 bg-brand-yellow overflow-y-auto">
            <h1 className="text-6xl font-black mb-12 border-[6px] border-black p-6 bg-white shadow-brutal-lg transform -rotate-2">🏆 Leaderboard</h1>
            <div className="w-full max-w-4xl flex flex-col gap-4">
              {leaderboard.map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center bg-white p-6 border-[4px] border-black shadow-brutal text-3xl font-bold hover:translate-x-2 transition-transform">
                  <div className="flex items-center gap-6">
                    <span className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-full text-2xl">{idx + 1}</span>
                    <span>{p.displayName}</span>
                  </div>
                  <span className="text-brand-pink font-black" style={{ textShadow: '2px 2px 0px black' }}>{p.score || 0} pts</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center font-bold text-2xl p-12">No scores yet! Get playing!</div>
              )}
            </div>
          </div>
        ) : currentSlide ? (
          <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
            {liveState.slideStatus === 'open' && (
              <div className="absolute top-8 right-8 bg-white border-[6px] border-black shadow-brutal-lg flex items-center justify-center text-6xl font-black w-32 h-32 rounded-full z-50">
                {timeLeft}
              </div>
            )}
            
            <SlideRenderer 
              slide={currentSlide} 
              showCorrectAnswer={liveState.slideStatus === 'results_shown'} 
            />
            
            <div className="w-full max-w-5xl mx-auto px-4 pb-12 flex-1 flex flex-col justify-center min-h-[400px]">
              {(liveState.slideStatus === 'open' || liveState.slideStatus === 'results_shown' || liveState.slideStatus === 'locked') && currentSlide.type !== 'info' && (
                <div className={`transition-opacity duration-500 ${liveState.slideStatus === 'open' && !currentSlide.resultsVisibleToStudents ? 'opacity-0' : 'opacity-100'}`}>
                  <LiveChart slide={currentSlide} tally={tally} />
                </div>
              )}
              
              {liveState.slideStatus === 'open' && !currentSlide.resultsVisibleToStudents && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 z-10">
                  <div className="text-4xl font-black bg-brand-pink p-8 border-[4px] border-black shadow-brutal-lg">
                    Results are hidden. Send in your answers!
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-3xl font-bold bg-white p-8 border-[4px] border-black shadow-brutal">
              No active slide.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
