'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Pencil, Activity, Slack } from 'lucide-react';

// Custom Discord SVG icon
function DiscordIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  format_type?: string | null;
  created_at: string;
}

interface WebhookCardProps {
  webhook: Webhook;
}

const MAX_VISIBLE_EVENTS = 5;

function FormatBadge({ formatType }: { formatType: string }) {
  if (formatType === 'standard' || !formatType) return null;

  const isSlack = formatType === 'slack';
  return (
    <span
      data-testid="format-badge"
      data-format={formatType}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        background: isSlack ? 'rgba(155, 89, 182, 0.15)' : 'rgba(88, 101, 242, 0.15)',
        color: isSlack ? '#9B59B6' : '#5865F2',
      }}
    >
      {isSlack ? <Slack size={11} /> : <DiscordIcon size={11} />}
      {isSlack ? 'Slack' : 'Discord'}
    </span>
  );
}

export default function WebhookCard({ webhook }: WebhookCardProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(webhook.enabled);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    try {
      const res = await fetch(`/api/settings/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (!res.ok) setEnabled(!newEnabled);
      else router.refresh();
    } catch {
      setEnabled(!newEnabled);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/settings/webhooks/${webhook.id}`, { method: 'DELETE' });
      router.push('/dashboard/settings/webhooks');
      router.refresh();
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  const events = Array.isArray(webhook.events) ? webhook.events as string[] : [];
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const extraCount = events.length - MAX_VISIBLE_EVENTS;

  return (
    <>
      <div
        data-testid="webhook-card"
        style={{
          background: '#161A1F',
          border: '1px solid #2E353D',
          borderRadius: '12px',
          padding: '20px',
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(232, 93, 4, 0.3)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#2E353D';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '2px' }}>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '14px',
                  color: '#F0F2F4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {webhook.url}
              </div>
              {webhook.format_type && <FormatBadge formatType={webhook.format_type} />}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6B7380' }}>
              Created {formatDistanceToNow(new Date(webhook.created_at), { addSuffix: true })}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status badge */}
            <span
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.02em',
                padding: '4px 8px',
                borderRadius: '6px',
                background: enabled ? 'rgba(16, 185, 129, 0.15)' : '#1E2329',
                color: enabled ? '#10B981' : '#6B7380',
                border: '1px solid transparent',
              }}
            >
              {enabled ? 'Active' : 'Paused'}
            </span>
            {/* Toggle */}
            <button
              data-testid="enabled-toggle"
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={handleToggle}
              disabled={toggling}
              title={enabled ? 'Disable webhook' : 'Enable webhook'}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: enabled ? '#E85D04' : '#2E353D',
                border: 'none',
                cursor: toggling ? 'not-allowed' : 'pointer',
                position: 'relative',
                transition: 'background 200ms ease',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: enabled ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  background: '#F0F2F4',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 200ms cubic-bezier(0.25, 1, 0.5, 1)',
                  display: 'block',
                }}
              />
            </button>
          </div>
        </div>

        {/* Events row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {visibleEvents.map((event) => (
            <span
              key={event}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.02em',
                padding: '3px 7px',
                borderRadius: '6px',
                background: '#1E2329',
                color: '#B8BFC7',
                border: '1px solid #2E353D',
              }}
            >
              {event}
            </span>
          ))}
          {extraCount > 0 && (
            <span
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 7px',
                borderRadius: '6px',
                background: '#1E2329',
                color: '#6B7380',
                border: '1px solid #2E353D',
              }}
            >
              +{extraCount} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/settings/webhooks/${webhook.id}`}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7380',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#E85D04';
              e.currentTarget.style.background = 'rgba(232, 93, 4, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6B7380';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Activity size={14} />
            View deliveries
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/settings/webhooks/${webhook.id}`}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#B8BFC7',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F0F2F4';
                e.currentTarget.style.background = '#1E2329';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#B8BFC7';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Pencil size={13} />
              Edit
            </Link>
            <button
              data-testid="delete-webhook-btn"
              type="button"
              onClick={() => setShowDeleteModal(true)}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#EF4444',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: '#161A1F',
              border: '1px solid #2E353D',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)' }}
              >
                <Trash2 size={20} color="#EF4444" />
              </div>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0F2F4', marginBottom: '4px' }}>
                  Delete Webhook
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#B8BFC7', lineHeight: 1.6 }}>
                  Permanently remove this webhook and all delivery history. This action cannot be undone.
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2E353D',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F0F2F4',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="confirm-delete-btn"
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
