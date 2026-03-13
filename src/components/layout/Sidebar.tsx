'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Factory,
  LayoutDashboard,
  Grid3X3,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Cpu,
  BookOpen,
  Radio,
  Users,
  FileText,
  User,
  FileStack,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/apps', label: 'Apps', icon: Grid3X3, exact: false },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity, exact: false },
  { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart3, exact: false },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, exact: false },
  { href: '/pipeline', label: 'Pipeline', icon: Cpu, exact: false },
  { href: '/dashboard/docs', label: 'API Docs', icon: BookOpen, exact: false },
  { href: '/dashboard/admin/events', label: 'Event Log', icon: Radio, exact: false },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/dashboard/admin/audit', label: 'Audit Log', icon: FileText, exact: false },
  { href: '/dashboard/settings?tab=templates', label: 'Templates', icon: FileStack, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
  { href: '/dashboard/settings/profile', label: 'Profile', icon: User, exact: true },
];

const STORAGE_KEY = 'sidebar-collapsed';

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof import('@/lib/supabase')['createSupabaseBrowserClient']> | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setCollapsed(true);
      onCollapsedChange?.(true);
    }
  }, [onCollapsedChange]);

  useEffect(() => {
    async function loadUser() {
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase');
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User';
          setUserInfo({ name, email: user.email ?? '' });
        }
      } catch {
        // silently ignore
      }
    }
    loadUser();
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    onCollapsedChange?.(next);
  }

  async function handleSignOut() {
    setSigningOut(true);
    if (!supabaseRef.current) {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase');
      supabaseRef.current = createSupabaseBrowserClient();
    }
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
      : '/auth/login';
    await supabaseRef.current.auth.signOut({ scope: 'global' });
    router.push(redirectTo);
    router.refresh();
  }

  function isActive(href: string, exact: boolean) {
    if (href.includes('?tab=templates')) {
      return pathname === '/dashboard/settings' && searchParams.get('tab') === 'templates';
    }
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <aside
      aria-label="sidebar-container"
      className="flex flex-col h-screen sticky top-0 transition-all duration-200 border-r"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        width: collapsed ? '56px' : '240px',
        minWidth: collapsed ? '56px' : '240px',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-3 py-4 border-b"
        style={{ borderColor: 'var(--border)', minHeight: '56px' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#6366F1' }}
        >
          <Factory className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span
            className="text-sm font-bold whitespace-nowrap overflow-hidden flex-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Factory
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          className="rounded-md p-1 hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ color: 'var(--text-muted)', marginLeft: collapsed ? 'auto' : undefined }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>

      {/* Nav */}
      <nav aria-label="sidebar" className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
              style={{
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#6366F1' : 'var(--text-secondary)',
                borderLeft: active ? '2px solid #6366F1' : '2px solid transparent',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        {userInfo && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: '#6366F1', color: '#fff' }}
            >
              {getInitials(userInfo.name)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {userInfo.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {userInfo.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? 'Sign Out' : undefined}
          data-testid="sign-out-button"
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
