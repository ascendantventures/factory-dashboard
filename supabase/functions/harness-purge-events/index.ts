/**
 * harness-purge-events — Supabase Edge Function
 *
 * Purges old harness_events and harness_webhook_deliveries rows.
 * Triggered daily at 02:00 UTC via Supabase cron schedule.
 *
 * Cron schedule (set in Supabase Dashboard → Edge Functions → Schedule):
 *   0 2 * * *   (daily at 02:00 UTC)
 *
 * Environment variables (set in Supabase Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL              — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
 *   EVENT_RETENTION_DAYS      — optional, defaults to 90
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  // Only allow POST requests (from cron scheduler)
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const eventTtlDays = parseInt(Deno.env.get('EVENT_RETENTION_DAYS') ?? '90', 10);
  const deliveryTtlDays = 30;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc('harness_purge_old_events', {
    event_ttl_days: eventTtlDays,
    delivery_ttl_days: deliveryTtlDays,
  });

  if (error) {
    console.error('[harness-purge-events] RPC error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = data as { events_deleted: number; deliveries_deleted: number };
  console.log(
    `[harness-purge-events] purged ${result.events_deleted} events, ${result.deliveries_deleted} deliveries` +
    ` (event_ttl=${eventTtlDays}d, delivery_ttl=${deliveryTtlDays}d)`
  );

  return new Response(
    JSON.stringify({
      ok: true,
      events_deleted: result.events_deleted,
      deliveries_deleted: result.deliveries_deleted,
      event_ttl_days: eventTtlDays,
      delivery_ttl_days: deliveryTtlDays,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
