'use client';

export type UserFilter = 'all' | 'real' | 'test';

interface Props {
  activeFilter: UserFilter;
  counts: { all: number; real: number; test: number };
  onChange: (filter: UserFilter) => void;
}

const TABS: { id: UserFilter; label: string; testId: string }[] = [
  { id: 'all', label: 'All', testId: 'filter-tab-all' },
  { id: 'real', label: 'Real', testId: 'filter-tab-real' },
  { id: 'test', label: 'Test Accounts', testId: 'filter-tab-test' },
];

export function UserFilterTabs({ activeFilter, counts, onChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        background: '#18181B',
        border: '1px solid #3F3F46',
        borderRadius: '6px',
        padding: '4px',
      }}
    >
      {TABS.map(tab => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            data-testid={tab.testId}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#6366F1' : '#A1A1AA',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              transition: 'all 150ms ease',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = '#27272A';
                (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA';
              }
            }}
          >
            {tab.label}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#27272A',
                color: '#71717A',
                fontSize: '11px',
                fontWeight: 500,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
