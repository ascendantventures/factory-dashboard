# CLAUDE.md — Project Context

## Project
- **Name:** Factory Dashboard
- **Description:** Pipeline operations UI for the Foundry agentic harness — Kanban board, metrics, issue creation, GitHub sync, enterprise nav & layout
- **Live URL:** https://build-work-blond.vercel.app
- **Build Repo:** https://github.com/ascendantventures/factory-dashboard
- **Original Issue:** https://github.com/ascendantventures/harness-beta-test/issues/2
- **Latest CR:** https://github.com/ascendantventures/harness-beta-test/issues/14

## Stack
- Next.js 14 (App Router, v16.1.6)
- Supabase (Auth + PostgreSQL + Realtime)
- Vercel (hosting + serverless functions)
- Tailwind CSS v4 + shadcn/ui
- @dnd-kit/core (drag-and-drop Kanban)
- Octokit (GitHub API for sync + issue creation)
- Recharts (metrics charts)
- Lucide React (icons)
- Sonner (toast notifications)
- framer-motion (animations)

## Architecture
- **Auth:** Supabase Auth with email/password + magic link. Middleware protects /dashboard/* routes.
- **API routes:** All under /app/api/ — sync, issues, build-repos, metrics, webhooks
- **Sync model:** Pull-based — `/api/sync` fetches issues from GitHub, upserts into `dash_issues` table. Auto-syncs every 60s from the Kanban board.
- **Realtime:** Supabase Realtime subscription on `dash_issues` for instant board updates
- **Kanban:** Drag-and-drop columns per station (intake → spec → design → build → QA → done). Dragging calls GitHub API to flip labels.
- **AppShell:** Sidebar (240px/56px collapsed) + Header (56px) + main content. Sidebar collapse state persisted to localStorage('sidebar-collapsed').

## Layout System (added in CR #14)
- **AppShell** (`src/components/layout/AppShell.tsx`) — Root shell wrapping Sidebar + Header + children
- **Sidebar** (`src/components/layout/Sidebar.tsx`) — Collapsible sidebar, 5 nav items, localStorage persistence
- **Header** (`src/components/layout/Header.tsx`) — Sticky 56px bar with PageTitle, GlobalSearch, SyncStatus, NotificationBell, NewIssueButton
- **MobileBottomNav** (`src/components/layout/MobileBottomNav.tsx`) — Bottom nav on mobile (md:hidden for desktop)
- **LoadingSkeleton** (`src/components/feedback/LoadingSkeleton.tsx`) — Skeleton variants: card, row, stat, kanban-column
- **EmptyState** (`src/components/feedback/EmptyState.tsx`) — Centered empty state with icon, title, description, optional CTA

## Navigation Routes
- `/dashboard` → Kanban Board (Dashboard)
- `/dashboard/apps` → Apps page (shows empty state, no apps data yet)
- `/dashboard/activity` → Activity feed (reads dash_stage_transitions)
- `/dashboard/metrics` → Metrics charts
- `/dashboard/costs` → Cost tracking
- `/dashboard/settings` → Settings

## Design System (CR #14 — DESIGN.md spec)
- **Primary:** #6366F1 (indigo — changed from old #3B82F6 blue)
- **Primary Hover:** #4F46E5
- **Primary Muted:** rgba(99,102,241,0.15)
- **Background:** #09090B (zinc-950)
- **Surface:** #18181B (zinc-900)
- **Surface Alt:** #27272A (zinc-800)
- **Border:** #3F3F46 (zinc-700)
- **Text Primary:** #FAFAFA
- **Text Secondary:** #A1A1AA
- **Text Muted:** #71717A
- **Font:** Inter (400;500;600;700;800) via Google Fonts
- Active nav: bg=rgba(99,102,241,0.15), left-border=2px solid #6366F1
- Sidebar: 240px expanded, 56px collapsed
- Header: 56px height, sticky top-0
- Bottom nav: 64px height, fixed bottom

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side)
- `GITHUB_TOKEN` — GitHub PAT for API access (issue sync + creation)

## Database (Supabase — project byvjkyfnjtasbdanafgd)
- `dash_issues` — Synced GitHub issues. **PK is bigint (issue number), NOT UUID.** Must provide `id` explicitly on insert.
- `dash_dashboard_config` — Per-user config (tracked_repos, notification_prefs)
- `dash_user_roles` — Admin role assignments (user_id + role)
- `dash_stage_transitions` — Stage change history for metrics (used by Activity page)
- `dash_agent_runs` — Agent execution logs (cost, duration, model)
- `dash_build_repos` — Cache of build repos for Target App dropdown (1hr TTL, keyed on github_repo)
- **RLS:** Enabled on most tables. Service role client bypasses RLS for sync operations.

## Key Files
- `src/app/dashboard/page.tsx` — Main Kanban board page (server component, fetches initial data)
- `src/app/dashboard/layout.tsx` — Dashboard layout using AppShell
- `src/components/layout/AppShell.tsx` — Root layout shell
- `src/components/layout/Sidebar.tsx` — New collapsible sidebar (replaces old src/components/Sidebar.tsx)
- `src/components/layout/Header.tsx` — Header bar
- `src/components/layout/MobileBottomNav.tsx` — Mobile bottom nav
- `src/components/kanban/KanbanBoard.tsx` — Client-side Kanban with DnD, auto-sync, realtime
- `src/components/NewIssueModal.tsx` — Create issue form with Target App dropdown
- `src/components/TargetAppDropdown.tsx` — Build repo selector populated from completed builds
- `src/app/api/sync/route.ts` — GitHub → Supabase sync endpoint
- `src/app/api/sync/status/route.ts` — Sync status endpoint (used by SyncStatus component)
- `src/app/api/issues/route.ts` — Create GitHub issue with station:intake label
- `src/app/api/build-repos/route.ts` — Fetch/cache build repos from BUILD COMPLETE comments
- `src/lib/supabase-server.ts` — Server-side Supabase clients
- `src/lib/supabase.ts` — Browser-side Supabase client
- `src/lib/github.ts` — GitHub API helpers

## Known Issues & Gotchas
- **dash_issues.id is bigint, not UUID** — the sync endpoint must set `id: ghIssue.number` explicitly.
- **Sync uses cookie-based auth** — `createSupabaseServerClient()` reads cookies. Can't test sync with Bearer tokens.
- **Repo input format** — Expects `owner/repo` format (e.g., `ascendantventures/harness-beta-test`). Full URLs silently fail.
- **Old Sidebar.tsx still exists** at `src/components/Sidebar.tsx` — it's no longer used. New sidebar is at `src/components/layout/Sidebar.tsx`. Safe to delete old one in future CR.
- **Next.js 14/15 params compat** — Dynamic route params need `use(params)` pattern for Next.js 15 compatibility. Direct destructuring fails.
- **Apps page** (`/dashboard/apps`) — currently shows empty state only. No backend for connected apps exists yet.
- **Notification bell** — static placeholder, no real notification data wired up.
- **Global search** — static UI only, no real search backend connected yet.

## Change Request Notes
- **Primary color is now #6366F1 (indigo)** — not the old blue. Update any hardcoded blue references.
- All UI uses dark mode (zinc-950 background) — maintain this in all new components
- Use shadcn/ui components (Dialog, Form, Button, etc.) for consistency
- Toast notifications via Sonner — use `toast.success()` / `toast.error()`
- New API routes go in `src/app/api/` — use `createSupabaseServerClient()` for user-scoped and `createSupabaseAdminClient()` for admin operations
- The Kanban board auto-syncs every 60s — new features should work with this cycle
- Sidebar collapse state persists in localStorage('sidebar-collapsed')
- Add `data-testid="skeleton"` to new skeleton components, `data-testid="empty-state"` to empty states
