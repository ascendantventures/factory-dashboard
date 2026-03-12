import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

function maskValue(value: string | undefined): string | null {
  if (!value) return null;
  if (value.length < 10) return '****';
  return `${value.slice(0, 4)}****...****${value.slice(-3)}`;
}

const TRACKED_KEYS = ['GITHUB_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY', 'VERCEL_TOKEN'];

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: roleData } = await supabase.from('dash_user_roles').select('role').eq('user_id', user.id).single();
  if (roleData?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createSupabaseAdminClient();

  // Get latest rotation per key
  const { data: rotations } = await admin
    .from('dash_key_rotation_log')
    .select('key_name, rotated_at, rotated_by, notes')
    .order('rotated_at', { ascending: false });

  // Group by key_name — latest only
  const latestByKey: Record<string, { rotated_at: string; rotated_by: string | null }> = {};
  for (const r of rotations ?? []) {
    if (!latestByKey[r.key_name]) {
      latestByKey[r.key_name] = { rotated_at: r.rotated_at, rotated_by: r.rotated_by };
    }
  }

  // Get emails for rotated_by user IDs
  const userIds = [...new Set(Object.values(latestByKey).map(r => r.rotated_by).filter(Boolean))];
  const emailById: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: { users: authUsers } } = await admin.auth.admin.listUsers();
    for (const u of authUsers) {
      if (userIds.includes(u.id)) emailById[u.id] = u.email ?? u.id;
    }
  }

  const keys = TRACKED_KEYS.map((key_name) => {
    const value = process.env[key_name];
    const last = latestByKey[key_name];
    return {
      key_name,
      status: value ? 'set' : 'missing',
      masked_preview: maskValue(value),
      last_rotated_at: last?.rotated_at ?? null,
      last_rotated_by: last?.rotated_by ? (emailById[last.rotated_by] ?? last.rotated_by) : null,
    };
  });

  return NextResponse.json({ keys });
}
