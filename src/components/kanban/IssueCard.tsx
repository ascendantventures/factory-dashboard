'use client';

import { Sparkles, Bug, Wrench, Clock, DollarSign, GitBranch, ExternalLink, GripVertical } from 'lucide-react';
import { DashIssue } from '@/types';
import { IssueEnrichment, formatTimeInStage, formatCost, getIssueType } from '@/lib/enrichment';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

interface IssueCardProps {
  issue: DashIssue;
  enrichment?: IssueEnrichment;
  isDragDisabled?: boolean;
  isOverlay?: boolean;
  showStationBadge?: boolean;
  onSelect?: (issue: DashIssue) => void;
}

function IssueTypeIcon({ labels }: { labels: string[] | null }) {
  const type = getIssueType(labels);
  const iconProps = { style: { width: 14, height: 14 }, strokeWidth: 2 };
  if (type === 'feature') return <Sparkles {...iconProps} style={{ ...iconProps.style, color: '#A78BFA' }} />;
  if (type === 'bug') return <Bug {...iconProps} style={{ ...iconProps.style, color: '#F87171' }} />;
  // ClipboardList is not in all lucide versions; fall through to Wrench
  return <Wrench {...iconProps} style={{ ...iconProps.style, color: '#A1A1AA' }} />;
}

function ComplexityBadge({ complexity }: { complexity: string }) {
  const c = complexity.toLowerCase();
  let bg = '#27272A', color = '#A1A1AA', border = '#3F3F46';
  if (c === 'simple') { bg = 'rgba(22,101,52,0.8)'; color = '#22C55E'; border = 'rgba(34,197,94,0.3)'; }
  else if (c === 'medium') { bg = 'rgba(133,77,14,0.8)'; color = '#EAB308'; border = 'rgba(234,179,8,0.3)'; }
  else if (c === 'complex') { bg = 'rgba(153,27,27,0.8)'; color = '#EF4444'; border = 'rgba(239,68,68,0.3)'; }
  // For other values (xs, sm, md, lg, xl from old system), use neutral
  const label = c === 'simple' ? 'Simple' : c === 'medium' ? 'Medium' : c === 'complex' ? 'Complex' : c.toUpperCase();
  return (
    <span
      data-testid="complexity-badge"
      data-complexity={c === 'simple' || c === 'medium' || c === 'complex' ? c : undefined}
      style={{
        background: bg, color, border: `1px solid ${border}`,
        borderRadius: 4, padding: '3px 8px',
        fontSize: 11, fontWeight: 600,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
        display: 'inline-flex', alignItems: 'center',
      }}
    >
      {label}
    </span>
  );
}

export function IssueCard({ issue, enrichment, isDragDisabled = false, isOverlay = false, showStationBadge = false, onSelect }: IssueCardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: issue.id, disabled: isDragDisabled, data: { issue } });

  const dndStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const timeInStage = enrichment?.entered_at
    ? formatTimeInStage(enrichment.entered_at)
    : null;
  const totalCost = enrichment?.total_cost_usd ?? 0;
  const isAgentActive = (enrichment?.active_runs ?? 0) > 0;
  const repoName = issue.repo?.split('/')[1] ?? issue.repo;

  const cardStyle: React.CSSProperties = {
    ...(isOverlay ? { opacity: 0.95 } : dndStyle),
    background: '#18181B',
    borderColor: isOverlay ? '#3B82F6' : '#27272A',
    boxShadow: isOverlay ? '0 10px 15px -3px rgba(0,0,0,0.6)' : '0 1px 2px rgba(0,0,0,0.3)',
    position: 'relative',
  };

  const labels = Array.isArray(issue.labels)
    ? (issue.labels as (string | { name?: string })[]).map(l =>
        typeof l === 'string' ? l : (l?.name ?? '')
      )
    : null;

  return (
    <motion.div
      ref={isOverlay ? undefined : setNodeRef}
      style={cardStyle}
      data-testid="kanban-card"
      className="rounded-xl border transition-colors"
      whileHover={isOverlay ? {} : {
        borderColor: 'rgba(99,102,241,0.3)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.15)',
        y: -2,
      }}
      whileTap={isOverlay ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Agent activity dot */}
      {isAgentActive && (
        <div
          data-testid="agent-activity-dot"
          className="motion-safe:animate-agent-pulse"
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 10, height: 10, borderRadius: '50%',
            background: '#22C55E',
            boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
          }}
          aria-label="Agent actively running"
        />
      )}

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
        <div
          className="flex-1 p-3 space-y-2 cursor-pointer"
          onClick={() => !isDragging && onSelect?.(issue)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect?.(issue)}
          aria-label={`View details for ${issue.title}`}
        >
          {/* Header row: icon + title + complexity badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-6">
              <span data-testid="issue-type-icon" className="flex-shrink-0">
                <IssueTypeIcon labels={labels} />
              </span>
              <p
                className="text-sm font-semibold leading-snug line-clamp-2"
                data-testid="issue-title"
                style={{ color: '#FAFAFA' }}
              >
                {issue.title}
              </p>
            </div>
            {issue.complexity && (
              <div className="flex-shrink-0">
                <ComplexityBadge complexity={issue.complexity} />
              </div>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* App context badge */}
            <span
              data-testid="app-context-badge"
              className="inline-flex items-center gap-1"
              style={{
                padding: '2px 8px',
                background: '#27272A',
                border: '1px solid #3F3F46',
                borderRadius: 4,
                fontSize: 11, fontWeight: 500,
                color: '#A1A1AA',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <GitBranch style={{ width: 10, height: 10 }} strokeWidth={2} />
              {repoName}
            </span>

            {/* Time in stage */}
            {timeInStage && (
              <span
                data-testid="time-in-stage"
                className="inline-flex items-center gap-1"
                style={{ fontSize: 12, fontWeight: 500, color: '#71717A', fontFamily: 'JetBrains Mono, monospace' }}
              >
                <Clock style={{ width: 12, height: 12 }} strokeWidth={2} />
                {timeInStage}
              </span>
            )}

            {/* Cost tracker */}
            <span
              data-testid="cost-tracker"
              className="inline-flex items-center gap-1"
              style={{ fontSize: 12, fontWeight: 600, color: '#A1A1AA', fontFamily: 'JetBrains Mono, monospace' }}
            >
              <DollarSign style={{ width: 12, height: 12, color: '#71717A' }} strokeWidth={2} />
              {formatCost(totalCost).replace('$', '')}
            </span>
          </div>

          {/* Issue number + external link row */}
          <div className="flex items-center justify-between">
            <span
              data-testid="issue-number"
              style={{ fontSize: 11, color: '#6366F1', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
            >
              #{issue.issue_number}
            </span>
            {issue.github_issue_url && (
              <a
                href={issue.github_issue_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#71717A', display: 'inline-flex', alignItems: 'center' }}
                title="Open in GitHub"
              >
                <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
