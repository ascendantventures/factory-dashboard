'use client';

import { useEffect } from 'react';

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
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8"
      style={{ color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}
    >
      <p className="text-sm">Something went wrong. Please try refreshing.</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#6366F1', color: '#fff' }}
      >
        Try again
      </button>
    </div>
  );
}
