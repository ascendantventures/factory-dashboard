import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Sidebar — hidden on mobile */}
      <div className="hidden sm:block">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 overflow-auto pb-16 sm:pb-0">
        {children}
      </main>
      {/* Bottom nav — visible on mobile only */}
      <BottomNav />
    </div>
  );
}
