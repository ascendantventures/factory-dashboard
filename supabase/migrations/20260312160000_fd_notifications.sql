-- =============================================================
-- Factory Dashboard — In-App Notification Center
-- Migration: fd_notifications + fd_notification_preferences
-- =============================================================

-- ── fd_notifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fd_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN (
                'spec_ready','build_complete','qa_passed','qa_failed',
                'deploy_complete','agent_stalled','pipeline_error')),
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  link        text NOT NULL DEFAULT '',
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fd_notifications_user_id_idx    ON public.fd_notifications(user_id);
CREATE INDEX IF NOT EXISTS fd_notifications_read_idx       ON public.fd_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS fd_notifications_created_at_idx ON public.fd_notifications(created_at DESC);

-- Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.fd_notifications;

-- ── fd_notification_preferences ──────────────────────────────
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
  quiet_hours_start     time NOT NULL DEFAULT '22:00',
  quiet_hours_end       time NOT NULL DEFAULT '08:00',
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fd_notif_prefs_user_id_idx ON public.fd_notification_preferences(user_id);

-- ── updated_at trigger on preferences ────────────────────────
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
ALTER TABLE public.fd_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fd_notification_preferences ENABLE ROW LEVEL SECURITY;

-- fd_notifications
CREATE POLICY "fd_notifications: users read own"
  ON public.fd_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "fd_notifications: users update own (mark read)"
  ON public.fd_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "fd_notifications: service role insert"
  ON public.fd_notifications FOR INSERT
  WITH CHECK (true);

-- fd_notification_preferences
CREATE POLICY "fd_notif_prefs: users read own"
  ON public.fd_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "fd_notif_prefs: users upsert own"
  ON public.fd_notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
