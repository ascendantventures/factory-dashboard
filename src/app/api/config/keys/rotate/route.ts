import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: roleData } = await supabase.from('dash_user_roles').select('role').eq('user_id', user.id).single();
  if (roleData?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key_name, notes } = await req.json();
  if (!key_name) return NextResponse.json({ error: 'key_name is required' }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: rotation, error } = await admin
    .from('dash_key_rotation_log')
    .insert({ key_name, rotated_by: user.id, notes: notes || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    logged: true,
    rotation_id: rotation.id,
    message: `Rotation recorded. Update ${key_name} in your deployment environment and redeploy.`,
  });
}
