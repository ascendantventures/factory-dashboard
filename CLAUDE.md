# CLAUDE.md — Project Context

## Project
- **Name:** Factory Dashboard
- **Description:** Pipeline operations UI for the Foundary agentic harness — Kanban board, metrics, issue creation, and GitHub sync
- **Live URL:** https://build-work-blond.vercel.app
- **Build Repo:** https://github.com/ascendantventures/factory-dashboard
- **Original Issue:** https://github.com/ascendantventures/harness-beta-test/issues/2

## Stack
- Next.js 14 (App Router)
- Supabase (Auth + PostgreSQL + Realtime)
- Vercel (hosting + serverless functions)
- Tailwind CSS + shadcn/ui
- @dnd-kit/core (drag-and-drop Kanban)
- Octokit (GitHub API for sync + issue creation)
- Recharts (metrics charts)
- Lucide React (icons)
- Sonner (toast notifications)

## Architecture
- **Auth:** Supabase Auth with email/password + magic link. Middleware protects /dashboard/* routes.
- **API routes:** All under /app/api/ — sync, issues, build-repos, metrics, webhooks
- **Sync model:** Pull-based — `/api/sync` fetches issues from GitHub, upserts into `dash_issues` table. Auto-syncs every 60s from the Kanban board.
- **Realtime:** Supabase Realtime subscription on `dash_issues` for instant board updates
- **Kanban:** Drag-and-drop columns per station (intake → spec → design → build → QA → done). Dragging calls GitHub API to flip labels.

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side)
- `GITHUB_TOKEN` — GitHub PAT for API access (issue sync + creation)

## Database (Supabase — project byvjkyfnjtasbdanafgd)
- `dash_issues` — Synced GitHub issues. **PK is bigint (issue number), NOT UUID.** Must provide `id` explicitly on insert.
- `dash_dashboard_config` — Per-user config (tracked_repos, notification_prefs)
- `dash_user_roles` — Admin role assignments (user_id + role)
- `dash_stage_transitions` — Stage change history for metrics
- `dash_agent_runs` — Agent execution logs (cost, duration, model)
- `dash_build_repos` — Cache of build repos for Target App dropdown (1hr TTL, keyed on github_repo)
- **RLS:** Enabled on most tables. Service role client bypasses RLS for sync operations.

## Key Files
- `src/app/dashboard/page.tsx` — Main Kanban board page (server component, fetches initial data)
- `src/components/kanban/KanbanBoard.tsx` — Client-side Kanban with DnD, auto-sync, realtime
- `src/components/NewIssueModal.tsx` — Create issue form with Target App dropdown
- `src/components/TargetAppDropdown.tsx` — Build repo selector populated from completed builds
- `src/app/api/sync/route.ts` — GitHub → Supabase sync endpoint
- `src/app/api/issues/route.ts` — Create GitHub issue with station:intake label
- `src/app/api/build-repos/route.ts` — Fetch/cache build repos from BUILD COMPLETE comments
- `src/lib/supabase-server.ts` — Server-side Supabase clients (createSupabaseServerClient + createSupabaseAdminClient)
- `src/lib/supabase.ts` — Browser-side Supabase client
- `src/lib/github.ts` — GitHub API helpers (fetchRepoIssues, fetchIssueComments, extractStation)

## Known Issues & Gotchas
- **dash_issues.id is bigint, not UUID** — the sync endpoint must set `id: ghIssue.number` explicitly. Missing this causes silent NOT NULL constraint failures.
- **Sync uses cookie-based auth** — `createSupabaseServerClient()` reads cookies, not Authorization headers. Can't test sync with Bearer tokens via curl.
- **Repo input format** — The sync/settings expect `owner/repo` format (e.g., `ascendantventures/harness-beta-test`). Full GitHub URLs silently fail because `repoPath.split('/')` takes first two segments.
- **Build repo correction comments** — If a BUILD COMPLETE comment has the wrong repo, post a "Build Repo Correction" comment with format `source code is in **owner/repo**`. The dropdown parser reads corrections as authoritative.
- **Next.js 14/15 params compat** — Dynamic route params need `use(params)` pattern for Next.js 15 compatibility. Direct destructuring fails.

## Change Request Notes
- All UI uses dark mode (#0A0A0A background) — maintain this in all new components
- Use shadcn/ui components (Dialog, Form, Button, etc.) for consistency
- Toast notifications via Sonner — use `toast.success()` / `toast.error()`
- New API routes go in `src/app/api/` — use `createSupabaseServerClient()` for user-scoped and `createSupabaseAdminClient()` for admin operations
- The Kanban board auto-syncs every 60s — new features should work with this cycle
