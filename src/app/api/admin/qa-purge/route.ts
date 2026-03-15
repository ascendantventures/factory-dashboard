import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

const DEFAULT_PATTERNS = ['qa_', 'qa-', 'testuser+', 'qa_login_', 'qa_state_', 'qa_dbg_'];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const purgeSecret = process.env.QA_PURGE_SECRET;
  const headerSecret = request.headers.get('x-qa-purge-secret');

  const adminClient = createSupabaseAdminClient();

  let triggeredBy = '';

  // Auth: either valid purge secret OR admin session
  if (purgeSecret && headerSecret === purgeSecret) {
    triggeredBy = 'ci';
  } else {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = await getUserRole(user.id);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    triggeredBy = `admin:${user.id}`;
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body.dry_run === true;
  const patterns: string[] = Array.isArray(body.patterns) ? body.patterns : DEFAULT_PATTERNS;

  // Fetch all users
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const allUsers = usersData?.users ?? [];
  const now = Date.now();

  const toDelete: { id: string; email: string }[] = [];
  const skipped: string[] = [];

  for (const user of allUsers) {
    const email = user.email ?? '';
    const matchesPattern = patterns.some(p => email.toLowerCase().includes(p.toLowerCase()));
    if (!matchesPattern) continue;

    // Safety guard: skip accounts older than 30 days
    const createdAt = new Date(user.created_at).getTime();
    if (now - createdAt > THIRTY_DAYS_MS) {
      skipped.push(email);
      continue;
    }

    toDelete.push({ id: user.id, email });
  }

  const deletedEmails: string[] = [];
  let errorMessage: string | undefined;

  if (!dryRun) {
    for (const u of toDelete) {
      try {
        await adminClient.auth.admin.deleteUser(u.id);
        deletedEmails.push(u.email);
      } catch (e) {
        errorMessage = e instanceof Error ? e.message : 'Unknown error';
      }
    }
  } else {
    // Dry run — just report what would be deleted
    deletedEmails.push(...toDelete.map(u => u.email));
  }

  // Log the purge run
  await adminClient.from('users_page_purge_log').insert({
    triggered_by: triggeredBy,
    accounts_deleted: dryRun ? 0 : deletedEmails.length,
    accounts_skipped: skipped.length,
    deleted_emails: dryRun ? [] : deletedEmails,
    error_message: errorMessage ?? null,
  });

  return NextResponse.json({
    deleted: dryRun ? 0 : deletedEmails.length,
    skipped: skipped.length,
    emails: deletedEmails,
    dry_run: dryRun,
    log_id: null,
  });
}
