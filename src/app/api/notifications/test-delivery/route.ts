/**
 * POST /api/notifications/test-delivery
 * Auth: Supabase session cookie (authenticated user)
 *
 * Sends a test message to validate email or Discord config.
 * Request body: { channel: "email" | "discord", discord_webhook_url?: string }
 * Response: { ok: true } | { ok: false, error: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import {
  sendEmailNotification,
  sendDiscordNotification,
  isValidDiscordWebhookUrl,
} from '@/lib/notification-delivery';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { channel, discord_webhook_url } = body as {
    channel?: string;
    discord_webhook_url?: string;
  };

  if (channel !== 'email' && channel !== 'discord') {
    return NextResponse.json(
      { ok: false, error: 'channel must be "email" or "discord"' },
      { status: 400 },
    );
  }

  const testPayload = {
    type: 'spec_ready',
    title: 'Test notification from Factory Dashboard',
    body: 'This is a test message to confirm your delivery channel is working.',
    link: '/dashboard',
  };

  if (channel === 'email') {
    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ ok: false, error: 'No email address on account' }, { status: 400 });
    }
    try {
      await sendEmailNotification(userEmail, testPayload);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email delivery failed';
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  // channel === 'discord'
  if (!discord_webhook_url) {
    return NextResponse.json({ ok: false, error: 'discord_webhook_url is required' }, { status: 400 });
  }
  if (!isValidDiscordWebhookUrl(discord_webhook_url)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid webhook URL. Must start with https://discord.com/api/webhooks/' },
      { status: 400 },
    );
  }
  try {
    await sendDiscordNotification(discord_webhook_url, testPayload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Discord delivery failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
