-- ============================================================
-- Migration: dash_notifications table
-- Issue: #101 — Notification bell panel
-- PREFIX: dash_
-- ============================================================

-- TABLE: dash_notifications
-- In-app notifications per user
create table if not exists dash_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in (
                'spec_ready', 'build_complete', 'qa_passed', 'qa_failed',
                'deploy_complete', 'agent_stalled', 'pipeline_error'
              )),
  title       text not null,
  body        text,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_dash_notifications_user
  on dash_notifications(user_id, created_at desc);
create index if not exists idx_dash_notifications_unread
  on dash_notifications(user_id, read) where read = false;

-- Enable Realtime for this table (idempotent)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE dash_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS
alter table dash_notifications enable row level security;

DO $$ BEGIN
  CREATE POLICY "Users can view own notifications"
    ON dash_notifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own notifications"
    ON dash_notifications FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert notifications"
    ON dash_notifications FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
