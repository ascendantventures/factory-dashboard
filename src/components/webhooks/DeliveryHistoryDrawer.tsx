'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, RefreshCw, Clock, Send, Timer } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliveryRecord {
  id: string;
  event_type: string;
  attempt_number: number;
  delivery_status: 'pending' | 'success' | 'failed' | 'retrying';
  response_code: number | null;
  error_message: string | null;
  delivered_at: string | null;
  next_retry_at: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const d = date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRetryIn(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const diffSec = Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  return `${Math.ceil(diffSec / 60)}m`;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, responseCode }: { status: DeliveryRecord['delivery_status']; responseCode: number | null }) {
  const configs = {
    success: {
      bg: 'rgba(34,197,94,0.15)', color: '#22C55E',
      label: responseCode ? String(responseCode) : '200',
      Icon: CheckCircle,
    },
    failed: {
      bg: 'rgba(239,68,68,0.15)', color: '#EF4444',
      label: responseCode ? String(responseCode) : 'Failed',
      Icon: XCircle,
    },
    retrying: {
      bg: 'rgba(245,158,11,0.15)', color: '#F59E0B',
      label: 'Retrying',
      Icon: RefreshCw,
    },
    pending: {
      bg: 'rgba(139,139,149,0.1)', color: '#8B8B95',
      label: 'Pending',
      Icon: Clock,
    },
  };
  const { bg, color, label, Icon } = configs[status] ?? configs.pending;
  return (
    <span
      data-testid="delivery-status-badge"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '4px 10px', borderRadius: '6px', background: bg, color,
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', fontWeight: 600,
      }}
    >
      <Icon
        size={12}
        style={status === 'retrying' ? { animation: 'retry-spin 1.5s linear infinite' } : {}}
      />
      {label}
    </span>
  );
}

// ── Retry Badge ───────────────────────────────────────────────────────────────

function RetryBadge({ nextRetryAt }: { nextRetryAt: string }) {
  const [label, setLabel] = useState(() => 'Retry in ' + formatRetryIn(nextRetryAt));
  useEffect(() => {
    const id = setInterval(() => {
      setLabel('Retry in ' + formatRetryIn(nextRetryAt));
    }, 5000);
    return () => clearInterval(id);
  }, [nextRetryAt]);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '4px',
      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
      fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500, color: '#F59E0B',
    }}>
      <Timer size={10} />
      {label}
    </span>
  );
}

// ── Delivery Row ──────────────────────────────────────────────────────────────

function DeliveryRow({ delivery }: { delivery: DeliveryRecord }) {
  const rowBg = {
    success: 'var(--delivery-success-bg, rgba(34,197,94,0.12))',
    failed: 'var(--delivery-failed-bg, rgba(239,68,68,0.12))',
    retrying: 'var(--delivery-retrying-bg, rgba(245,158,11,0.12))',
    pending: 'var(--delivery-pending-bg, rgba(139,139,149,0.08))',
  }[delivery.delivery_status] ?? 'transparent';

  const timestamp = delivery.delivered_at ?? delivery.created_at;

  return (
    <div
      data-testid="delivery-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 120px 90px',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle, #2D2D33)',
        background: rowBg,
        transition: 'background 150ms ease',
        gap: '8px',
      }}
    >
      {/* Col 1: Event Type */}
      <div>
        <span style={{
          display: 'inline-flex', padding: '4px 8px', borderRadius: '6px',
          background: 'var(--surface-alt, #27272A)', border: '1px solid var(--border, #3F3F46)',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500,
          color: 'var(--text-secondary, #A1A1AA)', letterSpacing: '0.02em',
        }}>
          {delivery.event_type}
        </span>
        {delivery.delivery_status === 'retrying' && delivery.next_retry_at && (
          <div style={{ marginTop: '4px' }}>
            <RetryBadge nextRetryAt={delivery.next_retry_at} />
          </div>
        )}
      </div>

      {/* Col 2: Attempt */}
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px',
        fontWeight: 500, color: 'var(--text-muted, #8B8B95)',
      }}>
        Attempt {delivery.attempt_number}
      </div>

      {/* Col 3: Status Badge */}
      <div>
        <StatusBadge status={delivery.delivery_status} responseCode={delivery.response_code} />
      </div>

      {/* Col 4: Timestamp */}
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px',
        color: 'var(--text-muted, #8B8B95)', textAlign: 'right',
      }}>
        {formatRelativeTime(timestamp)}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div data-testid="delivery-empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <Send size={48} color="var(--text-muted, #8B8B95)" />
      </div>
      <div style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 600,
        color: 'var(--text-primary, #FAFAFA)', marginBottom: '8px',
      }}>
        No deliveries yet
      </div>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px',
        color: 'var(--text-secondary, #A1A1AA)', maxWidth: '280px',
        margin: '0 auto', lineHeight: 1.5,
      }}>
        Events will appear here when matching webhooks are triggered.
      </div>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

interface DeliveryHistoryDrawerProps {
  webhookId: string;
  webhookUrl: string;
  onClose: () => void;
}

export default function DeliveryHistoryDrawer({ webhookId, webhookUrl, onClose }: DeliveryHistoryDrawerProps) {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/harness/webhook-delivery/${webhookId}?limit=20`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setDeliveries(json.deliveries ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setDeliveries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [webhookId]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 49,
          animation: 'backdrop-fade-in 200ms ease',
        }}
      />

      {/* Drawer */}
      <div
        data-testid="delivery-history-drawer"
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 'min(520px, 100vw)', height: '100vh',
          background: 'var(--surface, #18181B)',
          borderLeft: '1px solid var(--border, #3F3F46)',
          boxShadow: '-20px 0 40px rgba(0,0,0,0.4)',
          zIndex: 50, display: 'flex', flexDirection: 'column',
          animation: 'delivery-drawer-in 300ms ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          height: '56px', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border, #3F3F46)',
          background: 'var(--surface, #18181B)', position: 'sticky', top: 0,
        }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 600,
            color: 'var(--text-primary, #FAFAFA)',
          }}>
            Delivery History
            {total > 0 && (
              <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 400, color: 'var(--text-muted, #8B8B95)' }}>
                ({total})
              </span>
            )}
          </span>
          <button
            data-testid="delivery-drawer-close"
            onClick={onClose}
            aria-label="Close delivery history"
            style={{
              width: '32px', height: '32px', borderRadius: '6px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted, #8B8B95)', transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt, #27272A)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary, #FAFAFA)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted, #8B8B95)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* URL Bar */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--surface-alt, #27272A)',
          borderBottom: '1px solid var(--border, #3F3F46)',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '13px',
            color: 'var(--text-secondary, #A1A1AA)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {webhookUrl}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted, #8B8B95)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
              Loading…
            </div>
          ) : deliveries.length === 0 ? (
            <EmptyState />
          ) : (
            deliveries.map((d) => <DeliveryRow key={d.id} delivery={d} />)
          )}
        </div>
      </div>
    </>
  );
}
