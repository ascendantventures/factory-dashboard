import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import AppShell from '@/components/layout/AppShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  const userRole = (['admin', 'operator', 'viewer'] as const).find(r => r === role) ?? 'viewer';

  return <AppShell userRole={userRole}>{children}</AppShell>;
}
