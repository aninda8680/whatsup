/**
 * lib/types.ts
 *
 * WHY this file exists:
 * Firestore returns `DocumentData` (essentially `any`) when you call `.data()`.
 * Without converters, every consumer casts the result with `as MyType`, which
 * defeats TypeScript's purpose — the cast silently succeeds even if the shape
 * doesn't match. `withConverter` moves the cast to ONE place and forces all
 * reads/writes through a validated shape.
 *
 * Tally is a discriminated union because MCQ tally, rating tally, and wordcloud
 * tally have completely different shapes. A `Record<string, any>` loses that
 * information and makes chart code harder to keep correct.
 */

import {
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';

// ─── Slide ────────────────────────────────────────────────────────────────────

export type SlideType =
  | 'mcq_single'
  | 'mcq_multi'
  | 'wordcloud'
  | 'open_text'
  | 'rating'
  | 'ranking'
  | 'info';

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
  type: SlideType;
  prompt: string;
  options?: SlideOption[];
  correctOptionId?: string;
  config?: SlideConfig;
  resultsVisibleToStudents: boolean;
}

export const slideConverter: FirestoreDataConverter<Slide> = {
  toFirestore(slide: Slide): DocumentData {
    // Omit `id` — it lives in the document path, not the document body.
    const { id: _id, ...data } = slide;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Slide {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      order: data.order ?? 0,
      type: data.type as SlideType,
      prompt: data.prompt ?? '',
      options: data.options,
      correctOptionId: data.correctOptionId,
      config: data.config,
      resultsVisibleToStudents: data.resultsVisibleToStudents ?? true,
    };
  },
};

// ─── Session ──────────────────────────────────────────────────────────────────

export type SessionStatus = 'draft' | 'live' | 'ended';

/** The tier a host has purchased (or 'free'). */
export type Tier = 'free' | 'starter' | 'event' | 'fest';

export interface SessionSettings {
  anonymousByDefault: boolean;
  allowResubmit: boolean;
}

export interface Session {
  id: string;
  code: string;
  title: string;
  ownerUid: string;
  status: SessionStatus;
  currentSlideIndex: number;
  /** Firestore Timestamp — use `.toMillis()` for arithmetic. */
  createdAt: { toMillis: () => number } | null;
  startedAt?: { toMillis: () => number } | null;
  endedAt?: { toMillis: () => number } | null;
  settings: SessionSettings;
  /** Inherited from the host's entitlement at session-creation time. */
  tier: Tier;
  participantCap: number;
}

export const sessionConverter: FirestoreDataConverter<Session> = {
  toFirestore(session: Session): DocumentData {
    const { id: _id, ...data } = session;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Session {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      code: data.code ?? '',
      title: data.title ?? 'Untitled Session',
      ownerUid: data.ownerUid ?? '',
      status: (data.status as SessionStatus) ?? 'draft',
      currentSlideIndex: data.currentSlideIndex ?? 0,
      createdAt: data.createdAt ?? null,
      startedAt: data.startedAt ?? null,
      endedAt: data.endedAt ?? null,
      settings: data.settings ?? {
        anonymousByDefault: true,
        allowResubmit: false,
      },
      // Grandfathered sessions that predate the entitlement system default to free.
      tier: (data.tier as Tier) ?? 'free',
      participantCap: data.participantCap ?? 25,
    };
  },
};

// ─── Participant ──────────────────────────────────────────────────────────────

export interface Participant {
  id: string; // == Firebase Auth UID
  displayName: string;
  score: number;
  lastActive: { toMillis: () => number } | null;
}

export const participantConverter: FirestoreDataConverter<Participant> = {
  toFirestore(p: Participant): DocumentData {
    const { id: _id, ...data } = p;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Participant {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      displayName: data.displayName ?? 'Anonymous',
      score: data.score ?? 0,
      lastActive: data.lastActive ?? null,
    };
  },
};

// ─── Entitlement ──────────────────────────────────────────────────────────────

/**
 * Written server-side only (via Firebase Admin SDK in the payment webhook).
 * Clients may READ their own entitlement doc; writes are blocked by Firestore rules.
 */
export interface Entitlement {
  hostId: string;
  tier: Tier;
  participantCap: number;
  purchasedAt: number; // Unix ms
  expiresAt: number;   // Unix ms
  paymentId: string;   // Razorpay payment ID (also acts as idempotency key)
}

export const entitlementConverter: FirestoreDataConverter<Entitlement> = {
  toFirestore(e: Entitlement): DocumentData {
    return { ...e };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Entitlement {
    const data = snapshot.data(options);
    return {
      hostId: data.hostId ?? snapshot.id,
      tier: (data.tier as Tier) ?? 'free',
      participantCap: data.participantCap ?? 25,
      purchasedAt: data.purchasedAt ?? 0,
      expiresAt: data.expiresAt ?? 0,
      paymentId: data.paymentId ?? '',
    };
  },
};

// ─── Live Session State (RTDB, not Firestore) ─────────────────────────────────

export type SlideStatus = 'open' | 'locked' | 'results_shown' | 'leaderboard';

export interface LiveSessionState {
  currentSlideId: string | null;
  slideStatus: SlideStatus;
  participantCount: number;
  /** Server-side UNIX ms timestamp set when the slide opened. Used for scoring. */
  slideStartTime?: number;
}

// ─── Tally (discriminated union) ──────────────────────────────────────────────

/**
 * WHY a discriminated union instead of Record<string, any>:
 * MCQ tally keys are option IDs (strings → counts).
 * Rating tally has numeric keys + 'sum' and 'n' summary fields.
 * Wordcloud tally keys are the words submitted.
 * Conflating these into a loose type means chart components can't be
 * safely narrowed, leading to runtime errors when a field is missing.
 */
export interface McqTally {
  type: 'mcq';
  /** Maps option ID → response count */
  counts: Record<string, number>;
}

export interface RatingTally {
  type: 'rating';
  /** Maps rating value ('1'–'5') → count */
  counts: Record<string, number>;
  /** Sum of all ratings (for average calculation) */
  sum: number;
  /** Total responses */
  n: number;
}

export interface WordcloudTally {
  type: 'wordcloud';
  /** Maps normalised word → count */
  words: Record<string, number>;
}

export type Tally = McqTally | RatingTally | WordcloudTally | null;

/**
 * Converts the raw RTDB tally object into a typed Tally union.
 * Called by useLiveTally before setting state.
 *
 * @param raw    - The raw value from RTDB snapshot (may be null)
 * @param slideType - The slide type, used to choose the right shape
 */
export function parseTally(
  raw: Record<string, unknown> | null,
  slideType: SlideType
): Tally {
  if (!raw) return null;

  if (slideType === 'mcq_single' || slideType === 'mcq_multi') {
    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'number') {
        counts[k] = v;
      } else if (Array.isArray(v)) {
        counts[k] = v.length;
      }
    }
    return { type: 'mcq', counts };
  }

  if (slideType === 'rating') {
    const counts: Record<string, number> = {};
    for (const k of ['1', '2', '3', '4', '5']) {
      counts[k] = typeof raw[k] === 'number' ? (raw[k] as number) : 0;
    }
    return {
      type: 'rating',
      counts,
      sum: typeof raw.sum === 'number' ? raw.sum : 0,
      n: typeof raw.n === 'number' ? raw.n : 0,
    };
  }

  if (slideType === 'wordcloud' || slideType === 'open_text') {
    const words: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'number') words[k] = v;
    }
    return { type: 'wordcloud', words };
  }

  return null;
}
