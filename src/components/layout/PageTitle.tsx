'use client';

import { usePathname } from 'next/navigation';

const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/apps': 'Apps',
  '/dashboard/activity': 'Activity',
  '/dashboard/metrics': 'Metrics',
  '/dashboard/costs': 'Costs',
  '/dashboard/settings': 'Settings',
};

export default function PageTitle() {
  const pathname = usePathname();

  let title = 'Dashboard';

  if (pathname.startsWith('/dashboard/issues/')) {
    title = 'Issue Detail';
  } else {
    title = PATH_TITLES[pathname] ?? 'Dashboard';
  }

  return (
    <h1
      className="text-base font-semibold truncate"
      style={{ color: 'var(--text-primary)' }}
    >
      {title}
    </h1>
  );
}
