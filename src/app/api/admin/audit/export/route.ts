import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.id);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get('user_id');
  const category = searchParams.get('category');
  const action = searchParams.get('action');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const emailSearch = searchParams.get('email');

  let query = admin
    .from('audit_log_entries')
    .select('id,created_at,actor_email,action,category,target_type,target_id,details,ip_address')
    .order('created_at', { ascending: false })
    .limit(10000);

  if (userId) query = query.eq('user_id', userId);
  if (category) query = query.eq('category', category);
  if (action) query = query.ilike('action', `%${action}%`);
  if (emailSearch) query = query.ilike('actor_email', `%${emailSearch}%`);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59Z');

  const { data: entries, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = 'id,created_at,actor_email,action,category,target_type,target_id,details,ip_address';
  const rows = (entries ?? []).map((e) => {
    const cols = [
      e.id ?? '',
      e.created_at ?? '',
      escapeCsv(e.actor_email ?? ''),
      escapeCsv(e.action ?? ''),
      escapeCsv(e.category ?? ''),
      escapeCsv(e.target_type ?? ''),
      escapeCsv(e.target_id ?? ''),
      escapeCsv(e.details ? JSON.stringify(e.details) : ''),
      escapeCsv(e.ip_address ?? ''),
    ];
    return cols.join(',');
  });

  const csv = [headers, ...rows].join('\n');
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-log-${today}.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
