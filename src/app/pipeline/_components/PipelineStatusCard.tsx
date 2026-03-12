'use client';

import { LoopStatus } from './types';
import { Play } from 'lucide-react';

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(isoString).toLocaleDateString();
}

interface Props {
  loop: LoopStatus;
  onStartLoop: () => void;
}

export default function PipelineStatusCard({ loop, onStartLoop }: Props) {
  const { running, pid, uptime_seconds, last_tick_at } = loop;

  return (
    <div
      data-testid="pipeline-status-card"
      style={{
        background: '#141721',
        border: '1px solid #2A2F42',
        borderRadius: '12px',
        padding: '24px',
        width: '280px',
        minWidth: '280px',
        flexShrink: 0,
      }}
    >
      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div
          data-testid="pipeline-status-badge"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: running ? '#22C55E' : '#EF4444',
            flexShrink: 0,
            ...(running
              ? { boxShadow: '0 0 8px rgba(34,197,94,0.6)', animation: 'pulse-dot 2s ease-in-out infinite' }
              : {}),
          }}
        />
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '24px',
            fontWeight: 600,
            color: running ? '#22C55E' : '#EF4444',
          }}
        >
          {running ? 'Running' : 'Stopped'}
        </span>
      </div>

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7489',
              marginBottom: '4px',
            }}
          >
            PID
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              color: '#F1F3F9',
            }}
          >
            {pid ?? '—'}
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7489',
              marginBottom: '4px',
            }}
          >
            Uptime
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              color: '#F1F3F9',
            }}
          >
            {formatUptime(uptime_seconds)}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7489',
              marginBottom: '4px',
            }}
          >
            Last Tick
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              color: '#F1F3F9',
            }}
            title={last_tick_at ?? undefined}
          >
            {formatRelativeTime(last_tick_at)}
          </div>
        </div>
      </div>

      {/* Start loop button when stopped */}
      {!running && (
        <button
          onClick={onStartLoop}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#3B82F6',
            color: '#FFFFFF',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '40px',
          }}
        >
          <Play size={16} />
          Start Loop
        </button>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
