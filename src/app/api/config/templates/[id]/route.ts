import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: roleData } = await supabase.from('dash_user_roles').select('role').eq('user_id', user.id).single();
  return { user, isAdmin: roleData?.role === 'admin' };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, isAdmin } = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const admin = createSupabaseAdminClient();

  // If setting as default, get the template first to know its project_type
  if (body.is_default === true) {
    const { data: current } = await admin.from('dash_templates').select('project_type').eq('template_id', id).single();
    if (current) {
      await admin.from('dash_templates').update({ is_default: false }).eq('project_type', current.project_type).eq('is_default', true).neq('template_id', id);
    }
  }

  const { data: template, error } = await admin
    .from('dash_templates')
    .update(body)
    .eq('template_id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ template });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, isAdmin } = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  // Check if it's the only default for its project type
  const { data: tmpl } = await admin.from('dash_templates').select('project_type, is_default').eq('template_id', id).single();
  if (tmpl?.is_default) {
    const { count } = await admin.from('dash_templates').select('template_id', { count: 'exact', head: true }).eq('project_type', tmpl.project_type).eq('is_default', true);
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Cannot delete the only default template for this project type' }, { status: 400 });
    }
  }

  const { error } = await admin.from('dash_templates').delete().eq('template_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
