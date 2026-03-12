'use client';

import { useState } from 'react';
import IssueFilterBar, { type IssueFilters } from './IssueFilterBar';
import IssueHistoryTable from './IssueHistoryTable';

interface Props {
  repoId: string;
  onOpenCreateModal: () => void;
  refreshKey: number;
}

export default function IssueHistoryTab({ repoId, onOpenCreateModal, refreshKey }: Props) {
  const [filters, setFilters] = useState<IssueFilters>({
    station: '',
    complexity: '',
    from: '',
    to: '',
  });

  return (
    <div>
      <IssueFilterBar filters={filters} onChange={setFilters} />
      <IssueHistoryTable
        repoId={repoId}
        filters={filters}
        onOpenCreateModal={onOpenCreateModal}
        refreshKey={refreshKey}
      />
    </div>
  );
}
