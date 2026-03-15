'use client';

import { Menu, Factory } from 'lucide-react';

interface MobileHeaderProps {
  onOpenDrawer: () => void;
}

/**
 * Mobile-only sticky header with hamburger menu + logo.
 * Visible only at < md (hidden md:hidden — desktop uses full Header).
 * REQ-MOB-007
 */
export default function MobileHeader({ onOpenDrawer }: MobileHeaderProps) {
  return (
    <header
      className="md:hidden sticky top-0 z-50 flex items-center justify-between border-b"
      style={{
        height: 'var(--mobile-header-height, 56px)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 16,
        paddingRight: 16,
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation menu"
          onClick={onOpenDrawer}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 40,
            height: 40,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <Menu style={{ width: 20, height: 20 }} strokeWidth={2} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: 'var(--primary)' }}
          >
            <Factory style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Factory
          </span>
        </div>
      </div>

      {/* Right: reserved for future actions */}
      <div />
    </header>
  );
}
