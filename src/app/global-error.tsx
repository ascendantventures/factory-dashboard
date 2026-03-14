'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global] Unhandled error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          padding: '32px',
          background: '#09090B',
          color: '#A1A1AA',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        <p style={{ fontSize: '14px', margin: 0 }}>Something went wrong. Please try refreshing the page.</p>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
