'use client';

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  FilterX,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { PayloadViewer } from '@/components/event-log/PayloadViewer';

// ── Types ─────────────────────────────────────────────────────────────────────
interface HarnessEvent {
  id: string;
  created_at: string;
  direction: 'incoming' | 'outgoing' | 'internal';
  event_type: string;
  status: 'success' | 'failure' | 'pending';
  issue_number: number | null;
  submission_id: string | null;
  payload: unknown;
  error_message: string | null;
  duration_ms: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

// ── Direction Badge ───────────────────────────────────────────────────────────
function DirectionBadge({ direction }: { direction: 'incoming' | 'outgoing' | 'internal' }) {
  const configs = {
    incoming: { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA', Icon: ArrowDownLeft, label: 'INCOMING' },
    outgoing: { bg: 'rgba(139,92,246,0.15)', color: '#A78BFA', Icon: ArrowUpRight, label: 'OUTGOING' },
    internal: { bg: 'rgba(6,182,212,0.15)', color: '#22D3EE', Icon: ArrowLeftRight, label: 'INTERNAL' },
  };
  const { bg, color, Icon, label } = configs[direction] ?? configs.internal;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: bg, color, padding: '3px 8px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif',
      textTransform: 'uppercase', letterSpacing: '0.03em',
    }}>
      <Icon size={12} />
      {label}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'success' | 'failure' | 'pending' }) {
  const configs = {
    success: { bg: 'rgba(34,197,94,0.15)', color: '#4ADE80', Icon: CheckCircle2, label: 'SUCCESS' },
    failure: { bg: 'rgba(239,68,68,0.15)', color: '#F87171', Icon: XCircle, label: 'FAILURE' },
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#FBBF24', Icon: Clock, label: 'PENDING' },
  };
  const { bg, color, Icon, label } = configs[status] ?? configs.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: bg, color, padding: '3px 8px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif',
      textTransform: 'uppercase', letterSpacing: '0.03em',
    }}>
      <Icon size={12} />
      {label}
    </span>
  );
}

