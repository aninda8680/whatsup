'use client';

/**
 * app/error.tsx — Global App Router error boundary
 *
 * WHY global vs. per-route:
 * Per-route error.tsx files catch errors within their segment only. This root-
 * level file catches anything not already caught by a more specific boundary,
 * which covers Firebase SDK errors thrown in hooks (e.g. onSnapshot failing
 * due to missing RTDB URL, permission-denied from Firestore rules, network
 * timeouts). It does NOT catch errors in layout.tsx — for that, global-error.tsx
 * is needed (added below).
 *
 * API: this version uses `unstable_retry` (added in Next.js 16.2.0), NOT `reset`.
 * `unstable_retry` re-fetches server data before re-rendering; `reset` only
 * clears the error state without refetching. For Firebase read failures, we
 * want the re-fetch.
 */

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalErrorBoundary({ error, unstable_retry }: ErrorProps) {
  useEffect(() => {
    // In production this surfaces as an opaque digest; in dev you see the full message.
    // Log to your error tracking service (e.g. Sentry) here.
    console.error('[GlobalErrorBoundary]', error.digest ?? error.message);
  }, [error]);

  const isFirebasePermission =
    error.message?.includes('permission-denied') ||
    error.message?.includes('PERMISSION_DENIED');

  const isNetworkError =
    error.message?.includes('network') ||
    error.message?.includes('offline') ||
    error.message?.includes('Failed to fetch');

  let heading = 'Something went wrong';
  let detail = 'An unexpected error occurred. Please try again.';

  if (isFirebasePermission) {
    heading = 'Access denied';
    detail =
      'You don\'t have permission to view this page. Make sure you\'re signed in.';
  } else if (isNetworkError) {
    heading = 'Connection problem';
    detail =
      'Check your internet connection and try again. Your answers are safe.';
  }

  return (
    <div className="min-h-screen bg-brand-pink flex items-center justify-center p-8">
      <div className="bg-white border-[6px] border-black p-12 max-w-lg w-full shadow-brutal-lg text-center">
        <div className="text-6xl mb-6">💥</div>
        <h1 className="text-4xl font-black mb-4">{heading}</h1>
        <p className="text-lg font-bold text-gray-700 mb-8">{detail}</p>

        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={unstable_retry}
          className="px-8 py-4 bg-black text-white font-black text-xl border-[3px] border-black hover:bg-brand-yellow hover:text-black transition-all shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
