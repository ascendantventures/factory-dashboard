'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ActivityTimestamp } from './ActivityTimestamp';
import type { ActivityEvent as ActivityEventType } from '@/hooks/useActivityFeed';
import { LogViewer } from '@/components/agents/LogViewer';

const EVENT_CONFIG: Record<
  ActivityEventType['event_type'],
  { icon: string; color: string; bg: string }
> = {
  agent_spawned: { icon: '🚀', color: '#A5B4FC', bg: 'rgba(99,102,241,0.12)' },
  stage_completed: { icon: '✅', color: '#4ADE80', bg: 'rgba(34,197,94,0.12)' },
  build_deployed: { icon: '🔨', color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
  qa_result: { icon: '🧪', color: '#4ADE80', bg: 'rgba(34,197,94,0.12)' },
  bug_filed: { icon: '🐛', color: '#FB923C', bg: 'rgba(249,115,22,0.12)' },
  cost_logged: { icon: '💰', color: '#FDE047', bg: 'rgba(234,179,8,0.12)' },
};

function truncate(str: string | null | undefined, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function renderDescription(event: ActivityEventType, onWatch?: () => void): React.ReactNode {
  switch (event.event_type) {
    case 'agent_spawned':
      return (
        <>
          Agent spawned
          {event.station && (
            <> · <span className="font-medium">{event.station}</span></>
          )}
          {event.source === 'run' && onWatch && (
            <>
              {' · '}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWatch(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#E5A830',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  padding: 0,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
              >
                Watch
              </button>
            </>
          )}
        </>
      );
    case 'stage_completed':
      return (
        <>
          Stage moved
          {event.from_station && (
            <> <span className="font-medium">{event.from_station}</span> →</>
          )}{' '}
          <span className="font-medium">{event.to_station ?? '?'}</span>
          {event.duration_seconds && (
            <span style={{ color: '#71717A' }}> · {event.duration_seconds}s</span>
          )}
        </>
      );
    case 'build_deployed':
      return (
        <>
          Build deployed
          {event.live_url && (
            <>
              {' '}·{' '}
              <a
                href={event.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
                style={{ color: '#60A5FA' }}
                onClick={(e) => e.stopPropagation()}
              >
                view live
              </a>
            </>
          )}
        </>
      );
    case 'qa_result': {
      const passed = event.run_status === 'completed';
      return (
        <span style={{ color: passed ? '#4ADE80' : '#F87171' }}>
          QA {passed ? 'passed' : 'failed'}
          {!passed && event.log_summary && (
            <span className="block text-xs mt-0.5" style={{ color: '#A1A1AA' }}>
              {truncate(event.log_summary, 60)}
            </span>
          )}
        </span>
      );
    }
    case 'bug_filed':
      return <>Bug filed</>;
    case 'cost_logged':
      return (
        <>
          Cost logged
          {event.model && (
            <> · <span className="font-medium">{event.model}</span></>
          )}
          {event.estimated_cost_usd !== null && (
            <> · <span className="font-medium">${event.estimated_cost_usd.toFixed(4)}</span></>
          )}
        </>
      );
    default:
      return <>Pipeline event</>;
  }
}

interface ActivityEventProps {
  event: ActivityEventType;
}

export function ActivityEventRow({ event }: ActivityEventProps) {
  const [showLogViewer, setShowLogViewer] = useState(false);
  const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.stage_completed;
  const isQaFail = event.event_type === 'qa_result' && event.run_status === 'failed';
  const effectiveColor = isQaFail ? '#F87171' : config.color;
  const effectiveBg = isQaFail ? 'rgba(239,68,68,0.12)' : config.bg;

  const isAgentSpawned = event.event_type === 'agent_spawned' && event.source === 'run';

  const inner = (
    <div
      data-testid="activity-event"
      data-event-type={event.event_type}
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = '#1C1C1F';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
        style={{ background: effectiveBg, color: effectiveColor }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed" style={{ color: '#D4D4D8' }}>
          {renderDescription(event, isAgentSpawned ? () => setShowLogViewer(prev => !prev) : undefined)}
        </p>
        {event.issue_title && (
          <p className="text-xs mt-0.5 truncate" style={{ color: '#71717A' }}>
            #{event.issue_number} · {truncate(event.issue_title, 40)}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <ActivityTimestamp occurred_at={event.occurred_at} />
    </div>
  );

  return (
    <div>
      {/* Wrap in Link if there's an issue_number, but only for non-agent-spawned events */}
      {event.issue_number && !isAgentSpawned ? (
        <Link
          href={`/dashboard/issues/${event.issue_number}`}
          className="block"
          data-testid="activity-event-link"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}

      {/* Log viewer for agent_spawned events */}
      {showLogViewer && isAgentSpawned && (
        <div style={{ padding: '8px 12px' }}>
          <LogViewer
            run={{
              id: event.source_id,
              station: event.station,
              model: event.model,
              pid: null,
              started_at: event.occurred_at,
              estimated_cost_usd: event.estimated_cost_usd,
              run_status: event.run_status ?? 'running',
            }}
            onClose={() => setShowLogViewer(false)}
            mode="embedded"
          />
        </div>
      )}
    </div>
  );
}
