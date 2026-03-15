'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Webhook, Pencil, Trash2, X, History } from 'lucide-react';
import DeliveryHistoryDrawer from '@/components/webhooks/DeliveryHistoryDrawer';

const PIPELINE_EVENTS = [
  'station_transition',
  'agent_spawn',
  'agent_complete',
  'notification_sent',
  'thread_push',
  'token_usage',
  'github_webhook',
];

interface HarnessWebhook {
  webhook_id: string;
  name: string;
  url: string;
  enabled: boolean;
  events: string[];
  created_at: string;
  updated_at: string;
}

// ── Toggle Component ──────────────────────────────────────────────────────────
function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      data-testid="enabled-toggle"
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      style={{
        width: '36px', height: '20px', borderRadius: '10px',
        background: enabled ? '#6366F1' : '#3F3F46',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 150ms ease', padding: 0, flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: enabled ? '18px' : '2px', width: '16px', height: '16px',
        borderRadius: '50%', background: '#FAFAFA',
        transition: 'left 150ms cubic-bezier(0.25, 1, 0.5, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

// ── Webhook Card ──────────────────────────────────────────────────────────────
function WebhookCard({
  webhook,
  onEdit,
  onDelete,
  onToggle,
  onViewDeliveries,
}: {
  webhook: HarnessWebhook;
  onEdit: (w: HarnessWebhook) => void;
  onDelete: (w: HarnessWebhook) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onViewDeliveries: (w: HarnessWebhook) => void;
}) {
  return (
    <div
      data-testid="webhook-card"
      style={{
        background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px',
        padding: '16px 20px', transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#52525B'; (e.currentTarget as HTMLDivElement).style.background = '#1F1F23'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#3F3F46'; (e.currentTarget as HTMLDivElement).style.background = '#18181B'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {webhook.name}
            </h3>
            <Toggle enabled={webhook.enabled} onChange={(v) => onToggle(webhook.webhook_id, v)} />
          </div>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#A1A1AA', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {webhook.url}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {webhook.events.map(event => (
              <span key={event} style={{ fontSize: '11px', background: '#27272A', color: '#71717A', padding: '3px 8px', borderRadius: '4px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {event}
              </span>
            ))}
            {webhook.events.length === 0 && (
              <span style={{ fontSize: '11px', color: '#71717A', fontStyle: 'italic' }}>No events selected</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            data-testid="view-deliveries-btn"
            onClick={() => onViewDeliveries(webhook)}
            style={{ height: '32px', padding: '0 10px', borderRadius: '6px', background: 'transparent', border: '1px solid #3F3F46', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, transition: 'all 150ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#52525B'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3F3F46'; }}
            aria-label="View delivery history"
          >
            <History size={14} />
            Deliveries
          </button>
          <button
            onClick={() => onEdit(webhook)}
            style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
            aria-label="Edit webhook"
          >
            <Pencil size={16} />
          </button>
          <button
            data-testid="delete-webhook-btn"
            onClick={() => onDelete(webhook)}
            style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#F87171'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
            aria-label="Delete webhook"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Webhook Modal ─────────────────────────────────────────────────────────────
function WebhookModal({
  mode,
  webhook,
  onClose,
  onSave,
}: {
  mode: 'add' | 'edit';
  webhook?: HarnessWebhook;
  onClose: () => void;
  onSave: (data: { name: string; url: string; secret: string; events: string[]; enabled: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState(webhook?.name ?? '');
  const [url, setUrl] = useState(webhook?.url ?? '');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<Set<string>>(new Set(webhook?.events ?? []));
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleEvent(event: string) {
    setEvents(prev => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlError('');
    setError('');

    if (!name.trim()) { setError('Name is required'); return; }
    if (!url.trim()) { setUrlError('URL is required'); return; }
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'https:') { setUrlError('URL must use HTTPS'); return; }
    } catch {
      setUrlError('Invalid URL');
      return;
    }

    setLoading(true);
    try {
      await onSave({ name: name.trim(), url: url.trim(), secret: secret.trim(), events: Array.from(events), enabled: webhook?.enabled ?? true });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhook');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '40px', background: '#27272A', border: '1px solid #3F3F46',
    borderRadius: '6px', padding: '0 12px', fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px', color: '#FAFAFA', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <div
        data-testid="webhook-modal"
        style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #27272A' }}>
          <h2 style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
            {mode === 'add' ? 'Add Webhook' : 'Edit Webhook'}
          </h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '12px 16px', color: '#F87171', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>
                Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                data-testid="webhook-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Slack Hook"
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6366F1'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#3F3F46'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>
                URL <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                data-testid="webhook-url"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                placeholder="https://hooks.slack.com/..."
                style={{ ...inputStyle, borderColor: urlError ? '#EF4444' : '#3F3F46', boxShadow: urlError ? '0 0 0 3px rgba(239,68,68,0.15)' : 'none' }}
                onFocus={(e) => { if (!urlError) { (e.target as HTMLInputElement).style.borderColor = '#6366F1'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}}
                onBlur={(e) => { if (!urlError) { (e.target as HTMLInputElement).style.borderColor = '#3F3F46'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}}
              />
              <p style={{ fontSize: '12px', color: '#71717A', marginTop: '4px' }}>Must be HTTPS</p>
              {urlError && <p data-testid="url-error" style={{ fontSize: '12px', color: '#F87171', marginTop: '4px' }}>{urlError}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>
                Signing Secret <span style={{ fontSize: '11px', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                data-testid="webhook-secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Optional HMAC secret"
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6366F1'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#3F3F46'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
              />
              <p style={{ fontSize: '12px', color: '#71717A', marginTop: '4px' }}>Used for X-Factory-Signature header</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A1A1AA', marginBottom: '10px' }}>Events</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PIPELINE_EVENTS.map(event => (
                  <label key={event} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#A1A1AA', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      data-testid={`event-${event}`}
                      checked={events.has(event)}
                      onChange={() => toggleEvent(event)}
                      style={{ width: '16px', height: '16px', accentColor: '#6366F1', cursor: 'pointer' }}
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #27272A' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ height: '40px', padding: '0 20px', background: 'transparent', border: '1px solid #3F3F46', borderRadius: '6px', color: '#A1A1AA', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              data-testid="webhook-save-btn"
              type="submit"
              disabled={loading}
              style={{ height: '40px', padding: '0 20px', background: loading ? '#4F46E5' : '#6366F1', border: 'none', borderRadius: '6px', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving…' : mode === 'add' ? 'Create Webhook' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────
function ConfirmDeleteDialog({ webhook, onClose, onConfirm }: { webhook: HarnessWebhook; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try { await onConfirm(); onClose(); } catch { setLoading(false); }
  }

  return (
    <div
      data-testid="confirm-dialog"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '18px', fontWeight: 600, color: '#FAFAFA', marginBottom: '12px' }}>Delete webhook?</h3>
        <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.6, marginBottom: '24px' }}>
          This will permanently delete &ldquo;{webhook.name}&rdquo; and stop all event deliveries to this endpoint.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ height: '40px', padding: '0 20px', background: 'transparent', border: '1px solid #3F3F46', borderRadius: '6px', color: '#A1A1AA', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            data-testid="confirm-delete-btn"
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{ height: '40px', padding: '0 20px', background: '#EF4444', border: 'none', borderRadius: '6px', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────
export default function HarnessWebhooksClient() {
  const [webhooks, setWebhooks] = useState<HarnessWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<HarnessWebhook | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<HarnessWebhook | null>(null);
  const [deliveryWebhook, setDeliveryWebhook] = useState<HarnessWebhook | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/harness/webhooks');
      const json = await res.json();
      setWebhooks(json.webhooks ?? []);
    } catch { setWebhooks([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  async function handleAdd(data: { name: string; url: string; secret: string; events: string[]; enabled: boolean }) {
    const res = await fetch('/api/harness/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to create webhook');
    setWebhooks(prev => [json, ...prev]);
  }

  async function handleEdit(data: { name: string; url: string; secret: string; events: string[]; enabled: boolean }) {
    if (!editingWebhook) return;
    const res = await fetch(`/api/harness/webhooks/${editingWebhook.webhook_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to update webhook');
    setWebhooks(prev => prev.map(w => w.webhook_id === editingWebhook.webhook_id ? json : w));
  }

  async function handleDelete() {
    if (!deletingWebhook) return;
    const res = await fetch(`/api/harness/webhooks/${deletingWebhook.webhook_id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete webhook');
    setWebhooks(prev => prev.filter(w => w.webhook_id !== deletingWebhook.webhook_id));
  }

  async function handleToggle(id: string, enabled: boolean) {
    const res = await fetch(`/api/harness/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      setWebhooks(prev => prev.map(w => w.webhook_id === id ? { ...w, enabled } : w));
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: '#71717A', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' }}>
        Loading webhooks…
      </div>
    );
  }

  return (
    <>
      {/* Header row with Add Webhook button when list is non-empty */}
      {webhooks.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            data-testid="add-webhook-btn"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 20px', background: '#6366F1', border: 'none', borderRadius: '6px', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={16} />
            Add Webhook
          </button>
        </div>
      )}

      {/* Webhook List or Empty State */}
      {webhooks.length === 0 ? (
        <div data-testid="empty-state" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <Webhook size={48} style={{ margin: '0 auto 16px', color: '#71717A' }} />
          <h3 style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '18px', fontWeight: 600, color: '#FAFAFA', marginBottom: '8px' }}>
            No webhooks configured
          </h3>
          <p style={{ fontSize: '14px', color: '#A1A1AA', maxWidth: '400px', margin: '0 auto 24px' }}>
            Send pipeline events to Slack, Discord, or any HTTP endpoint.
          </p>
          <button
            data-testid="add-webhook-btn"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 20px', background: '#6366F1', border: 'none', borderRadius: '6px', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={16} />
            Add Webhook
          </button>
        </div>
      ) : (
        <div data-testid="webhook-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {webhooks.map(webhook => (
            <WebhookCard
              key={webhook.webhook_id}
              webhook={webhook}
              onEdit={(w) => setEditingWebhook(w)}
              onDelete={(w) => setDeletingWebhook(w)}
              onToggle={handleToggle}
              onViewDeliveries={(w) => setDeliveryWebhook(w)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <WebhookModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
        />
      )}

      {/* Edit Modal */}
      {editingWebhook && (
        <WebhookModal
          mode="edit"
          webhook={editingWebhook}
          onClose={() => setEditingWebhook(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirm */}
      {deletingWebhook && (
        <ConfirmDeleteDialog
          webhook={deletingWebhook}
          onClose={() => setDeletingWebhook(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Delivery History Drawer */}
      {deliveryWebhook && (
        <DeliveryHistoryDrawer
          webhookId={deliveryWebhook.webhook_id}
          webhookUrl={deliveryWebhook.url}
          onClose={() => setDeliveryWebhook(null)}
        />
      )}
    </>
  );
}
