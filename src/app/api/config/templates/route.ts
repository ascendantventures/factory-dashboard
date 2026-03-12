import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false, supabase };
  const { data: roleData } = await supabase.from('dash_user_roles').select('role').eq('user_id', user.id).single();
  return { user, isAdmin: roleData?.role === 'admin', supabase };
}

export async function GET() {
  const { user, supabase } = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: templates, error } = await supabase
    .from('dash_templates')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const { user, isAdmin } = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { template_slug, template_name, description, source_repo, deploy_target, project_type, is_default } = body;

  if (!template_slug || !template_name || !source_repo || !deploy_target || !project_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Check slug uniqueness
  const { data: existing } = await admin.from('dash_templates').select('template_id').eq('template_slug', template_slug).single();
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });

  // If setting as default, unset previous default for same project_type
  if (is_default) {
    await admin.from('dash_templates').update({ is_default: false }).eq('project_type', project_type).eq('is_default', true);
  }

  const { data: template, error } = await admin.from('dash_templates').insert({
    template_slug,
    template_name,
    description: description || null,
    source_repo,
    deploy_target,
    project_type,
    is_default: !!is_default,
    created_by: user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template }, { status: 201 });
}
