'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

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

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 text-xs"
      style={{ color: syncing ? '#6366F1' : 'var(--text-muted)' }}
      aria-label="Sync status"
      title={!lastSync ? "Sync happens automatically every 30 seconds or when you trigger a manual refresh." : undefined}
    >
      <RefreshCw
        className="w-3.5 h-3.5"
        style={{
          animation: syncing ? 'spin 1s linear infinite' : 'none',
        }}
      />
      <span>
        {lastSync ? `Synced ${timeAgo(lastSync)}` : 'Not synced'}
      </span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
