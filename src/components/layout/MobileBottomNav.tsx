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

export default function MobileBottomNav({ isAdmin }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true, testId: undefined },
    { href: '/dashboard/apps', label: 'Apps', icon: Grid3X3, exact: false, testId: undefined },
    { href: '/dashboard/activity', label: 'Activity', icon: Activity, exact: false, testId: undefined },
    { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart3, exact: false, testId: undefined },
    ...(isAdmin
      ? [{ href: '/dashboard/admin/users', label: 'Admin', icon: Shield, exact: false, testId: 'bottom-nav-admin' }]
      : []),
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false, testId: 'bottom-nav-settings' },
  ];

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="bottom-nav"
      data-testid="mobile-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50"
      style={{
        height: '64px',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-stretch h-full">
        {navItems.map(({ href, label, icon: Icon, exact, testId }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors"
              style={{ color: active ? '#6366F1' : 'var(--text-muted)' }}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
