-- =============================================================
-- Notification Center Phase 1 + Phase 2 — fd_notification_preferences
-- Migration: Creates fd_notification_preferences table
-- Issue: #109
-- =============================================================

-- TABLE: fd_notification_preferences
-- Per-user notification preferences including per-type toggles,
-- quiet hours, delivery channels, and timezone.
CREATE TABLE IF NOT EXISTS public.fd_notification_preferences (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Per-type notification toggles (Phase 1)
  spec_ready           boolean NOT NULL DEFAULT true,
  build_complete       boolean NOT NULL DEFAULT true,
  qa_passed            boolean NOT NULL DEFAULT true,
  qa_failed            boolean NOT NULL DEFAULT true,
  deploy_complete      boolean NOT NULL DEFAULT true,
  agent_stalled        boolean NOT NULL DEFAULT false,
  pipeline_error       boolean NOT NULL DEFAULT true,

  -- Quiet hours (Phase 1)
  quiet_hours_enabled  boolean NOT NULL DEFAULT false,
  quiet_hours_start    text NOT NULL DEFAULT '22:00',
  quiet_hours_end      text NOT NULL DEFAULT '08:00',

  -- Delivery channels (Phase 2)
  email_enabled        boolean NOT NULL DEFAULT false,
  discord_enabled      boolean NOT NULL DEFAULT false,
  discord_webhook_url  text,

  -- Timezone (Phase 2)
  user_timezone        text NOT NULL DEFAULT 'UTC',

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id)
);

-- Indexes for delivery channel server-side filtering
CREATE INDEX IF NOT EXISTS fd_notif_prefs_email_enabled_idx
  ON public.fd_notification_preferences(email_enabled)
  WHERE email_enabled = true;

CREATE INDEX IF NOT EXISTS fd_notif_prefs_discord_enabled_idx
  ON public.fd_notification_preferences(discord_enabled)
  WHERE discord_enabled = true;

-- RLS
ALTER TABLE public.fd_notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own notification preferences"
    ON public.fd_notification_preferences FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can upsert own notification preferences"
    ON public.fd_notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own notification preferences"
    ON public.fd_notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-create preferences row on new user signup
CREATE OR REPLACE FUNCTION public.create_notification_preferences_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.fd_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_notif_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_notification_preferences_on_signup();
