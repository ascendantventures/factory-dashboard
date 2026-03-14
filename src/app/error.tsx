'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App] Client error:', error);
  }, [error]);

  return (
    <div
      style={{
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
    </div>
  );
}
