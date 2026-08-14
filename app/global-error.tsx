'use client';

/**
 * app/global-error.tsx — Root layout error boundary
 *
 * WHY separate from error.tsx:
 * app/error.tsx cannot catch errors thrown in layout.tsx (it wraps the layout's
 * children, not the layout itself). global-error.tsx replaces the root layout
 * when active, so it must supply its own <html> and <body> tags.
 *
 * This fires in the rare case that layout.tsx itself crashes (e.g. the Google
 * Font fetch fails at build time and somehow surfaces at runtime, or an import
 * in the layout chain throws during hydration).
 */

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#ff66c4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '6px solid #000',
            padding: '3rem',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '8px 8px 0px #000',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💥</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
            Critical Error
          </h1>
          <p style={{ marginBottom: '2rem', color: '#555' }}>
            The application failed to load. Please refresh the page.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '1rem' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={unstable_retry}
            style={{
              padding: '1rem 2rem',
              background: '#000',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.25rem',
              border: '3px solid #000',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
