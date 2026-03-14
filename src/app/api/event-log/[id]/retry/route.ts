import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authenticated session
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  // Fetch the event from harness_events
  const { data: event, error: fetchError } = await admin
    .from('harness_events')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (event.direction !== 'out' || event.status !== 'failed') {
    return NextResponse.json({ error: 'Event is not a failed outgoing webhook' }, { status: 400 });
  }

  // Attempt re-dispatch of the stored payload
  let newStatus: 'delivered' | 'failed' = 'delivered';

  try {
    const destination = event.source;

    if (destination && destination.startsWith('http')) {
      const response = await fetch(destination, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.payload),
        signal: AbortSignal.timeout(10000),
      });
      newStatus = response.ok ? 'delivered' : 'failed';
    } else {
      // Source is not a URL — mark as delivered
      newStatus = 'delivered';
    }
  } catch (err) {
    console.error('Retry dispatch error:', err);
    newStatus = 'failed';
  }

  // Update the event record
  const { error: updateError } = await admin
    .from('harness_events')
    .update({
      status: newStatus,
      retry_count: (event.retry_count ?? 0) + 1,
      last_retried_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('Failed to update event after retry:', updateError);
    return NextResponse.json({ error: 'Failed to update event status' }, { status: 500 });
  }

  if (newStatus === 'failed') {
    return NextResponse.json({ success: false, status: 'failed' }, { status: 200 });
  }

  return NextResponse.json({ success: true, status: 'delivered' });
}
