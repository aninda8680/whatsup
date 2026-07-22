import { useState, useEffect } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

export function useLiveTally(sessionId: string | null, slideId: string | null) {
  const [tally, setTally] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !slideId) {
      setTally({});
      setLoading(false);
      return;
    }

    const tallyRef = ref(rtdb, `live/${sessionId}/slides/${slideId}/tally`);

    onValue(tallyRef, (snapshot) => {
      const data = snapshot.val();
      setTally(data || {});
      setLoading(false);
    }, (err) => {
      console.error("RTDB Error in useLiveTally:", err);
      setLoading(false);
    });

    return () => {
      off(tallyRef);
    };
  }, [sessionId, slideId]);

  return { tally, loading };
}
