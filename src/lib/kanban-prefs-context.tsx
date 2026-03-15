'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { STATIONS, type Station } from '@/lib/constants';

// ── Types ────────────────────────────────────────────────────────────────────

export type SyncState = 'idle' | 'saving' | 'saved' | 'error';

export interface KanbanPrefsState {
  columnOrder: Station[];
  hiddenColumns: Station[];
  isSaving: boolean;
  syncState: SyncState;
  setOrder: (newOrder: Station[]) => void;
  toggleHidden: (columnKey: Station) => void;
  reset: () => void;
}

const SERVER_WRITE_DEBOUNCE = 500;
const SAVED_INDICATOR_DURATION = 2000;

// Legacy localStorage key from Phase 1
const LEGACY_PREFS_KEY = 'kanban_column_prefs';

// ── Default order ────────────────────────────────────────────────────────────

function getEffectiveOrder(columnOrder: Station[]): Station[] {
  if (columnOrder.length === 0) return [...STATIONS];
  // Ensure all current stations are present (handle added/removed stations)
  const ordered = columnOrder.filter((s) => (STATIONS as readonly string[]).includes(s)) as Station[];
  const missing = STATIONS.filter((s) => !ordered.includes(s));
  return [...ordered, ...missing];
}

// ── Context ───────────────────────────────────────────────────────────────────

const KanbanPrefsContext = createContext<KanbanPrefsState | null>(null);

export function useKanbanPrefs(): KanbanPrefsState {
  const ctx = useContext(KanbanPrefsContext);
  if (!ctx) throw new Error('useKanbanPrefs must be used within KanbanPrefsProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function KanbanPrefsProvider({ children }: { children: React.ReactNode }) {
  const [columnOrder, setColumnOrderState] = useState<Station[]>([...STATIONS]);
  const [hiddenColumns, setHiddenColumnsState] = useState<Station[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  // ── Load prefs from server on mount ────────────────────────────────────────

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch('/api/kanban/prefs');
        if (!res.ok) return;
        const data = await res.json() as { column_order: Station[]; hidden_columns: Station[] };

        if (!isMounted.current) return;

        const serverOrder = data.column_order ?? [];
        const serverHidden = data.hidden_columns ?? [];

        if (serverOrder.length === 0 && serverHidden.length === 0) {
          // New user — check localStorage for Phase 1 prefs and seed server
          const legacy = getLegacyPrefs();
          if (legacy) {
            setColumnOrderState(getEffectiveOrder([]));
            setHiddenColumnsState(legacy.hiddenColumns);
            // Persist legacy prefs to server (one-time migration)
            persistToServer([], legacy.hiddenColumns);
          } else {
            setColumnOrderState([...STATIONS]);
            setHiddenColumnsState([]);
          }
        } else {
          setColumnOrderState(getEffectiveOrder(serverOrder));
          setHiddenColumnsState(serverHidden);
        }
      } catch {
        // Silent fail — use defaults
      }
    }
    loadPrefs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist to server (debounced) ──────────────────────────────────────────

  const persistToServer = useCallback(
    (order: Station[], hidden: Station[]) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        if (!isMounted.current) return;
        setSyncState('saving');
        try {
          const res = await fetch('/api/kanban/prefs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_order: order, hidden_columns: hidden }),
          });
          if (!isMounted.current) return;
          if (!res.ok) throw new Error('Server error');
          setSyncState('saved');
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => {
            if (isMounted.current) setSyncState('idle');
          }, SAVED_INDICATOR_DURATION);
        } catch {
          if (isMounted.current) setSyncState('error');
        }
      }, SERVER_WRITE_DEBOUNCE);
    },
    []
  );

  // ── Exposed actions ────────────────────────────────────────────────────────

  const setOrder = useCallback(
    (newOrder: Station[]) => {
      setColumnOrderState(newOrder);
      setHiddenColumnsState((prev) => {
        persistToServer(newOrder, prev);
        return prev;
      });
    },
    [persistToServer]
  );

  const toggleHidden = useCallback(
    (columnKey: Station) => {
      setHiddenColumnsState((prev) => {
        const visibleCount = columnOrder.length - prev.length;
        // Cannot hide the last visible column
        if (!prev.includes(columnKey) && visibleCount <= 1) return prev;

        const next = prev.includes(columnKey)
          ? prev.filter((s) => s !== columnKey)
          : [...prev, columnKey];

        persistToServer(columnOrder, next);
        return next;
      });
    },
    [columnOrder, persistToServer]
  );

  const reset = useCallback(() => {
    const defaultOrder = [...STATIONS];
    const defaultHidden: Station[] = [];
    setColumnOrderState(defaultOrder);
    setHiddenColumnsState(defaultHidden);
    persistToServer(defaultOrder, defaultHidden);
  }, [persistToServer]);

  return (
    <KanbanPrefsContext.Provider
      value={{
        columnOrder,
        hiddenColumns,
        isSaving: syncState === 'saving',
        syncState,
        setOrder,
        toggleHidden,
        reset,
      }}
    >
      {children}
    </KanbanPrefsContext.Provider>
  );
}

// ── Legacy localStorage migration helper ────────────────────────────────────

interface LegacyPrefs {
  hiddenColumns: Station[];
}

function getLegacyPrefs(): LegacyPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LEGACY_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { hiddenColumns?: Station[] };
    const hiddenColumns = Array.isArray(parsed.hiddenColumns) ? parsed.hiddenColumns : [];
    if (hiddenColumns.length === 0) return null;
    return { hiddenColumns };
  } catch {
    return null;
  }
}
