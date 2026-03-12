'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { STATIONS, Station, STATION_COLORS, STATION_LABELS } from '@/lib/constants';
import { DashIssue } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { IssueCard } from './IssueCard';
import { AnimatedCounter } from './AnimatedCounter';
import { IssueDetailPanel } from './IssueDetailPanel';
import { RefreshCw, Loader2, Plus, LayoutGrid, Layers3, RotateCcw, Radio } from 'lucide-react';
import { ActivitySidebar } from '@/components/activity/ActivitySidebar';
import { EnrichmentMap, IssueEnrichment } from '@/lib/enrichment';
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
import { AnimatePresence, motion } from 'framer-motion';
import { viewModeVariants } from '@/lib/motion';

type ViewMode = 'full' | 'simplified';

interface KanbanPrefs {
  hiddenColumns: Station[];
  viewMode: ViewMode;
}

const DEFAULT_PREFS: KanbanPrefs = { hiddenColumns: [], viewMode: 'full' };
const PREFS_KEY = 'kanban_column_prefs';
const ACTIVITY_SIDEBAR_KEY = 'activity_sidebar_open';

function loadActivitySidebarOpen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ACTIVITY_SIDEBAR_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveActivitySidebarOpen(open: boolean) {
  try {
    localStorage.setItem(ACTIVITY_SIDEBAR_KEY, String(open));
  } catch {}
}

function loadPrefs(): KanbanPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return JSON.parse(raw) as KanbanPrefs;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: KanbanPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

