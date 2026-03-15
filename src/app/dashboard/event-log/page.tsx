'use client';

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FilterX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { EventDirectionBadge } from '@/components/event-log/EventDirectionBadge';
import { EventStatusBadge } from '@/components/event-log/EventStatusBadge';
import { PayloadViewer } from '@/components/event-log/PayloadViewer';
import { toast } from 'sonner';
import { useRealtimeEvents, type HarnessEventRow } from '@/hooks/useRealtimeEvents';
import RealtimePulse from '@/components/event-log/RealtimePulse';

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

interface FilterValues {
  direction: string;
  event_type: string;
  status: string;
  from: string;
  to: string;
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

// ── Filter Bar ────────────────────────────────────────────────────────────────
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

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    height: '40px',
    paddingLeft: '12px',
    paddingRight: '12px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    background: 'var(--surface)',
    outline: 'none',
    width: '100%',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    paddingRight: '36px',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
  };

  function focusStyle(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--primary)';
    (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
  }
  function blurStyle(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--border)';
    (e.target as HTMLElement).style.boxShadow = 'none';
  }

  return (
    <div
      className="rounded-lg mb-4"
      style={{
        background: 'var(--surface-alt)',
        border: '1px solid var(--border)',
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
            data-testid="filter-direction"
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
          <ChevronDown size={14} className="absolute pointer-events-none" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
        <label style={labelStyle} htmlFor="filter-event-type">Event Type</label>
        <input
          id="filter-event-type"
          data-testid="filter-event-type"
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
            data-testid="filter-status"
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
          <ChevronDown size={14} className="absolute pointer-events-none" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelStyle} htmlFor="filter-from">From</label>
        <input
          id="filter-from"
          data-testid="filter-from"
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
          data-testid="filter-to"
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
          data-testid="clear-filters"
          onClick={onClear}
          className="flex items-center gap-1.5"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: 'var(--primary)',
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
      const res = await fetch(`/api/admin/events/${event.id}/retry`, { method: 'POST' });
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

  const cellStyle: React.CSSProperties = {
    padding: '16px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    verticalAlign: 'middle',
  };

  return (
    <>
      <tr
        data-testid="event-row"
        onClick={onToggle}
        style={{
          background: expanded ? 'var(--surface-alt)' : 'var(--surface)',
          borderBottom: expanded ? 'none' : '1px solid var(--border)',
          cursor: 'pointer',
          borderLeft: expanded ? '2px solid var(--primary)' : '2px solid transparent',
          transition: 'background 100ms ease',
        }}
        onMouseOver={(e) => {
          if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(99,102,241,0.05)';
        }}
        onMouseOut={(e) => {
          if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface)';
        }}
      >
        {/* Timestamp */}
        <td style={{ ...cellStyle, width: '140px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--text-muted)' }}>
            {formatTimestamp(event.created_at)}
          </span>
        </td>

        {/* Direction */}
        <td style={{ ...cellStyle, width: '80px', textAlign: 'center' }}>
          <EventDirectionBadge direction={event.direction} />
        </td>

        {/* Event Type */}
        <td style={{ ...cellStyle }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--text-primary)' }}>
            {event.event_type}
          </span>
        </td>

        {/* Source */}
        <td style={{ ...cellStyle, width: '120px', color: 'var(--text-muted)', fontSize: '13px' }}>
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
                color: 'var(--text-muted)',
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
                  color: retrying ? 'var(--text-muted)' : 'var(--primary)',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: retrying ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => {
                  if (!retrying) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)';
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
            background: 'var(--surface-alt)',
            borderBottom: '1px solid var(--border)',
            borderLeft: '2px solid var(--primary)',
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
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Payload */}
            <div data-testid="payload-viewer">
              <PayloadViewer payload={event.payload} />
            </div>
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
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? '#ffffff' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
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
      data-testid="pagination"
      className="flex flex-wrap items-center justify-between gap-4"
      style={{ padding: '16px 0' }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
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
        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          {[100, 60, '80%', 80, 60, 40].map((w, j) => (
            <td key={j} style={{ padding: '16px' }}>
              <div
                className="rounded"
                style={{
                  height: '16px',
                  background: 'var(--surface-alt)',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  width: typeof w === 'string' ? w : `${w}px`,
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
  const [refreshKey, setRefreshKey] = useState(0);

  // Realtime subscription for live event updates
  const { status: realtimeStatus } = useRealtimeEvents({
    onNewEvent: (newEvent: HarnessEventRow) => {
      // Map HarnessEventRow to EventLogEntry and prepend to list (page 1 only)
      if (page === 1) {
        const entry: EventLogEntry = {
          id: newEvent.id,
          direction: newEvent.direction === 'incoming' ? 'in' : 'out',
          event_type: newEvent.event_type,
          source: (newEvent.metadata as Record<string, unknown> | null)?.source as string ?? 'harness',
          payload: newEvent.payload,
          status: newEvent.status === 'success' ? 'delivered' : newEvent.status === 'failure' ? 'failed' : 'received',
          retry_count: 0,
          last_retried_at: null,
          created_at: newEvent.created_at,
        };
        setEvents((prev) => [entry, ...prev]);
      }
    },
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), page]
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

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
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
  }, [searchParams.toString(), refreshKey]);

  function handleRetrySuccess(id: string) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'delivered' as const } : e))
    );
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        {/* Page Header */}
        <div
          className="pb-6 mb-6"
          style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              Event Log
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              View harness events and webhook deliveries
            </p>
          </div>
          {/* Header actions: realtime pulse + refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RealtimePulse status={realtimeStatus} />
            <button
              data-testid="refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'background 150ms ease',
              }}
              onMouseOver={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-elevated)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)';
              }}
            >
              <RefreshCw
                size={13}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} />

        {/* Table */}
        <div
          data-testid="event-log-list"
          className="rounded-lg overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 200ms ease',
          }}
        >
          {/* Empty state */}
          {!loading && events.length === 0 && (
            <div data-testid="empty-state" className="text-center" style={{ padding: hasFilters ? '48px 24px' : '64px 24px' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: hasFilters ? '16px' : '20px' }}>
                {hasFilters
                  ? <FilterX size={48} style={{ margin: '0 auto' }} />
                  : <Radio size={56} style={{ margin: '0 auto' }} />
                }
              </div>
              <h3
                style={{
                  fontSize: hasFilters ? '16px' : '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                {hasFilters ? 'No events match your filters' : 'No events yet'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: hasFilters ? '16px' : 0 }}>
                {hasFilters
                  ? 'Try adjusting your filters or clear them to see all events.'
                  : 'Events will appear here when webhooks are received or notifications are sent.'}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    background: 'transparent',
                    color: 'var(--primary)',
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
            <table data-testid="event-table" className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--surface-alt)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {['Timestamp', 'Dir', 'Event Type', 'Source', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left"
                      style={{
                        padding: '12px 16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// ── Page export (wrapped in Suspense for useSearchParams) ─────────────────────
export default function EventLogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
      </div>
    }>
      <EventLogPageInner />
    </Suspense>
  );
}
