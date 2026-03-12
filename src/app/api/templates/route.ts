import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { FdIssueTemplate } from '@/types';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('fd_issue_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ templates: data ?? [] });
  } catch (err) {
    console.error('[GET /api/templates]', err);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check via dash_user_roles
    const { data: roleData } = await supabase
      .from('dash_user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await request.json() as Partial<FdIssueTemplate>;
    const { name, description, title_prefix, body_template, labels, estimated_cost, complexity } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!body_template?.trim()) {
      return NextResponse.json({ error: 'body_template is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('fd_issue_templates')
      .insert({
        name: name.trim(),
        description: description?.trim() ?? '',
        title_prefix: title_prefix?.trim() ?? '',
        body_template: body_template.trim(),
        labels: labels ?? [],
        estimated_cost: estimated_cost?.trim() ?? '',
        complexity: complexity ?? 'medium',
        is_default: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[POST /api/templates]', err);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
