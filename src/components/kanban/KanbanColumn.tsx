'use client';

import { Station, STATION_COLORS, STATION_LABELS } from '@/lib/constants';
import { DashIssue } from '@/types';
import { IssueCard } from './IssueCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Inbox } from 'lucide-react';

interface KanbanColumnProps {
  station: Station;
  issues: DashIssue[];
  draggingIssueIds: Set<number>;
}

export function KanbanColumn({ station, issues, draggingIssueIds }: KanbanColumnProps) {
  const color = STATION_COLORS[station];
  const label = STATION_LABELS[station];

  const { setNodeRef, isOver } = useDroppable({ id: `column-${station}`, data: { station } });

  return (
    <div
      data-testid={`column-${station}`}
      className="flex flex-col rounded-xl border overflow-hidden transition-all"
      style={{
        background: isOver ? `${color}08` : 'var(--surface)',
        borderColor: isOver ? color : 'var(--border)',
        minWidth: '280px',
        width: '280px',
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: '#262626', color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}
        >
          {issues.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-2 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 160px)', minHeight: '80px' }}
      >
        <SortableContext
          items={issues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 text-sm rounded-lg border border-dashed gap-2"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
            >
              <Inbox className="w-8 h-8" style={{ color: '#71717A' }} />
              <span>No issues in {label.toLowerCase()}</span>
            </div>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                isDragDisabled={draggingIssueIds.has(issue.issue_number)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
