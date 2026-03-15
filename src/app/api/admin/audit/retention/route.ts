import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const role = await getUserRole(user.id);
  if (role !== 'admin') return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

export async function GET() {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const admin = createSupabaseAdminClient();
  const { data, error: dbError } = await admin
    .from('fd_audit_retention_config')
    .select('id, retention_days, updated_at, updated_by')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Resolve updated_by email if present
  let updated_by_email: string | undefined;
  if (data.updated_by) {
    const { data: userData } = await admin.auth.admin.getUserById(data.updated_by);
    updated_by_email = userData?.user?.email;
  }

  return NextResponse.json({
    id: data.id,
    retention_days: data.retention_days,
    updated_at: data.updated_at,
    updated_by: data.updated_by,
    updated_by_email,
  });
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  let body: { retention_days?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { retention_days } = body;
  if (typeof retention_days !== 'number' || !Number.isInteger(retention_days) || retention_days < 7) {
    return NextResponse.json({ error: 'retention_days must be an integer >= 7' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Get existing row id
  const { data: existing } = await admin
    .from('fd_audit_retention_config')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Retention config not found' }, { status: 404 });
  }

  const { data, error: dbError } = await admin
    .from('fd_audit_retention_config')
    .update({
      retention_days,
      updated_at: new Date().toISOString(),
      updated_by: user!.id,
    })
    .eq('id', existing.id)
    .select('id, retention_days, updated_at, updated_by')
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    retention_days: data.retention_days,
    updated_at: data.updated_at,
    updated_by: data.updated_by,
    updated_by_email: user!.email,
  });
}
