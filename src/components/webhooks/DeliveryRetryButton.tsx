'use client';

import { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryRetryButtonProps {
  webhookId: string;
  deliveryId: string;
  onSuccess?: (newDeliveryId: string, statusCode: number | null) => void;
}

export default function DeliveryRetryButton({
  webhookId,
  deliveryId,
  onSuccess,
}: DeliveryRetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      const res = await fetch(
        `/api/settings/webhooks/${webhookId}/deliveries/${deliveryId}/retry`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(`Retry failed: ${data.error ?? res.statusText}`);
        return;
      }
      const data = await res.json();
      toast.success(
        `Delivery retried — ${data.status_code ?? 'no response'}`
      );
      onSuccess?.(data.new_delivery_id, data.status_code);
    } catch (err) {
      toast.error(`Retry failed: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <button
      type="button"
      data-testid="retry-button"
      onClick={handleRetry}
      disabled={isRetrying}
      aria-label="Retry delivery"
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
        transition: 'all 150ms ease',
        opacity: isRetrying ? 0.5 : 1,
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
          style={{ animation: 'spin 1s linear infinite' }}
        />
      ) : (
        <RotateCcw size={14} />
      )}
      <span>Retry</span>
    </button>
  );
}
