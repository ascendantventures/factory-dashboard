'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export interface HarnessEventRow {
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
  metadata: unknown;
  isNew?: boolean;
}

export type RealtimeStatus = 'connecting' | 'live' | 'polling';

interface UseRealtimeEventsOptions {
  onNewEvent?: (event: HarnessEventRow) => void;
}

export function useRealtimeEvents(options?: UseRealtimeEventsOptions) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const channelRef = useRef<ReturnType<ReturnType<typeof createSupabaseBrowserClient>['channel']> | null>(null);
  const onNewEventRef = useRef(options?.onNewEvent);

  useEffect(() => {
    onNewEventRef.current = options?.onNewEvent;
  }, [options?.onNewEvent]);

  const teardown = useCallback(() => {
    if (channelRef.current) {
      const supabase = createSupabaseBrowserClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel('harness_events_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'harness_events',
        },
        (payload) => {
          const newRow = payload.new as HarnessEventRow;
          onNewEventRef.current?.({ ...newRow, isNew: true });
        }
      )
      .subscribe((channelStatus) => {
        if (channelStatus === 'SUBSCRIBED') {
          setStatus('live');
        } else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT' || channelStatus === 'CLOSED') {
          setStatus('polling');
        } else {
          setStatus('connecting');
        }
      });

    channelRef.current = channel;

    return teardown;
  }, [teardown]);

  return { status, teardown };
}
