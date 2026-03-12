# REGRESSION.md — Feature Test Manifest

This file lists every testable feature in the Factory Dashboard.
QA and UAT agents run through this ENTIRE list on every build.
If any existing feature breaks, the build fails.

**Format:** Each feature has test steps and expected results.
Tests marked `[auth]` require login first.

---

## Authentication
_Core: Issue #2_

### Test Steps
- [ ] Navigate to /auth/login — login form renders
- [ ] Enter valid credentials (ajrrac@gmail.com) and submit — redirects to /dashboard
- [ ] Enter invalid credentials — shows error message, stays on login page
- [ ] Navigate to /dashboard without auth — redirects to /auth/login
- [ ] Click Sign Out — redirects to login page, session cleared

### Routes
- /auth/login
- /dashboard (protected)

---

## Kanban Board [auth]
_Core: Issue #2, Enhanced: #9, #13_

### Test Steps
- [ ] /dashboard loads the Kanban board with columns: Intake, Spec, Design, Build, QA, Bugfix, Done
- [ ] Each column shows issue count and total cost
- [ ] Issue cards display: title, repo tag, complexity badge, cost, issue number
- [ ] Cards are draggable (drag handles visible)
- [ ] Clicking a card opens issue detail or navigates to issue page
- [ ] Board auto-refreshes every 60 seconds (sync indicator updates)
- [ ] "Sync" button triggers manual sync from GitHub

### Routes
- /dashboard

---

## Create Issue [auth]
_Core: Issue #7_

### Test Steps
- [ ] "New Issue" button is visible in the global header
- [ ] Clicking it opens the create issue modal/form
- [ ] Form includes: title, description, target app (dropdown)
- [ ] Target app dropdown shows clean display names (not raw repo paths)
- [ ] Submitting creates a GitHub issue with station:intake label
- [ ] New issue appears on the Kanban board after sync
- [ ] Form validates required fields

### Routes
- Modal triggered from header

---

## Apps Page [auth]
_Core: Issue #11_

### Test Steps
- [ ] /dashboard/apps lists all build repos as cards (must return 200 — if 500, check for `github_issue_url` column error)
- [ ] Each card shows: app name, status, live URL
- [ ] Clicking an app navigates to /dashboard/apps/[repoId]
- [ ] App detail page loads without errors
- [ ] GET /api/apps returns 200 (not 500 "column github_issue_url does not exist")

### Routes
- /dashboard/apps
- /dashboard/apps/[repoId]

---

## Activity Feed [auth]
_Core: Issue #12_

### Test Steps
- [ ] /dashboard/activity shows pipeline events
- [ ] Events include: agent spawns, stage transitions, build completions
- [ ] Events are chronologically ordered (newest first)
- [ ] Page loads without errors

### Routes
- /dashboard/activity

---

## Metrics [auth]
_Core: Issue #2_

### Test Steps
- [ ] /dashboard/metrics loads without errors
- [ ] Shows cost data if available
- [ ] /dashboard/costs loads without errors (alternate route)

### Routes
- /dashboard/metrics
- /dashboard/costs

---

## Settings [auth]
_Core: Issue #2_

### Test Steps
- [ ] /dashboard/settings loads without errors
- [ ] Shows tracked repos configuration
- [ ] Settings are editable by admin users

### Routes
- /dashboard/settings

---

## Navigation [auth]
_Core: Issue #14_

### Test Steps
- [ ] Left sidebar shows all nav items: Dashboard, Apps, Activity, Metrics, Pipeline, API Docs, Event Log, Settings
- [ ] Each nav item navigates to the correct page
- [ ] Active page is highlighted in the sidebar
- [ ] User info (name, email) shown at bottom of sidebar
- [ ] Sign Out link works
- [ ] Search bar visible in header (Cmd+K shortcut hint)
- [ ] Notification bell icon visible in header

