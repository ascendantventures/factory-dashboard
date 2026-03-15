'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getSyncTooltip(lastSync: string | null, syncing: boolean): string {
  if (syncing) return 'Sync in progress — data may be up to 5 minutes old';
  if (!lastSync) return 'Sync pending — data may be outdated. This usually resolves automatically.';
  const ageMs = Date.now() - new Date(lastSync).getTime();
  const ageMinutes = ageMs / 60_000;
  if (ageMinutes < 5) return 'All data is up to date';
  return 'Sync pending — data may be outdated. This usually resolves automatically.';
}

export function SyncStatus() {
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/sync/status');
      if (res.ok) {
        const data = await res.json() as { last_sync: string | null };
        setLastSync(data.last_sync);
      }
    } catch {
      // silently ignore
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const tooltipText = getSyncTooltip(lastSync, syncing);
  const badgeText = syncing ? 'Syncing...' : lastSync ? `Synced ${timeAgo(lastSync)}` : 'Not synced';

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            data-testid="sync-badge"
            tabIndex={0}
            className="hidden sm:flex items-center gap-1.5 text-xs cursor-default"
            style={{ color: syncing ? '#6366F1' : 'var(--text-muted)' }}
            aria-label={`Sync status: ${badgeText}`}
          >
            <RefreshCw
              className="w-3.5 h-3.5"
              style={{
                animation: syncing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>{badgeText}</span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            align="center"
            sideOffset={4}
            style={{
              background: '#27272A',
              border: '1px solid #3F3F46',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              lineHeight: '1.4',
              color: '#A1A1AA',
              maxWidth: '220px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 9999,
            }}
          >
            {tooltipText}
            <Tooltip.Arrow style={{ fill: '#3F3F46' }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
