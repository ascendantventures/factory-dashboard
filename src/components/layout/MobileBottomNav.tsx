'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Grid3X3,
  Activity,
  Play,
  MoreHorizontal,
  BookOpen,
  Radio,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';

const PRIMARY_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/apps', label: 'Apps', icon: Grid3X3, exact: false },
  { href: '/pipeline', label: 'Pipeline', icon: Play, exact: false },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity, exact: false },
];

const OVERFLOW_NAV_ITEMS = [
  { href: '/dashboard/docs', label: 'API Docs', icon: BookOpen, exact: false },
  { href: '/dashboard/admin/events', label: 'Event Log', icon: Radio, exact: false },
  { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart3, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const overflowActive = OVERFLOW_NAV_ITEMS.some(({ href, exact }) => isActive(href, exact));

  return (
    <>
      <nav
        aria-label="mobile navigation"
        data-testid="mobile-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50"
        style={{
          height: '64px',
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-stretch h-full">
          {PRIMARY_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors"
                style={{ color: active ? '#6366F1' : 'var(--text-muted)' }}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            data-testid="mobile-more-btn"
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors"
            style={{ color: overflowActive ? '#6366F1' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Overlay + bottom sheet */}
      {sheetOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-60"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSheetOpen(false)}
          />
          <div
            data-testid="mobile-more-sheet"
            className="md:hidden fixed bottom-0 left-0 right-0 z-61"
            style={{
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0',
              padding: '16px 16px 24px',
              animation: 'sheet-slide-up 200ms ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
                More
              </span>
              <button
                onClick={() => setSheetOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            {OVERFLOW_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  data-testid="mobile-sheet-item"
                  onClick={() => setSheetOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: active ? '#A5B4FC' : 'var(--text-primary)',
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'background 150ms ease',
                  }}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
