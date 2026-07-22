import { useState, useEffect } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

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

    onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveState({
          currentSlideId: data.currentSlideId || null,
          slideStatus: data.slideStatus || "locked",
          participantCount: data.participantCount || 0,
          slideStartTime: data.slideStartTime || undefined,
        });
      }
      setLoading(false);
    }, (err) => {
      console.error("RTDB Error in useLiveSlide:", err);
      setLoading(false);
    });

    return () => {
      off(liveRef);
    };
  }, [sessionId]);

  return { liveState, loading };
}
