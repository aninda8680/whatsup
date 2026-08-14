/**
 * hooks/useSession.ts
 *
 * WHY withConverter here:
 * Previously, both Session and Slide were cast with `as Session` / `as Slide`
 * after calling `.data()` directly. That cast always succeeds in TypeScript
 * even if the shape is wrong — it just silences the compiler. withConverter
 * moves the single source-of-truth cast into sessionConverter/slideConverter
 * (lib/types.ts) where it's easy to audit and update.
 *
 * WHY useMemo on slides:
 * Firestore's onSnapshot fires even for metadata-only changes (e.g. pending
 * write acknowledgement). Without memoisation, the slides array is a new
 * reference on every tick, causing every component that reads `slides` to
 * re-render even if the actual slide data is identical. JSON.stringify is
 * O(n) but slides arrays are small (<50 items), making this a good trade-off.
 */

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  Session,
  Slide,
  sessionConverter,
  slideConverter,
} from '@/lib/types';

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [rawSlides, setRawSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setRawSlides([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // withConverter ensures fromFirestore runs on every snapshot, giving us
    // properly typed Session objects instead of raw DocumentData.
    const sessionRef = doc(db, 'sessions', sessionId).withConverter(sessionConverter);
    const slidesRef = collection(db, 'sessions', sessionId, 'slides').withConverter(slideConverter);
    const slidesQuery = query(slidesRef, orderBy('order', 'asc'));

    const unsubscribeSession = onSnapshot(
      sessionRef,
      (docSnap) => {
        // The converter runs here — docSnap.data() returns Session | undefined
        setSession(docSnap.exists() ? docSnap.data() : null);
      },
      (err) => {
        console.error('[useSession] Firestore session error:', err);
        setError(err);
      }
    );

    const unsubscribeSlides = onSnapshot(
      slidesQuery,
      (snapshot) => {
        // converter runs on each doc — snapshot.docs[n].data() returns Slide
        setRawSlides(snapshot.docs.map((d) => d.data()));
        setLoading(false);
      },
      (err) => {
        console.error('[useSession] Firestore slides error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeSlides();
    };
  }, [sessionId]);

  /**
   * Memoize slides by their serialised content.
   * If the slide data is identical between snapshots, the reference stays
   * the same and downstream components skip their re-render.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slides = useMemo(() => rawSlides, [JSON.stringify(rawSlides)]);

  return { session, slides, loading, error };
}

// Re-export types that consumers currently import from this file
// to avoid breaking the existing import surface while types migrate to lib/types.ts
export type { Session, Slide, SlideOption, SlideConfig } from '@/lib/types';
