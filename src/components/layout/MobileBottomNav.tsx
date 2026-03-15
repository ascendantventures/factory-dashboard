'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Grid3X3,
  Activity,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';

interface MobileBottomNavProps {
  isAdmin: boolean;
}

const BASE_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true, testId: undefined },
  { href: '/dashboard/apps', label: 'Apps', icon: Grid3X3, exact: false, testId: undefined },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity, exact: false, testId: undefined },
  { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart3, exact: false, testId: undefined },
];

const ADMIN_ITEM = {
  href: '/dashboard/admin/users',
  label: 'Admin',
  icon: Shield,
  exact: false,
  testId: 'bottom-nav-admin',
};

const SETTINGS_ITEM = {
  href: '/dashboard/settings',
  label: 'Settings',
  icon: Settings,
  exact: false,
  testId: undefined,
};

export default function MobileBottomNav({ isAdmin }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [...BASE_NAV_ITEMS, isAdmin ? ADMIN_ITEM : SETTINGS_ITEM];

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="bottom-nav"
      data-testid="bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom))',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, label, icon: Icon, exact, testId }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors relative"
              style={{ color: active ? '#6366F1' : 'var(--text-muted)' }}
            >
              {/* Active indicator bar */}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '24px',
                    height: '3px',
                    borderRadius: '0 0 2px 2px',
                    background: '#6366F1',
                    animation: 'nav-indicator-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  aria-hidden="true"
                />
              )}
              <Icon
                className="w-5 h-5"
                strokeWidth={active ? 2.5 : 1.5}
                style={active ? { filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))' } : undefined}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
