'use client';

export interface IssueFilters {
  station: string;
  complexity: string;
  from: string;
  to: string;
}

interface IssueFilterBarProps {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
}

const STATIONS = ['', 'intake', 'spec', 'design', 'build', 'test', 'done', 'failed'];
const COMPLEXITIES = ['', 'simple', 'medium', 'complex'];

const selectStyle: React.CSSProperties = {
  height: '44px',
  background: '#1A1918',
  color: '#F5F3F0',
  fontSize: '14px',
  fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
  padding: '0 32px 0 12px',
  border: '1px solid #3D3937',
  borderRadius: '6px',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none' as const,
};

const inputStyle: React.CSSProperties = {
  height: '44px',
  background: '#1A1918',
  color: '#F5F3F0',
  fontSize: '13px',
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  padding: '0 12px',
  border: '1px solid #3D3937',
  borderRadius: '6px',
  outline: 'none',
  width: '130px',
};

export default function IssueFilterBar({ filters, onChange }: IssueFilterBarProps) {
  const hasFilters = filters.station || filters.complexity || filters.from || filters.to;

  function update(key: keyof IssueFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange({ station: '', complexity: '', from: '', to: '' });
  }

  return (
    <div
      data-testid="filter-bar"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        background: '#1A1918',
        padding: '16px',
        border: '1px solid #3D3937',
        borderRadius: '8px',
        marginBottom: '16px',
      }}
    >
      {/* Station filter */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#7A7672', whiteSpace: 'nowrap' }}>
          Stage
        </span>
        <div style={{ position: 'relative' }}>
          <select
            data-testid="filter-station"
            value={filters.station}
            onChange={(e) => update('station', e.target.value)}
            style={{ ...selectStyle, width: '140px' }}
          >
            {STATIONS.map((s) => (
              <option key={s} value={s} style={{ background: '#1A1918' }}>
                {s === '' ? 'All stages' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <span
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#7A7672',
              fontSize: '12px',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Complexity filter */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#7A7672', whiteSpace: 'nowrap' }}>
          Complexity
        </span>
        <div style={{ position: 'relative' }}>
          <select
            data-testid="filter-complexity"
            value={filters.complexity}
            onChange={(e) => update('complexity', e.target.value)}
            style={{ ...selectStyle, width: '120px' }}
          >
            {COMPLEXITIES.map((c) => (
              <option key={c} value={c} style={{ background: '#1A1918' }}>
                {c === '' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <span
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#7A7672',
              fontSize: '12px',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#7A7672', whiteSpace: 'nowrap' }}>
          From
        </span>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => update('from', e.target.value)}
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
        <span style={{ fontSize: '13px', color: '#7A7672' }}>to</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => update('to', e.target.value)}
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          style={{
            background: 'transparent',
            color: '#D4A012',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            padding: '0 4px',
            fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
