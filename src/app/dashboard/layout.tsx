import AppShell from '@/components/layout/AppShell';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user ? await getUserRole(user.id) : 'viewer';
  const isAdmin = role === 'admin';

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}
