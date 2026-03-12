'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Props {
  selectedCount: number;
  onAction: (action: 'role_change' | 'deactivate' | 'reactivate', role?: string) => Promise<void>;
  onClear: () => void;
}

export function BulkActionsBar({ selectedCount, onAction, onClear }: Props) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAction(action: 'role_change' | 'deactivate' | 'reactivate', role?: string) {
    setLoading(true);
    setShowRoleMenu(false);
    await onAction(action, role);
    setLoading(false);
  }

  return (
    <div style={{
      background: '#DBEAFE', borderRadius: '8px', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
    }}>
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1D4ED8' }}>
        {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
      </span>

      {/* Change Role dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowRoleMenu(v => !v)}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500,
            border: '1px solid #BFDBFE', background: '#FFFFFF', color: '#1D4ED8', cursor: 'pointer',
          }}
        >
          Change Role <ChevronDown size={14} />
        </button>
        {showRoleMenu && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: '4px',
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(15,23,42,0.1)', zIndex: 10,
            minWidth: '160px', padding: '4px 0',
          }}>
            {(['viewer', 'operator', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => handleAction('role_change', r)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  border: 'none', background: 'transparent', fontSize: '14px', color: '#334155', cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => handleAction('deactivate')}
        disabled={loading}
        style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
      >
        Deactivate
      </button>

      <button
        onClick={() => handleAction('reactivate')}
        disabled={loading}
        style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#059669', cursor: 'pointer' }}
      >
        Reactivate
      </button>

      <button
        onClick={onClear}
        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}
      >
        <X size={14} /> Clear
      </button>
    </div>
  );
}
