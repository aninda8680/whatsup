import { useState, useEffect } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export function useServerTime() {
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  useEffect(() => {
    const offsetRef = ref(rtdb, '.info/serverTimeOffset');
    const unsubscribe = onValue(offsetRef, (snap) => {
      setServerTimeOffset(snap.val() || 0);
    });

    return () => unsubscribe();
  }, []);

  // Return a function so we can get the exact time at the moment of calling
  return { 
    serverTimeOffset, 
    getServerTime: () => Date.now() + serverTimeOffset 
  };
}
