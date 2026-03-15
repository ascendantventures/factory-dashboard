'use client';

import React from 'react';
import { Station, STATION_COLORS, STATION_LABELS } from '@/lib/constants';
import { DashIssue } from '@/types';
import { IssueCard } from './IssueCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Eye, EyeOff, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cardContainerVariants, cardVariants } from '@/lib/motion';
import { EnrichmentMap, formatCost } from '@/lib/enrichment';

interface KanbanColumnProps {
  station: Station;
  issues: DashIssue[];
  draggingIssueIds: Set<number>;
  enrichmentMap: EnrichmentMap;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectIssue?: (issue: DashIssue) => void;
  /** Optional drag handle rendered in the column header (Phase 2) */
  dragHandle?: React.ReactNode;
}

export function KanbanColumn({ station, issues, draggingIssueIds, enrichmentMap, isCollapsed = false, onToggleCollapse, onSelectIssue, dragHandle }: KanbanColumnProps) {
  const color = STATION_COLORS[station];
  const label = STATION_LABELS[station];

  const { setNodeRef, isOver } = useDroppable({ id: `column-${station}`, data: { station } });

  // Calculate column total cost
  const columnTotalCost = issues.reduce((sum, issue) => {
    return sum + (enrichmentMap.get(issue.id)?.total_cost_usd ?? 0);
  }, 0);

  const issueCountText = issues.length === 1 ? '1 issue' : `${issues.length} issues`;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isCollapsed ? (
        <motion.button
          key="pill"
          data-testid="column-pill"
          data-column={station}
          onClick={onToggleCollapse}
          className="flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-colors flex-shrink-0"
          style={{ width: '48px', minWidth: '48px', background: '#18181B', borderColor: color, minHeight: '200px', padding: '12px 8px' }}
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 48 }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          whileHover={{ backgroundColor: `${color}10` }}
          title={`Show ${label} column`}
        >
          <div className="flex flex-col items-center gap-2">
            <Eye className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
            <span className="text-xs font-semibold" style={{ color, writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '10px' }}>
              {label}
            </span>
            <span className="text-xs font-semibold" style={{ color: '#A1A1AA', fontFamily: 'Inter, sans-serif' }}>
              {issues.length}
            </span>
          </div>
        </motion.button>
      ) : (
        <motion.div
          key="expanded"
          data-testid={`kanban-column-station-${station}`}
          data-column={station}
          className="flex flex-col rounded-xl border overflow-hidden transition-colors flex-shrink-0"
          style={{
            background: isOver ? `${color}08` : '#18181B',
            borderColor: isOver ? color : '#27272A',
            minWidth: '200px',
            width: '240px',
          }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        >
          {/* Column header */}
          <div
            data-testid="column-header-full"
            className="px-4 py-3 border-b"
            style={{ borderColor: '#27272A' }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-0 min-w-0">
                {/* Drag handle (injected by DraggableKanbanColumn) */}
                {dragHandle}
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                <span className="text-sm font-semibold truncate ml-2" style={{ fontFamily: 'Inter, sans-serif', color: '#FAFAFA', textTransform: 'capitalize' }}>
                  {label}
                </span>
              </div>
              <button
                data-testid="column-hide-btn"
                onClick={onToggleCollapse}
                className="p-1 rounded transition-colors"
                style={{ color: '#71717A' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = color; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
                title={`Hide ${label} column`}
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Count and cost row */}
            <div className="flex items-center justify-between">
              <span
                data-testid="column-issue-count"
                style={{ fontSize: 12, fontWeight: 500, color: '#71717A', fontFamily: 'Inter, sans-serif' }}
              >
                {issueCountText}
              </span>
              <span
                data-testid="column-cost-total"
                style={{ fontSize: 12, fontWeight: 600, color: '#A1A1AA', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {formatCost(columnTotalCost)}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div
            ref={setNodeRef}
            className="flex-1 p-3 overflow-y-auto kanban-scroll"
            style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '80px' }}
          >
            <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {issues.length === 0 ? (
                <div
                  style={{
                    height: 120,
                    border: '1px dashed #3F3F46',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#52525B',
                    gap: 8,
                  }}
                >
                  <Inbox style={{ width: 24, height: 24 }} strokeWidth={1.5} />
                  <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}>No issues</span>
                </div>
              ) : (
                <motion.div className="space-y-2" variants={cardContainerVariants} initial="initial" animate="animate">
                  {issues.map((issue) => (
                    <motion.div key={issue.id} variants={cardVariants}>
                      <IssueCard
                        issue={issue}
                        enrichment={enrichmentMap.get(issue.id)}
                        isDragDisabled={draggingIssueIds.has(issue.issue_number)}
                        onSelect={onSelectIssue}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </SortableContext>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
