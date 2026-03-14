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
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
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

// ── Dark mode tokens ──────────────────────────────────────────────────────────
const C = {
  bg:         '#09090B',
  surface:    '#18181B',
  surfaceAlt: '#27272A',
  border:     '#3F3F46',
  textPri:    '#FAFAFA',
  textSec:    '#A1A1AA',
  textMut:    '#71717A',
  primary:    '#6366F1',
} as const;

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

// ── Dark mode badge components ────────────────────────────────────────────────
function DirectionBadge({ direction }: { direction: 'in' | 'out' }) {
  if (direction === 'in') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded whitespace-nowrap"
        style={{ background: 'rgba(14,165,233,0.15)', color: '#38BDF8', padding: '4px 8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}
      >
        <ArrowDownLeft size={12} />IN
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded whitespace-nowrap"
      style={{ background: 'rgba(168,85,247,0.15)', color: '#C084FC', padding: '4px 8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}
    >
      <ArrowUpRight size={12} />OUT
    </span>
  );
}

function StatusBadge({ status }: { status: 'received' | 'delivered' | 'failed' }) {
  const styles = {
    received:  { background: 'rgba(113,113,122,0.2)',  color: '#A1A1AA' },
    delivered: { background: 'rgba(34,197,94,0.15)',   color: '#4ADE80' },
    failed:    { background: 'rgba(239,68,68,0.15)',   color: '#F87171' },
  };
  const s = styles[status] ?? styles.received;
  return (
    <span className="inline-flex items-center rounded whitespace-nowrap" style={{ ...s, padding: '4px 8px', fontSize: '11px', fontWeight: 500 }}>
      {status}
    </span>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
interface FilterValues {
  direction: string;
  event_type: string;
  status: string;
  from: string;
  to: string;
}

const labelSt: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: C.textSec, marginBottom: '6px', display: 'block' };
const inputSt: React.CSSProperties = { height: '40px', paddingLeft: '12px', paddingRight: '12px', border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '14px', color: C.textPri, background: C.surface, outline: 'none', width: '100%' };
const selectSt: React.CSSProperties = { ...inputSt, paddingRight: '36px', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' };

function onFocus(e: React.FocusEvent<HTMLElement>) {
  (e.target as HTMLElement).style.borderColor = C.primary;
  (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
}
function onBlur(e: React.FocusEvent<HTMLElement>) {
  (e.target as HTMLElement).style.borderColor = C.border;
  (e.target as HTMLElement).style.boxShadow = 'none';
}

function FilterBar({ filters, onChange, onClear }: { filters: FilterValues; onChange: (k: keyof FilterValues, v: string) => void; onClear: () => void }) {
  const hasFilters = Object.values(filters).some(Boolean);
  return (
    <div
      data-testid="filter-bar"
      className="rounded-lg mb-4"
      style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelSt} htmlFor="filter-direction">Direction</label>
        <div className="relative">
          <select id="filter-direction" data-testid="filter-direction" value={filters.direction} onChange={(e) => onChange('direction', e.target.value)} style={selectSt} onFocus={onFocus} onBlur={onBlur}>
            <option value="">All</option>
            <option value="in">Incoming (IN)</option>
            <option value="out">Outgoing (OUT)</option>
          </select>
          <ChevronDown size={14} className="absolute pointer-events-none" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMut }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
        <label style={labelSt} htmlFor="filter-event-type">Event Type</label>
        <input id="filter-event-type" data-testid="filter-event-type" type="text" placeholder="Filter by event type..." value={filters.event_type} onChange={(e) => onChange('event_type', e.target.value)} style={inputSt} onFocus={onFocus} onBlur={onBlur} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelSt} htmlFor="filter-status">Status</label>
        <div className="relative">
          <select id="filter-status" data-testid="filter-status" value={filters.status} onChange={(e) => onChange('status', e.target.value)} style={selectSt} onFocus={onFocus} onBlur={onBlur}>
            <option value="">All</option>
            <option value="received">Received</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={14} className="absolute pointer-events-none" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMut }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelSt} htmlFor="filter-from">From</label>
        <input id="filter-from" data-testid="filter-from" type="date" value={filters.from} onChange={(e) => onChange('from', e.target.value)} style={inputSt} onFocus={onFocus} onBlur={onBlur} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
        <label style={labelSt} htmlFor="filter-to">To</label>
        <input id="filter-to" data-testid="filter-to" type="date" value={filters.to} onChange={(e) => onChange('to', e.target.value)} style={inputSt} onFocus={onFocus} onBlur={onBlur} />
      </div>
      {hasFilters && (
        <button data-testid="clear-filters" onClick={onClear} className="flex items-center gap-1.5" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: C.primary, fontSize: '13px', fontWeight: 500, padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', alignSelf: 'flex-end' }} onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }} onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}>
          <FilterX size={14} />Clear filters
        </button>
      )}
    </div>
  );
}

// ── Event Row ─────────────────────────────────────────────────────────────────
function EventRow({ event, expanded, onToggle, onRetrySuccess }: { event: EventLogEntry; expanded: boolean; onToggle: () => void; onRetrySuccess: (id: string) => void }) {
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

  const cell: React.CSSProperties = { padding: '16px', fontSize: '14px', color: C.textSec, verticalAlign: 'middle' };

  return (
    <>
      <tr
        data-testid="event-row"
        onClick={onToggle}
        style={{ background: expanded ? C.surfaceAlt : C.surface, borderBottom: expanded ? 'none' : `1px solid ${C.border}`, cursor: 'pointer', borderLeft: expanded ? `2px solid ${C.primary}` : '2px solid transparent', transition: 'background 100ms ease' }}
        onMouseOver={(e) => { if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(99,102,241,0.05)'; }}
        onMouseOut={(e) => { if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = C.surface; }}
      >
        <td style={{ ...cell, width: '140px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: C.textMut }}>{formatTimestamp(event.created_at)}</span>
        </td>
        <td style={{ ...cell, width: '80px', textAlign: 'center' }}>
          <DirectionBadge direction={event.direction} />
        </td>
        <td style={{ ...cell }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: C.textPri }}>{event.event_type}</span>
        </td>
        <td style={{ ...cell, width: '120px', color: C.textMut, fontSize: '13px' }}>{event.source || '—'}</td>
        <td style={{ ...cell, width: '100px', textAlign: 'center' }}>
          <StatusBadge status={event.status} />
        </td>
        <td style={{ ...cell, width: '100px' }}>
          <div className="flex items-center gap-2">
            <ChevronDown size={18} style={{ color: C.textMut, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
            {showRetry && (
              <button data-testid="retry-button" onClick={handleRetry} disabled={retrying} className="flex items-center gap-1" style={{ background: 'transparent', color: retrying ? C.textMut : C.primary, border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: retrying ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }} onMouseOver={(e) => { if (!retrying) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)'; }} onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                <RotateCcw size={12} style={{ animation: retrying ? 'spin 1s linear infinite' : 'none' }} />
                {retrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: C.surfaceAlt, borderBottom: `1px solid ${C.border}`, borderLeft: `2px solid ${C.primary}` }}>
          <td colSpan={6} style={{ padding: '16px 24px' }}>
            <div className="flex flex-wrap gap-6 mb-4">
              {[
                { label: 'Source', value: event.source || '—' },
                { label: 'Created', value: new Date(event.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
                { label: 'Retry Count', value: String(event.retry_count) },
                ...(event.last_retried_at ? [{ label: 'Last Retried', value: formatTimestamp(event.last_retried_at) }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: C.textMut, letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: '13px', color: C.textPri, marginTop: '2px' }}>{value}</div>
                </div>
              ))}
            </div>
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
function PaginationBar({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (p: number) => void }) {
  const { page, per_page, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / per_page));
  const from = Math.min((page - 1) * per_page + 1, total);
  const to = Math.min(page * per_page, total);

  const btn = (active: boolean, disabled: boolean): React.CSSProperties => ({
    width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${active ? C.primary : C.border}`,
    background: active ? C.primary : C.surface, color: active ? '#FFFFFF' : disabled ? C.textMut : C.textSec,
    fontSize: '13px', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 100ms ease',
  });

  const pages: number[] = [];
  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) pages.push(i);

  if (total === 0) return null;

  return (
    <div data-testid="pagination" className="flex flex-wrap items-center justify-between gap-4" style={{ padding: '16px 0' }}>
      <span style={{ fontSize: '13px', color: C.textMut }}>Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} style={btn(false, page <= 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
        {pages.map((p) => <button key={p} onClick={() => onPageChange(p)} style={btn(p === page, false)}>{p}</button>)}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} style={btn(false, page >= totalPages)} aria-label="Next page"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
          {[100, 60, '80%', 80, 60, 40].map((w, j) => (
            <td key={j} style={{ padding: '16px' }}>
              <div className="rounded" style={{ height: '16px', background: C.surfaceAlt, animation: 'skeleton-pulse 1.5s ease-in-out infinite', width: typeof w === 'string' ? w : `${w}px` }} />
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), page]
  );

  function updateFilter(key: keyof FilterValues, value: string) {
    startTransition(() => { router.push(buildUrl({ [key]: value, page: 1 })); });
  }
  function clearFilters() {
    startTransition(() => { router.push('/dashboard/event-log'); });
  }
  function changePage(newPage: number) {
    startTransition(() => { router.push(buildUrl({ page: newPage })); });
  }

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
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'delivered' as const } : e)));
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        {/* Page Header */}
        <div className="pb-6 mb-6" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: C.textPri, lineHeight: '1.3', letterSpacing: '-0.01em', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Event Log
          </h1>
          <p style={{ fontSize: '14px', color: C.textSec, marginTop: '8px' }}>
            View harness events and webhook deliveries
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} />

        {/* Table */}
        <div data-testid="event-log-list" className="rounded-lg overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, opacity: loading ? 0.6 : 1, transition: 'opacity 200ms ease' }}>
          {!loading && events.length === 0 && (
            <div data-testid="empty-state" className="text-center" style={{ padding: hasFilters ? '48px 24px' : '64px 24px' }}>
              <div style={{ color: C.textMut, marginBottom: hasFilters ? '16px' : '20px' }}>
                {hasFilters ? <FilterX size={48} style={{ margin: '0 auto' }} /> : <Radio size={56} style={{ margin: '0 auto' }} />}
              </div>
              <h3 style={{ fontSize: hasFilters ? '16px' : '18px', fontWeight: 600, color: C.textPri, marginBottom: '8px' }}>
                {hasFilters ? 'No events match your filters' : 'No events yet'}
              </h3>
              <p style={{ fontSize: '14px', color: C.textSec, marginBottom: hasFilters ? '16px' : 0 }}>
                {hasFilters ? 'Try adjusting your filters or clear them to see all events.' : 'Events will appear here when webhooks are received or notifications are sent.'}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} style={{ background: 'transparent', color: C.primary, border: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {(loading || events.length > 0) && (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                  {['Timestamp', 'Dir', 'Event Type', 'Source', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left" style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              {loading ? <TableSkeleton /> : (
                <tbody>
                  {events.map((event) => (
                    <EventRow key={event.id} event={event} expanded={expandedId === event.id} onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)} onRetrySuccess={handleRetrySuccess} />
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes skeleton-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function EventLogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#09090B' }}><div style={{ color: '#71717A', fontSize: '14px' }}>Loading...</div></div>}>
      <EventLogPageInner />
    </Suspense>
  );
}
