'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import MobileSidebarDrawer from './MobileSidebarDrawer';
import { MobileFAB } from '@/components/ui/MobileFAB';

interface AppShellProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

export default function AppShell({ children, isAdmin }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--background)' }}
    >
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar onCollapsedChange={setSidebarCollapsed} />
      </div>

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header — visible only below md */}
        <MobileHeader onOpenDrawer={() => setDrawerOpen(true)} />

        {/* Desktop header — hidden on mobile (MobileHeader takes its place) */}
        <div className="hidden md:block">
          <Header />
        </div>

        <main
          className="flex-1 min-w-0 overflow-auto pb-16 md:pb-0"
        >
          {children}
        </main>
      </div>

      {/* Mobile sidebar drawer */}
      <MobileSidebarDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Bottom nav — visible on mobile only */}
      <MobileBottomNav isAdmin={isAdmin} />

      {/* Mobile FAB — single create-issue entry point on mobile */}
      <MobileFAB />
    </div>
  );
}
