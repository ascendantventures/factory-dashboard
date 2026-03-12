'use client';

import { ArrowRight, Check, XCircle, RefreshCw, Rocket, Clock } from 'lucide-react';
import StationBadge from './StationBadge';

interface TimelineEventData {
  id: string;
  submission_id: string;
  issue_title: string | null;
  issue_number: number | null;
  event_type: string;
  station: string | null;
  occurred_at: string;
  duration_seconds: number | null;
  metadata: Record<string, unknown>;
}

const EVENT_CONFIG: Record<string, { color: string; Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string }> = {
  station_entered: { color: '#60A5FA', Icon: ArrowRight, label: 'Station Entered' },
  station_exited:  { color: '#34D399', Icon: Check, label: 'Station Exited' },
  failure:         { color: '#EF4444', Icon: XCircle, label: 'Failure' },
  bugfix_loop:     { color: '#FB923C', Icon: RefreshCw, label: 'Bugfix Loop' },
  deployed:        { color: '#10B981', Icon: Rocket, label: 'Deployed' },
};

const DEFAULT_CONFIG = { color: '#7A7672', Icon: ArrowRight, label: 'Event' };

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  event: TimelineEventData;
  index: number;
}

export default function TimelineEventCard({ event, index }: Props) {
  const config = EVENT_CONFIG[event.event_type] ?? DEFAULT_CONFIG;
  const { color, Icon, label } = config;
  const isHighlighted = event.event_type === 'failure' || event.event_type === 'bugfix_loop';
  const borderLeftColor = event.event_type === 'failure' ? '#EF4444' : event.event_type === 'bugfix_loop' ? '#FB923C' : 'transparent';

  return (
    <div
      style={{
        display: 'flex',
        gap: '0',
        marginBottom: '24px',
        animationDelay: `${Math.min(index, 10) * 50}ms`,
        animation: 'slide-up 200ms cubic-bezier(0.25,1,0.5,1) both',
      }}
    >
      {/* Node */}
      <div style={{ position: 'relative', width: '24px', flexShrink: 0 }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '9999px',
            background: '#252321',
            border: `2px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Icon size={12} style={{ color }} />
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          marginLeft: '16px',
          flex: 1,
          background: '#1A1918',
          border: '1px solid #3D3937',
          borderLeft: isHighlighted ? `3px solid ${borderLeftColor}` : '1px solid #3D3937',
          borderRadius: '8px',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color,
            marginBottom: '4px',
            fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
          }}
        >
          {label}
        </div>

        {event.issue_title && (
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#F5F3F0',
              marginBottom: '8px',
              fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
            }}
          >
            {event.issue_number ? `#${event.issue_number} ` : ''}
            {event.issue_title}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {event.station && <StationBadge station={event.station} />}

          <span
            style={{
              fontSize: '12px',
              color: '#7A7672',
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            }}
          >
            {formatTime(event.occurred_at)}
          </span>

          {event.duration_seconds != null && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#B8B4AF',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              }}
            >
              <Clock size={12} style={{ color: '#7A7672' }} />
              {formatDuration(event.duration_seconds)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
