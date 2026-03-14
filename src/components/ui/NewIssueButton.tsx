'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import QuickCreateModal from '@/components/QuickCreateModal';

export function NewIssueButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-testid="quick-create-trigger"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-90"
        style={{
          background: '#6366F1',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="Create new issue"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">New Issue</span>
      </button>

      {open && (
        <QuickCreateModal
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
