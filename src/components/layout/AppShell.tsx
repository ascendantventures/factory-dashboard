'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';

interface AppShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function AppShell({ children, isAdmin = false }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--background)' }}
    >
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar onCollapsedChange={setSidebarCollapsed} />
      </div>

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main
          className="flex-1 min-w-0 overflow-auto pb-16 md:pb-0"
        >
          {children}
        </main>
      </div>

      {/* Bottom nav — visible on mobile only */}
      <MobileBottomNav isAdmin={isAdmin} />
    </div>
  );
}
