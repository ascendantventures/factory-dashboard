import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import { AuditLogClient } from './AuditLogClient';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  if (!['admin'].includes(role)) redirect('/dashboard');

  return <AuditLogClient />;
}
