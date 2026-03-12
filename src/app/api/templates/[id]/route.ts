import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { FdIssueTemplate } from '@/types';

async function getAdminUser(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleData } = await supabase
    .from('dash_user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return roleData?.role === 'admin' ? user : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminUser = await getAdminUser(supabase);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json() as Partial<FdIssueTemplate>;
    const { name, description, title_prefix, body_template, labels, estimated_cost, complexity } = body;

    const updates: Partial<FdIssueTemplate> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (title_prefix !== undefined) updates.title_prefix = title_prefix.trim();
    if (body_template !== undefined) updates.body_template = body_template.trim();
    if (labels !== undefined) updates.labels = labels;
    if (estimated_cost !== undefined) updates.estimated_cost = estimated_cost.trim();
    if (complexity !== undefined) updates.complexity = complexity;

    const { data, error } = await supabase
      .from('fd_issue_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    console.error('[PATCH /api/templates/[id]]', err);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminUser = await getAdminUser(supabase);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { id } = await params;

    // Check if template exists and is a system default
    const { data: template } = await supabase
      .from('fd_issue_templates')
      .select('id, is_default')
      .eq('id', id)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.is_default) {
      return NextResponse.json(
        { error: 'System templates cannot be deleted.' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('fd_issue_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[DELETE /api/templates/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
