'use client';

import { formatDistanceToNow } from 'date-fns';
import type { SpecActivity } from '@/types/spec-flow';

interface SpecActivityFeedProps {
  activities: SpecActivity[];
}

const ACTIVITY_COLORS: Record<string, string> = {
  approved: '#059669',
  feedback_requested: '#D97706',
  skip_design: '#6366F1',
};

const ACTIVITY_LABELS: Record<string, string> = {
  approved: 'approved the spec',
  feedback_requested: 'requested changes',
  skip_design: 'skipped design phase',
};

export function SpecActivityFeed({ activities }: SpecActivityFeedProps) {
  return (
    <div data-testid="spec-activity-feed" style={{ marginTop: 32, borderTop: '1px solid #E2E8F0', paddingTop: 24 }}>
      <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 13, fontWeight: 600, color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: '0.04em',
        marginBottom: 16,
      }}>
        Activity
      </div>

      {activities.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '32px 0',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14, color: '#94A3B8',
        }}>
          No activity yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {activities.map((activity, idx) => {
            const dotColor = ACTIVITY_COLORS[activity.activity_type] ?? '#94A3B8';
            const actionLabel = ACTIVITY_LABELS[activity.activity_type] ?? activity.activity_type;
            const actorName = activity.actor_email?.split('@')[0] ?? 'Someone';
            const feedback = activity.payload?.feedback as string | undefined;
            const commentUrl = activity.payload?.commentUrl as string | undefined;
            const notes = activity.payload?.notes as string | undefined;

            return (
              <div
                key={activity.id}
                data-testid="spec-activity-entry"
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: idx < activities.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                {/* Timeline dot */}
                <div style={{ position: 'relative', flexShrink: 0, paddingTop: 6 }}>
                  <div style={{
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: dotColor,
                  }} />
                  {idx < activities.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: 16, bottom: -12, left: 3,
                      width: 2,
                      background: '#E2E8F0',
                    }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5, color: '#0F172A' }}>
                    <span style={{ fontWeight: 500 }}>{actorName}</span>{' '}
                    <span style={{ fontWeight: 400 }}>{actionLabel}</span>
                  </div>

                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>

                  {/* Feedback preview */}
                  {feedback && (
                    <div style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13, lineHeight: 1.5, color: '#475569',
                      background: '#F1F5F9',
                      padding: '8px 12px',
                      borderRadius: 6,
                      marginTop: 8,
                      maxHeight: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {feedback}
                    </div>
                  )}

                  {/* Comment URL link */}
                  {commentUrl && (
                    <a
                      href={commentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 12, color: '#2563EB',
                        textDecoration: 'none',
                        display: 'inline-block',
                        marginTop: 4,
                      }}
                    >
                      View on GitHub →
                    </a>
                  )}

                  {/* Approval notes */}
                  {notes && (
                    <div style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13, lineHeight: 1.5, color: '#475569',
                      background: '#F1F5F9',
                      padding: '8px 12px',
                      borderRadius: 6,
                      marginTop: 8,
                    }}>
                      {notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
