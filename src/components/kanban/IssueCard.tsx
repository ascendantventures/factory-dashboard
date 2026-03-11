'use client';

import Link from 'next/link';
import { Clock, User, GripVertical } from 'lucide-react';
import { DashIssue } from '@/types';
import { COMPLEXITY_COLORS, COMPLEXITY_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface IssueCardProps {
  issue: DashIssue;
  isDragDisabled?: boolean;
  isOverlay?: boolean;
}

export function IssueCard({ issue, isDragDisabled = false, isOverlay = false }: IssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    disabled: isDragDisabled,
    data: { issue },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const timeInStage = issue.updated_at
    ? formatDistanceToNow(new Date(issue.updated_at), { addSuffix: false })
    : null;

  const complexityColor = issue.complexity
    ? COMPLEXITY_COLORS[issue.complexity] ?? '#A1A1AA'
    : null;
  const complexityLabel = issue.complexity
    ? COMPLEXITY_LABELS[issue.complexity] ?? issue.complexity.toUpperCase()
    : null;

  const repoShort = issue.repo.split('/')[1] ?? issue.repo;

  const cardStyle: React.CSSProperties = {
    ...(isOverlay ? { opacity: 0.95 } : style),
    background: 'var(--surface)',
    borderColor: isOverlay ? '#3B82F6' : 'var(--border)',
    boxShadow: isOverlay ? '0 10px 15px -3px rgba(0,0,0,0.6)' : undefined,
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={cardStyle}
      data-testid="issue-card"
      className="rounded-lg border transition-all"
    >
      <div className="flex items-stretch">
        {/* Drag handle */}
        <div
          {...(isOverlay ? {} : { ...attributes, ...listeners })}
          className="flex items-center justify-center px-2 rounded-l-lg transition-colors hover:bg-[#1A1A1A]"
          style={{
            color: 'var(--text-muted)',
            cursor: isDragDisabled ? 'not-allowed' : 'grab',
            opacity: isDragDisabled ? 0.4 : 1,
            pointerEvents: isDragDisabled ? 'none' : 'auto',
            borderRight: '1px solid var(--border)',
            minWidth: '28px',
          }}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Card content */}
        <Link
          href={`/dashboard/issues/${issue.issue_number}?repo=${encodeURIComponent(issue.repo)}`}
          className="flex-1 p-3 space-y-2 block"
          onClick={(e: React.MouseEvent) => isDragging && e.preventDefault()}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <span
              className="text-xs"
              data-testid="issue-number"
              style={{ color: '#3B82F6', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
            >
              #{issue.issue_number}
            </span>
            {complexityLabel && complexityColor && (
              <Badge label={complexityLabel} color={complexityColor} />
            )}
          </div>

          {/* Title */}
          <p
            className="text-sm font-medium leading-snug line-clamp-2"
            data-testid="issue-title"
            style={{ color: 'var(--text-primary)' }}
          >
            {issue.title}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {repoShort}
            </span>
            <div className="flex items-center gap-3">
              {issue.author && (
                <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <User className="w-3 h-3" />
                  <span className="text-xs">{issue.author}</span>
                </div>
              )}
              {timeInStage && (
                <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-3 h-3" />
                  <span
                    className="text-xs"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {timeInStage}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
