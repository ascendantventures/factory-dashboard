'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface UserInfo {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

interface Props {
  user: UserInfo;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRoleModal({ user, onClose, onSuccess }: Props) {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Update failed'); return; }
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
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(15,23,42,0.1)', maxWidth: '420px', width: '100%' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Change Role</h2>
          <button
            onClick={onClose}
            style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Updating role for:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>
                  {getInitials(user.display_name)}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: 0 }}>{user.display_name}</p>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{user.email}</p>
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>New role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{
                  height: '40px', width: '100%', boxSizing: 'border-box',
                  border: '1px solid #E2E8F0', borderRadius: '6px',
                  padding: '0 12px', fontSize: '14px', color: '#334155',
                  appearance: 'none', background: '#FFFFFF', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error && <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>{error}</p>}
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: '1px solid #E2E8F0', background: 'transparent', color: '#334155', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, background: loading ? '#93C5FD' : '#2563EB', color: '#FFFFFF', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Updating…' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
