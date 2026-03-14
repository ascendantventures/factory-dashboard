import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import AppShell from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

async function DashboardShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  let isAdmin = false;
  try {
    const role = await getUserRole(user.id);
    isAdmin = role === 'admin';
  } catch {
    // Default to non-admin if role lookup fails — layout must not crash
    isAdmin = false;
  }

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}

function DashboardLoadingFallback() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="animate-skeleton"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--surface-alt)',
        }}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
