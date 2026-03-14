'use client';

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Filter,
  FilterX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { EventDirectionBadge } from '@/components/event-log/EventDirectionBadge';
import { EventStatusBadge } from '@/components/event-log/EventStatusBadge';
import { PayloadViewer } from '@/components/event-log/PayloadViewer';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface EventLogEntry {
  id: string;
  direction: 'in' | 'out';
  event_type: string;
  source: string;
  payload: unknown;
  status: 'received' | 'delivered' | 'failed';
  retry_count: number;
  last_retried_at: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
}

interface EventLogResponse {
  data: EventLogEntry[];
  pagination: Pagination;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60) return rtf.format(-diffMins, 'minute');
    return rtf.format(-Math.round(diffHours), 'hour');
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getPayloadPreview(payload: unknown): string {
  const str = JSON.stringify(payload);
  return str.length > 200 ? str.slice(0, 200) + '...' : str;
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
interface FilterValues {
  direction: string;
  event_type: string;
  status: string;
  from: string;
  to: string;
}

function FilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: FilterValues;
  onChange: (key: keyof FilterValues, value: string) => void;
  onClear: () => void;
}) {
  const hasFilters = Object.values(filters).some(Boolean);

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
  };

  const inputStyle = {
    height: '40px',
    paddingLeft: '12px',
    paddingRight: '12px',
    border: '1px solid #E2E4E9',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#0F172A',
    background: '#FFFFFF',
    outline: 'none',
    width: '100%',
  };

  const selectStyle = {
    ...inputStyle,
    paddingRight: '36px',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    cursor: 'pointer',
  };

  function focusStyle(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = '#2563EB';
    (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
  }
  function blurStyle(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = '#E2E4E9';
    (e.target as HTMLElement).style.boxShadow = 'none';
  }

  return (
    <div
      className="rounded-lg mb-4"
      style={{
        background: '#F4F5F7',
        border: '1px solid #E2E4E9',
        padding: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelStyle} htmlFor="filter-direction">Direction</label>
        <div className="relative">
          <select
            id="filter-direction"
            aria-label="Direction"
            value={filters.direction}
            onChange={(e) => onChange('direction', e.target.value)}
            style={selectStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          >
            <option value="">All</option>
            <option value="in">Incoming (IN)</option>
            <option value="out">Outgoing (OUT)</option>
          </select>
          <ChevronDown size={14} className="absolute pointer-events-none" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
        <label style={labelStyle} htmlFor="filter-event-type">Event Type</label>
        <input
          id="filter-event-type"
          type="text"
          placeholder="Filter by event type..."
          value={filters.event_type}
          onChange={(e) => onChange('event_type', e.target.value)}
          style={inputStyle}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelStyle} htmlFor="filter-status">Status</label>
        <div className="relative">
          <select
            id="filter-status"
            aria-label="Status"
            value={filters.status}
            onChange={(e) => onChange('status', e.target.value)}
            style={selectStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          >
            <option value="">All</option>
            <option value="received">Received</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={14} className="absolute pointer-events-none" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelStyle} htmlFor="filter-from">From</label>
        <input
          id="filter-from"
          type="date"
          value={filters.from}
          onChange={(e) => onChange('from', e.target.value)}
          style={inputStyle}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelStyle} htmlFor="filter-to">To</label>
        <input
          id="filter-to"
          type="date"
          value={filters.to}
          onChange={(e) => onChange('to', e.target.value)}
          style={inputStyle}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: '#2563EB',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px 12px',
            cursor: 'pointer',
            borderRadius: '6px',
            alignSelf: 'flex-end',
          }}
          onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
          onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
        >
          <FilterX size={14} />
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Event Row ─────────────────────────────────────────────────────────────────
function EventRow({
  event,
  expanded,
  onToggle,
  onRetrySuccess,
}: {
  event: EventLogEntry;
  expanded: boolean;
  onToggle: () => void;
  onRetrySuccess: (id: string) => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const showRetry = event.direction === 'out' && event.status === 'failed';

  async function handleRetry(e: React.MouseEvent) {
    e.stopPropagation();
    setRetrying(true);
    try {
      const res = await fetch(`/api/event-log/${event.id}/retry`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Webhook retried successfully');
        onRetrySuccess(event.id);
      } else {
        toast.error('Retry failed. Check logs for details.');
      }
    } catch {
      toast.error('Retry failed. Check logs for details.');
    } finally {
      setRetrying(false);
    }
  }

  const cellStyle = {
    padding: '16px',
    fontSize: '14px',
    color: '#475569',
    verticalAlign: 'middle' as const,
  };

  return (
    <>
      <tr
        data-testid="event-row"
        onClick={onToggle}
        style={{
          background: expanded ? '#FAFBFC' : '#FFFFFF',
          borderBottom: expanded ? 'none' : '1px solid #ECEEF2',
          cursor: 'pointer',
          borderLeft: expanded ? '2px solid #2563EB' : '2px solid transparent',
          transition: 'background 100ms ease',
        }}
        onMouseOver={(e) => {
          if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(37, 99, 235, 0.03)';
        }}
        onMouseOut={(e) => {
          if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = '#FFFFFF';
        }}
      >
        {/* Timestamp */}
        <td style={{ ...cellStyle, width: '140px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
            {formatTimestamp(event.created_at)}
          </span>
        </td>

        {/* Direction */}
        <td style={{ ...cellStyle, width: '70px', textAlign: 'center' }}>
          <EventDirectionBadge direction={event.direction} />
        </td>

        {/* Event Type */}
        <td style={{ ...cellStyle }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#0F172A' }}>
            {event.event_type}
          </span>
        </td>

        {/* Source */}
        <td style={{ ...cellStyle, width: '100px', color: '#94A3B8', fontSize: '13px' }}>
          {event.source || '—'}
        </td>

        {/* Status */}
        <td style={{ ...cellStyle, width: '100px', textAlign: 'center' }}>
          <EventStatusBadge status={event.status} />
        </td>

        {/* Actions */}
        <td style={{ ...cellStyle, width: '100px' }}>
          <div className="flex items-center gap-2">
            <ChevronDown
              size={18}
              style={{
                color: '#94A3B8',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }}
            />
            {showRetry && (
              <button
                data-testid="retry-button"
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-1"
                style={{
                  background: 'transparent',
                  color: retrying ? '#94A3B8' : '#2563EB',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: retrying ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => {
                  if (!retrying) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(37, 99, 235, 0.08)';
                }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <RotateCcw
                  size={12}
                  style={{ animation: retrying ? 'spin 1s linear infinite' : 'none' }}
                />
                {retrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded payload row */}
      {expanded && (
        <tr
          style={{
            background: '#FAFBFC',
            borderBottom: '1px solid #ECEEF2',
            borderLeft: '2px solid #2563EB',
          }}
        >
          <td colSpan={6} style={{ padding: '16px 24px' }}>
            {/* Metadata */}
            <div className="flex flex-wrap gap-6 mb-3">
              {[
                { label: 'Source', value: event.source || '—' },
                {
                  label: 'Created',
                  value: new Date(event.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }),
                },
                { label: 'Retry Count', value: String(event.retry_count) },
                ...(event.last_retried_at
                  ? [{ label: 'Last Retried', value: formatTimestamp(event.last_retried_at) }]
                  : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.04em' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#0F172A', marginTop: '2px' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Payload */}
            <PayloadViewer payload={event.payload} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function PaginationBar({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}) {
  const { page, per_page, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / per_page));
  const from = Math.min((page - 1) * per_page + 1, total);
  const to = Math.min(page * per_page, total);

  const pageButtonStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #E2E4E9',
    background: active ? '#2563EB' : '#FFFFFF',
    color: active ? '#FFFFFF' : disabled ? '#94A3B8' : '#475569',
    fontSize: '13px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const pageNumbers: number[] = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  if (total === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4"
      style={{ padding: '16px 0' }}
    >
      <span style={{ fontSize: '13px', color: '#94A3B8' }}>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={pageButtonStyle(false, page <= 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={pageButtonStyle(p === page, false)}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={pageButtonStyle(false, page >= totalPages)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid #ECEEF2' }}>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} style={{ padding: '16px' }}>
              <div
                className="rounded"
                style={{
                  height: '16px',
                  background: '#F4F5F7',
                  animation: 'pulse-subtle 1.5s ease-in-out infinite',
                  width: j === 2 ? '80%' : j === 0 ? '100px' : '60px',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

// ── Main Page (inner) ─────────────────────────────────────────────────────────
function EventLogPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 50, total: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: FilterValues = {
    direction: searchParams.get('direction') ?? '',
    event_type: searchParams.get('event_type') ?? '',
    status: searchParams.get('status') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  };
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const buildUrl = useCallback(
    (overrides: Partial<FilterValues & { page: number }>) => {
      const params = new URLSearchParams();
      const merged = { ...filters, page, ...overrides };
      if (merged.direction) params.set('direction', merged.direction);
      if (merged.event_type) params.set('event_type', merged.event_type);
      if (merged.status) params.set('status', merged.status);
      if (merged.from) params.set('from', merged.from);
      if (merged.to) params.set('to', merged.to);
      if (merged.page > 1) params.set('page', String(merged.page));
      const qs = params.toString();
      return `/dashboard/event-log${qs ? `?${qs}` : ''}`;
    },
    [filters, page]
  );

  function updateFilter(key: keyof FilterValues, value: string) {
    startTransition(() => {
      router.push(buildUrl({ [key]: value, page: 1 }));
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.push('/dashboard/event-log');
    });
  }

  function changePage(newPage: number) {
    startTransition(() => {
      router.push(buildUrl({ page: newPage }));
    });
  }

  // Fetch events
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchEvents() {
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', '50');
        if (filters.direction) params.set('direction', filters.direction);
        if (filters.event_type) params.set('event_type', filters.event_type);
        if (filters.status) params.set('status', filters.status);
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);

        const res = await fetch(`/api/event-log?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json: EventLogResponse = await res.json();
        if (!cancelled) {
          setEvents(json.data);
          setPagination(json.pagination);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvents();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  function handleRetrySuccess(id: string) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'delivered' as const } : e))
    );
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div
      className="min-h-screen"
      style={{ background: '#FAFBFC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        {/* Page Header */}
        <div
          className="pb-6 mb-6"
          style={{ borderBottom: '1px solid #E2E4E9' }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: '1.2',
              letterSpacing: '-0.02em',
            }}
          >
            Event Log
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '8px' }}>
            Incoming webhook events and outgoing notifications
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} />

        {/* Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E4E9',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 200ms ease',
          }}
        >
          {/* Empty state: no events at all */}
          {!loading && events.length === 0 && (
            <div className="text-center" style={{ padding: hasFilters ? '48px 24px' : '64px 24px' }}>
              <div style={{ color: '#94A3B8', marginBottom: hasFilters ? '16px' : '20px' }}>
                <FilterX size={hasFilters ? 48 : 56} style={{ margin: '0 auto' }} />
              </div>
              <h3
                style={{
                  fontSize: hasFilters ? '16px' : '18px',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginBottom: '8px',
                }}
              >
                {hasFilters ? 'No events match your filters' : 'No events yet'}
              </h3>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: hasFilters ? '16px' : 0 }}>
                {hasFilters
                  ? 'Try adjusting your filters or clear them to see all events.'
                  : 'Events will appear here when webhooks are received or notifications are sent.'}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    background: 'transparent',
                    color: '#2563EB',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {(loading || events.length > 0) && (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: '#F4F5F7',
                    borderBottom: '1px solid #E2E4E9',
                  }}
                >
                  {['Timestamp', 'Dir', 'Event Type', 'Source', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left"
                      style={{
                        padding: '12px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {loading ? (
                <TableSkeleton />
              ) : (
                <tbody>
                  {events.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      expanded={expandedId === event.id}
                      onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                      onRetrySuccess={handleRetrySuccess}
                    />
                  ))}
                </tbody>
              )}
            </table>
          )}
        </div>

        {/* Pagination */}
        <PaginationBar pagination={pagination} onPageChange={changePage} />
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Page export (wrapped in Suspense for useSearchParams) ─────────────────────
export default function EventLogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFBFC' }}>
        <div style={{ color: '#94A3B8', fontSize: '14px' }}>Loading...</div>
      </div>
    }>
      <EventLogPageInner />
    </Suspense>
  );
}
