'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Grid3X3,
  Activity,
  BarChart3,
  Shield,
} from 'lucide-react';

interface MobileBottomNavProps {
  userRole?: 'admin' | 'operator' | 'viewer';
}

export default function MobileBottomNav({ userRole }: MobileBottomNavProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin';

  const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true, testId: undefined },
    { href: '/dashboard/apps', label: 'Apps', icon: Grid3X3, exact: false, testId: undefined },
    { href: '/dashboard/activity', label: 'Activity', icon: Activity, exact: false, testId: undefined },
    { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart3, exact: false, testId: undefined },
    ...(isAdmin ? [{ href: '/dashboard/admin/users', label: 'Admin', icon: Shield, exact: false, testId: 'bottom-nav-admin' }] : []),
  ];

  function isActive(href: string, exact: boolean) {
    if (href === '/dashboard/admin/users') return pathname.startsWith('/dashboard/admin');
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50"
      style={{
        height: '64px',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-stretch h-full">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact, testId }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors"
              style={{ color: active ? '#6366F1' : 'var(--text-muted)' }}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
