'use client';

import Link from 'next/link';
import { Clock, User, GripVertical } from 'lucide-react';
import { DashIssue } from '@/types';
import { COMPLEXITY_COLORS, COMPLEXITY_LABELS, STATION_COLORS, STATION_LABELS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

interface IssueCardProps {
  issue: DashIssue;
  isDragDisabled?: boolean;
  isOverlay?: boolean;
  showStationBadge?: boolean;
}

export function IssueCard({ issue, isDragDisabled = false, isOverlay = false, showStationBadge = false }: IssueCardProps) {
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

  const stationColor = issue.station ? STATION_COLORS[issue.station] : '#71717A';
  const stationLabel = issue.station ? STATION_LABELS[issue.station] : '';

  const cardStyle: React.CSSProperties = {
    ...(isOverlay ? { opacity: 0.95 } : style),
    background: '#18181B',
    borderColor: isOverlay ? '#3B82F6' : '#27272A',
    boxShadow: isOverlay ? '0 10px 15px -3px rgba(0,0,0,0.6)' : '0 1px 2px rgba(0,0,0,0.3)',
  };

  return (
    <motion.div
      ref={isOverlay ? undefined : setNodeRef}
      style={cardStyle}
      data-testid="issue-card"
      className="rounded-xl border transition-colors"
      whileHover={isOverlay ? {} : {
        borderColor: 'rgba(99, 102, 241, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        y: -2,
      }}
      whileTap={isOverlay ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-stretch">
        {/* Drag handle */}
        <div
          {...(isOverlay ? {} : { ...attributes, ...listeners })}
          className="flex items-center justify-center px-2 rounded-l-xl transition-colors hover:bg-[#27272A]"
          style={{
            color: '#71717A',
            cursor: isDragDisabled ? 'not-allowed' : 'grab',
            opacity: isDragDisabled ? 0.4 : 1,
            pointerEvents: isDragDisabled ? 'none' : 'auto',
            borderRight: '1px solid #27272A',
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
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <span
              className="text-xs"
              data-testid="issue-number"
              style={{ color: '#6366F1', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
            >
              #{issue.issue_number}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {showStationBadge && (
                <span
                  data-testid="station-badge"
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: `${stationColor}20`,
                    color: stationColor,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {stationLabel}
                </span>
              )}
              {complexityLabel && complexityColor && (
                <span
                  data-testid="complexity-badge"
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: `${complexityColor}20`,
                    color: complexityColor,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {complexityLabel}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <p
            className="text-sm font-medium leading-snug line-clamp-2"
            data-testid="issue-title"
            style={{ color: '#FAFAFA' }}
          >
            {issue.title}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs" style={{ color: '#71717A' }}>
              {issue.repo.split('/')[1] ?? issue.repo}
            </span>
            <div className="flex items-center gap-3">
              {issue.author && (
                <div className="flex items-center gap-1" style={{ color: '#71717A' }}>
                  <User className="w-3 h-3" />
                  <span className="text-xs">{issue.author}</span>
                </div>
              )}
              {timeInStage && (
                <div className="flex items-center gap-1" style={{ color: '#71717A' }} data-testid="time-in-stage">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {timeInStage}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
