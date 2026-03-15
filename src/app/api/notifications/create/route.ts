import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  VALID_NOTIFICATION_TYPES,
  DEFAULT_PREFERENCES,
  isInQuietHours,
  isTypeEnabled,
  type NotificationType,
} from '@/lib/notification-types';
import { deliverNotification } from '@/lib/notification-delivery';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Auth: x-factory-secret header
  const secret = request.headers.get('x-factory-secret');
  if (!secret || secret !== process.env.FACTORY_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    user_id?: string;
    type?: string;
    title?: string;
    body?: string;
    link?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { user_id, type, title, body: notifBody = '', link = '/dashboard' } = body;

  if (!user_id || !type || !title) {
    return NextResponse.json(
      { error: 'Missing required fields: user_id, type, title' },
      { status: 400 }
    );
  }

  if (!VALID_NOTIFICATION_TYPES.includes(type as NotificationType)) {
    return NextResponse.json(
      { error: `Invalid notification type. Must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Load user preferences
  const { data: prefsRow } = await serviceClient
    .from('fd_notification_preferences')
    .select('*')
    .eq('user_id', user_id)
    .single();

  const prefs = { ...DEFAULT_PREFERENCES, ...(prefsRow ?? {}) };

  // Check if this type is enabled
  if (!isTypeEnabled(prefs, type as NotificationType)) {
    return NextResponse.json({ skipped: true, reason: 'type_disabled' });
  }

  // Check quiet hours
  if (isInQuietHours(prefs)) {
    return NextResponse.json({ skipped: true, reason: 'quiet_hours' });
  }

  // Insert the notification
  const { data: notification, error: insertError } = await serviceClient
    .from('dash_notifications')
    .insert({
      user_id,
      type,
      title,
      body: notifBody,
      link,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[notifications/create] Insert error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Fire delivery (non-fatal) — get user email from auth
  try {
    const { data: userData } = await serviceClient.auth.admin.getUserById(user_id);
    const userEmail = userData?.user?.email;

    if (userEmail) {
      await deliverNotification(prefs, userEmail, {
        type,
        title,
        body: notifBody,
        link,
      });
    }
  } catch (err) {
    console.error('[notifications/create] Delivery error:', err);
    // Non-fatal — insert already succeeded
  }

  return NextResponse.json({ id: notification.id });
}
