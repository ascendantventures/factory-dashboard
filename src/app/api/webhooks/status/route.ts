import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    const { data: events, error } = await admin
      .from('dash_webhook_events')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ events: events ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch webhook events' }, { status: 500 });
  }
}
