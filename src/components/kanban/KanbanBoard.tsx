'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { STATIONS, Station } from '@/lib/constants';
import { DashIssue } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { RefreshCw, Loader2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

interface KanbanBoardProps {
  initialIssues: DashIssue[];
}

export function KanbanBoard({ initialIssues }: KanbanBoardProps) {
  const [issues, setIssues] = useState<DashIssue[]>(initialIssues);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const getSupabase = useCallback(async () => {
    if (!supabaseRef.current) {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase');
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  }, []);

  const fetchLastSync = useCallback(async () => {
    try {
      const res = await fetch('/api/sync/status');
      if (res.ok) {
        const data = await res.json();
        setLastSync(data.last_sync);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchLastSync();

    let mounted = true;
    let channelCleanup: (() => void) | null = null;

    getSupabase().then((supabase) => {
      if (!mounted) return;

      const channel = supabase
        .channel('dash_issues_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'dash_issues' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setIssues((prev) => [...prev, payload.new as DashIssue]);
            } else if (payload.eventType === 'UPDATE') {
              setIssues((prev) =>
                prev.map((i) =>
                  i.id === (payload.new as DashIssue).id ? (payload.new as DashIssue) : i
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setIssues((prev) =>
                prev.filter((i) => i.id !== (payload.old as DashIssue).id)
              );
            }
          }
        )
        .subscribe();

      channelCleanup = () => supabase.removeChannel(channel);
    });

    return () => {
      mounted = false;
      channelCleanup?.();
    };
  }, [getSupabase, fetchLastSync]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        const issuesRes = await fetch('/api/issues');
        if (issuesRes.ok) {
          const data = await issuesRes.json();
          setIssues(data.issues ?? []);
        }
        fetchLastSync();
      }
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  }

  function getIssuesForStation(station: Station) {
    return issues.filter((i) => i.station === station);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            Kanban Board
          </h1>
          {lastSync && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Last sync: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync GitHub
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {STATIONS.map((station) => (
            <KanbanColumn
              key={station}
              station={station}
              issues={getIssuesForStation(station)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
