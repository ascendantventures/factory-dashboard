'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Factory,
  LayoutDashboard,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { useState, useRef } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Board', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart2, exact: false },
  { href: '/dashboard/costs', label: 'Costs', icon: DollarSign, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof import('@/lib/supabase')['createSupabaseBrowserClient']> | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    if (!supabaseRef.current) {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase');
      supabaseRef.current = createSupabaseBrowserClient();
    }
    await supabaseRef.current.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 transition-all duration-200 border-r"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        width: collapsed ? '60px' : '220px',
        minWidth: collapsed ? '60px' : '220px',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--primary)' }}
        >
          <Factory className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span
            className="text-sm font-bold whitespace-nowrap overflow-hidden"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            Factory
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-md p-1 hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? '#3B82F620' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                border: active ? '1px solid #3B82F630' : '1px solid transparent',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
