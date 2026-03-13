'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterState {
  email: string;
  category: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}

interface AuditFiltersProps {
  onChange: (filters: FilterState) => void;
}

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'user_management', label: 'User Management' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'issues', label: 'Issues' },
  { value: 'settings', label: 'Settings' },
  { value: 'auth', label: 'Auth' },
];

const inputStyle: React.CSSProperties = {
  height: '40px',
  background: '#12151A',
  border: '1px solid #2A3038',
  borderRadius: '8px',
  padding: '0 12px',
  fontSize: '14px',
  fontWeight: 400,
  color: '#F0F2F5',
  outline: 'none',
  width: '100%',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#A8B2BF',
  marginBottom: '6px',
};

export function AuditFilters({ onChange }: AuditFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    email: '',
    category: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Debounce text fields
  const debouncedOnChange = useCallback(
    (() => {
      let timeout: ReturnType<typeof setTimeout>;
      return (f: FilterState) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => onChange(f), 300);
      };
    })(),
    [onChange],
  );

  useEffect(() => {
    debouncedOnChange(filters);
  }, [filters, debouncedOnChange]);

  function update(key: keyof FilterState, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function clearAll() {
    const empty: FilterState = { email: '', category: '', action: '', dateFrom: '', dateTo: '' };
    setFilters(empty);
    onChange(empty);
  }

  return (
    <div
      style={{
        background: '#161A1F',
        border: '1px solid #2A3038',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'flex-end',
        }}
      >
        {/* Email Search */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={labelStyle}>Search by email</label>
          <div style={{ position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#6B7785',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="actor@example.com"
              value={filters.email}
              onChange={e => update('email', e.target.value)}
              data-testid="email-search"
              style={{ ...inputStyle, paddingLeft: '40px' }}
              onFocus={e => {
                (e.target as HTMLInputElement).style.borderColor = '#D4A534';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(212,165,52,0.15)';
              }}
              onBlur={e => {
                (e.target as HTMLInputElement).style.borderColor = '#2A3038';
                (e.target as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Category Select */}
        <div style={{ width: '180px' }}>
          <label style={labelStyle}>Category</label>
          <Select
            value={filters.category || '_all_'}
            onValueChange={(v) => update('category', v === '_all_' ? '' : v)}
          >
            <SelectTrigger
              data-testid="category-filter"
              className="h-10 bg-[#12151A] border-[#2A3038] text-[#F0F2F5] focus:border-[#D4A534] focus:ring-[#D4A534]/15 focus:ring-offset-0"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E2328] border-[#2A3038] text-[#F0F2F5]">
              {CATEGORIES.map((c) => (
                <SelectItem
                  key={c.value || '_all_'}
                  value={c.value || '_all_'}
                  className="focus:bg-[#2A3038] focus:text-[#F0F2F5]"
                >
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Search */}
        <div style={{ width: '200px' }}>
          <label style={labelStyle}>Action</label>
          <input
            type="text"
            placeholder="e.g. approve_spec"
            value={filters.action}
            onChange={e => update('action', e.target.value)}
            data-testid="action-search"
            style={inputStyle}
            onFocus={e => {
              (e.target as HTMLInputElement).style.borderColor = '#D4A534';
              (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(212,165,52,0.15)';
            }}
            onBlur={e => {
              (e.target as HTMLInputElement).style.borderColor = '#2A3038';
              (e.target as HTMLInputElement).style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Date Range — responsive wrapper */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
          className="date-range-wrapper"
        >
          {/* Date From */}
          <div style={{ width: '160px', minWidth: '140px', flexShrink: 1 }}>
            <label style={labelStyle}>From</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => update('dateFrom', e.target.value)}
                data-testid="date-from"
                style={{ ...inputStyle, paddingRight: '36px', colorScheme: 'dark' }}
                onFocus={e => {
                  (e.target as HTMLInputElement).style.borderColor = '#D4A534';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(212,165,52,0.15)';
                }}
                onBlur={e => {
                  (e.target as HTMLInputElement).style.borderColor = '#2A3038';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
              <Calendar
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#6B7785',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Date To */}
          <div style={{ width: '160px', minWidth: '140px', flexShrink: 1 }}>
            <label style={labelStyle}>To</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => update('dateTo', e.target.value)}
                data-testid="date-to"
                style={{ ...inputStyle, paddingRight: '36px', colorScheme: 'dark' }}
                onFocus={e => {
                  (e.target as HTMLInputElement).style.borderColor = '#D4A534';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(212,165,52,0.15)';
                }}
                onBlur={e => {
                  (e.target as HTMLInputElement).style.borderColor = '#2A3038';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
              <Calendar
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#6B7785',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              onClick={clearAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                height: '40px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#A8B2BF',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,165,52,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = '#D4A534';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#A8B2BF';
              }}
            >
              <X style={{ width: '14px', height: '14px' }} />
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
