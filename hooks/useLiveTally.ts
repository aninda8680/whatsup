/**
 * hooks/useLiveTally.ts
 *
 * WHY typed Tally instead of Record<string, any>:
 * The tally shape differs per slide type (MCQ vs rating vs wordcloud). Keeping
 * it as `any` means chart components must defensively probe for fields at
 * runtime with no TypeScript help. parseTally() converts the raw RTDB object
 * into a discriminated union so the chart component can narrow by `tally.type`
 * and get compile-time guarantees on the fields it accesses.
 *
 * WHY useMemo on tally:
 * RTDB onValue fires very frequently during a live session (every vote triggers
 * it). Without memoisation, the chart re-renders on every incoming vote, even
 * if the particular bar being rendered didn't change. The JSON.stringify
 * comparison is cheap for tally objects (typically <20 keys).
 */

import { useState, useEffect, useMemo } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Tally, SlideType, parseTally } from '@/lib/types';

export function useLiveTally(
  sessionId: string | null,
  slideId: string | null,
  slideType: SlideType | null
) {
  const [rawTally, setRawTally] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !slideId) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      setTimeout(() => {
        setRawTally(null);
        setLoading(false);
      }, 0);
      return;
    }

    const tallyRef = ref(rtdb, `live/${sessionId}/slides/${slideId}/tally`);

    const unsubscribe = onValue(
      tallyRef,
      (snapshot) => {
        setRawTally(snapshot.val() as Record<string, unknown> | null);
        setLoading(false);
      },
      (err) => {
        console.error('[useLiveTally] RTDB error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId, slideId]);

  /**
   * Parse and memoize. parseTally is a pure function so this is safe.
   * The tally reference only changes when the serialised RTDB value changes.
   */
  const tally = useMemo<Tally>(
    () => parseTally(rawTally, slideType ?? 'info'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawTally ? JSON.stringify(rawTally) : null, slideType]
  );

  return { tally, loading };
}
