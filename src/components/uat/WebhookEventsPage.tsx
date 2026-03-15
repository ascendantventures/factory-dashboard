'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, Search, Webhook } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

interface WebhookEvent {
  id: string;
  github_delivery_id: string;
  event_type: string;
  github_issue_number: number | null;
  processed: boolean;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function WebhookEventsPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchEvents = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      let query = supabase
        .from('uat_webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (eventTypeFilter !== 'all') query = query.eq('event_type', eventTypeFilter);
      if (statusFilter === 'processed') query = query.eq('processed', true).is('error_message', null);
      else if (statusFilter === 'failed') query = query.not('error_message', 'is', null);
      else if (statusFilter === 'pending') query = query.eq('processed', false).is('error_message', null);
      if (searchQuery) query = query.ilike('github_delivery_id', `%${searchQuery}%`);

      const { data } = await query;
      setEvents(data ?? []);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, eventTypeFilter, statusFilter, searchQuery]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const getEventStatus = (event: WebhookEvent) => {
    if (event.error_message) return 'failed';
    if (event.processed) return 'processed';
    return 'pending';
  };

  const statusBadge = (event: WebhookEvent) => {
    const s = getEventStatus(event);
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      processed: { bg: 'rgba(34, 197, 94, 0.12)', color: '#22C55E', label: 'Processed' },
      failed: { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', label: 'Failed' },
      pending: { bg: 'rgba(139, 139, 149, 0.08)', color: '#A1A1AA', label: 'Pending' },
    };
    const st = styles[s];
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: st.bg, color: st.color }}>
        {st.label}
      </span>
    );
  };

  const eventTypeBadge = (eventType: string) => {
    const isComment = eventType === 'issue_comment';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '6px',
        fontSize: '12px', fontWeight: 600,
        background: isComment ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
        color: isComment ? '#A855F7' : '#3B82F6',
      }}>
        {eventType}
      </span>
    );
  };

  const clearFilters = () => {
    setEventTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  const selectStyle = {
    height: '36px', padding: '0 12px', background: '#18181B', color: '#FAFAFA',
    fontSize: '14px', border: '1px solid #3F3F46', borderRadius: '8px', outline: 'none', cursor: 'pointer',
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', margin: 0, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
            Webhook Events
          </h1>
          <p style={{ fontSize: '14px', color: '#A1A1AA', marginTop: '4px', marginBottom: 0 }}>
            GitHub webhook deliveries and processing status
          </p>
        </div>
        <button
          onClick={() => fetchEvents(true)}
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer', borderRadius: '8px' }}
        >
          <RefreshCw size={18} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={eventTypeFilter} onChange={e => { setEventTypeFilter(e.target.value); setPage(1); }} style={{ ...selectStyle, width: '160px' }}>
          <option value="all">All Events</option>
          <option value="issues">issues</option>
          <option value="issue_comment">issue_comment</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ ...selectStyle, width: '140px' }}>
          <option value="all">All Statuses</option>
          <option value="processed">Processed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A', pointerEvents: 'none' }} />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by delivery ID..."
            style={{ ...selectStyle, width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Event Table */}
      <div style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '12px', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>Loading...</div>
        ) : events.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            {searchQuery || eventTypeFilter !== 'all' || statusFilter !== 'all' ? (
              <>
                <Search size={40} color="#3F3F46" style={{ margin: '0 auto 16px', display: 'block' }} />
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', fontFamily: "'DM Sans', sans-serif", margin: '0 0 8px' }}>No events found</p>
                <p style={{ fontSize: '14px', color: '#A1A1AA', margin: '0 0 24px' }}>Try adjusting your filters or search query.</p>
                <button onClick={clearFilters} style={{ height: '36px', padding: '0 16px', background: 'transparent', color: '#A1A1AA', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: '1px solid #3F3F46', cursor: 'pointer' }}>
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <Webhook size={48} color="#3F3F46" style={{ margin: '0 auto 16px', display: 'block' }} />
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', fontFamily: "'DM Sans', sans-serif", margin: '0 0 8px' }}>No webhook events yet</p>
                <p style={{ fontSize: '14px', color: '#A1A1AA', margin: 0 }}>Events will appear here once your GitHub webhook is configured and starts receiving deliveries.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  {['Delivery ID', 'Event', 'Issue #', 'Status', 'Received'].map(col => (
                    <th key={col} style={{
                      height: '44px', padding: '0 16px', background: '#27272A', color: '#A1A1AA',
                      fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: 'left', borderBottom: '1px solid #3F3F46',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} style={{
                    borderBottom: '1px solid #27272A',
                    background: event.error_message ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                  }}>
                    <td style={{ height: '52px', padding: '0 16px', color: '#A1A1AA', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                      {event.github_delivery_id.substring(0, 8)}...
                    </td>
                    <td style={{ height: '52px', padding: '0 16px' }}>
                      {eventTypeBadge(event.event_type)}
                    </td>
                    <td style={{ height: '52px', padding: '0 16px', color: '#A1A1AA' }}>
                      {event.github_issue_number ? (
                        <a
                          href={`https://github.com/ascendantventures/harness-beta-test/issues/${event.github_issue_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#6366F1', textDecoration: 'none' }}
                        >
                          #{event.github_issue_number}
                          <ExternalLink size={12} />
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ height: '52px', padding: '0 16px' }}>
                      {statusBadge(event)}
                    </td>
                    <td style={{ height: '52px', padding: '0 16px', color: '#71717A', fontSize: '13px' }}>
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid #27272A' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ height: '32px', padding: '0 12px', background: 'transparent', color: page === 1 ? '#3F3F46' : '#A1A1AA', fontSize: '14px', border: '1px solid #3F3F46', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                ←
              </button>
              <span style={{ height: '32px', padding: '0 12px', display: 'flex', alignItems: 'center', color: '#FAFAFA', fontSize: '14px' }}>
                Page {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={events.length < PAGE_SIZE}
                style={{ height: '32px', padding: '0 12px', background: 'transparent', color: events.length < PAGE_SIZE ? '#3F3F46' : '#A1A1AA', fontSize: '14px', border: '1px solid #3F3F46', borderRadius: '6px', cursor: events.length < PAGE_SIZE ? 'not-allowed' : 'pointer' }}
              >
                →
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
