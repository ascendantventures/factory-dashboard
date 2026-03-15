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

-- Enable Realtime for this table
alter publication supabase_realtime add table dash_notifications;

-- RLS
alter table dash_notifications enable row level security;

create policy "Users can view own notifications"
  on dash_notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on dash_notifications for update
  using (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on dash_notifications for insert
  with check (true);
