'use client';

import { Search, ChevronDown } from 'lucide-react';

interface Props {
  search: string;
  role: string;
  status: string;
  onSearchChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onClear: () => void;
}

export function UserFilters({ search, role, status, onSearchChange, onRoleChange, onStatusChange, onClear }: Props) {
  const hasFilters = search || (role && role !== 'all') || (status && status !== 'all');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '16px', background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', marginBottom: '16px' }}>
      {/* Search */}
      <div style={{ position: 'relative', width: '280px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by name or email"
          style={{
            height: '40px', width: '100%', boxSizing: 'border-box',
            border: '1px solid #3F3F46', borderRadius: '6px',
            paddingLeft: '40px', paddingRight: '12px',
            fontSize: '14px', color: '#FAFAFA', background: '#27272A', outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.background = '#18181B'; e.currentTarget.style.border = '1px solid #6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
          onBlur={e => { e.currentTarget.style.background = '#27272A'; e.currentTarget.style.border = '1px solid #3F3F46'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Role filter */}
      <div style={{ position: 'relative' }}>
        <select
          name="role"
          value={role}
          onChange={e => onRoleChange(e.target.value)}
          style={{
            height: '40px', padding: '0 32px 0 12px', border: '1px solid #3F3F46', borderRadius: '6px',
            fontSize: '14px', color: '#FAFAFA', background: '#18181B', appearance: 'none', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="operator">Operator</option>
          <option value="viewer">Viewer</option>
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717A', pointerEvents: 'none' }} />
      </div>

      {/* Status filter */}
      <div style={{ position: 'relative' }}>
        <select
          name="status"
          value={status}
          onChange={e => onStatusChange(e.target.value)}
          style={{
            height: '40px', padding: '0 32px 0 12px', border: '1px solid #3F3F46', borderRadius: '6px',
            fontSize: '14px', color: '#FAFAFA', background: '#18181B', appearance: 'none', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717A', pointerEvents: 'none' }} />
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: 'none', background: 'transparent', color: '#6366F1', cursor: 'pointer' }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
