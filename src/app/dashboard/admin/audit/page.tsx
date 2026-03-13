import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import { AuditLogTable } from './AuditLogTable';
import type { AuditEntry } from './AuditEntryRow';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  if (role !== 'admin') redirect('/dashboard');

  // Server-side initial data fetch — no client-side flash (AC-001.4)
  const admin = createSupabaseAdminClient();
  const { data: entries, count } = await admin
    .from('audit_log_entries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 49);

  return (
    <div
      style={{
        padding: '24px 32px',
        maxWidth: '1400px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <AuditLogTable
        initialEntries={(entries ?? []) as AuditEntry[]}
        initialTotal={count ?? 0}
      />
    </div>
  );
}
