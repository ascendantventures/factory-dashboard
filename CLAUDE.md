# CLAUDE.md — Project Context

## Project
- **Name:** Factory Dashboard
- **Description:** Pipeline operations UI for the Foundry agentic harness — Kanban board, metrics, issue creation, GitHub sync, enterprise nav & layout
- **Live URL:** https://factory-dashboard-tau.vercel.app
- **Build Repo:** https://github.com/ascendantventures/factory-dashboard
- **Original Issue:** https://github.com/ascendantventures/harness-beta-test/issues/2
- **Latest CR:** https://github.com/ascendantventures/harness-beta-test/issues/116

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
- yet-another-react-lightbox (CR #36 — image lightbox for attachment gallery)
- uuid (CR #36 — UUIDs for storage paths)

## Architecture
- **Auth:** Supabase Auth with email/password + magic link. Middleware protects /dashboard/* routes.
- **API routes:** All under /app/api/ — sync, issues, build-repos, metrics, webhooks
- **Sync model:** Pull-based — `/api/sync` fetches issues from GitHub, upserts into `dash_issues` table. Auto-syncs every 60s from the Kanban board.
- **Realtime:** Supabase Realtime subscriptions on `dash_issues`, `dash_stage_transitions`, and `dash_agent_runs` for instant updates
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
- `/dashboard/apps` → Apps Portfolio page — responsive grid of app cards with status badges, issue counts, deploy info
- `/dashboard/apps/[repoId]` → App detail page (mobile full page; desktop uses drawer instead)
- `/dashboard/activity` → Activity feed (reads dash_stage_transitions)
- `/dashboard/metrics` → Metrics charts
- `/dashboard/analytics` → Cost Analytics & ROI Dashboard (Issue #25) — charts, ROI metrics, CSV export
- `/dashboard/costs` → Cost tracking
- `/dashboard/settings` → Settings (tabs: general, users, templates, environment, api-keys)
- `/dashboard/templates` → Templates registry (dedicated route, defaults to templates tab in SettingsClient)

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
- **Font UI:** Inter (400;500;600;700;800) via Google Fonts
- **Font Attachment:** Instrument Sans (400;500;600;700) via Google Fonts (added CR #51)
- Active nav: bg=rgba(99,102,241,0.15), left-border=2px solid #6366F1
- Sidebar: 240px expanded, 56px collapsed
- Header: 56px height, sticky top-0
- Bottom nav: 64px height, fixed bottom

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side)
- `GITHUB_TOKEN` — GitHub PAT for API access (issue sync + creation)
- `WEBHOOK_SECRET_ENCRYPTION_KEY` — AES-GCM 32-byte key for encrypting webhook signing secrets (Issue #29). Pad to 32 chars if shorter. Required for HMAC signing dispatch.

## Database (Supabase — project byvjkyfnjtasbdanafgd)
- `dash_issues` — Synced GitHub issues. **PK is bigint (issue number), NOT UUID.** Must provide `id` explicitly on insert.
- `dash_dashboard_config` — Per-user config (tracked_repos, notification_prefs)
- `dash_user_roles` — Admin role assignments (user_id + role)
- `dash_stage_transitions` — Stage change history. Realtime enabled (CR #12). Used by Activity feed + metrics.
- **Realtime publication:** Both `dash_stage_transitions` and `dash_agent_runs` are added to `supabase_realtime` publication (migration 20260312120000).
- `dash_agent_runs` — Agent execution logs (cost, duration, model). **Columns:** `run_status` (not `status`), `estimated_cost_usd` (not `cost_usd`), `log_summary` (not `logs`).
- `dash_issue_cost_summary` — VIEW: pre-aggregated cost + active_runs per issue (added CR #13)
- `dash_issue_stage_entry` — VIEW: current station entry timestamp per issue (added CR #13)
- `dash_build_repos` — Cache of build repos for Target App dropdown (1hr TTL, keyed on github_repo)
- `dash_deployment_cache` — Caches latest Vercel deployment per build repo (added CR #11). Keyed on repo_full_name. Columns: repo_full_name, vercel_deployment_id, deploy_url, deploy_state, deployed_at, raw_payload. Upsert on conflict repo_full_name.
- `fd_webhooks` — Registered webhook endpoints (Issue #29). Columns: id, url, secret_hash (AES-GCM encrypted, never raw), events (JSONB array), enabled, created_by, created_at, updated_at. RLS: owner-only CRUD.
- `fd_webhook_deliveries` — Rolling delivery log per webhook (Issue #29). Columns: id, webhook_id, event, payload, status_code, response_body, sent_at. RLS: owner can read; service role inserts only. Cascade-deletes when webhook deleted.
- **RLS:** Enabled on most tables. Service role client bypasses RLS for sync operations.

## Key Files
- `src/app/dashboard/page.tsx` — Main Kanban board page (server component, fetches initial data)
- `src/app/dashboard/layout.tsx` — Dashboard layout using AppShell
- `src/components/layout/AppShell.tsx` — Root layout shell
- `src/components/layout/Sidebar.tsx` — New collapsible sidebar (replaces old src/components/Sidebar.tsx)
- `src/components/layout/Header.tsx` — Header bar
- `src/components/layout/MobileBottomNav.tsx` — Mobile bottom nav
- `src/components/kanban/KanbanBoard.tsx` — Client-side Kanban with DnD, auto-sync, realtime, + Activity sidebar toggle
- `src/app/api/activity/route.ts` — GET /api/activity — unified feed from dash_stage_transitions + dash_agent_runs, JOINs dash_issues for titles
- `src/hooks/useActivityFeed.ts` — Initial fetch + 2 Realtime channel subs (activity-transitions, activity-runs), caps at 200 events
- `src/components/activity/ActivitySidebar.tsx` — Collapsible right panel (w-80), localStorage persistence ('activity_sidebar_open')
- `src/components/activity/ActivityFeed.tsx` — AnimatePresence slide-in list, loading skeleton, empty state
- `src/components/activity/ActivityEvent.tsx` — Single event row with icon+color per event_type, data-testid="activity-event" + data-event-type
- `src/components/activity/ActivityTimestamp.tsx` — Auto-updating relative time (30s interval), title=ISO for a11y
- `src/components/NewIssueModal.tsx` — Create issue form. Target Repository now uses `RepositorySelector` (no longer takes `trackedRepos` prop).
- `src/components/TargetAppDropdown.tsx` — Optional "Target App" dropdown for change requests (fetches /api/build-repos)
- `src/components/ui/RepositorySelector.tsx` — Shared required repo selector (Issue #85). Fetches /api/build-repos, shows display names, inline validation error, data-testid="repo-selector".
- `src/app/api/sync/route.ts` — GitHub → Supabase sync endpoint
- `src/app/api/sync/status/route.ts` — Sync status endpoint (used by SyncStatus component)
- `src/app/api/issues/route.ts` — Create GitHub issue with station:intake label
- `src/app/api/build-repos/route.ts` — Fetch/cache build repos from BUILD COMPLETE comments
- `src/lib/supabase-server.ts` — Server-side Supabase clients
- `src/lib/supabase.ts` — Browser-side Supabase client
- `src/lib/github.ts` — GitHub API helpers
- `src/lib/enrichment.ts` — IssueEnrichment type, EnrichmentMap, formatTimeInStage/formatCost/getIssueType helpers
- `src/components/kanban/IssueDetailPanel.tsx` — Slide-over panel with stage timeline, agent runs table, cost breakdown
- `src/app/api/apps/route.ts` — GET /api/apps — returns all apps with computed status, issue counts, tech stack
- `src/app/api/apps/[repoId]/route.ts` — GET /api/apps/[repoId] — returns app detail with issues, transitions, deployments
- `src/app/api/apps/refresh-deployments/route.ts` — POST /api/apps/refresh-deployments — admin-only Vercel cache refresh
- `src/components/apps/AppCard.tsx` — App card with framer-motion hover animation
- `src/components/apps/AppStatusBadge.tsx` — Status pill: Active (green) | Idle (gray) | Error (red)
- `src/components/apps/AppGrid.tsx` — Responsive grid 1/2/3 col wrapper
- `src/components/apps/AppDetailDrawer.tsx` — Slide-in drawer for app detail (desktop), fetches /api/apps/[id]
- `src/components/apps/AppIssueList.tsx` — Issues grouped by station in pipeline order
- `src/components/apps/AppTechStack.tsx` — Tech stack tag pills
- `src/components/apps/DeploymentHistory.tsx` — Last deploy row with relative time

## Webhook & Integration Configuration (Issue #29)
- **New routes:** `/dashboard/settings/webhooks`, `/dashboard/settings/webhooks/new`, `/dashboard/settings/webhooks/[id]`
- **API routes:**
  - `GET /api/settings/webhooks` — list user's webhooks (no secret_hash)
  - `POST /api/settings/webhooks` — create webhook (URL validation, encrypt secret, require HTTPS)
  - `PATCH /api/settings/webhooks/[id]` — update webhook (partial)
  - `DELETE /api/settings/webhooks/[id]` — delete webhook (RLS-scoped)
  - `POST /api/settings/webhooks/[id]/test` — fire test payload, log delivery
  - `GET /api/settings/webhooks/[id]/deliveries` — last 50 deliveries ordered by sent_at DESC
- **Lib files:**
  - `src/lib/webhook-events.ts` — PIPELINE_EVENTS array, EVENT_CATEGORIES, PipelineEvent type
  - `src/lib/webhook-dispatcher.ts` — `dispatchEvent()` (server-only), `encryptSecret()`/`decryptSecret()` using AES-GCM, HMAC-SHA-256 header `X-Factory-Signature`
- **Components:** `src/components/webhooks/` — WebhookForm.tsx, WebhookCard.tsx, DeliveryLog.tsx, TestWebhookButton.tsx, IntegrationPresets.tsx
- **Secret storage:** AES-GCM encrypted with `WEBHOOK_SECRET_ENCRYPTION_KEY` env var. NOT a plain hash — raw secret needed for HMAC at dispatch time.
- **data-testid attributes:** `webhook-card`, `enabled-toggle`, `delete-webhook-btn`, `confirm-delete-btn`, `test-webhook-btn`, `test-result`, `delivery-log`, `delivery-row`, `url-error`, `event-{eventName}` (e.g. `event-build.completed`), `preset-discord`, `preset-slack`

## Pipeline Control Panel (CR #19)
- **New route:** `/pipeline` — protected by middleware, uses AppShell, polls every 5s
- **New API routes:**
  - `GET /api/pipeline/status` — reads PID from `/tmp/harness.pid`, locks from `/tmp/harness-*.lock`, backoffs from `/tmp/backoff-*.json`; counts from `pipeline_audit_log`
  - `POST /api/pipeline/control` — actions: `start_loop|stop_loop|force_tick|clear_locks|clear_backoff`; logs to `pipeline_audit_log`
  - `POST /api/issues/[number]/action` — skip/block/retry/advance/revert; calls GitHub API; logs to `pipeline_audit_log`
  - `GET|PATCH /api/pipeline/config` — reads/upserts `pipeline_station_config` (upsert on `station_name`)
- **New DB tables:** `pipeline_station_config`, `pipeline_audit_log` (migration: 20260312075308_spec_schema_issue19.sql)
- **Filesystem conventions:** PID file: `/tmp/harness.pid` (line 1: PID, line 2: epoch ms); Lock files: `/tmp/harness-{issue}.lock`; Backoff files: `/tmp/backoff-{issue}.json`; Force-tick: `/tmp/harness-force-tick`
- **Harness start command:** `HARNESS_START_CMD` env var (default `node /app/loop.js`), `HARNESS_CWD` for working dir
- **Station order:** intake → spec → design → build → qa → done
- **Issue action menu:** also exported from `_components/IssueActionMenu.tsx` for use in Kanban + issue detail
- **Audit log polling:** page queries `pipeline_audit_log` via Supabase browser client on same 5s cycle
- **data-testid attributes:** `pipeline-status-card`, `harness-status-badge`, `harness-pid`, `pipeline-metrics-bar`, `active-agents-count`, `processed-today`, `processed-week`, `processed-all-time`, `locks-list`, `station-config-panel`, `config-row-{station}`, `audit-log-table`, `issue-action-menu-trigger`, `issue-action-menu`
- **Harness heartbeat (CR #105):** Dashboard reads from `harness_heartbeat` Supabase table (singleton row id='main'). `GET /api/harness-status` replaces old local-file-based `/api/pipeline/status`. Staleness threshold: 5 min. Poll interval: 30s.
- **CLAUDE models:** haiku-4-5, sonnet-4-6, opus-4-6 — hardcoded in StationConfigPanel

## Known Issues & Gotchas
- **Vercel project / Supabase instance mismatch** — the repo has been linked to two different Vercel projects (`build-work` and `factory-dashboard`) at different points. Each uses a different Supabase instance. When applying migrations, use `supabase link --project-ref <ref>` to ensure you're targeting the correct DB. The `factory-dashboard` project uses Supabase ref `ojazkhiqwgssduehubdu`; the `build-work` project uses `xvniwehnspnxlnerbfwj`. Both must have all migrations applied.
- **`NEXT_PUBLIC_SUPABASE_URL` must be set for ALL Vercel environments (preview + development + production)** — if missing from Preview, every server component that calls `createSupabaseServerClient()` will crash with a Next.js digest error at runtime (since `NEXT_PUBLIC_*` vars are inlined at build time for server bundles).
- **`WEBHOOK_SECRET_ENCRYPTION_KEY` must be set for all environments** — set for production AND preview/development. Missing key causes decryption failures on test/dispatch, though the `?? ''` fallback prevents hard crashes.
- **dash_issues.id is bigint, not UUID** — the sync endpoint must set `id: ghIssue.number` explicitly.
- **Sync uses cookie-based auth** — `createSupabaseServerClient()` reads cookies. Can't test sync with Bearer tokens.
- **Repo input format** — Expects `owner/repo` format (e.g., `ascendantventures/harness-beta-test`). Full URLs silently fail.
- **Old Sidebar.tsx still exists** at `src/components/Sidebar.tsx` — it's no longer used. New sidebar is at `src/components/layout/Sidebar.tsx`. Safe to delete old one in future CR.
- **Next.js 14/15 params compat** — Dynamic route params need `use(params)` pattern for Next.js 15 compatibility. Direct destructuring fails.
- **VERCEL_TOKEN not set** — deployment fields return null, deploy history shows "—" on cards. Set VERCEL_TOKEN env var in Vercel project settings to enable deploy tracking.
- **Apps issue linking** — Issues linked to apps via `build_repo: org/repo` in `dash_issues.body`. The original BUILD issue is also linked via `dash_build_repos.issue_number`. If neither matches, issues won't appear under that app.
- **Webhooks page try/catch (Issue #90)** — `page.tsx` data fetch is wrapped in try/catch that returns empty state on error. `error.tsx` boundary added for unhandled exceptions. Root cause was unhandled async throws from `createSupabaseServerClient()` / Supabase query propagating as server-side exception (Digest: 2416468996).
- **Notification bell** — static placeholder, no real notification data wired up.
- **Global search** — static UI only, no real search backend connected yet.
- **MobileBottomNav role resolution (Issue #92)** — MobileBottomNav no longer fetches role client-side. Role is resolved server-side in DashboardLayout via `getUserRole(user.id)` and passed down as `isAdmin` prop through AppShell. If Admin entry is missing on mobile, check: (1) `fd_user_roles` row has `is_active = true` for the user, (2) DashboardLayout is server component (no `'use client'` directive), (3) AppShell receives `isAdmin` prop.
- **`github_issue_url` column does not exist in `dash_issues`** — the list route (`apps/route.ts`) was fixed (CR #62), but the detail route (`apps/[repoId]/route.ts`) also selected this column and mapped it — both occurrences removed in bugfix #68. Do not add `github_issue_url` to any Supabase query on `dash_issues`.
- **Supabase Storage signed URLs** — `upload/route.ts` previously built a fake `/storage/v1/object/sign/…` URL without a signature token, causing 400 errors on fetch. Always use `admin.storage.from(bucket).createSignedUrl(path, expiry)` to generate a real signed URL; never hand-construct one (#70).
- **Webhooks page error handling (Issue #90)** — `page.tsx` uses Supabase `{ data, error }` pattern (not try/catch) to catch DB errors. On error, `webhooks` is null and empty state renders. An `error.tsx` boundary exists in the same directory to catch any unhandled server exceptions. The `WEBHOOK_SECRET_ENCRYPTION_KEY` is set for Production + Preview + Development in Vercel — do NOT remove it from Preview scope.
- **Settings page duplicate `<main>` (Issue #107)** — `SettingsClient.tsx` had an inner `<main className="flex-1 md:pl-8 md:pt-0">` inside the outer layout `<main>`. This violates WCAG 2.1 SC 1.3.6 and breaks `agent-browser get text 'main'` with strict-mode violations. Fixed by changing inner `<main>` to `<section>` (line ~852 in `SettingsClient.tsx`). Do not use `<main>` for content sub-sections inside the layout shell.
- **Event Log route fix (Issue #116)** — Sidebar "Event Log" href was updated in CR #114 to `/dashboard/event-log` but the page was never created. Fixed by creating `src/app/dashboard/event-log/page.tsx` (dark-mode, fetches from `/api/event-log`) and `src/app/api/event-log/route.ts` (queries `harness_events` table). The old page at `/dashboard/admin/events` is intentionally kept as a legacy route. Do NOT modify `/api/admin/events/route.ts` — it still queries `fdash_event_log` and may have other consumers.

## Enhanced Kanban Cards (CR #13)
- **IssueCard** now accepts `enrichment?: IssueEnrichment` + `onSelect?` — card click opens IssueDetailPanel
- **KanbanColumn** accepts `enrichmentMap: EnrichmentMap` + `onSelectIssue?` — shows column cost totals
- **KanbanBoard** fetches enrichment from `dash_issue_cost_summary` + `dash_issue_stage_entry` views; subscribes to `dash_agent_runs` Realtime for live updates
- **IssueDetailPanel** fetches from `/api/issues/[number]` on open; panel slide-over with framer-motion
- data-testid attributes: `kanban-card`, `kanban-board`, `kanban-column`, `complexity-badge`, `time-in-stage`, `cost-tracker`, `agent-activity-dot`, `issue-detail-panel`, `close-panel`, `detail-title`, `stage-timeline`, `agent-run-list`, `cost-breakdown`, `column-issue-count`, `column-cost-total`
- **dash_issues.github_issue_url** — added optional field to DashIssue type (populated by sync if present)

## Activity Feed (CR #12)
- **ActivityEvent types:** `agent_spawned` (🚀 indigo), `stage_completed` (✅ green), `build_deployed` (🔨 blue), `qa_result` (🧪 green/red), `bug_filed` (🐛 orange), `cost_logged` (💰 yellow)
- **Sidebar toggle button:** data-testid="activity-toggle-btn" in KanbanBoard toolbar
- **Sidebar panel:** data-testid="activity-sidebar" — renders when activityOpen=true
- **Event rows:** data-testid="activity-event", data-event-type={event.event_type}
- **Timestamps:** data-testid="activity-timestamp", title=ISO, updates every 30s
- **Empty state:** data-testid="activity-empty"
- **localStorage key:** 'activity_sidebar_open' (persists open/closed state)
- **Realtime channels:** 'activity-transitions' (INSERT on dash_stage_transitions), 'activity-runs' (INSERT + UPDATE on dash_agent_runs)
- **API discriminator logic:** running→agent_spawned; qa+completed/failed→qa_result; cost+completed→cost_logged; done+live_url→build_deployed; else→stage_completed
- **Issue title resolution:** JOIN in /api/activity; Realtime payloads don't join (title=null on live events)

## Live Agent Log Viewer (CR #21)
- **Storage bucket:** `dash-agent-logs` — must be created in Supabase; logs stored as `{run_id}.log`
- **New DB columns on dash_agent_runs:** `log_file_path` (text), `pid` (integer) — added via migration 20260313000000
- **New API routes:**
  - `GET /api/agents/active` — returns all running agent runs with log_file_path + pid
  - `GET /api/agents/logs/[runId]` — SSE stream: polls Storage every 1.5s for active runs; serves full log for completed runs
  - `GET /api/agents/logs/[runId]/raw` — full log as plain text for copy button
- **New components in `src/components/agents/`:**
  - `LogViewer.tsx` — terminal panel (bg `#0D0E12`), accepts `run: AgentRunMeta`, `mode: 'panel' | 'embedded'`
  - `AgentMetadataBar.tsx` — station badge + model badge + PID + elapsed + cost
  - `AgentStatusDot.tsx` — pulsing amber dot (running), green (completed), red (failed)
  - `LogViewerLine.tsx` — single log line with color coding: blue (commands), red (errors), green (success)
  - `LogViewerToolbar.tsx` — search input + scroll-lock toggle + copy button
- **New hooks:**
  - `useAgentLogStream.ts` — EventSource management, reconnect at last offset on error
  - `useElapsedTime.ts` — tick-based elapsed time string, updates every second
- **Integration points:**
  - `IssueCard.tsx` — amber agent dot is now clickable; fetches active run from `/api/agents/active` + opens LogViewer
  - `IssueDetailPanel.tsx` — Agent Runs table has new "Logs" column with Eye icon button; click toggles inline LogViewer
  - `ActivityEvent.tsx` — `agent_spawned` events show "Watch" link that toggles inline LogViewer
- **Design:** Warm amber (`#E5A830`) primary for log viewer UI; dark terminal bg `#0D0E12`; JetBrains Mono for log lines; Outfit for UI text
- **data-testid attributes:** `log-viewer`, `log-content`, `log-line`, `log-search-input`, `scroll-lock-toggle`, `copy-log-btn`, `view-logs-btn`, `agent-station`, `agent-model`, `agent-elapsed`, `log-viewer-close`
- **Harness upload note:** Log streaming only works if harness uploads log chunks to `dash-agent-logs/{run_id}.log` in Supabase Storage. Dev fallback reads from `/tmp/factory-agent-logs/{run_id}.log`.

## Image & Design Attachment System (CR #36)
- **New DB table:** `fd_issue_attachments` — id (uuid PK), issue_number (int), filename, file_type, storage_path, url, uploaded_by (auth.uid FK), created_at
  - RLS: all authenticated can SELECT; uploader-only INSERT; uploader+admin DELETE
  - Migration: `20260312200000_issue_attachments.sql`
- **Storage bucket:** `issue-attachments` — public, 10MB limit, path: `issues/{issue_number}/{uuid}.{ext}`
- **lib/storage.ts BUCKETS:** `issueAttachments: 'issue-attachments'` (alongside existing pencilDesigns)
- **lib/attachments.ts:** Client helpers — `uploadAttachment()`, `listAttachments()`, `deleteAttachment()`, type validators
- **New API routes:**
  - `POST /api/issues/[number]/attachments` — multipart upload, validates type+size+count limit (10 files, 10MB each)
  - `GET /api/issues/[number]/attachments` — list all attachments for an issue
  - `DELETE /api/issues/[number]/attachments/[id]` — deletes from Storage + DB; 403 for non-owner non-admin
  - `GET /api/attachments/[id]` — redirects to signed URL (60s) for download
  - `GET /api/issues/[number]/attachment-context` — returns formatted markdown string for pipeline agent prompt injection
- **Components in `src/components/attachments/`:**
  - `AttachmentUploader.tsx` — drag-and-drop zone, file preview, upload progress, multi-file queue; uses `BUCKETS.issueAttachments`
  - `AttachmentGallery.tsx` — image grid + yet-another-react-lightbox, PDF iframe modal, .pen badge, delete confirm, "Add file" button
  - `AttachmentItem.tsx` — single thumbnail card with hover overlay (zoom/download/delete); non-image shows FileText icon + type badge
  - `PenFileBadge.tsx` — .pen file display with violet styling, "Open in Pencil" deep link (`pencil://open?url=...`), download button
- **NewIssueModal integration:** Added `ModalFileQueue` component (inline file queue, deferred upload); files are stored as `File[]` state then uploaded after GitHub issue creation using the returned `result.number`
- **Issue detail page integration:** `AttachmentGallery` added inside the Description card, below `IssueBody`, passes `currentUserId` + `isAdmin` from server component
- **Pipeline context injection:** `GET /api/issues/[number]/attachment-context` returns formatted `## Attached Files` block; pipeline orchestrator calls this before dispatching SPEC/DESIGN/BUILD agents
- **Allowed file types:** PNG, JPG, GIF, SVG, PDF, .pen (application/x-pencil)
- **Light mode design:** attachment components use inline styles from issue #36 DESIGN.md (white surfaces, #2563EB primary) — intentional contrast within dark dashboard shell
- **data-testid attributes:** `attachment-dropzone`, `attachment-file-input`, `attachment-preview`, `attachment-gallery`, `attachment-item`, `delete-attachment-btn`, `pen-file-badge`

## Cost Analytics & ROI Dashboard (Issue #25)
- **Primary data source:** `dash_agent_runs` (has `estimated_cost_usd`, `model`, `repo`, `station`, `duration_seconds`, `run_status`)
- **NOTE:** Spec referenced `dash_stage_transitions` for cost data, but actual cost data is on `dash_agent_runs`. Analytics API routes query `dash_agent_runs`.
- **New API routes (all require authenticated session):**
  - `GET /api/analytics/costs` — totals (all-time/month/week/today), by_app, by_station, by_model
  - `GET /api/analytics/roi` — cost_per_issue, avg_time_to_deploy_hours, qa_first_try_rate, issues_completed
  - `GET /api/analytics/trends` — time-series cost data; granularity: day|week|month
  - `GET /api/analytics/export` — CSV download with active filters
- **New components:** `src/app/dashboard/analytics/` — AnalyticsDashboard, TotalsGrid, ROIMetricsGrid, SpendByAppChart, SpendByStationChart, SpendByModelChart, SpendOverTimeChart, FilterBar, ExportButton
- **Hooks:** `useAnalyticsCosts`, `useAnalyticsROI`, `useAnalyticsTrends` — all in `src/app/dashboard/analytics/hooks/`
- **Filter state:** persisted in URL search params (from, to, repo, granularity)
- **Column mapping:** `estimated_cost_usd` (not `cost_usd`), `repo` (not `build_repo`), `started_at` (not `created_at`), `run_status` (not `status`)
- **ROI QA rate:** (issues without bugfix / total issues) × 100
- **Migration:** `20260312210000_analytics_indexes.sql` — perf indexes on dash_agent_runs only

## Change Request Notes
- **Primary color is now #6366F1 (indigo)** — not the old blue. Update any hardcoded blue references.
- All UI uses dark mode (zinc-950 background) — maintain this in all new components
- Use shadcn/ui components (Dialog, Form, Button, etc.) for consistency
- Toast notifications via Sonner — use `toast.success()` / `toast.error()`
- New API routes go in `src/app/api/` — use `createSupabaseServerClient()` for user-scoped and `createSupabaseAdminClient()` for admin operations
- The Kanban board auto-syncs every 60s — new features should work with this cycle
- Sidebar collapse state persists in localStorage('sidebar-collapsed')
- Add `data-testid="skeleton"` to new skeleton components, `data-testid="empty-state"` to empty states

## Template & Environment Management (CR #20)
- **New DB tables:**
  - `dash_templates` — template registry with CRUD; RLS: all authenticated can read, only admin can write; unique index enforces one default per project_type
  - `dash_key_rotation_log` — audit log for API key rotation events; RLS: admin-only read/insert
- **New API routes (all under /api/config/):**
  - `GET /api/config/templates` — list all templates (authenticated)
  - `POST /api/config/templates` — create template (admin only); 409 if slug taken
  - `PATCH /api/config/templates/[id]` — update template, handles is_default atomically (admin only)
  - `DELETE /api/config/templates/[id]` — delete template; 400 if only default for project type (admin only)
  - `GET /api/config/env-status` — returns env var names + masked_preview + set/missing status; never returns values
  - `POST /api/config/health-check` — live connectivity tests to GitHub/Supabase/Vercel/Anthropic; not cached
  - `GET /api/config/keys` — API key status + rotation history; resolves rotated_by UUID to email (admin only)
  - `POST /api/config/keys/rotate` — logs rotation event to dash_key_rotation_log (admin only)
- **Settings page refactored** — sidebar tab navigation: General | Users (admin) | Templates | Environment | API Keys (admin)
- **Components all in SettingsClient.tsx:**
  - `TemplateRegistryPanel` — table + Add/Edit/Delete modals, role-gated
  - `TemplateModal` — add or edit form, slug disabled on edit
  - `DeleteTemplateModal` — confirm delete with error display
  - `EnvStatusPanel` — env var list + health check grid (2×2)
  - `ServiceStatusRow` — per-service health indicator with latency
  - `ApiKeyPanel` — key table + rotation history
  - `RotateKeyModal` — log rotation with success state
- **Masking rule:** first 4 + `****...****` + last 3 chars; if <10 chars: `****`
- **Health check services:** GitHub (`/user`), Supabase (`/rest/v1/`), Vercel (`/v2/user`), Anthropic (`/v1/models`)
- **data-testid attributes:** `add-template-btn`, `template-table`, `template-row`, `edit-template-btn`, `delete-template-btn`, `env-var-list`, `env-var-row`, `run-health-check-btn`, `health-check-spinner`, `health-check-results`, `service-status-row`, `key-row`, `rotate-key-btn`, `confirm-rotate`

## Spec Review & Approval Flow (CR #18)
- **New route:** Opens as slide-over panel from the Kanban board when clicking a `station:spec` issue card
- **New API routes:**
  - `GET /api/specs/[issueNumber]?repo=...` — fetches spec comment from GitHub (looks for heading-heavy comment or `<!-- SPEC -->` marker)
  - `POST /api/specs/approve` — marks spec approved (`spec_approved=true`), optional `skipDesign` flag to advance station to `design`
  - `POST /api/specs/feedback` — posts feedback comment to GitHub issue via Octokit
- **New DB tables:** `factory_spec_activities` (FK to `dash_issues.id`), new columns added to `dash_issues` (`spec_approved`, `spec_approved_by`, `spec_approved_at`, `spec_approval_notes`)
- **New components:** `src/components/spec-review/` — SpecReviewPanel (main), SpecMarkdownRenderer, SpecSectionHighlighter, SpecMetadata, SpecActionBar, ApproveConfirmDialog, FeedbackDialog, SkipDesignConfirmDialog, SpecActivityFeed
- **KanbanBoard integration:** `KanbanBoard.tsx` shows `SpecReviewPanel` instead of `IssueDetailPanel` for `station:spec` issues
- **dash_issues.id is bigint** — `factory_spec_activities.issue_id` is bigint FK, not UUID
- **data-testid attributes:** `spec-review-panel`, `spec-markdown-renderer`, `spec-section-nav`, `spec-metadata`, `spec-activity-feed`, `spec-action-approve`, `spec-action-request-changes`, `spec-action-skip-design`, `approve-confirm-dialog`, `feedback-dialog`, `skip-design-confirm-dialog`
- **KanbanColumn test ID changed:** `data-testid` is now `kanban-column-station-{station}`
- **Migration:** `20260313100000_spec_review_flow.sql`

## API Documentation & Event Log (CR #31)
- **New routes:** `/dashboard/docs` (API docs), `/dashboard/admin/events` (event log)
- **New DB table:** `fdash_event_log` — stores incoming GitHub webhooks + outgoing notification events
  - Columns: id (uuid PK), direction (in/out), event_type, source, payload (jsonb), status (received/delivered/failed), retry_count, last_retried_at, created_at
  - RLS: SELECT for authenticated; INSERT/UPDATE for service_role only
  - Migration: `20260312140000_spec_schema_issue31.sql`
- **New API routes:**
  - `GET /api/admin/events` — paginated event log; filters: direction, event_type, status, from, to; payload truncated to 500 chars in list view
  - `POST /api/admin/events/[id]/retry` — retry failed outgoing webhook; increments retry_count + sets last_retried_at; 400 if not failed out event
  - `GET /api/docs/routes` — returns `ROUTE_MANIFEST` from `src/lib/route-manifest.ts` (static file, NOT dynamic FS scan)
- **Route manifest:** `src/lib/route-manifest.ts` — hand-authored static list of all API routes; update this when adding new routes
- **New components:**
  - `src/components/event-log/EventDirectionBadge.tsx` — IN (blue) / OUT (purple) pill
  - `src/components/event-log/EventStatusBadge.tsx` — received/delivered/failed with color coding
  - `src/components/event-log/PayloadViewer.tsx` — dark JSON viewer with line numbers, syntax highlighting, copy button
- **Event logging on ingest:** Webhook handler (`src/app/api/webhooks/github/route.ts`) inserts to `fdash_event_log` via fire-and-forget upsert after processing. Uses `onConflict: 'id'` pattern.
- **Design:** These pages use light mode (bg `#FAFBFC`) within the existing dark AppShell — intentional per DESIGN.md for this CR. Primary color #2563EB for these pages.
- **Sidebar:** Added `BookOpen` (API Docs) and `Radio` (Event Log) icons + nav items
- **Filters:** Direction/event_type/status/date-range filters persist in URL query string for shareability
- **data-testid attributes:** `route-card`, `event-row`, `payload-viewer`, `retry-button`

## Vercel Deployment Status & Management (Issue #38)
- **New DB table:** `fdash_vercel_cache` — TTL cache for Vercel API responses
  - Columns: id (uuid PK), cache_key (text UNIQUE), data (jsonb), cached_at (timestamptz), expires_at (timestamptz)
  - Auth trigger `trg_fdash_purge_expired_cache` auto-deletes expired rows on insert/update
  - **MUST use upsert (`ON CONFLICT (cache_key) DO UPDATE`) — never plain insert**
  - Migration: `20260312150000_fdash_vercel_cache.sql`
- **New API routes (all server-side, VERCEL_API_TOKEN never exposed to client):**
  - `GET /api/deployments/[repoId]` — lists last 10 deployments; cache key `deployments:{repoId}`, TTL 2 min
  - `GET /api/deployments/[repoId]/[deployId]` — deployment detail + build logs; cache key `deployment:{repoId}:{deployId}`, TTL 5 min
  - `POST /api/deployments/[repoId]/redeploy` — triggers redeploy of latest prod deployment; busts `deployments:{repoId}` cache
  - `GET /api/deployments/[repoId]/domains` — domain list; cache key `domains:{repoId}`, TTL 10 min
  - `GET /api/deployments/[repoId]/env` — env var names only (values NEVER returned); cache key `env:{repoId}`, TTL 10 min
- **New lib files:**
  - `src/lib/vercel-api.ts` — Vercel REST API v6 client (fetchDeployments, fetchDeploymentDetail, triggerRedeploy, fetchDomains, fetchEnvVars)
  - `src/lib/vercel-cache.ts` — getCached/setCached/invalidateCache using fdash_vercel_cache via admin client
- **New components in `src/components/apps/DeploymentPanel/`:**
  - `index.tsx` — Container: fetches all data, orchestrates panel, auto-refreshes when BUILDING
  - `StatusBadge.tsx` — READY (green + pulse), BUILDING (yellow + spin), ERROR (red), CANCELED (gray)
  - `ProductionBadge.tsx` — production URL link, status badge, relative time, build duration
  - `DeploymentList.tsx` — table of last 10 deployments with header row
  - `DeploymentRow.tsx` — commit SHA, message, author, status badge, timestamp; click opens drawer
  - `BuildLogDrawer.tsx` — slide-from-right drawer: commit info, metrics, preview URL, scrollable log lines
  - `RedeployButton.tsx` — POST /redeploy, loading state, sonner toast on success/error
  - `DomainList.tsx` — domains with verified badge, production badge, copy-to-clipboard
  - `EnvVarList.tsx` — env var names with present/missing indicator; values NEVER shown
  - `MetricsChart.tsx` — Recharts line charts for build duration; bundle size chart placeholder
- **App detail page updated:** `/dashboard/apps/[repoId]/page.tsx` now embeds `<DeploymentPanel repoId={vercelProjectId} />`
  - Falls back to URL `repoId` if `app.vercel_project_id` is null
- **Required env vars:**
  - `VERCEL_API_TOKEN` — Vercel personal/team access token (server-only, never exposed)
  - `VERCEL_TEAM_ID` — Vercel team ID (optional; omit for personal accounts)
- **data-testid attributes:** `production-status-badge`, `production-deployment-url`, `deployment-row`, `build-log-drawer`, `build-log-content`, `commit-sha`, `commit-author`, `redeploy-button`, `domain-row`, `copy-url-button`, `env-var-list`, `build-time-chart`, `bundle-size-chart`
- **Design:** Uses the existing dark color system (surface #141419 = var(--surface), border #2A2A36 = var(--border)); primary blue #3B82F6 for this panel (Vercel-aligned); BUILDING status shows yellow spinner
- **Animations added to globals.css:** `@keyframes shimmer`, `@keyframes vercel-dot-pulse`, `@keyframes spin`
- **Live URL:** https://factory-dashboard-tau.vercel.app

## User Management & Admin Panel (Issue #24)
- **New routes:**
  - `/dashboard/admin/users` — Admin-only user list with invite, role change, deactivate/reactivate, bulk actions, search/filter
  - `/dashboard/admin/audit` — Admin-only audit log (append-only view of all user management actions)
  - `/dashboard/settings/profile` — Profile settings for all roles: display name edit, read-only email+role, change password
- **New DB tables:**
  - `fd_user_roles` — user_id (FK auth.users), role (admin/operator/viewer), is_active (bool), updated_by, timestamps. **Use upsert() not insert() — unique constraint on user_id**. RLS: admins see all; users see own row.
  - `fd_audit_log` — actor_id, target_user_id, action, details (jsonb), created_at. **Append-only** — no DELETE RLS policy. Service-role writes only.
  - Migration: `20260312220000_fd_user_roles_audit.sql`
- **New API routes:**
  - `GET /api/admin/users` — list all users with roles/status (admin only); query: search, role, status, page, pageSize
  - `POST /api/admin/users/invite` — Supabase `inviteUserByEmail()` + upsert fd_user_roles; 409 if email exists
  - `PATCH /api/admin/users/:id` — update role/is_active; calls Supabase ban/unban; writes audit log; self-demotion and self-deactivation blocked
  - `POST /api/admin/users/bulk` — bulk role_change / deactivate / reactivate; excludes actor's own account
  - `POST /api/auth/change-password` — verifies current password by signInWithPassword then calls updateUser
  - `PATCH /api/auth/profile` — updates `raw_user_meta_data.full_name`; validates 2–50 chars
  - `GET /api/admin/audit` — paginated audit log with enriched actor/target user info (admin only)
- **New lib:**
  - `src/lib/roles.ts` — `getUserRole(userId)` via service-role client; `writeAuditLog()` helper
  - `src/lib/storage.ts` — added `avatars: 'fd-avatars'` bucket constant (Phase 2)
- **Components in `src/app/dashboard/admin/users/_components/`:** UserManagementClient, RoleBadge, StatusBadge, InviteUserModal, EditRoleModal, DeactivateModal, BulkActionsBar, UserFilters
- **Key behavior:**
  - Role allowlist pattern: `['admin'].includes(role)` — never `role !== 'viewer'`
  - Admin cannot self-demote or self-deactivate
  - Own account row has no checkbox (excluded from bulk)
  - Supabase ban_duration `87600h` = effectively permanent ban for deactivated users; `none` to unban
  - Password change: re-authenticates with current password before calling updateUser
  - Audit actions: invite, role_change, deactivate, reactivate, password_change
- **data-testid attributes:** `invite-user-btn`, `send-invite-btn`, `row-actions-btn`, `deactivate-btn`, `confirm-deactivate-btn`, `status-badge`, `save-profile-btn`, `change-password-btn`, `error-message`, `toast-success`, `toast-error`

## Pencil.dev Design Integration (CR #37)
- **New routes:**
  - `/dashboard/apps/[repoId]/designs` — Design gallery per app (all .pen files across issues)
  - `/dashboard/apps/[repoId]/designs/[issueNumber]` — Design detail viewer for a specific issue
- **New API routes (all require authentication):**
  - `GET /api/designs/[repoId]` — list all .pen designs for a repo
  - `GET /api/designs/[repoId]/[issueNumber]` — latest design for an issue (user > pipeline)
  - `GET /api/designs/attachment/[attachmentId]` — signed URL (60s) for user-uploaded .pen
  - `POST /api/designs/parse` — validate + summarize .pen JSON (frame count, tokens)
  - `POST /api/designs/upload` — upload user .pen; stores in Supabase Storage + adds has-design-reference label
- **New DB tables:**
  - `pencil_designs` — repo_id, issue_number, file_url, commit_sha, version, source ('pipeline'|'user'). Service role inserts pipeline; authenticated inserts user.
  - `pencil_design_attachments` — user-uploaded metadata: repo_id, issue_number, storage_path, file_name, file_size, uploaded_by (auth.uid()).
  - Migration: `20260312170000_pencil_designs.sql`
- **Storage bucket:** `pencil-designs` (private) — user .pen files at `{repoId}/{issueNumber}/{filename}`
- **Lib files:** `src/lib/storage.ts` (BUCKETS), `src/lib/pen-types.ts` (all .pen types)
- **Hooks:** `src/hooks/usePenParser.ts`, `src/hooks/useDesigns.ts`
- **Components in `src/components/pencil/`:** PenFrameCanvas (HTML Canvas renderer), PenFrameGrid, PenFrameDetail, PenDesignTokens, PenOpenButton, PenDownloadButton, PenFileViewer, DesignGallery, DesignVersionHistory, DesignUploadButton, DesignReferenceTag, EmptyGallery
- **Variable resolution:** `{variable.name}` tokens in fill/stroke/color resolved from canvas.variables; missing vars fall back to #cccccc
- **Design system:** Pencil pages use light mode (#FDFCFB bg, #E85D4C primary) via inline styles — dashboard shell remains dark
- **GitHub label:** `has-design-reference` (color #0075ca) auto-created and applied on user .pen upload
- **storage.objects.owner policy:** uses `owner::uuid = auth.uid()` to avoid uuid=text type mismatch
- **data-testid attributes:** `pen-frame-thumbnail`, `pen-frame-detail`, `pen-tab-tokens`, `pen-tab-frames`, `pen-tokens-panel`, `pen-download-btn`, `nav-tab-designs`, `design-gallery-item`, `design-gallery-empty`, `pen-upload-input`, `design-reference-tag`, `upload-error`

## CR #84 — Sign-out URL + Test DB Fixtures + Stats Consistency
_Source: https://github.com/ascendantventures/harness-beta-test/issues/84_

### Changes Made

**REQ-FD-001: Sign-out redirect fix**
- File: `src/components/layout/Sidebar.tsx`
- Added `data-testid="sign-out-button"` to the sign-out button
- Changed `router.push('/auth/login')` to use `NEXT_PUBLIC_APP_URL` env var when set:
  `router.push(process.env.NEXT_PUBLIC_APP_URL ? ${NEXT_PUBLIC_APP_URL}/auth/login : '/auth/login')`
- Added `scope: 'global'` to `signOut()` for proper session cleanup
- **Required env var:** `NEXT_PUBLIC_APP_URL=https://factory-dashboard-tau.vercel.app` (set in Vercel production)
- **Supabase config:** Add `https://factory-dashboard-tau.vercel.app/**` to Auth > URL Configuration > Redirect URLs

**REQ-FD-002: Test DB fixtures**
- New file: `supabase/seeds/test-fixtures.sql`
- Inserts 1 row into `dash_build_repos` (github_repo: ascendantventures/factory-dashboard)
- Inserts 3 rows into `dash_issues` with `build_repo: ascendantventures/factory-dashboard` in body
- Uses bigint IDs 9000101–9000103 to avoid collision with real data
- All inserts are idempotent (ON CONFLICT DO NOTHING)
- **To apply:** `psql $BUILD_WORK_DB_URL -f supabase/seeds/test-fixtures.sql`

**REQ-FD-003: Stats count consistency**
- File: `src/app/dashboard/apps/[repoId]/page.tsx` — added `data-testid="app-issue-count-header"` to total count span
- File: `src/components/apps/AppCard.tsx` — added `data-testid="app-issue-count-stats"` to total count span
- Both counts come from the same API logic (`bodyMatch || numberMatch`) — already consistent, testids enable E2E verification

**New E2E test files:**
- `tests/e2e/signout-redirect.spec.ts`
- `tests/e2e/stats-consistency.spec.ts`

## CR #85 — Templates Sidebar Discoverability & Mobile Nav
_Source: https://github.com/ascendantventures/harness-beta-test/issues/85_

### Changes Made

**REQ-85-001: Templates link in admin sidebar**
- File: `src/components/layout/Sidebar.tsx`
- Added `FileStack` icon import from lucide-react
- Added Templates nav item (after Audit Log, before Settings): `{ href: '/dashboard/settings?tab=templates', label: 'Templates', icon: FileStack, exact: false }`
- Updated `isActive()` to detect query-param-based active state (`?tab=templates`)

**REQ-85-002: Templates in mobile bottom nav**
- File: `src/components/layout/MobileBottomNav.tsx`
- Added `FileStack` icon + Templates as 6th nav item (between Metrics and Settings)
- Added `data-testid="mobile-nav"` to `<nav>` element

**REQ-85-003: QuickCreate repository dropdown**
- New file: `src/components/ui/RepositorySelector.tsx` — shared dropdown fetching `/api/build-repos`, display names, loading/empty/error states
- File: `src/components/NewIssueModal.tsx` — `trackedRepos` prop removed; Target Repository uses `RepositorySelector`
- File: `src/components/ui/NewIssueButton.tsx` — added `data-testid="quick-create-trigger"`, removed `trackedRepos={[]}`

### data-testid attributes added
- `data-testid="mobile-nav"` — mobile bottom nav
- `data-testid="quick-create-trigger"` — New Issue button
- `data-testid="repo-selector"` — repository selector dropdown
- `data-testid="repo-selector-error"` — inline validation error

## Bug Fix: Mobile Bottom Nav Admin Entry (Issue #86)
_Source: https://github.com/ascendantventures/harness-beta-test/issues/86_

### Changes Made

**REQ-UMP-005-FIX-001: Role-aware MobileBottomNav**
- File: `src/components/layout/MobileBottomNav.tsx`
- Replaced static 6-item `NAV_ITEMS` array with role-aware logic
- Added `useEffect` role check using `createSupabaseBrowserClient()` + `fd_user_roles` query
- Admin users see: Dashboard, Apps, Activity, Metrics, **Admin** (Shield icon, `data-testid="bottom-nav-admin"`, href=/dashboard/admin/users)
- Non-admin users see: Dashboard, Apps, Activity, Metrics, **Settings**
- Removed `Templates` from mobile nav (was 6th item, now exactly 5 items)
- Removed `FileStack` import (Templates removed), added `Shield` import
- Initial render shows Settings (non-admin default); swaps to Admin after role check succeeds

**REQ-UMP-005-FIX-002: is_active data fix**
- BUILD verified `fd_user_roles.is_active` must be `true` for admin users
- If `is_active` is NULL/false for any admin, apply: `UPDATE fd_user_roles SET is_active = true WHERE role = 'admin' AND (is_active IS NULL OR is_active = false);`

### data-testid attributes
- `data-testid="mobile-nav"` — nav container (unchanged)
- `data-testid="bottom-nav-admin"` — Admin link (admin users only)

### Known Gotcha
- Role check is async (useEffect); initial render always shows Settings. Admin swap happens in <100ms. This is intentional (no loading state per DESIGN.md).
- `fd_user_roles.is_active` MUST be `true` for admin role to render the Admin nav item.

## Bug Fix: fd_user_roles Data + Code Hardening (Issue #89)
_Source: https://github.com/ascendantventures/harness-beta-test/issues/89_

### Root Cause
`fd_user_roles.is_active` was NULL/false for the admin user (`ajrrac@gmail.com`), causing `getUserRole()` to return `'viewer'` (since `!null === true`). Mobile nav showed Settings instead of Admin.

### Changes Made

**REQ-BUG89-001: SQL data fix (applied directly to Supabase `xvniwehnspnxlnerbfwj`)**
- Migration: `supabase/migrations/20260314020000_fix_fd_user_roles_default_issue89.sql`
- `ALTER TABLE fd_user_roles ALTER COLUMN is_active SET DEFAULT true` — prevents future NULL inserts
- `UPDATE fd_user_roles SET is_active = true WHERE role = 'admin' AND (is_active IS NULL OR is_active = false)` — idempotent data fix
- Admin row for `ajrrac@gmail.com` (UUID: `b4c20f13-15de-4ef4-b297-8358f9049262`) upserted with `is_active = true`
- RLS policy `fd_user_roles_self_select` added (users can read their own row)

**REQ-BUG89-002: getUserRole() hardening (`src/lib/roles.ts`)**
- Changed `if (!data || !data.is_active)` → `if (!data || data.is_active === false)`
- NULL `is_active` is now treated as truthy — legacy rows without the flag set are not silently demoted

**REQ-BUG89-003: MobileBottomNav settings testid (`src/components/layout/MobileBottomNav.tsx`)**
- Added `testId: 'bottom-nav-settings'` to `SETTINGS_ITEM` — enables QA to verify settings item is absent for admin users

### Critical: fd_user_roles table setup
- The `fd_user_roles` table is in Supabase project `xvniwehnspnxlnerbfwj` (the project the app actually uses per Vercel env vars)
- This is different from the `factory-dashboard` supabase project (`dkibmvieqomkznxuugri`) — do NOT link to that one for migrations
- Always `supabase link --project-ref xvniwehnspnxlnerbfwj` before pushing migrations for this app

---

## UAT Fix: Webhook Preset Auto-apply + List Page Crash (Issue #87)
- **Issue:** https://github.com/ascendantventures/harness-beta-test/issues/87
- **Fixes applied in commit:** `50ec416` on `feature/issue-77`
- **Bug 1 (REQ-WHK-FIX-001):** Webhook preset auto-apply broken — replaced `useEffect`-based initialization in `WebhookForm.tsx` with direct `useState` initialization from `defaultPreset` prop. The `useEffect` approach caused hydration mismatch in Next.js 16 where `useEffect` fires AFTER hydration, making preset invisible on first render.
- **Bug 2 (REQ-WHK-FIX-002):** Webhook list server crash — caused by unused `import IntegrationPresets` in `page.tsx` (Server Component importing a `'use client'` component in a way that triggered SSR exception). Removed the import and added graceful error handling for the `fd_webhooks` query.
- **Key pattern:** In Next.js 16 App Router, never use `useEffect` to initialize state from props — initialize directly in `useState()`. `useEffect` runs post-hydration and causes visible flicker/failure.
- **No DB migrations required** — pure client/SSR bug fixes.

## CR #80 — Duplicate Breadcrumb Fix (Design Detail Page)
- **Issue:** https://github.com/ascendantventures/harness-beta-test/issues/80
- **Route affected:** `/dashboard/apps/[repoId]/designs/[issueNumber]`
- **Root cause:** `PenFileViewer.tsx` contained an inline `<nav>` (lines 55-73) rendering raw `repoId` UUID with no `aria-label`. The design detail page already had a correct breadcrumb above it.
- **Fix:** Removed the legacy `<nav>` block from `PenFileViewer.tsx`. Added accessible breadcrumb to `page.tsx` with `aria-label="breadcrumb"`, `useAppDisplayName` for UUID resolution, and `Issue #N` format.
- **New file:** `src/hooks/useAppDisplayName.ts` — fetches `/api/apps/[repoId]` and returns `display_name` (falls back to `repo_full_name`).
- **No DB migrations required** — UI-only fix.

## CR #108 — Users Page: Search, Filter Tabs, Test Badges, Role Confirmation, Bulk Delete
_Source: https://github.com/ascendantventures/harness-beta-test/issues/108_

### Changes Made

**New file: `src/lib/users.ts`**
- `TEST_ACCOUNT_PATTERNS` — regex array matching: `qa_`, `qa-`, `_test`, `+test`, `testuser+`, `test_*`, `test-*`
- `USERS_PAGE_SIZE = 20`
- `isTestAccount(email: string): boolean`

**Updated: `src/app/api/admin/users/route.ts`**
- Added `filter` query param (`all` | `real` | `test`) — filters by `isTestAccount()`
- Added `isTestAccount` field to each user in response
- Added `counts: { all, real, test }` to response (for tab badges)
- Added `totalPages` to response

**Updated: `src/app/api/admin/users/bulk/route.ts`**
- Added `delete` action — calls `supabase.auth.admin.deleteUser()` + cleans `fd_user_roles`
- Added `DELETE` HTTP method handler for `{ userIds: string[] }` body

**New file: `src/app/api/admin/users/[id]/role/route.ts`**
- `PATCH /api/admin/users/[id]/role` — dedicated role-change endpoint with audit log

**New file: `src/app/dashboard/admin/users/_components/UserFilterTabs.tsx`**
- Tabs: All / Real / Test Accounts with count badges
- `data-testid`: `filter-tab-all`, `filter-tab-real`, `filter-tab-test`

**New file: `src/app/dashboard/admin/users/_components/TestAccountBadge.tsx`**
- Amber "TEST" badge with FlaskConical icon
- `data-testid`: `test-account-badge`

**New file: `src/app/dashboard/admin/users/_components/RoleChangeConfirmDialog.tsx`**
- Modal: "Change {email} from {oldRole} → {newRole}?"
- `data-testid`: `role-confirm-dialog`, `confirm-cancel`, `confirm-submit`

**New file: `src/app/dashboard/admin/users/_components/BulkDeleteConfirmDialog.tsx`**
- Modal with AlertTriangle icon + warning for >5 users
- `data-testid`: `bulk-delete-dialog`

**Overhauled: `src/app/dashboard/admin/users/_components/UserManagementClient.tsx`**
- Dark mode design (matching DESIGN.md: #18181B surface, #6366F1 primary, #FAFAFA text)
- Inline `RoleSelector` dropdown per row — triggers `RoleChangeConfirmDialog` on change
- `TestAccountBadge` shown inline with email for matching users
- `BulkActionBar` (sticky bottom) with "Delete N Selected" → `BulkDeleteConfirmDialog`
- Single-user delete via Trash2 icon in actions column
- Pagination: Prev/Next with page count display
- All required `data-testid` attributes added

### data-testid Reference (Issue #108 additions)
| Element | data-testid |
|---------|-------------|
| Search input | `user-search` |
| Filter tab: All | `filter-tab-all` |
| Filter tab: Real | `filter-tab-real` |
| Filter tab: Test | `filter-tab-test` |
| User table | `user-table` |
| User row | `user-row` |
| User email | `user-email` |
| Test account badge | `test-account-badge` |
| Role dropdown | `role-dropdown` |
| Role confirm dialog | `role-confirm-dialog` |
| Confirm cancel button | `confirm-cancel` |
| Confirm submit button | `confirm-submit` |
| Select all checkbox | `select-all-checkbox` |
| Bulk action bar | `bulk-action-bar` |
| Bulk delete button | `bulk-delete-btn` |
| Bulk delete dialog | `bulk-delete-dialog` |
| Pagination | `pagination` |

### No DB migrations required
All operations use existing `auth.users` (Supabase Admin API) and `fd_user_roles` table.
