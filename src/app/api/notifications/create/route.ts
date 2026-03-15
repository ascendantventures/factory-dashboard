/**
 * POST /api/notifications/create
 * Auth: x-factory-secret header (service role)
 *
 * Inserts a notification into dash_notifications, then:
 * 1. Loads the user's fd_notification_preferences
 * 2. If email_enabled + type enabled → sends email via Resend (non-fatal)
 * 3. If discord_enabled + webhook set + type enabled → sends Discord message (non-fatal)
 * 4. Returns { id } on success, { skipped: true, reason } if quiet hours / prefs block it
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { isValidNotificationType, isInQuietHours } from '@/lib/notification-types';
import {
  isTypeEnabled,
  sendEmailNotification,
  sendDiscordNotification,
  type NotificationPreferences,
} from '@/lib/notification-delivery';

export async function POST(request: NextRequest) {
  // Auth: factory secret
  const secret = request.headers.get('x-factory-secret');
  if (!secret || secret !== process.env.FACTORY_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { user_id, type, title, body: notifBody = '', link = '' } = body as {
    user_id?: string;
    type?: string;
    title?: string;
    body?: string;
    link?: string;
  };

  if (!user_id || typeof user_id !== 'string') {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  if (!type || !isValidNotificationType(type)) {
    return NextResponse.json(
      { error: `Invalid notification type. Must be one of: spec_ready, build_complete, qa_passed, qa_failed, deploy_complete, agent_stalled, pipeline_error` },
      { status: 400 },
    );
  }
  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Load user preferences
  const { data: prefs } = await admin
    .from('fd_notification_preferences')
    .select('*')
    .eq('user_id', user_id)
    .single();

  // Check quiet hours (if prefs exist)
  if (prefs && isInQuietHours(prefs)) {
    return NextResponse.json({ skipped: true, reason: 'quiet_hours' });
  }

  // Check per-type toggle
  if (prefs && !isTypeEnabled(prefs as NotificationPreferences, type)) {
    return NextResponse.json({ skipped: true, reason: 'type_disabled' });
  }

  // Insert the notification
  const { data: inserted, error: insertError } = await admin
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

  if (insertError || !inserted) {
    console.error('[notifications/create] insert error:', insertError);
    return NextResponse.json({ error: insertError?.message ?? 'Insert failed' }, { status: 500 });
  }

  const notificationPayload = {
    type,
    title: title as string,
    body: (notifBody ?? '') as string,
    link: (link ?? '') as string,
  };

  // Deliver via email (non-fatal)
  if (prefs?.email_enabled) {
    try {
      const { data: userData } = await admin.auth.admin.getUserById(user_id);
      const userEmail = userData?.user?.email;
      if (userEmail) {
        await sendEmailNotification(userEmail, notificationPayload);
      }
    } catch (err) {
      console.error('[notifications/create] email delivery error:', err);
    }
  }

  // Deliver via Discord (non-fatal)
  if (prefs?.discord_enabled && prefs?.discord_webhook_url) {
    try {
      await sendDiscordNotification(prefs.discord_webhook_url, notificationPayload);
    } catch (err) {
      console.error('[notifications/create] discord delivery error:', err);
    }
  }

  return NextResponse.json({ id: inserted.id });
}
