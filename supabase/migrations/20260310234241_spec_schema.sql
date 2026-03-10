
-- ============================================================
-- Factory Dashboard Migration SQL
-- Project prefix: dash_
-- ============================================================

-- TABLE: dash_issues
-- Cached GitHub issue data for fast querying
create table if not exists dash_issues (
  id            bigint primary key,
  issue_number  int not null,
  repo          text not null,
  title         text not null,
  body          text,
  state         text not null default 'open',
  station       text,
  complexity    text,
  issue_type    text,
  author        text,
  assignee      text,
  labels        jsonb not null default '[]',
  created_at    timestamptz not null,
  updated_at    timestamptz not null,
  closed_at     timestamptz,
  synced_at     timestamptz not null default now(),
  unique(repo, issue_number)
);

create index if not exists idx_dash_issues_station on dash_issues(repo, station);
create index if not exists idx_dash_issues_updated on dash_issues(repo, updated_at desc);
create index if not exists idx_dash_issues_state   on dash_issues(repo, state);

-- TABLE: dash_stage_transitions
-- Timeline of every station change per issue
create table if not exists dash_stage_transitions (
  id               uuid primary key default gen_random_uuid(),
  issue_id         bigint not null references dash_issues(id) on delete cascade,
  repo             text not null,
  issue_number     int not null,
  from_station     text,
  to_station       text not null,
  transitioned_at  timestamptz not null default now(),
  duration_seconds int,
  agent_model      text,
  metadata         jsonb not null default '{}'
);

create index if not exists idx_dash_transitions_issue   on dash_stage_transitions(issue_id, transitioned_at);
create index if not exists idx_dash_transitions_repo    on dash_stage_transitions(repo, transitioned_at desc);
create index if not exists idx_dash_transitions_station on dash_stage_transitions(repo, to_station);

-- TABLE: dash_agent_runs
-- Agent execution records per issue+station
create table if not exists dash_agent_runs (
  id                 uuid primary key default gen_random_uuid(),
  issue_id           bigint references dash_issues(id) on delete cascade,
  repo               text not null,
  issue_number       int not null,
  station            text not null,
  model              text,
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  run_status         text not null default 'running'
                       check (run_status in ('running', 'completed', 'failed', 'timeout')),
  duration_seconds   int,
  exit_code          int,
  log_summary        text,
  estimated_cost_usd numeric(8,4),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_dash_runs_repo   on dash_agent_runs(repo, started_at desc);
create index if not exists idx_dash_runs_status on dash_agent_runs(run_status) where run_status = 'running';
create index if not exists idx_dash_runs_issue  on dash_agent_runs(issue_id, started_at desc);

-- auto-update updated_at (SECURITY DEFINER)
create or replace function dash_fn_agent_runs_updated_at()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dash_agent_runs_updated_at on dash_agent_runs;
create trigger trg_dash_agent_runs_updated_at
  before update on dash_agent_runs
  for each row execute function dash_fn_agent_runs_updated_at();

-- TABLE: dash_dashboard_config
-- Per-user configuration
-- BUILD: user_id FK to auth.users - always use upsert() ON CONFLICT user_id, NEVER plain insert()
create table if not exists dash_dashboard_config (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  tracked_repos      text[] not null default '{}',
  notification_prefs jsonb not null default '{"stage_changes": true, "failures": true}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique(user_id)
);

create or replace function dash_fn_dashboard_config_updated_at()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dash_config_updated_at on dash_dashboard_config;
create trigger trg_dash_config_updated_at
  before update on dash_dashboard_config
  for each row execute function dash_fn_dashboard_config_updated_at();

-- TABLE: dash_user_roles
-- Role assignments: operator | admin
-- BUILD: user_id FK to auth.users - always use upsert() ON CONFLICT user_id, NEVER plain insert()
-- NEVER replace any existing handle_new_user trigger in auth schema
-- Application upserts role as 'operator' on first login via server action
create table if not exists dash_user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'operator'
               check (role in ('operator', 'admin')),
  created_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_dash_user_roles_user on dash_user_roles(user_id);

-- RLS POLICIES
-- BUILD owns RLS. Patterns below are the required definitions.

-- dash_issues: all authenticated users read; service role writes
alter table dash_issues enable row level security;
create policy "dash_issues: authenticated read"
  on dash_issues for select to authenticated using (true);

-- dash_stage_transitions: all authenticated users read
alter table dash_stage_transitions enable row level security;
create policy "dash_transitions: authenticated read"
  on dash_stage_transitions for select to authenticated using (true);

-- dash_agent_runs: all authenticated users read; service role writes
alter table dash_agent_runs enable row level security;
create policy "dash_runs: authenticated read"
  on dash_agent_runs for select to authenticated using (true);

-- dash_dashboard_config: users manage own row
alter table dash_dashboard_config enable row level security;
create policy "dash_config: users own row"
  on dash_dashboard_config for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- dash_user_roles: users read own role; admin management via service role
alter table dash_user_roles enable row level security;
create policy "dash_roles: users read own"
  on dash_user_roles for select to authenticated
  using (user_id = auth.uid());

