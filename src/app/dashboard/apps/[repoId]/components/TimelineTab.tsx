'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import TimelineEventCard from './TimelineEvent';

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

export default function TimelineTab({ repoId }: { repoId: string }) {
  const [events, setEvents] = useState<TimelineEventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${repoId}/timeline`)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoId]);

  if (loading) {
    return (
      <div data-testid="timeline-view" style={{ paddingLeft: '32px', position: 'relative' }}>
        {/* Skeleton line */}
        <div
          style={{
            position: 'absolute',
            left: '11px',
            top: 0,
            bottom: 0,
            width: '2px',
            background: '#3D3937',
          }}
        />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '0', marginBottom: '24px' }}>
            <div style={{ width: '24px', flexShrink: 0 }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '9999px',
                  background: '#252321',
                  border: '2px solid #3D3937',
                  animation: 'skeleton 1.5s ease-in-out infinite',
                }}
              />
            </div>
            <div
              style={{
                marginLeft: '16px',
                flex: 1,
                height: '72px',
                background: '#1A1918',
                border: '1px solid #3D3937',
                borderRadius: '8px',
                animation: 'skeleton 1.5s ease-in-out infinite',
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        data-testid="timeline-view"
        style={{ position: 'relative' }}
      >
        <div
          data-testid="timeline-empty-state"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '64px 24px',
            gap: '12px',
          }}
        >
          <Clock size={48} style={{ color: '#7A7672' }} />
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#F5F3F0' }}>
            No timeline events
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#7A7672',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            Pipeline events will appear here as issues are processed through the factory.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="timeline-view" style={{ paddingLeft: '32px', position: 'relative' }}>
      {/* Vertical line */}
      <div
        style={{
          position: 'absolute',
          left: '11px',
          top: 0,
          bottom: 0,
          width: '2px',
          background: '#3D3937',
        }}
      />

      {events.map((event, index) => (
        <TimelineEventCard key={event.id} event={event} index={index} />
      ))}
    </div>
  );
}