// ── Event Row ─────────────────────────────────────────────────────────────────
function EventRow({ event, expanded, onToggle }: { event: HarnessEvent; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        data-testid="event-row"
        onClick={onToggle}
        style={{
          background: expanded ? '#27272A' : '#18181B',
          borderBottom: '1px solid #27272A',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => { if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = '#1F1F23'; }}
        onMouseLeave={(e) => { if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = '#18181B'; }}
      >
        <td style={{ padding: '14px 16px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: '#A1A1AA', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span title={event.created_at}>{formatRelativeTime(event.created_at)}</span>
        </td>
        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
          <DirectionBadge direction={event.direction} />
        </td>
        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', background: '#27272A', color: '#A1A1AA', padding: '4px 8px', borderRadius: '4px' }}>
            {event.event_type}
          </span>
        </td>
        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#A1A1AA', verticalAlign: 'middle' }}>
          {event.issue_number ? (
            <a href={`/dashboard?issue=${event.issue_number}`} onClick={(e) => e.stopPropagation()} style={{ color: '#6366F1', textDecoration: 'none' }}>
              #{event.issue_number}
            </a>
          ) : '—'}
        </td>
        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
          <StatusBadge status={event.status} />
        </td>
        <td style={{ padding: '14px 16px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: '#71717A', verticalAlign: 'middle' }}>
          {event.duration_ms != null ? `${event.duration_ms}ms` : '—'}
        </td>
        <td style={{ padding: '14px 16px', width: '40px', verticalAlign: 'middle', textAlign: 'center' }}>
          <ChevronDown
            size={16}
            style={{ color: '#71717A', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
          />
        </td>
      </tr>
      {expanded && (
        <tr data-testid="event-details" style={{ background: '#27272A', borderBottom: '1px solid #3F3F46' }}>
          <td colSpan={7} style={{ padding: '16px 24px' }}>
            {event.error_message && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '12px 16px', marginBottom: '12px', color: '#F87171', fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                <strong>Error:</strong> {event.error_message}
              </div>
            )}
            {event.submission_id && (
              <div style={{ marginBottom: '12px', fontSize: '12px', color: '#71717A' }}>
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif', marginRight: '8px' }}>Submission ID:</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#A1A1AA' }}>{event.submission_id}</span>
              </div>
            )}
            {event.payload != null && <PayloadViewer payload={event.payload} />}
            {event.payload == null && <div style={{ color: '#71717A', fontSize: '13px', fontStyle: 'italic' }}>No payload</div>}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Table Skeleton ────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid #27272A' }}>
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} style={{ padding: '14px 16px' }}>
              <div style={{ height: '16px', borderRadius: '4px', background: 'linear-gradient(90deg, #27272A 0%, #3F3F46 50%, #27272A 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', width: j === 2 ? '80%' : '60px' }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

// ── Inner Page (needs useSearchParams) ───────────────────────────────────────
function EventLogPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [events, setEvents] = useState<HarnessEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const LIMIT = 50;
  const direction = searchParams.get('direction') ?? '';
  const event_type = searchParams.get('event_type') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const offset = (page - 1) * LIMIT;

  const hasFilters = !!(direction || event_type || status);

  function buildUrl(overrides: Record<string, string | number>) {
    const params = new URLSearchParams();
    const merged = { direction, event_type, status, page: String(page), ...overrides };
    if (merged.direction) params.set('direction', String(merged.direction));
    if (merged.event_type) params.set('event_type', String(merged.event_type));
    if (merged.status) params.set('status', String(merged.status));
    if (Number(merged.page) > 1) params.set('page', String(merged.page));
    const qs = params.toString();
    return `/dashboard/event-log${qs ? `?${qs}` : ''}`;
  }

  function updateFilter(key: string, value: string) {
    startTransition(() => { router.push(buildUrl({ [key]: value, page: 1 })); });
  }

  function clearFilters() {
    startTransition(() => { router.push('/dashboard/event-log'); });
  }

  function changePage(newPage: number) {
    startTransition(() => { router.push(buildUrl({ page: newPage })); });
  }

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(LIMIT));
      params.set('offset', String(offset));
      if (direction) params.set('direction', direction);
      if (event_type) params.set('event_type', event_type);
      if (status) params.set('status', status);
      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setEvents(json.events ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [direction, event_type, status, offset, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const from = offset + 1;
  const to = Math.min(offset + LIMIT, total);

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#71717A',
    textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left',
    fontFamily: 'Inter, system-ui, sans-serif', background: '#27272A',
    borderBottom: '1px solid #3F3F46',
  };

  const selectStyle: React.CSSProperties = {
    height: '36px', background: '#27272A', border: '1px solid #3F3F46', borderRadius: '6px',
    color: '#FAFAFA', fontSize: '13px', padding: '0 32px 0 10px', fontFamily: 'Inter, system-ui, sans-serif',
    cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 data-testid="page-title" style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: '#FAFAFA', margin: 0, lineHeight: 1.2 }}>
            Event Log
          </h1>
          <p style={{ fontSize: '14px', color: '#A1A1AA', marginTop: '4px' }}>
            Pipeline activity and integration events
          </p>
        </div>
        <button
          data-testid="refresh-btn"
          onClick={() => setRefreshKey(k => k + 1)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px', background: 'transparent', border: '1px solid #3F3F46', borderRadius: '6px', color: '#A1A1AA', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms ease' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; }}
        >
          <RotateCcw size={16} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div data-testid="event-filters" style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px', flex: 1 }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Direction</label>
          <select data-testid="filter-direction" value={direction} onChange={(e) => updateFilter('direction', e.target.value)} style={selectStyle}>
            <option value="">All directions</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
            <option value="internal">Internal</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px', flex: 1 }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Event Type</label>
          <select data-testid="filter-event-type" value={event_type} onChange={(e) => updateFilter('event_type', e.target.value)} style={selectStyle}>
            <option value="">All types</option>
            <option value="station_transition">Station Transition</option>
            <option value="agent_spawn">Agent Spawn</option>
            <option value="agent_complete">Agent Complete</option>
            <option value="notification_sent">Notification Sent</option>
            <option value="thread_push">Thread Push</option>
            <option value="token_usage">Token Usage</option>
            <option value="github_webhook">GitHub Webhook</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px', flex: 1 }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Status</label>
          <select data-testid="filter-status" value={status} onChange={(e) => updateFilter('status', e.target.value)} style={selectStyle}>
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        {hasFilters && (
          <button
            data-testid="clear-filters-btn"
            onClick={clearFilters}
            style={{ height: '36px', padding: '0 12px', background: 'transparent', border: '1px dashed #3F3F46', borderRadius: '6px', color: '#71717A', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 150ms ease', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#52525B'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3F3F46'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
          >
            <FilterX size={14} />
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', overflow: 'hidden' }}>
        {!loading && events.length === 0 ? (
          <div data-testid="empty-state" style={{ textAlign: 'center', padding: '64px 24px' }}>
            {hasFilters ? (
              <>
                <FilterX size={48} style={{ margin: '0 auto 16px', color: '#71717A' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', marginBottom: '8px' }}>No events matching filters</h3>
                <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '16px' }}>Try adjusting your filter criteria.</p>
                <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: '14px', cursor: 'pointer' }}>Clear all filters</button>
              </>
            ) : (
              <>
                <Activity size={48} style={{ margin: '0 auto 16px', color: '#71717A' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', marginBottom: '8px' }}>No events yet</h3>
                <p style={{ fontSize: '14px', color: '#A1A1AA', maxWidth: '400px', margin: '0 auto' }}>
                  Pipeline events will appear here once the factory loop starts processing issues.
                </p>
              </>
            )}
          </div>
        ) : (
          <table data-testid="event-table" style={{ width: '100%', borderCollapse: 'collapse', opacity: loading ? 0.6 : 1, transition: 'opacity 200ms ease' }}>
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Direction</th>
                <th style={thStyle}>Event Type</th>
                <th style={thStyle}>Issue</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Duration</th>
                <th style={{ ...thStyle, width: '40px' }}></th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton />
            ) : (
              <tbody>
                {events.map(event => (
                  <EventRow
                    key={event.id}
                    event={event}
                    expanded={expandedId === event.id}
                    onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  />
                ))}
              </tbody>
            )}
          </table>
        )}

        {/* Pagination */}
        {(total > 0 || loading) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #27272A', background: '#18181B' }}>
            <span data-testid="pagination-info" style={{ fontSize: '13px', color: '#71717A' }}>
              {loading ? 'Loading…' : `Showing ${from}–${to} of ${total} events`}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                data-testid="pagination-prev"
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #3F3F46', background: 'transparent', color: page <= 1 ? '#3F3F46' : '#A1A1AA', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                data-testid="pagination-next"
                onClick={() => changePage(page + 1)}
                disabled={page >= totalPages}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #3F3F46', background: 'transparent', color: page >= totalPages ? '#3F3F46' : '#A1A1AA', cursor: page >= totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventLogPage() {
  return (
    <Suspense fallback={<div style={{ padding: '64px', textAlign: 'center', color: '#71717A' }}>Loading event log…</div>}>
      <EventLogPageInner />
    </Suspense>
  );
}
