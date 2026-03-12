'use client';

import { Station, STATION_COLORS, STATION_LABELS } from '@/lib/constants';
import { DashIssue } from '@/types';
import { IssueCard } from './IssueCard';
import { AnimatedCounter } from './AnimatedCounter';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cardContainerVariants, cardVariants } from '@/lib/motion';

interface KanbanColumnProps {
  station: Station;
  issues: DashIssue[];
  draggingIssueIds: Set<number>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function KanbanColumn({ station, issues, draggingIssueIds, isCollapsed = false, onToggleCollapse }: KanbanColumnProps) {
  const color = STATION_COLORS[station];
  const label = STATION_LABELS[station];

  const { setNodeRef, isOver } = useDroppable({ id: `column-${station}`, data: { station } });

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isCollapsed ? (
        // Collapsed pill
        <motion.button
          key="pill"
          data-testid="column-pill"
          data-column={station}
          onClick={onToggleCollapse}
          className="flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-colors flex-shrink-0"
          style={{
            width: '48px',
            minWidth: '48px',
            background: '#18181B',
            borderColor: color,
            minHeight: '200px',
            padding: '12px 8px',
          }}
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 48 }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          whileHover={{ backgroundColor: `${color}10` }}
          title={`Show ${label} column`}
        >
          <div className="flex flex-col items-center gap-2">
            <Eye className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
            <span
              className="text-xs font-semibold"
              style={{
                color,
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontSize: '10px',
              }}
            >
              {label}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: '#A1A1AA', fontFamily: 'Inter, sans-serif' }}
            >
              {issues.length}
            </span>
          </div>
        </motion.button>
      ) : (
        // Expanded column
        <motion.div
          key="expanded"
          data-testid="kanban-column"
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
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: '#27272A' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span
                className="text-sm font-semibold truncate"
                style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#FAFAFA' }}
              >
                {label}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <AnimatedCounter count={issues.length} color={color} />
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
          </div>

          {/* Cards */}
          <div
            ref={setNodeRef}
            className="flex-1 p-3 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 180px)', minHeight: '80px' }}
          >
            <SortableContext
              items={issues.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {issues.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-8 text-sm rounded-lg border border-dashed gap-2"
                  style={{ color: '#71717A', borderColor: '#27272A' }}
                >
                  <span>Empty</span>
                </div>
              ) : (
                <motion.div
                  className="space-y-2"
                  variants={cardContainerVariants}
                  initial="initial"
                  animate="animate"
                >
                  {issues.map((issue) => (
                    <motion.div key={issue.id} variants={cardVariants}>
                      <IssueCard
                        issue={issue}
                        isDragDisabled={draggingIssueIds.has(issue.issue_number)}
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