// Simplified view: 3 rollup columns
const SIMPLIFIED_COLUMNS = [
  { id: 'intaked' as const, label: 'Intaked', sources: ['intake'] as Station[], color: '#F59E0B' },
  { id: 'in-progress' as const, label: 'In Progress', sources: ['spec', 'design', 'build', 'qa', 'bugfix'] as Station[], color: '#6366F1' },
  { id: 'done' as const, label: 'Done', sources: ['done'] as Station[], color: '#22C55E' },
];

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
  const [prefs, setPrefs] = useState<KanbanPrefs>(DEFAULT_PREFS);
  const [enrichmentMap, setEnrichmentMap] = useState<EnrichmentMap>(new Map());
  const [selectedIssue, setSelectedIssue] = useState<DashIssue | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  // Load prefs from localStorage on mount
  useEffect(() => {
    setPrefs(loadPrefs());
    setActivityOpen(loadActivitySidebarOpen());
  }, []);

  const updatePrefs = useCallback((updater: (p: KanbanPrefs) => KanbanPrefs) => {
    setPrefs((prev) => {
      const next = updater(prev);
      savePrefs(next);
      return next;
    });
  }, []);

  const toggleColumn = useCallback((station: Station) => {
    updatePrefs((p) => ({
      ...p,
      hiddenColumns: p.hiddenColumns.includes(station)
        ? p.hiddenColumns.filter((s) => s !== station)
        : [...p.hiddenColumns, station],
    }));
  }, [updatePrefs]);

  const resetLayout = useCallback(() => {
    updatePrefs(() => DEFAULT_PREFS);
  }, [updatePrefs]);

  const setViewMode = useCallback((mode: ViewMode) => {
    updatePrefs((p) => ({ ...p, viewMode: mode }));
  }, [updatePrefs]);

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

  const fetchEnrichment = useCallback(async () => {
    try {
      const supabase = await getSupabase();
      const [costRes, stageRes] = await Promise.all([
        supabase.from('dash_issue_cost_summary').select('issue_id,total_cost_usd,active_runs'),
        supabase.from('dash_issue_stage_entry').select('issue_id,entered_at'),
      ]);
      const costData = costRes.data ?? [];
      const stageData = stageRes.data ?? [];
      const stageMap = new Map(stageData.map((s: { issue_id: number; entered_at: string }) => [s.issue_id, s.entered_at]));
      const map = new Map<number, IssueEnrichment>();
      for (const row of costData) {
        map.set(row.issue_id, {
          total_cost_usd: Number(row.total_cost_usd ?? 0),
          active_runs: Number(row.active_runs ?? 0),
          entered_at: stageMap.get(row.issue_id) ?? null,
        });
      }
      // Also add stage data for issues not in cost table
      for (const row of stageData) {
        if (!map.has(row.issue_id)) {
          map.set(row.issue_id, { total_cost_usd: 0, active_runs: 0, entered_at: row.entered_at });
        }
      }
      setEnrichmentMap(map);
    } catch (err) {
      console.error('Failed to fetch enrichment:', err);
    }
  }, [getSupabase]);

  const fetchLastSync = useCallback(async () => {
    try {
      const res = await fetch('/api/sync/status');
      if (res.ok) {
        const data = await res.json();
        setLastSync(data.last_sync);
      }
    } catch {}
  }, []);

  // Auto-sync interval (every 60 seconds)
  const AUTO_SYNC_INTERVAL_MS = 60_000;

  useEffect(() => {
    fetchLastSync();
    fetchEnrichment();
    let mounted = true;
    let channelCleanup: (() => void) | null = null;
    let agentRunsChannelCleanup: (() => void) | null = null;

    // Supabase Realtime for instant DB change propagation
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

      // Subscribe to agent_runs for real-time cost/status updates
      const agentRunsChannel = supabase
        .channel('dash_agent_runs_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dash_agent_runs' }, () => {
          fetchEnrichment();
        })
        .subscribe();
      agentRunsChannelCleanup = () => supabase.removeChannel(agentRunsChannel);
    });

    // Auto-sync from GitHub every 60s (syncs labels/state changes into DB)
    const autoSyncInterval = setInterval(async () => {
      if (!mounted) return;
      try {
        const res = await fetch('/api/sync', { method: 'POST' });
        if (res.ok) {
          const issuesRes = await fetch('/api/issues');
          if (issuesRes.ok) {
            const data = await issuesRes.json();
            setIssues(data.issues ?? []);
          }
          fetchLastSync();
          fetchEnrichment();
        }
      } catch {
        // Silent fail on auto-sync
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      mounted = false;
      channelCleanup?.();
      agentRunsChannelCleanup?.();
      clearInterval(autoSyncInterval);
    };
  }, [getSupabase, fetchLastSync, fetchEnrichment]);

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
    } catch {}
    finally {
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

  const hasHiddenColumns = prefs.hiddenColumns.length > 0;

  function toggleActivity() {
    setActivityOpen((prev) => {
      const next = !prev;
      saveActivitySidebarOpen(next);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full" data-testid="kanban-board">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0 gap-4 flex-wrap"
        style={{ borderColor: '#27272A' }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, DM Sans, sans-serif', color: '#FAFAFA', letterSpacing: '-0.01em' }}>
            Kanban Board
          </h1>
          {lastSync && (
            <p className="text-xs mt-0.5" style={{ color: '#71717A', fontFamily: 'Inter, sans-serif' }}>
              Last sync: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </div>

        {/* View mode + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode segmented control */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ background: '#18181B', border: '1px solid #27272A' }}
          >
            <button
              data-testid="view-mode-full"
              onClick={() => setViewMode('full')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                background: prefs.viewMode === 'full' ? '#27272A' : 'transparent',
                color: prefs.viewMode === 'full' ? '#FAFAFA' : '#71717A',
              }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Full
            </button>
            <button
              data-testid="view-mode-simplified"
              onClick={() => setViewMode('simplified')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                background: prefs.viewMode === 'simplified' ? '#27272A' : 'transparent',
                color: prefs.viewMode === 'simplified' ? '#FAFAFA' : '#71717A',
              }}
            >
              <Layers3 className="w-3.5 h-3.5" />
              Simplified
            </button>
          </div>

          {/* Reset layout */}
          {(hasHiddenColumns || prefs.viewMode !== 'full') && (
            <button
              data-testid="reset-layout-btn"
              onClick={resetLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ color: '#A1A1AA', border: '1px solid #27272A', background: 'transparent' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {/* New issue */}
          <button
            data-testid="new-issue-btn"
            onClick={() => setShowNewIssueModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#22C55E', color: '#fff' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#16A34A'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#22C55E'; }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Issue</span>
          </button>

          {/* Sync */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: '#6366F1', color: '#fff' }}
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync
          </button>

          {/* Activity toggle */}
          <button
            data-testid="activity-toggle-btn"
            onClick={toggleActivity}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activityOpen ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activityOpen ? '#A5B4FC' : '#71717A',
              border: `1px solid ${activityOpen ? '#6366F1' : '#27272A'}`,
            }}
          >
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Activity</span>
          </button>
        </div>
      </div>

      {/* Board + Activity Sidebar Row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Board */}
        <div className="hidden sm:block flex-1 overflow-x-auto p-4" style={{ overflowY: 'hidden' }}>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <AnimatePresence mode="wait">
              {prefs.viewMode === 'full' ? (
                <motion.div
                  key="full-view"
                  data-testid="kanban-grid"
                  className="flex gap-3 h-full"
                  style={{ minHeight: 'calc(100vh - 140px)' }}
                  variants={viewModeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {STATIONS.map((station) => (
                    <KanbanColumn
                      key={station}
                      station={station}
                      issues={getIssuesForStation(station)}
                      draggingIssueIds={draggingIssueIds}
                      enrichmentMap={enrichmentMap}
                      isCollapsed={prefs.hiddenColumns.includes(station)}
                      onToggleCollapse={() => toggleColumn(station)}
                      onSelectIssue={setSelectedIssue}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="simplified-view"
                  data-testid="kanban-grid"
                  className="grid h-full gap-4"
                  style={{
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    minHeight: 'calc(100vh - 140px)',
                  }}
                  variants={viewModeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {SIMPLIFIED_COLUMNS.map((col) => {
                    const colIssues = col.sources.flatMap((s) => getIssuesForStation(s));
                    return (
                      <SimplifiedColumn
                        key={col.id}
                        id={col.id}
                        label={col.label}
                        color={col.color}
                        issues={colIssues}
                        enrichmentMap={enrichmentMap}
                        onSelectIssue={setSelectedIssue}
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

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

        {/* Activity Sidebar */}
        <ActivitySidebar isOpen={activityOpen} onToggle={toggleActivity} />
      </div>

      {showNewIssueModal && (
        <NewIssueModal
          trackedRepos={trackedRepos}
          onClose={() => setShowNewIssueModal(false)}
          onSync={handleSync}
        />
      )}

      <IssueDetailPanel issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </div>
  );
}

// Simplified Column
function SimplifiedColumn({
  id,
  label,
  color,
  issues,
  enrichmentMap,
  onSelectIssue,
}: {
  id: string;
  label: string;
  color: string;
  issues: DashIssue[];
  enrichmentMap: EnrichmentMap;
  onSelectIssue?: (issue: DashIssue) => void;
}) {
  return (
    <motion.div
      data-testid="kanban-column"
      data-column={id}
      className="flex flex-col rounded-xl border overflow-hidden"
      style={{ background: '#18181B', borderColor: '#27272A' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: '#27272A' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold" style={{ color: '#FAFAFA', fontFamily: 'Space Grotesk, sans-serif' }}>
            {label}
          </span>
        </div>
        <AnimatedCounter count={issues.length} color={color} />
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {issues.length === 0 ? (
          <EmptyColumnState label={label} />
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              enrichment={enrichmentMap.get(issue.id)}
              showStationBadge
              onSelect={onSelectIssue}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

function EmptyColumnState({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed gap-2 text-sm"
      style={{ color: '#71717A', borderColor: '#27272A' }}
    >
      <span>No issues in {label.toLowerCase()}</span>
    </div>
  );
}

// Mobile view
function MobileView({ issues }: { issues: DashIssue[] }) {
  const [activeStation, setActiveStation] = useState<Station>(STATIONS[0]);
  const filteredIssues = issues.filter((i) => i.station === activeStation);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto border-b flex-shrink-0"
        style={{ borderColor: '#27272A' }}
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
                background: isActive ? `${color}20` : '#18181B',
                color: isActive ? color : '#71717A',
                border: `1px solid ${isActive ? color : '#27272A'}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              {label}
              {count > 0 && (
                <span
                  className="ml-0.5 px-1.5 rounded-full text-[10px]"
                  style={{
                    background: isActive ? `${color}30` : '#27272A',
                    color: isActive ? color : '#71717A',
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
            style={{ borderColor: '#27272A', color: '#71717A' }}
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
