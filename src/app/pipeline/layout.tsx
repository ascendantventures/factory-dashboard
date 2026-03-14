import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import AppShell from '@/components/layout/AppShell';

export default async function PipelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}
