'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Station } from '@/lib/constants';
import type { DashIssue } from '@/types';
import type { EnrichmentMap } from '@/lib/enrichment';
import { KanbanColumn } from './KanbanColumn';

interface DraggableKanbanColumnProps {
  station: Station;
  issues: DashIssue[];
  draggingIssueIds: Set<number>;
  enrichmentMap: EnrichmentMap;
  isHidden: boolean;
  onToggleHidden: () => void;
  onSelectIssue?: (issue: DashIssue) => void;
}

export function DraggableKanbanColumn({
  station,
  issues,
  draggingIssueIds,
  enrichmentMap,
  isHidden,
  onToggleHidden,
  onSelectIssue,
}: DraggableKanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: station,
    data: { type: 'column', station },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} data-kanban-column={station} data-sortable-id={station}>
      <KanbanColumn
        station={station}
        issues={issues}
        draggingIssueIds={draggingIssueIds}
        enrichmentMap={enrichmentMap}
        isCollapsed={isHidden}
        onToggleCollapse={onToggleHidden}
        onSelectIssue={onSelectIssue}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            data-drag-handle
            data-column={station}
            className="drag-handle flex items-center justify-center rounded-md transition-all flex-shrink-0 relative"
            style={{
              width: '24px',
              height: '24px',
              background: 'transparent',
              opacity: 0.6,
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              marginRight: '4px',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = '#27272A';
              btn.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'transparent';
                btn.style.opacity = '0.6';
              }
            }}
          >
            <GripVertical
              className="w-4 h-4"
              style={{ color: isDragging ? '#6366F1' : '#71717A' }}
              strokeWidth={2}
            />
          </button>
        }
      />
    </div>
  );
}
