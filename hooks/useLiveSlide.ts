import { useState, useEffect } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export interface LiveSessionState {
  currentSlideId: string | null;
  slideStatus: "open" | "locked" | "results_shown" | "leaderboard";
  participantCount: number;
  slideStartTime?: number;
}

export function useLiveSlide(sessionId: string | null) {
  const [liveState, setLiveState] = useState<LiveSessionState>({
    currentSlideId: null,
    slideStatus: "locked",
    participantCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const liveRef = ref(rtdb, `live/${sessionId}`);

    // onValue returns an unsubscribe function — use it for cleanup
    // instead of off(liveRef) which would detach ALL listeners on this path
    const unsubscribe = onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveState({
          currentSlideId: data.currentSlideId || null,
          slideStatus: data.slideStatus || "locked",
          participantCount: data.participantCount || 0,
          slideStartTime: data.slideStartTime || undefined,
        });
      } else {
        // RTDB node was cleared (session ended) — reset to default
        setLiveState({ currentSlideId: null, slideStatus: "locked", participantCount: 0 });
      }
      setLoading(false);
    }, (err) => {
      console.error("RTDB Error in useLiveSlide:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { liveState, loading };
}

