'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function WebhooksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[WebhooksPage] Error:', error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-16 mx-auto"
      style={{ maxWidth: '400px', minHeight: '400px' }}
    >
      <AlertCircle
        style={{ width: '48px', height: '48px', color: 'var(--error)', marginBottom: '16px' }}
        strokeWidth={1.5}
      />
      <h2
        style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}
      >
        Failed to load webhooks
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
        We couldn&apos;t load your webhooks. Please refresh the page or try again.
      </p>
      <button
        onClick={reset}
        style={{
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
  );
}
