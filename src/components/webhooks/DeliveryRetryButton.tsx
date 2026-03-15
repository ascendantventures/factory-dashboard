'use client';

import { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';

interface DeliveryRetryButtonProps {
  webhookId: string;
  deliveryId: string;
  event: string;
  onSuccess?: (newStatusCode: number | null, newDeliveryId: string) => void;
}

export default function DeliveryRetryButton({
  webhookId,
  deliveryId,
  event,
  onSuccess,
}: DeliveryRetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [result, setResult] = useState<{ statusCode: number | null } | null>(null);

  async function handleRetry() {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      const res = await fetch(
        `/api/settings/webhooks/${webhookId}/deliveries/${deliveryId}/retry`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (!res.ok) {
        // Show error feedback in the button area
        console.error('Retry failed:', data.error);
        setResult(null);
        return;
      }

      setResult({ statusCode: data.status_code });
      onSuccess?.(data.status_code, data.new_delivery_id);
    } catch {
      // Network error
    } finally {
      setIsRetrying(false);
    }
  }

  // Show outcome briefly after a successful retry
  if (result !== null) {
    const ok = result.statusCode !== null && result.statusCode >= 200 && result.statusCode < 300;
    return (
      <span
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '6px',
          background: ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: ok ? '#10B981' : '#EF4444',
        }}
      >
        {result.statusCode ?? 'timeout'}
      </span>
    );
  }

  return (
    <button
      data-testid="retry-button"
      type="button"
      onClick={handleRetry}
      disabled={isRetrying}
      aria-label={`Retry delivery for ${event} event`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '12px',
        fontWeight: 500,
        color: '#B8BFC7',
        background: 'transparent',
        border: '1px solid #2E353D',
        borderRadius: '6px',
        padding: '6px 10px',
        cursor: isRetrying ? 'not-allowed' : 'pointer',
        opacity: isRetrying ? 0.5 : 1,
        transition: 'all 150ms ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!isRetrying) {
          e.currentTarget.style.background = '#1E2329';
          e.currentTarget.style.borderColor = '#3A424D';
          e.currentTarget.style.color = '#FAFAFB';
        }
      }}
      onMouseLeave={(e) => {
        if (!isRetrying) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = '#2E353D';
          e.currentTarget.style.color = '#B8BFC7';
        }
      }}
    >
      {isRetrying ? (
        <Loader2
          size={14}
          style={{
            animation: 'spin 1s linear infinite',
          }}
        />
      ) : (
        <RotateCcw size={14} />
      )}
      <span>Retry</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .retry-spinner { animation: none; }
        }
      `}</style>
    </button>
  );
}
