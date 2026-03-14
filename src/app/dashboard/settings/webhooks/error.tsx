'use client';

import { AlertTriangle } from 'lucide-react';

export default function WebhooksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isUserFriendly =
    error.message &&
    error.message.length < 100 &&
    !error.message.includes('at ') &&
    !error.message.includes('undefined');

  const displayMessage = isUserFriendly
    ? error.message
    : "We couldn't load your webhooks. This may be a temporary issue.";

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
      <div
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          background: '#161A1F',
          border: '1px solid #2E353D',
          borderRadius: '12px',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#1E2329',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={28} color="#EF4444" />
          </div>
        </div>

        {/* Heading */}
        <div
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#F0F2F4',
            marginBottom: '8px',
          }}
        >
          Unable to load webhooks
        </div>

        {/* Error message */}
        <div
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#6B7380',
            marginBottom: '20px',
            maxWidth: '320px',
            marginInline: 'auto',
          }}
        >
          {displayMessage}
        </div>

        {/* Try Again button */}
        <button
          onClick={reset}
          style={{
            background: '#6366F1',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#4F46E5')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#6366F1')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
