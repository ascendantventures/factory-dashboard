'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import QuickCreateModal from '@/components/QuickCreateModal';

/**
 * Mobile Floating Action Button — single create-issue entry point on mobile.
 * Hidden on sm: and above (desktop uses header NewIssueButton).
 * REQ-MOB-003
 */
export function MobileFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Create issue"
        data-testid="mobile-fab"
        onClick={() => setOpen(true)}
        className="mobile-fab sm:hidden fixed z-40 flex items-center justify-center"
        style={{
          bottom: 'calc(max(80px, env(safe-area-inset-bottom, 0px) + 80px))',
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.15)',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.background = 'var(--primary-hover)';
          btn.style.transform = 'scale(1.05)';
          btn.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.45), 0 0 0 1px rgba(99, 102, 241, 0.2)';
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.background = 'var(--primary)';
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.15)';
        }}
      >
        <Plus style={{ width: 24, height: 24 }} strokeWidth={2.5} />
      </button>

      {open && <QuickCreateModal onClose={() => setOpen(false)} />}
    </>
  );
}
