import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import { UserManagementClient } from './_components/UserManagementClient';

export const dynamic = 'force-dynamic';

export default async function UserManagementPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  // PATTERN 5: allowlist, never !==
  if (!['admin'].includes(role)) redirect('/dashboard');

  return <UserManagementClient currentUserId={user.id} />;
}
