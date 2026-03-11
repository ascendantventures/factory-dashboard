'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart2, DollarSign, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Board', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart2, exact: false },
  { href: '/dashboard/costs', label: 'Costs', icon: DollarSign, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav
      className="block sm:hidden fixed bottom-0 left-0 right-0 border-t z-50"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 py-3 gap-1 text-xs font-medium transition-colors"
              style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}
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
