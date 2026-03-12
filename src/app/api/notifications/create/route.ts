import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { isInQuietHours, NotificationType, NOTIFICATION_TYPES } from '@/lib/notification-types';

export async function POST(req: NextRequest) {
  // Auth: x-factory-secret header required
  const secret = req.headers.get('x-factory-secret');
  if (!secret || secret !== process.env.FACTORY_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { user_id, type, title, body: notifBody = '', link = '' } = body;

  if (!user_id || !type || !title) {
    return NextResponse.json({ error: 'Missing required fields: user_id, type, title' }, { status: 400 });
  }

  if (!NOTIFICATION_TYPES.includes(type as NotificationType)) {
    return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Check user preferences
  const { data: prefs } = await admin
    .from('fd_notification_preferences')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (prefs) {
    // Check if this notification type is enabled
    const typeEnabled = prefs[type as keyof typeof prefs];
    if (typeEnabled === false) {
      return NextResponse.json({ skipped: true, reason: 'type_disabled' });
    }

    // Check quiet hours
    if (isInQuietHours(prefs.quiet_hours_enabled, prefs.quiet_hours_start, prefs.quiet_hours_end)) {
      return NextResponse.json({ skipped: true, reason: 'quiet_hours' });
    }
  }

  const { data, error } = await admin
    .from('fd_notifications')
    .insert({ user_id, type, title, body: notifBody, link })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
