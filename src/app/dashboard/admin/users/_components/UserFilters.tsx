'use client';

import { Search } from 'lucide-react';

interface Props {
  search: string;
  testFilter: string;
  counts: { all: number; real: number; test: number };
  onSearchChange: (v: string) => void;
  onTestFilterChange: (v: string) => void;
  onClear: () => void;
}

export function UserFilters({ search, testFilter, counts, onSearchChange, onTestFilterChange, onClear }: Props) {
  const tabs = [
    { key: 'all', label: 'All', count: counts.all, testId: 'filter-tab-all' },
    { key: 'real', label: 'Real', count: counts.real, testId: 'filter-tab-real' },
    { key: 'test', label: 'Test Accounts', count: counts.test, testId: 'filter-tab-test' },
  ];

  const hasFilters = search || testFilter !== 'all';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
      {/* Search */}
      <div style={{ position: 'relative', width: '280px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#71717A',
            pointerEvents: 'none',
          }}
        />
        <input
          data-testid="user-search"
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by email"
          style={{
            height: '40px',
            width: '100%',
            boxSizing: 'border-box' as const,
            border: '1px solid #3F3F46',
            borderRadius: '6px',
            paddingLeft: '40px',
            paddingRight: '12px',
            fontSize: '14px',
            color: '#FAFAFA',
            background: '#18181B',
            outline: 'none',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#6366F1';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.25)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = '#3F3F46';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Filter Tabs */}
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
        {tabs.map(tab => {
          const isActive = testFilter === tab.key;
          return (
            <button
              key={tab.key}
              data-testid={tab.testId}
              onClick={() => onTestFilterChange(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#6366F1' : '#A1A1AA',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {tab.label}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 500,
                  background: '#27272A',
                  color: '#71717A',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  minWidth: '20px',
                  textAlign: 'center' as const,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            border: '1px solid #3F3F46',
            background: 'transparent',
            color: '#A1A1AA',
            cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
