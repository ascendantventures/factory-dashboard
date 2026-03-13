'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Pencil, Activity } from 'lucide-react';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
}

interface WebhookCardProps {
  webhook: Webhook;
}

const MAX_VISIBLE_EVENTS = 5;

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
    setEnabled(newEnabled); // optimistic
    try {
      const res = await fetch(`/api/settings/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (!res.ok) setEnabled(!newEnabled); // revert on error
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
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '14px',
                color: '#F0F2F4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {webhook.url}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6B7380', marginTop: '2px' }}>
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
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                }}
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
