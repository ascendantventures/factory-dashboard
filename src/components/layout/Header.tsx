'use client';

import PageTitle from './PageTitle';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { NewIssueButton } from '@/components/ui/NewIssueButton';

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center px-4 gap-4 border-b"
      style={{
        height: '56px',
        background: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Left: Page title */}
      <div className="flex-1 min-w-0">
        <PageTitle />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <GlobalSearch />
        <SyncStatus />
        <NotificationBell />
        <NewIssueButton />
      </div>
    </header>
  );
}
