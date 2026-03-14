import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ webhookId: string }> }) {
  const { webhookId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.url !== undefined) {
    try {
      const parsed = new URL(body.url.trim());
      if (parsed.protocol !== 'https:') return NextResponse.json({ error: 'URL must use HTTPS' }, { status: 400 });
      updates.url = body.url.trim();
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }
  if (body.secret !== undefined) updates.secret = body.secret?.trim() || null;
  if (body.enabled !== undefined) updates.enabled = body.enabled;
  if (body.events !== undefined) updates.events = Array.isArray(body.events) ? body.events : [];

  const { data, error } = await supabase
    .from('harness_webhooks')
    .update(updates)
    .eq('webhook_id', webhookId)
    .eq('created_by', user.id)
    .select('webhook_id, name, url, enabled, events, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ webhookId: string }> }) {
  const { webhookId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('harness_webhooks')
    .delete()
    .eq('webhook_id', webhookId)
    .eq('created_by', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
