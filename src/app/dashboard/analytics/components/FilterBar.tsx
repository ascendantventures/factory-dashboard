'use client';

import { RotateCcw } from 'lucide-react';

interface FilterBarProps {
  from: string;
  to: string;
  repo: string;
  repos: string[];
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onRepoChange: (v: string) => void;
  onReset: () => void;
}

const inputStyle: React.CSSProperties = {
  height: '36px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0 12px',
  fontSize: '14px',
  fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
  color: 'var(--text-primary)',
  outline: 'none',
  colorScheme: 'dark',
};

export default function FilterBar({
  from, to, repo, repos,
  onFromChange, onToChange, onRepoChange, onReset,
}: FilterBarProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>From</label>
        <input
          type="date"
          value={from.slice(0, 10)}
          onChange={e => onFromChange(e.target.value ? new Date(e.target.value).toISOString() : from)}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>To</label>
        <input
          type="date"
          value={to.slice(0, 10)}
          onChange={e => onToChange(e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : to)}
          style={inputStyle}
        />
      </div>
      <select
        data-testid="filter-repo"
        value={repo}
        onChange={e => onRepoChange(e.target.value)}
        style={{ ...inputStyle, minWidth: '160px', cursor: 'pointer' }}
      >
        <option value="">All repos</option>
        {repos.map(r => (
          <option key={r} value={r}>{r.split('/').pop() ?? r}</option>
        ))}
      </select>
      <button
        onClick={onReset}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
          cursor: 'pointer',
          transition: 'all 150ms ease-out',
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(59,130,246,0.1)'; (e.target as HTMLButtonElement).style.color = '#3B82F6'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
      >
        <RotateCcw size={14} />
        Reset filters
      </button>
    </div>
  );
}
