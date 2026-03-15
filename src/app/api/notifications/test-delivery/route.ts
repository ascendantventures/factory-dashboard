import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { sendEmailNotification, sendDiscordNotification, isValidDiscordWebhookUrl } from '@/lib/notification-delivery';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { channel?: string; discord_webhook_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { channel, discord_webhook_url } = body;

  const testNotification = {
    type: 'spec_ready',
    title: 'Test notification from Factory Dashboard',
    body: 'This is a test to confirm your notification channel is working correctly.',
    link: '/dashboard',
  };

  if (channel === 'email') {
    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ ok: false, error: 'No email address on account' });
    }

    try {
      await sendEmailNotification(userEmail, testNotification);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email delivery failed';
      return NextResponse.json({ ok: false, error: message });
    }
  }

  if (channel === 'discord') {
    if (!discord_webhook_url) {
      return NextResponse.json(
        { ok: false, error: 'discord_webhook_url is required' },
        { status: 400 }
      );
    }

    if (!isValidDiscordWebhookUrl(discord_webhook_url)) {
      return NextResponse.json(
        { ok: false, error: 'Webhook URL must start with https://discord.com/api/webhooks/' },
        { status: 400 }
      );
    }

    try {
      await sendDiscordNotification(discord_webhook_url, testNotification);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Discord delivery failed';
      return NextResponse.json({ ok: false, error: message });
    }
  }

  return NextResponse.json(
    { ok: false, error: 'channel must be "email" or "discord"' },
    { status: 400 }
  );
}
