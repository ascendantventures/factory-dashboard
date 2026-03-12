'use client';

import { X, Check, XCircle } from 'lucide-react';
import { AgentStatusDot } from './AgentStatusDot';
import { useElapsedTime } from '@/hooks/useElapsedTime';

interface AgentMetadataBarProps {
  runId: string;
  station: string | null;
  model: string | null;
  pid: number | null;
  startedAt: string | null;
  estimatedCost: number | null;
  runStatus: string;
  exitCode: number | null;
  isComplete: boolean;
  onClose?: () => void;
}

function StationBadge({ station }: { station: string }) {
  const s = station.toLowerCase();
  let bg = '#1E222B', color = '#A8B0BF';
  if (s === 'spec') { bg = '#1E3A5F'; color = '#60A5FA'; }
  else if (s === 'design') { bg = '#3D2D5C'; color = '#A78BFA'; }
  else if (s === 'build') { bg = '#2D4A3E'; color = '#34D399'; }
  else if (s === 'qa') { bg = '#4A3D2D'; color = '#FBBF24'; }

  return (
    <span
      data-testid="agent-station"
      style={{
        background: bg,
        color,
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        fontFamily: 'Outfit, system-ui, sans-serif',
      }}
    >
      {station.toUpperCase()}
    </span>
  );
}

function ModelBadge({ model }: { model: string }) {
  return (
    <span
      data-testid="agent-model"
      style={{
        background: '#1E222B',
        color: '#A8B0BF',
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {model}
    </span>
  );
}

export function AgentMetadataBar({
  station,
  model,
  pid,
  startedAt,
  estimatedCost,
  runStatus,
  exitCode,
  isComplete,
  onClose,
}: AgentMetadataBarProps) {
  const elapsed = useElapsedTime(isComplete ? null : startedAt);

  const relativeStart = startedAt
    ? (() => {
        const diffMs = Date.now() - new Date(startedAt).getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        if (diffSecs < 60) return `${diffSecs}s ago`;
        const diffMins = Math.floor(diffSecs / 60);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        return `${diffHrs}h ago`;
      })()
    : null;

  const costStr = estimatedCost != null ? `$${estimatedCost.toFixed(4)}` : null;

  return (
    <div
      style={{
        background: '#12141A',
        borderBottom: '1px solid #2A2F3A',
        padding: '12px 16px',
        flexShrink: 0,
      }}
    >
      {/* Row 1 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AgentStatusDot status={runStatus} size="sm" />

        {station && <StationBadge station={station} />}
        {model && <ModelBadge model={model} />}
        {pid != null && (
          <span
            style={{
              fontSize: 12,
              color: '#6B7280',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            PID {pid}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {onClose && (
          <button
            onClick={onClose}
            data-testid="log-viewer-close"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              color: '#6B7280',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1A1D25';
              (e.currentTarget as HTMLButtonElement).style.color = '#F0F2F5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
            }}
            aria-label="Close log viewer"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* Row 2 */}
      <div style={{ marginTop: 6 }}>
        {isComplete ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: 'Outfit, system-ui, sans-serif',
            }}
          >
            {exitCode === 0 ? (
              <>
                <Check style={{ width: 13, height: 13, color: '#34D399' }} />
                <span style={{ color: '#34D399', fontWeight: 600 }}>Exit: 0</span>
              </>
            ) : (
              <>
                <XCircle style={{ width: 13, height: 13, color: '#F87171' }} />
                <span style={{ color: '#F87171', fontWeight: 600 }}>
                  Exit: {exitCode ?? 1}
                </span>
              </>
            )}
            {costStr && (
              <span style={{ color: '#6B7280', marginLeft: 8 }}>
                Est. {costStr}
              </span>
            )}
          </div>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: '#6B7280',
              fontFamily: 'Outfit, system-ui, sans-serif',
            }}
          >
            <span data-testid="agent-elapsed">
              {relativeStart && `Started ${relativeStart}`}
              {relativeStart && ' · '}
              {`Elapsed: ${elapsed}`}
              {costStr && ` · Est. ${costStr}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
