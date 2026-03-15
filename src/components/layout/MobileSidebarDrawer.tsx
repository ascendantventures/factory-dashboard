'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  Factory,
  LayoutDashboard,
  Grid3X3,
  Activity,
  BarChart3,
  Cpu,
  BookOpen,
  Radio,
  Users,
  FileText,
  Settings,
  LogOut,
  FileStack,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/apps', label: 'Apps', icon: Grid3X3, exact: false },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity, exact: false },
  { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart3, exact: false },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, exact: false },
  { href: '/pipeline', label: 'Pipeline', icon: Cpu, exact: false },
  { href: '/dashboard/docs', label: 'API Docs', icon: BookOpen, exact: false },
  { href: '/dashboard/event-log', label: 'Event Log', icon: Radio, exact: false },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/dashboard/admin/audit', label: 'Audit Log', icon: FileText, exact: false },
  { href: '/dashboard/templates', label: 'Templates', icon: FileStack, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
  { href: '/dashboard/settings/profile', label: 'Profile', icon: User, exact: true },
];

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile sidebar drawer — slides in from left.
 * Contains the full nav (mirrors desktop Sidebar).
 * REQ-MOB-007
 */
export default function MobileSidebarDrawer({ isOpen, onClose }: MobileSidebarDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const hamburgerReturnRef = useRef<HTMLElement | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Touch swipe-to-close
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Save element to return focus to on close
      hamburgerReturnRef.current = document.activeElement as HTMLElement;
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else if (hamburgerReturnRef.current) {
      (hamburgerReturnRef.current as HTMLElement).focus();
      hamburgerReturnRef.current = null;
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    onClose();
    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase');
      const supabase = createSupabaseBrowserClient();
      const redirectTo = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
        : '/auth/login';
      await supabase.auth.signOut({ scope: 'global' });
      router.push(redirectTo);
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      <div
        data-testid="drawer-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'fade-in 200ms ease-out',
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        data-testid="mobile-drawer"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchMove={(e) => { touchCurrentX.current = e.touches[0].clientX; }}
        onTouchEnd={() => {
          if (touchStartX.current - touchCurrentX.current > 100) onClose();
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 70,
          width: 'var(--mobile-drawer-width, 280px)',
          maxWidth: '85vw',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'drawer-slide-in 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}
        >
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

          <button
            ref={closeButtonRef}
            aria-label="Close navigation menu"
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 36,
              height: 36,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X style={{ width: 20, height: 20 }} strokeWidth={2} />
          </button>
        </div>

        {/* Nav items */}
        <nav
          aria-label="sidebar"
          style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className="flex items-center gap-3 rounded-lg transition-colors"
                style={{
                  padding: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  fontWeight: 500,
                  background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                  border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  textDecoration: 'none',
                }}
              >
                <Icon
                  style={{ width: 18, height: 18, flexShrink: 0 }}
                  strokeWidth={active ? 2 : 1.5}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Sign out */}
        <div
          style={{
            padding: '12px 8px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            data-testid="mobile-drawer-sign-out"
            className="w-full flex items-center gap-3 rounded-lg transition-colors disabled:opacity-50"
            style={{
              padding: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <LogOut style={{ width: 18, height: 18 }} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
