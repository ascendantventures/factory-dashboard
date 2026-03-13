'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  user: { id: string; display_name: string; is_active: boolean };
  onClose: () => void;
  onSuccess: () => void;
}

export function DeactivateModal({ user, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isDeactivating = user.is_active;

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Action failed'); return; }
      onSuccess();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(15,23,42,0.1)', maxWidth: '400px', width: '100%' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            {isDeactivating ? 'Deactivate User' : 'Reactivate User'}
          </h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', textAlign: 'center' }}>
          {isDeactivating && (
            <div style={{ marginBottom: '16px' }}>
              <AlertTriangle size={24} style={{ color: '#D97706' }} />
            </div>
          )}
          <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
            {isDeactivating
              ? <>Are you sure you want to deactivate <strong>{user.display_name}</strong>? They will be logged out immediately and unable to access the dashboard until reactivated.</>
              : <>Reactivate <strong>{user.display_name}</strong>? They will be able to log in again.</>
            }
          </p>
          {error && <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500, marginTop: '12px' }}>{error}</p>}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: '1px solid #E2E8F0', background: 'transparent', color: '#334155', cursor: 'pointer' }}>
            Cancel
          </button>
          {isDeactivating ? (
            <button
              data-testid="confirm-deactivate-btn"
              onClick={handleConfirm}
              disabled={loading}
              style={{ padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, background: loading ? '#FCA5A5' : '#DC2626', color: '#FFFFFF', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Deactivating…' : 'Deactivate'}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{ padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, background: loading ? '#93C5FD' : '#2563EB', color: '#FFFFFF', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Reactivating…' : 'Reactivate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
