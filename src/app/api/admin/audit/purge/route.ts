import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc('purge_old_audit_entries');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deletedCount = data as number;

  // AC-003.4: Log purge action to audit_log_entries
  await logAction({
    actorEmail: 'system@cron',
    action: 'purge_audit_log',
    category: 'settings',
    details: { deleted_count: deletedCount },
  });

  return NextResponse.json({ deleted: deletedCount });
}
