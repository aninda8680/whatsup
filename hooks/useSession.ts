import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, collection, onSnapshot, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';

export interface SlideOption {
  id: string;
  label: string;
}

export interface SlideConfig {
  min?: number;
  max?: number;
  step?: number;
  allowMultiple?: boolean;
}

export interface Slide {
  id: string;
  order: number;
  type: "mcq_single" | "mcq_multi" | "wordcloud" | "open_text" | "rating" | "ranking" | "info";
  prompt: string;
  options?: SlideOption[];
  correctOptionId?: string;
  config?: SlideConfig;
  resultsVisibleToStudents: boolean;
}

export interface Session {
  id: string;
  code: string;
  title: string;
  ownerUid: string;
  status: "draft" | "live" | "ended";
  currentSlideIndex: number;
  createdAt: any;
  startedAt?: any;
  endedAt?: any;
  settings: {
    anonymousByDefault: boolean;
    allowResubmit: boolean;
  };
}

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setSlides([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const sessionRef = doc(db, 'sessions', sessionId);
    const slidesRef = collection(db, 'sessions', sessionId, 'slides');
    const slidesQuery = query(slidesRef, orderBy('order', 'asc'));

    const unsubscribeSession = onSnapshot(
      sessionRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSession({ id: docSnap.id, ...docSnap.data() } as Session);
        } else {
          setSession(null);
        }
      },
      (err) => {
        console.error("Error fetching session:", err);
        setError(err);
      }
    );

    const unsubscribeSlides = onSnapshot(
      slidesQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const slidesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Slide[];
        setSlides(slidesData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching slides:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeSlides();
    };
  }, [sessionId]);

  return { session, slides, loading, error };
}
