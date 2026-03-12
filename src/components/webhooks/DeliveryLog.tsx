'use client';

import { formatDistanceToNow } from 'date-fns';

interface Delivery {
  id: string;
  event: string;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  sent_at: string;
}

interface DeliveryLogProps {
  deliveries: Delivery[];
}

function getRowStyle(statusCode: number | null): React.CSSProperties {
  if (statusCode === null) {
    return { background: '#2E2514' };
  }
  if (statusCode >= 200 && statusCode < 300) {
    return { background: '#0D2E24' };
  }
  if (statusCode >= 400) {
    return { background: '#2E1515' };
  }
  return {};
}

function getStatusBadgeStyle(statusCode: number | null) {
  if (statusCode === null) {
    return { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' };
  }
  if (statusCode >= 200 && statusCode < 300) {
    return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' };
  }
  return { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' };
}

export default function DeliveryLog({ deliveries }: DeliveryLogProps) {
  if (deliveries.length === 0) {
    return (
      <div
        data-testid="delivery-log"
        style={{
          padding: '32px',
          textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#6B7380',
          border: '1px solid #2E353D',
          borderRadius: '12px',
          background: '#161A1F',
        }}
      >
        No deliveries yet. Send a test payload to see results here.
      </div>
    );
  }

  return (
    <div
      data-testid="delivery-log"
      style={{
        border: '1px solid #2E353D',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 80px 1fr 120px',
          background: '#1E2329',
          borderBottom: '1px solid #2E353D',
          padding: '0',
        }}
      >
        {['Event', 'Status', 'Response', 'Sent'].map((col) => (
          <div
            key={col}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
              color: '#6B7380',
              padding: '12px 16px',
            }}
          >
            {col}
          </div>
        ))}
      </div>

      {/* Rows */}
      {deliveries.map((delivery, idx) => {
        const badgeStyle = getStatusBadgeStyle(delivery.status_code);
        const rowStyle = getRowStyle(delivery.status_code);
        return (
          <div
            key={delivery.id}
            data-testid="delivery-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 80px 1fr 120px',
              ...rowStyle,
              borderBottom: idx < deliveries.length - 1 ? '1px solid #232930' : 'none',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!rowStyle.background) e.currentTarget.style.background = '#1E2329';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = rowStyle.background as string ?? '';
            }}
          >
            {/* Event */}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#1E2329',
                  color: '#B8BFC7',
                  border: '1px solid #2E353D',
                }}
              >
                {delivery.event}
              </span>
            </div>
            {/* Status */}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: badgeStyle.bg,
                  color: badgeStyle.color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {delivery.status_code ?? 'timeout'}
              </span>
            </div>
            {/* Response */}
            <div
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  color: '#6B7380',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {delivery.response_body ? delivery.response_body.slice(0, 40) : '—'}
              </span>
            </div>
            {/* Sent */}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B7380' }}>
                {formatDistanceToNow(new Date(delivery.sent_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
