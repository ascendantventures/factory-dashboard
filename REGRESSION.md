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
- [ ] /dashboard/apps lists all build repos as cards
- [ ] Each card shows: app name, status, live URL
- [ ] Clicking an app navigates to /dashboard/apps/[repoId]
- [ ] App detail page loads without errors

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

## In-App Notification Center (Issue #26)
_Added: 2026-03-12_

### Notification Bell [auth]
- [ ] Navigate to /dashboard — notification bell (data-testid="notification-bell") is visible in header
- [ ] With no unread notifications — notification badge (data-testid="notification-badge") is NOT visible
- [ ] POST /api/notifications/create with x-factory-secret header: `{"user_id": "<test-user-id>", "type": "spec_ready", "title": "Test notification", "body": "Test body", "link": "/dashboard"}` — returns 200 with `{id: "..."}
- [ ] Refresh /dashboard — notification badge shows "1" in red pill
- [ ] Click bell icon — notification panel (data-testid="notification-panel") opens below bell
- [ ] Click outside the panel — panel closes
- [ ] Press Escape key while panel is open — panel closes

### Notification Panel [auth]
- [ ] Open panel — shows notification item (data-testid="notification-item") with type icon, title, body text, relative timestamp
- [ ] Unread notification has left teal border and unread dot (data-testid="unread-dot") visible
- [ ] Click a notification — marks it as read (unread dot disappears), navigates to notification's link
- [ ] Return to /dashboard, open bell — unread count decremented, badge hidden if count = 0
- [ ] POST 3 more notifications, open panel — shows "Mark all read" button (data-testid="mark-all-read-btn")
- [ ] Click "Mark all read" — all notifications show as read, badge disappears, unread dot hidden on all items
- [ ] With no notifications — panel shows "All caught up" empty state with Inbox icon
- [ ] Panel footer shows "Notification settings" link — clicking navigates to /dashboard/settings/notifications

### Real-time Delivery [auth]
- [ ] Open notification panel, then POST a new notification via /api/notifications/create — new notification appears in panel within 2 seconds WITHOUT page refresh
- [ ] Unread badge count increments immediately on real-time notification arrival

### Notification Preferences Page [auth]
- [ ] Navigate to /dashboard/settings/notifications — page loads with title "Notification Preferences"
- [ ] Sidebar nav shows "Notifications" link with Bell icon — link is highlighted when on this page
- [ ] Page renders 7 toggle rows (data-testid="notif-type-toggle"): spec_ready, build_complete, qa_passed, qa_failed, deploy_complete, agent_stalled, pipeline_error
- [ ] All 7 toggles are ON by default for a new user
- [ ] Toggle OFF "QA failed" (data-testid="notif-toggle-qa_failed") — toggle turns gray, "Saved" indicator appears
- [ ] Reload page — qa_failed toggle is still OFF (persisted to DB)
- [ ] Toggle qa_failed back ON — "Saved" indicator appears again
- [ ] POST /api/notifications/create with type=qa_failed for a user who has qa_failed=false — returns `{skipped: true, reason: "type_disabled"}`

### Quiet Hours [auth]
- [ ] On preferences page — "Enable quiet hours" toggle is visible, OFF by default
- [ ] Toggle ON quiet hours — start time + end time inputs appear (default 10:00 PM and 08:00 AM)
- [ ] Change start time to "23:00" — "Saved" indicator appears, change persists on reload
- [ ] Toggle quiet hours OFF — time inputs disappear
- [ ] With quiet hours active covering current time, POST /api/notifications/create — returns `{skipped: true, reason: "quiet_hours"}`

### Internal Create API
- [ ] POST /api/notifications/create WITHOUT x-factory-secret header — returns 401
- [ ] POST /api/notifications/create with wrong secret — returns 401
- [ ] POST /api/notifications/create with valid secret and valid body — returns 200 with `{id: "..."}`
- [ ] POST /api/notifications/create with invalid type "unknown_type" — returns 400

### Routes/Endpoints
- GET /api/notifications
- PATCH /api/notifications/[id]/read
- POST /api/notifications/read-all
- GET /api/notifications/preferences
- PATCH /api/notifications/preferences
- POST /api/notifications/create (internal)
- /dashboard/settings/notifications (page)
