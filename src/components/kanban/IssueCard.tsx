'use client';

import { useState } from 'react';
import { Sparkles, Bug, Wrench, Clock, DollarSign, GitBranch, ExternalLink, GripVertical } from 'lucide-react';
import { DashIssue } from '@/types';
import { IssueEnrichment, formatTimeInStage, formatCost, getIssueType } from '@/lib/enrichment';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { LogViewer } from '@/components/agents/LogViewer';

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

const COMPLEXITY_ABBREV: Record<string, string> = {
  simple: 'S',
  medium: 'M',
  complex: 'C',
  completed: 'Done',
  in_progress: 'Active',
};

function ComplexityBadge({ complexity }: { complexity: string }) {
  const c = complexity.toLowerCase();
  let bg = '#27272A', color = '#A1A1AA', border = '#3F3F46';
  if (c === 'simple') { bg = 'rgba(22,101,52,0.8)'; color = '#22C55E'; border = 'rgba(34,197,94,0.3)'; }
  else if (c === 'medium') { bg = 'rgba(133,77,14,0.8)'; color = '#EAB308'; border = 'rgba(234,179,8,0.3)'; }
  else if (c === 'complex') { bg = 'rgba(153,27,27,0.8)'; color = '#EF4444'; border = 'rgba(239,68,68,0.3)'; }
  const abbrev = COMPLEXITY_ABBREV[c] ?? c.toUpperCase();
  return (
    <span
      data-testid="status-badge"
      data-complexity={c === 'simple' || c === 'medium' || c === 'complex' ? c : undefined}
      title={complexity}
      style={{
        background: bg, color, border: `1px solid ${border}`,
        borderRadius: 4, padding: '3px 8px',
        fontSize: 11, fontWeight: 600,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
        display: 'inline-flex', alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {abbrev}
    </span>
  );
}

interface ActiveRun {
  id: string;
  station: string | null;
  model: string | null;
  pid: number | null;
  started_at: string | null;
  estimated_cost_usd: number | null;
  run_status: string;
}

export function IssueCard({ issue, enrichment, isDragDisabled = false, isOverlay = false, showStationBadge = false, onSelect }: IssueCardProps) {
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
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
      data-issue-number={issue.issue_number}
      className="rounded-xl border transition-colors"
      whileHover={isOverlay ? {} : {
        borderColor: 'rgba(99,102,241,0.3)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.15)',
        y: -2,
      }}
      whileTap={isOverlay ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Agent activity dot — clickable to open log viewer */}
      {isAgentActive && (
        <button
          data-testid="agent-activity-dot"
          onClick={async (e) => {
            e.stopPropagation();
            if (showLogViewer) {
              setShowLogViewer(false);
              return;
            }
            // Fetch active run for this issue
            try {
              const res = await fetch(`/api/agents/active`);
              if (res.ok) {
                const data = await res.json() as { runs: ActiveRun[] };
                const run = data.runs.find(r => r.run_status === 'running');
                if (run) {
                  setActiveRun(run);
                  setShowLogViewer(true);
                }
              }
            } catch {
              // If fetch fails, still toggle
              setShowLogViewer(true);
            }
          }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 20, height: 20,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
          aria-label="View agent logs"
          title="View agent logs"
        >
          <div style={{ position: 'relative', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                position: 'absolute',
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid rgba(229, 168, 48, 0.3)',
                animation: 'pulse-ring 1.5s ease-out infinite',
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#E5A830',
              }}
            />
          </div>
        </button>
      )}

      <div className="flex items-stretch">
        {/* Drag handle */}
        <div
          {...(isOverlay ? {} : { ...attributes, ...listeners })}
          data-testid="drag-handle"
          className="flex items-center justify-center px-2 rounded-l-xl transition-all hover:bg-[#27272A] group"
          style={{
            color: '#A1A1AA',
            cursor: isDragDisabled ? 'not-allowed' : 'grab',
            opacity: isDragDisabled ? 0.3 : 0.6,
            pointerEvents: isDragDisabled ? 'none' : 'auto',
            borderRight: '1px solid #27272A',
            minWidth: '28px',
          }}
        >
          <GripVertical className="w-3.5 h-3.5 transition-opacity group-hover:opacity-100" />
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
                data-testid="card-title"
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

            {/* Cost tracker — only show when cost > 0 */}
            {totalCost > 0 && (
              <span
                data-testid="card-cost"
                className="inline-flex items-center gap-1"
                style={{ fontSize: 12, fontWeight: 600, color: '#A1A1AA', fontFamily: 'JetBrains Mono, monospace' }}
              >
                <DollarSign style={{ width: 12, height: 12, color: '#71717A' }} strokeWidth={2} />
                {formatCost(totalCost).replace('$', '')}
              </span>
            )}
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

      {/* Log viewer panel — shown below card when agent dot is clicked */}
      <AnimatePresence>
        {showLogViewer && activeRun && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden', marginTop: 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <LogViewer
              run={activeRun}
              onClose={() => setShowLogViewer(false)}
              mode="embedded"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
