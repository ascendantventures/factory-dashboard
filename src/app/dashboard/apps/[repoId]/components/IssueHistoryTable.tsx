'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, FileSearch, Inbox } from 'lucide-react';
import StationBadge from './StationBadge';
import ComplexityBadge from './ComplexityBadge';
import type { IssueFilters } from './IssueFilterBar';

export interface IssueRow {
  id: string;
  github_issue_url: string;
  issue_number: number;
  title: string;
  station: string | null;
  complexity: string | null;
  cost_usd: number;
  created_at: string;
  updated_at: string;
}

type SortKey = 'date' | 'cost' | 'stage' | 'complexity';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffDays > 30) return new Date(dateStr).toLocaleDateString();
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'today';
}

function SortIcon({ col, activeSort, activeOrder }: { col: SortKey; activeSort: SortKey; activeOrder: 'asc' | 'desc' }) {
  if (col !== activeSort) return <ArrowUpDown size={12} style={{ color: '#7A7672' }} />;
  if (activeOrder === 'asc') return <ArrowUp size={12} style={{ color: '#D4A012' }} />;
  return <ArrowDown size={12} style={{ color: '#D4A012' }} />;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div
            style={{
              height: '16px',
              borderRadius: '4px',
              background: '#252321',
              animation: 'skeleton 1.5s ease-in-out infinite',
              width: i === 1 ? '80%' : '60%',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

interface Props {
  repoId: string;
  filters: IssueFilters;
  onOpenCreateModal: () => void;
  refreshKey: number;
}

export default function IssueHistoryTable({ repoId, filters, onOpenCreateModal, refreshKey }: Props) {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const fetchIssues = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, order });
    if (filters.station) params.set('station', filters.station);
    if (filters.complexity) params.set('complexity', filters.complexity);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);

    fetch(`/api/apps/${repoId}/issues?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setIssues(d.issues ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoId, filters, sort, order]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues, refreshKey]);

  function handleSortClick(col: SortKey) {
    if (col === sort) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(col);
      setOrder('desc');
    }
  }

  const thStyle: React.CSSProperties = {
    background: '#252321',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: '#7A7672',
    textAlign: 'left',
    borderBottom: '1px solid #3D3937',
    fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  };

  const hasFilters = filters.station || filters.complexity || filters.from || filters.to;

  return (
    <div
      data-testid="issue-history-table"
      style={{
        border: '1px solid #3D3937',
        borderRadius: '8px',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr>
              <th
                style={{ ...thStyle, width: '80px' }}
                onClick={() => handleSortClick('date')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Issue #
                </span>
              </th>
              <th style={{ ...thStyle, cursor: 'default' }}>Title</th>
              <th
                style={{ ...thStyle, width: '120px' }}
                onClick={() => handleSortClick('stage')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Station
                  <SortIcon col="stage" activeSort={sort} activeOrder={order} />
                </span>
              </th>
              <th
                style={{ ...thStyle, width: '120px' }}
                onClick={() => handleSortClick('complexity')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Complexity
                  <SortIcon col="complexity" activeSort={sort} activeOrder={order} />
                </span>
              </th>
              <th
                style={{ ...thStyle, width: '100px' }}
                onClick={() => handleSortClick('cost')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Cost
                  <SortIcon col="cost" activeSort={sort} activeOrder={order} />
                </span>
              </th>
              <th
                style={{ ...thStyle, width: '140px' }}
                onClick={() => handleSortClick('date')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Date
                  <SortIcon col="date" activeSort={sort} activeOrder={order} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading &&
              issues.map((issue) => (
                <tr
                  key={issue.id}
                  data-testid="issue-row"
                  onClick={() => window.open(issue.github_issue_url, '_blank', 'noopener,noreferrer')}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid #3D3937',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = '#252321';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: '13px',
                      color: '#D4A012',
                    }}
                  >
                    #{issue.issue_number}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#F5F3F0',
                      maxWidth: '0',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={issue.title}
                    >
                      {issue.title}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StationBadge station={issue.station} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <ComplexityBadge complexity={issue.complexity} />
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#F5F3F0',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    ${issue.cost_usd.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: '13px',
                      color: '#7A7672',
                    }}
                    title={new Date(issue.created_at).toLocaleString()}
                  >
                    {formatRelativeTime(issue.created_at)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Empty states */}
      {!loading && issues.length === 0 && (
        <div
          data-testid={hasFilters ? 'issue-history-empty-state' : 'issue-history-zero-state'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '64px 24px',
            gap: '12px',
          }}
        >
          {hasFilters ? (
            <>
              <FileSearch size={48} style={{ color: '#7A7672' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#F5F3F0' }}>
                No issues found
              </div>
              <div style={{ fontSize: '14px', color: '#7A7672', textAlign: 'center', maxWidth: '360px' }}>
                No issues match your current filters. Try adjusting your search criteria.
              </div>
            </>
          ) : (
            <>
              <Inbox size={48} style={{ color: '#7A7672' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#F5F3F0' }}>
                No issues yet
              </div>
              <div style={{ fontSize: '14px', color: '#7A7672', textAlign: 'center', maxWidth: '360px' }}>
                This app hasn&apos;t processed any issues yet. Create your first issue to get started.
              </div>
              <button
                onClick={onOpenCreateModal}
                style={{
                  marginTop: '8px',
                  background: '#D4A012',
                  color: '#0F0E0D',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
                }}
              >
                Create first issue
              </button>
            </>
          )}
        </div>
      )}

      {/* Row count */}
      {!loading && total > 0 && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #3D3937',
            fontSize: '12px',
            color: '#7A7672',
            background: '#252321',
          }}
        >
          {total} issue{total !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
