-- =============================================================
-- Notification Center Phase 2 — Delivery Channels + Timezone
-- Migration: CREATE fd_notification_preferences + Phase 2 columns
-- Issue: #109
-- =============================================================

-- ── fd_notification_preferences ──────────────────────────────
-- Creates the table if it doesn't exist (in case Phase 1 issue-26
-- was never merged to main). Includes all Phase 1 columns + Phase 2.
CREATE TABLE IF NOT EXISTS public.fd_notification_preferences (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  spec_ready            boolean NOT NULL DEFAULT true,
  build_complete        boolean NOT NULL DEFAULT true,
  qa_passed             boolean NOT NULL DEFAULT true,
  qa_failed             boolean NOT NULL DEFAULT true,
  deploy_complete       boolean NOT NULL DEFAULT true,
  agent_stalled         boolean NOT NULL DEFAULT true,
  pipeline_error        boolean NOT NULL DEFAULT true,
  quiet_hours_enabled   boolean NOT NULL DEFAULT false,
  quiet_hours_start     text NOT NULL DEFAULT '22:00',
  quiet_hours_end       text NOT NULL DEFAULT '08:00',
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fd_notif_prefs_user_id_idx ON public.fd_notification_preferences(user_id);

-- ── Phase 2: delivery channel + timezone columns ──────────────
ALTER TABLE public.fd_notification_preferences
  ADD COLUMN IF NOT EXISTS email_enabled       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discord_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discord_webhook_url text,
  ADD COLUMN IF NOT EXISTS user_timezone       text NOT NULL DEFAULT 'UTC';

-- Indexes for server-side filtering by delivery channel
CREATE INDEX IF NOT EXISTS fd_notif_prefs_email_enabled_idx
  ON public.fd_notification_preferences(email_enabled)
  WHERE email_enabled = true;

CREATE INDEX IF NOT EXISTS fd_notif_prefs_discord_enabled_idx
  ON public.fd_notification_preferences(discord_enabled)
  WHERE discord_enabled = true;

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fd_set_notif_prefs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fd_notif_prefs_updated_at_trigger ON public.fd_notification_preferences;
CREATE TRIGGER fd_notif_prefs_updated_at_trigger
  BEFORE UPDATE ON public.fd_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.fd_set_notif_prefs_updated_at();

-- ── auto-create default preferences on user signup ───────────
CREATE OR REPLACE FUNCTION public.fd_create_default_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.fd_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fd_on_auth_user_created_notif_prefs ON auth.users;
CREATE TRIGGER fd_on_auth_user_created_notif_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fd_create_default_notification_preferences();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.fd_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fd_notif_prefs: users read own" ON public.fd_notification_preferences;
CREATE POLICY "fd_notif_prefs: users read own"
  ON public.fd_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fd_notif_prefs: users upsert own" ON public.fd_notification_preferences;
CREATE POLICY "fd_notif_prefs: users upsert own"
  ON public.fd_notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all prefs (for server-side delivery checks)
DROP POLICY IF EXISTS "fd_notif_prefs: service role read all" ON public.fd_notification_preferences;
CREATE POLICY "fd_notif_prefs: service role read all"
  ON public.fd_notification_preferences FOR SELECT
  USING (true);