### Routes
- All /dashboard/* routes

---

## Sync [auth]
_Core: Issue #2_

### Test Steps
- [ ] Sync status indicator shows last sync time
- [ ] Manual sync button triggers GitHub → Supabase sync
- [ ] New GitHub issues appear on the board after sync
- [ ] Label changes in GitHub reflect on the Kanban board after sync

### Routes
- /api/sync (POST)
- /api/sync/status (GET)

---

## Build Repo Dropdown [auth]
_Core: Issue #8_

### Test Steps
- [ ] Target App dropdown in create issue shows deduplicated entries
- [ ] Dropdown shows clean display names (e.g., "Factory Dashboard" not "factory-dashboard — ...")
- [ ] Selecting a repo correctly associates the issue with that build repo

### Routes
- /api/build-repos (GET)

---

## Image & Design Attachment System [auth]
_Issue #36 — Added: 2026-03-12_

### Upload (Create Issue flow)

- [ ] [auth] Open the Create Issue modal (click "New Issue" button in header)
- [ ] Scroll to the "Attachments" section — drag-and-drop zone renders with "Drop files here or click to browse" text
- [ ] Drag a PNG file onto the drop zone — file appears in preview list with thumbnail, filename, and file size
- [ ] Click the drop zone — file browser opens; select a .pdf file — appears in list with extension label
- [ ] Add a .pen file — appears in list with "pen" extension label
- [ ] Try to add a .exe file — error message appears: "type not supported"
- [ ] Try to add a file over 10MB — error message appears: "exceeds 10MB"
- [ ] Complete the form (title + description + repo) and submit — issue created successfully; attachments uploaded to the new issue number
- [ ] Toast shows "Issue created" with link to GitHub

### Gallery (Issue Detail page)

- [ ] [auth] Navigate to /dashboard/issues/[number] for an issue with attachments
- [ ] "Attachments" section renders below the Description, above Agent Runs
- [ ] Image thumbnails display in a responsive grid (auto-fill, minmax 160px)
- [ ] Click an image thumbnail — lightbox opens full-screen
- [ ] Press left/right arrow keys in lightbox — navigates between images
- [ ] Press Escape — lightbox closes
- [ ] PDF attachment shows FileText icon with "PDF" badge; click opens PDF iframe modal
- [ ] PDF modal has Close button and Download button; Close button dismisses modal
- [ ] .pen file renders as PenFileBadge (violet styling, not a thumbnail card)
- [ ] PenFileBadge has "Open in Pencil" button — URL is `pencil://open?url=...`
- [ ] PenFileBadge has "Download" button — triggers file download via /api/attachments/[id]
- [ ] Issue with no attachments shows empty state: "No attachments yet" with Add attachment button

### Add Attachment (from Issue Detail page)

- [ ] [auth] On issue detail page, click "Add file" button — AttachmentUploader zone appears inline
- [ ] Drop/select a valid file — shows upload progress bar then checkmark on completion
- [ ] Newly uploaded file appears in the gallery immediately after upload

### Delete

- [ ] [auth] As the file uploader, hover over an image thumbnail — delete button (red trash icon) appears in overlay
- [ ] Click delete — confirmation modal appears: "Delete attachment?" with filename
- [ ] Click "Keep file" — modal closes, file remains
- [ ] Click "Delete file" — file removed from gallery, removed from Supabase Storage
- [ ] [auth] As a non-owner non-admin, the delete button is NOT visible on hover overlay
- [ ] DELETE /api/issues/[number]/attachments/[id] as non-owner returns 403

### API Endpoints

- [ ] GET /api/issues/[number]/attachments returns 401 when not authenticated
- [ ] POST /api/issues/[number]/attachments returns 401 when not authenticated
- [ ] POST with unsupported file type returns 400 with descriptive error
- [ ] POST with file > 10MB returns 400 with size error
- [ ] POST when issue already has 10 attachments returns 400
- [ ] DELETE /api/issues/[number]/attachments/[id] returns 403 for non-owner
- [ ] GET /api/attachments/[id] redirects to a signed download URL
- [ ] GET /api/issues/[number]/attachment-context returns formatted markdown when attachments exist
- [ ] GET /api/issues/[number]/attachment-context returns `{ "context": "" }` for issues with no attachments

### Routes/Endpoints
- /dashboard/issues/[number] (issue detail with gallery)
- POST /api/issues/[number]/attachments
- GET /api/issues/[number]/attachments
- DELETE /api/issues/[number]/attachments/[id]
- GET /api/attachments/[id]
- GET /api/issues/[number]/attachment-context

---

## Enhanced App Management — Issue History, Stats, Timeline, Create Issue (Issue #35)
_Added: 2026-03-12_

### Test Steps

#### App Detail Page — Stats Bar [auth]
- [ ] Navigate to /dashboard/apps — click on any app card
- [ ] Verify stats bar appears below page header with 6 stat cards: Total Issues, Total Cost, Avg Cost, Success Rate, Active Issues, Last Deployed
- [ ] `data-testid="app-stats-bar"` is visible; `data-testid="stat-total-issues"` shows a number
- [ ] Stats bar shows "0", "$0.00", "—" gracefully for apps with no issues (no error/crash)

#### App Detail Page — Tab Navigation [auth]
- [ ] Three tabs are visible: "Overview", "Issues", "Timeline"
- [ ] Clicking "Overview" shows existing content (GitHub link, deployment panel, designs link)
- [ ] Clicking "Issues" shows the issue history table and filter bar
- [ ] Clicking "Timeline" shows the timeline view or empty state

#### Issue History Tab [auth]
- [ ] `data-testid="issue-history-table"` visible when on Issues tab
- [ ] `data-testid="filter-bar"` visible with Station, Complexity, date range controls
- [ ] Issues table shows columns: Issue #, Title, Station, Complexity, Cost, Date
- [ ] Station column shows colored badges (e.g., blue for "spec", cyan for "build", green for "done")
- [ ] Clicking Station filter dropdown and selecting a station filters the table (only that station shown)
- [ ] "Clear filters" button appears when any filter is applied; clicking it resets all filters
- [ ] Clicking a column header (Cost, Date, Station, Complexity) sorts the table
- [ ] Clicking an issue row opens the GitHub issue URL in a new tab
- [ ] When no issues match filters: `data-testid="issue-history-empty-state"` appears with "No issues found" heading
- [ ] When app has no issues at all: "No issues yet" empty state with "Create first issue" button

#### Create Issue Modal [auth]
- [ ] "New Issue" button visible in page header (amber/gold, Plus icon)
- [ ] Clicking "New Issue" opens the create issue modal (`data-testid="create-issue-modal"`)
- [ ] `data-testid="create-issue-repo"` is pre-filled with app's repo and is disabled/read-only
- [ ] Four quick-type buttons visible: Bug Report, Feature Request, Design Change, Performance Fix
- [ ] Clicking a quick-type button selects it (amber background), clicking again deselects
- [ ] Title field is required — submitting empty title shows error "Title is required"
- [ ] Clicking Cancel closes the modal without creating an issue
- [ ] Pressing Escape closes the modal
- [ ] Clicking modal backdrop (outside) closes the modal

#### Timeline Tab [auth]
- [ ] Clicking "Timeline" tab shows `data-testid="timeline-view"`
- [ ] If `fadash_timeline_events` is empty: `data-testid="timeline-empty-state"` visible with "No timeline events" heading
- [ ] If events exist: vertical timeline with event cards; each card shows event type, station badge, timestamp
- [ ] Failure events (event_type=failure) have red left border highlight
- [ ] Bugfix loop events have orange left border highlight

#### API Endpoints [auth]
- [ ] GET /api/apps/{repoId}/issues returns 200 with `{ issues: [...], total: N }` for authenticated user
- [ ] GET /api/apps/{repoId}/issues?station=build returns only build-station issues
- [ ] GET /api/apps/{repoId}/stats returns 200 with `{ total_issues, total_cost_usd, ... }`
- [ ] GET /api/apps/{repoId}/timeline returns 200 with `{ events: [...] }`
- [ ] All routes return 401 for unauthenticated requests

### Routes/Endpoints
- /dashboard/apps/[repoId] (updated — now has tabs)
- GET /api/apps/[repoId]/issues
- GET /api/apps/[repoId]/stats
- GET /api/apps/[repoId]/timeline
- POST /api/apps/[repoId]/issues
