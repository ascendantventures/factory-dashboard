'use client';

import { Trash2, X } from 'lucide-react';

interface Props {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionsBar({ selectedCount, onDelete, onClear }: Props) {
  return (
    <div
      data-testid="bulk-action-bar"
      style={{
        position: 'sticky',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: '#323238',
        border: '1px solid #3F3F46',
        borderRadius: '8px',
        padding: '12px 20px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        zIndex: 40,
        width: 'fit-content',
        marginBottom: '16px',
        animation: 'slide-up 200ms cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '14px', fontWeight: 500, color: '#FAFAFA' }}>
        {selectedCount} selected
      </span>

      <div style={{ width: '1px', height: '24px', background: '#3F3F46' }} />

      <button
        data-testid="bulk-delete-btn"
        onClick={onDelete}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: '#EF4444',
          border: 'none',
          borderRadius: '6px',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '14px',
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
      >
        <Trash2 size={16} />
        Delete {selectedCount} Selected
      </button>

      <button
        onClick={onClear}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          borderRadius: '6px',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          border: 'none',
          background: 'transparent',
          color: '#71717A',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
      >
        <X size={14} /> Clear
      </button>
    </div>
  );
}
