'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { ActivityEvent } from '@/app/api/activity/route';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export type { ActivityEvent };

const MAX_EVENTS = 200;

function mapTransitionRow(row: Record<string, unknown>): ActivityEvent {
  const metadata = row.metadata as Record<string, unknown> | null;
  const liveUrl = metadata?.live_url as string | null ?? null;
  const toStation = row.to_station as string | null;

  let eventType: ActivityEvent['event_type'] = 'stage_completed';
  if (toStation === 'done' && liveUrl) {
    eventType = 'build_deployed';
  }

  return {
    id: `transition:${row.id}`,
    event_type: eventType,
    source: 'transition',
    source_id: String(row.id),
    occurred_at: row.transitioned_at as string,
    issue_number: row.issue_number as number | null,
    issue_title: null,
    repo: row.repo as string,
    from_station: row.from_station as string | null,
    to_station: toStation,
    duration_seconds: row.duration_seconds as number | null,
    station: null,
    run_status: null,
    model: null,
    estimated_cost_usd: null,
    live_url: liveUrl,
    log_summary: null,
  };
}

function mapRunRow(row: Record<string, unknown>): ActivityEvent {
  const runStatus = row.run_status as string | null;
  const station = row.station as string | null;
  const estimatedCost = row.estimated_cost_usd as number | null;

  let eventType: ActivityEvent['event_type'] = 'agent_spawned';
  if (runStatus === 'running') {
    eventType = 'agent_spawned';
  } else if (station === 'qa' && (runStatus === 'completed' || runStatus === 'failed')) {
    eventType = 'qa_result';
  } else if (estimatedCost !== null && runStatus === 'completed') {
    eventType = 'cost_logged';
  }

  return {
    id: `run:${row.id}`,
    event_type: eventType,
    source: 'run',
    source_id: String(row.id),
    occurred_at: row.started_at as string,
    issue_number: row.issue_number as number | null,
    issue_title: null,
    repo: row.repo as string,
    from_station: null,
    to_station: null,
    duration_seconds: row.duration_seconds as number | null,
    station: station,
    run_status: runStatus,
    model: row.model as string | null,
    estimated_cost_usd: estimatedCost,
    live_url: null,
    log_summary: row.log_summary as string | null,
  };
}

export function useActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const prependEvent = useCallback((event: ActivityEvent) => {
    setEvents((prev) => {
      // Deduplicate by id
      if (prev.some((e) => e.id === event.id)) return prev;
      const next = [event, ...prev];
      return next.slice(0, MAX_EVENTS);
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    async function fetchInitial() {
      try {
        const res = await fetch('/api/activity?limit=50');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mountedRef.current) {
          setEvents(data.events ?? []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load activity');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    fetchInitial();

    // Realtime subscriptions
    const supabase = createSupabaseBrowserClient();

    const transitionsChannel = supabase
      .channel('activity-transitions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dash_stage_transitions' },
        (payload) => {
          if (!mountedRef.current) return;
          const event = mapTransitionRow(payload.new as Record<string, unknown>);
          prependEvent(event);
        }
      )
      .subscribe();

    const runsChannel = supabase
      .channel('activity-runs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dash_agent_runs' },
        (payload) => {
          if (!mountedRef.current) return;
          const event = mapRunRow(payload.new as Record<string, unknown>);
          prependEvent(event);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dash_agent_runs' },
        (payload) => {
          if (!mountedRef.current) return;
          const event = mapRunRow(payload.new as Record<string, unknown>);
          // For updates, replace existing or prepend if cost_logged / qa_result
          setEvents((prev) => {
            const existingIdx = prev.findIndex((e) => e.id === event.id);
            if (existingIdx !== -1) {
              const next = [...prev];
              next[existingIdx] = event;
              return next;
            }
            // It's a new meaningful event type — prepend it
            return [event, ...prev].slice(0, MAX_EVENTS);
          });
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(transitionsChannel);
      supabase.removeChannel(runsChannel);
    };
  }, [prependEvent]);

  return { events, loading, error };
}
