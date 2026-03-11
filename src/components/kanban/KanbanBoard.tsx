'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { STATIONS, Station, STATION_COLORS, STATION_LABELS } from '@/lib/constants';
import { DashIssue } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { IssueCard } from './IssueCard';
import { RefreshCw, Loader2, Plus } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NewIssueModal } from '@/components/NewIssueModal';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';

interface KanbanBoardProps {
  initialIssues: DashIssue[];
  trackedRepos: string[];
}

export function KanbanBoard({ initialIssues, trackedRepos }: KanbanBoardProps) {
  const [issues, setIssues] = useState<DashIssue[]>(initialIssues);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [activeIssue, setActiveIssue] = useState<DashIssue | null>(null);
  const [draggingIssueIds, setDraggingIssueIds] = useState<Set<number>>(new Set());
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dash_issues' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setIssues((prev) => [...prev, payload.new as DashIssue]);
          } else if (payload.eventType === 'UPDATE') {
            setIssues((prev) =>
              prev.map((i) => i.id === (payload.new as DashIssue).id ? (payload.new as DashIssue) : i)
            );
          } else if (payload.eventType === 'DELETE') {
            setIssues((prev) => prev.filter((i) => i.id !== (payload.old as DashIssue).id));
          }
        })
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

  function handleDragStart(event: DragStartEvent) {
    const issue = issues.find((i) => i.id === event.active.id);
    if (issue) setActiveIssue(issue);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const draggedIssue = issues.find((i) => i.id === active.id);
    if (!draggedIssue) return;

    let targetStation: Station | null = null;
    const overId = String(over.id);
    if (overId.startsWith('column-')) {
      targetStation = overId.replace('column-', '') as Station;
    } else {
      const overIssue = issues.find((i) => i.id === over.id);
      if (overIssue) targetStation = overIssue.station;
    }

    if (!targetStation || targetStation === draggedIssue.station) return;

    const originalStation = draggedIssue.station;

    // Optimistic update
    setIssues((prev) =>
      prev.map((i) => i.id === draggedIssue.id ? { ...i, station: targetStation! } : i)
    );

    setDraggingIssueIds((prev) => new Set([...prev, draggedIssue.issue_number]));

    try {
      const res = await fetch(
        `/api/issues/${draggedIssue.issue_number}/station?repo=${encodeURIComponent(draggedIssue.repo)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ station: targetStation }),
        }
      );
      if (!res.ok) throw new Error('API error');
    } catch {
      setIssues((prev) =>
        prev.map((i) => i.id === draggedIssue.id ? { ...i, station: originalStation } : i)
      );
      toast.error('Failed to update stage');
    } finally {
      setDraggingIssueIds((prev) => {
        const next = new Set(prev);
        next.delete(draggedIssue.issue_number);
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>
            Kanban Board
          </h1>
          {lastSync && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Last sync: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewIssueModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all"
            style={{ background: '#10B981', color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#059669'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#10B981'; }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Issue</span>
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync GitHub
          </button>
        </div>
      </div>

      {/* Desktop Kanban Board */}
      <div className="hidden sm:block flex-1 overflow-x-auto p-6" data-testid="kanban-board">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {STATIONS.map((station) => (
              <KanbanColumn
                key={station}
                station={station}
                issues={getIssuesForStation(station)}
                draggingIssueIds={draggingIssueIds}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeIssue ? (
              <div data-testid="drag-overlay" style={{ width: '280px' }}>
                <IssueCard issue={activeIssue} isOverlay isDragDisabled={false} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile view */}
      <div className="block sm:hidden flex-1 overflow-hidden">
        <MobileView issues={issues} />
      </div>

      {showNewIssueModal && (
        <NewIssueModal
          trackedRepos={trackedRepos}
          onClose={() => setShowNewIssueModal(false)}
          onSync={handleSync}
        />
      )}
    </div>
  );
}

function MobileView({ issues }: { issues: DashIssue[] }) {
  const [activeStation, setActiveStation] = useState<Station>(STATIONS[0]);
  const filteredIssues = issues.filter((i) => i.station === activeStation);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}
        data-testid="mobile-station-tabs"
      >
        {STATIONS.map((station) => {
          const color = STATION_COLORS[station];
          const label = STATION_LABELS[station];
          const count = issues.filter((i) => i.station === station).length;
          const isActive = station === activeStation;
          return (
            <button
              key={station}
              data-testid={`mobile-tab-${station}`}
              onClick={() => setActiveStation(station)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: isActive ? `${color}20` : '#1A1A1A',
                color: isActive ? color : 'var(--text-muted)',
                border: `1px solid ${isActive ? color : '#262626'}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              {label}
              {count > 0 && (
                <span
                  className="ml-0.5 px-1.5 rounded-full text-[10px]"
                  style={{
                    background: isActive ? `${color}30` : '#262626',
                    color: isActive ? color : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredIssues.length === 0 ? (
          <div
            className="flex items-center justify-center py-12 rounded-lg border border-dashed text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            No issues in {STATION_LABELS[activeStation].toLowerCase()}
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>
    </div>
  );
}
