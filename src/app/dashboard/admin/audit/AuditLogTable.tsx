'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileSearch, SearchX } from 'lucide-react';
import { AuditFilters, FilterState } from './AuditFilters';
import { AuditEntryRow, AuditEntry } from './AuditEntryRow';
import { ExportButton } from './ExportButton';
import { LiveIndicator, LiveStatus } from './LiveIndicator';
import { createSupabaseBrowserClient } from '@/lib/supabase';

interface AuditLogTableProps {
  initialEntries: AuditEntry[];
  initialTotal: number;
}

const PAGE_SIZE = 50;

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #1F242A' }}>
      {[180, 200, 160, 140, 120].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px', width: `${w}px` }}>
          <div
            style={{
              height: '16px',
              background: 'linear-gradient(90deg, #1E2328 0%, #2A3038 50%, #1E2328 100%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              width: `${60 + (i * 13) % 40}%`,
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export function AuditLogTable({ initialEntries, initialTotal }: AuditLogTableProps) {
  const [entries, setEntries] = useState<AuditEntry[]>(initialEntries);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    email: '', category: '', action: '', dateFrom: '', dateTo: '',
  });
  const [realtimeStatus, setRealtimeStatus] = useState<LiveStatus>('CONNECTING');
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Supabase Realtime subscription on audit_log_entries
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel('audit-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log_entries' },
        (payload) => {
          const newEntry = payload.new as AuditEntry;
          const f = filtersRef.current;

          // AC-001.5: respect active filters — skip entries that don't match
          if (f.category && newEntry.category !== f.category) return;
          if (f.email && !newEntry.actor_email?.toLowerCase().includes(f.email.toLowerCase())) return;
          if (f.action && !newEntry.action?.toLowerCase().includes(f.action.toLowerCase())) return;

          setEntries(prev => [newEntry, ...prev]);
          setTotal(prev => prev + 1);
          setNewEntryIds(prev => new Set([...prev, newEntry.id]));

          // Remove highlight after animation completes
          setTimeout(() => {
            setNewEntryIds(prev => {
              const next = new Set(prev);
              next.delete(newEntry.id);
              return next;
            });
          }, 2000);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('SUBSCRIBED');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('CLOSED');
        } else {
          setRealtimeStatus('CONNECTING');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const buildParams = useCallback((f: FilterState, p: number) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('limit', String(PAGE_SIZE));
    if (f.email) params.set('email', f.email);
    if (f.category) params.set('category', f.category);
    if (f.action) params.set('action', f.action);
    if (f.dateFrom) params.set('date_from', f.dateFrom);
    if (f.dateTo) params.set('date_to', f.dateTo);
    return params.toString();
  }, []);

  const fetchPage = useCallback(async (f: FilterState, p: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/audit?${buildParams(f, p)}`);
      const data = await res.json();
      if (res.ok) {
        if (append) {
          setEntries(prev => [...prev, ...data.entries]);
        } else {
          setEntries(data.entries);
        }
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams]);

  const handleFiltersChange = useCallback((f: FilterState) => {
    setFilters(f);
    setPage(0);
    fetchPage(f, 0, false);
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(filters, nextPage, true);
  }, [page, filters, fetchPage]);

  const hasMore = entries.length < total;

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              fontSize: '32px',
              fontWeight: 700,
              color: '#F0F2F5',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Audit Log
          </h1>
          <p style={{ fontSize: '13px', color: '#6B7785', marginTop: '4px', marginBottom: 0 }}>
            Complete history of all dashboard actions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <LiveIndicator status={realtimeStatus} />
          <ExportButton filters={filters} />
        </div>
      </div>

      {/* Filters */}
      <AuditFilters onChange={handleFiltersChange} />

      {/* Table Panel */}
      <div
        data-testid="audit-table"
        style={{
          background: '#161A1F',
          border: '1px solid #2A3038',
          borderRadius: '12px',
          overflow: 'hidden',
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 150ms ease',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#12151A', borderBottom: '1px solid #2A3038' }}>
                {['TIMESTAMP', 'ACTOR', 'ACTION', 'CATEGORY', 'TARGET'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6B7785',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <SearchX style={{ width: '40px', height: '40px', color: '#6B7785', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#F0F2F5', margin: '0 0 8px' }}>
                      No matching entries
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B7785', margin: 0 }}>
                      Try adjusting your filters or search terms.
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <AuditEntryRow
                    key={entry.id}
                    entry={entry}
                    index={i}
                    isNew={newEntryIds.has(entry.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && entries.length > 0 && (
          <div
            style={{
              padding: '20px 16px',
              borderTop: '1px solid #2A3038',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <p style={{ fontSize: '13px', color: '#6B7785', margin: 0, textAlign: 'center' }}>
              Showing {entries.length.toLocaleString()} of {total.toLocaleString()} entries
            </p>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                data-testid="load-more-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #2A3038',
                  background: 'transparent',
                  color: '#F0F2F5',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  opacity: loadingMore ? 0.6 : 1,
                  maxWidth: '300px',
                  width: '100%',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  if (!loadingMore) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1E2328';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A534';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A3038';
                }}
              >
                {loadingMore ? (
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                ) : null}
                {loadingMore ? 'Loading\u2026' : 'Load more entries'}
              </button>
            )}
          </div>
        )}

        {/* True empty state (no data at all) */}
        {!loading && entries.length === 0 && total === 0 && (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <FileSearch style={{ width: '48px', height: '48px', color: '#6B7785', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#F0F2F5', margin: '0 0 8px' }}>
              No activity recorded yet
            </p>
            <p style={{ fontSize: '14px', color: '#6B7785', margin: '0 auto', maxWidth: '400px' }}>
              Actions will appear here as users interact with the dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
