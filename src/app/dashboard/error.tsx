'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard] Client error:', error);
  }, [error]);

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="flex flex-col items-center justify-center text-center px-6 py-16"
        style={{ maxWidth: '400px', margin: '0 auto' }}
      >
        <AlertCircle
          style={{ width: '48px', height: '48px', color: 'var(--error)' }}
          strokeWidth={1.5}
        />
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginTop: '16px',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginTop: '8px',
            lineHeight: 1.6,
          }}
        >
          The dashboard encountered an unexpected error. Please refresh the page.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '24px',
            padding: '8px 16px',
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
