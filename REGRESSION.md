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

## Webhook & Integration Configuration (Issue #29)
_Added: 2026-03-12_

### Test Steps [auth]

**Webhook List Page**
- [ ] Navigate to /dashboard/settings/webhooks — page renders with "Webhooks" H1, "Add Webhook" button, Discord + Slack preset cards
- [ ] If no webhooks exist — empty state with Webhook icon and "No webhooks yet" message is shown
- [ ] "Add Webhook" button links to /dashboard/settings/webhooks/new

**Create Webhook via Preset**
- [ ] Go to /dashboard/settings/webhooks/new — page renders with Discord + Slack preset tiles and "or configure manually" divider
- [ ] Click Discord preset tile (data-testid="preset-discord") — URL field pre-filled with Discord placeholder, build.completed + qa.passed + deploy.completed checkboxes checked
- [ ] Click Slack preset tile (data-testid="preset-slack") — URL field pre-filled with Slack placeholder, build.completed + qa.passed + deploy.completed checkboxes checked
- [ ] After preset, modify URL to real HTTPS URL, click "Create Webhook" — webhook saved, redirects to /dashboard/settings/webhooks, new card appears

**Create Webhook — Validation**
- [ ] Submit form with http:// URL — inline error "URL must use HTTPS" shown at data-testid="url-error", form does not submit
- [ ] Submit form with invalid URL — inline error shown, form does not submit
- [ ] Submit form with no events selected — inline events error shown, form does not submit
- [ ] Submit form with valid HTTPS URL and at least one event — webhook created successfully

**Event Checkboxes**
- [ ] All 16 pipeline events are listed grouped by category (Issues, Spec, Build, QA, Deploy, Agent, Pipeline)
- [ ] Each checkbox has data-testid="event-{eventName}" (e.g. event-build.completed)
- [ ] Checking/unchecking events updates selection state

**WebhookCard (Webhook List)**
- [ ] Each webhook shows truncated URL, creation timestamp, enabled/disabled badge, toggle switch
- [ ] Up to 5 event badges shown; if more, "+N more" badge shown
- [ ] Toggle switch (data-testid="enabled-toggle") — click to disable, badge changes to "Paused"; click again to re-enable, badge changes to "Active"
- [ ] Toggle persists after page refresh (PATCH /api/settings/webhooks/:id called)
- [ ] "Edit" link navigates to /dashboard/settings/webhooks/[id]
- [ ] "Delete" button (data-testid="delete-webhook-btn") opens confirmation modal

**Delete Webhook**
- [ ] Delete modal shows webhook URL context, "Cancel" and "Delete Webhook" (data-testid="confirm-delete-btn") buttons
- [ ] Click "Cancel" — modal closes, webhook still in list
- [ ] Click "Delete Webhook" — webhook removed from list, deliveries cascade-deleted
- [ ] After delete — redirects to /dashboard/settings/webhooks

**Edit Webhook**
- [ ] Navigate to /dashboard/settings/webhooks/[id] — form pre-filled with existing URL and selected events
- [ ] Secret field shows placeholder "Enter new secret to replace existing", not current secret
- [ ] Change URL, save — updated URL reflected on list page
- [ ] Change events, save — updated event badges on card

**Test Webhook**
- [ ] On edit page, "Send Test" button (data-testid="test-webhook-btn") visible in "Test Webhook" card
- [ ] Click "Send Test" — button enters loading state ("Sending…"), result appears within ~10s
- [ ] Test result (data-testid="test-result") shows HTTP status code and response snippet
- [ ] Success response (2xx): green left border, CheckCircle2 icon, green status badge
- [ ] Failure/timeout: red left border, XCircle icon, red/yellow status badge
- [ ] After test, a delivery entry with event="test" appears in the Delivery Log section

**Delivery Log**
- [ ] Delivery log table (data-testid="delivery-log") visible on edit page
- [ ] Table shows columns: Event, Status, Response, Sent
- [ ] Each row (data-testid="delivery-row") shows event badge, status code badge, truncated response, relative timestamp
- [ ] 2xx status rows styled green background (#0D2E24)
- [ ] 4xx/5xx rows styled red background (#2E1515)
- [ ] null (timeout) rows styled yellow background (#2E2514)
- [ ] At most 50 rows shown, ordered most-recent first
- [ ] Empty delivery log shows "No deliveries yet" message

**Danger Zone**
- [ ] Danger Zone card on edit page has red border, "Delete Webhook" button
- [ ] Delete from detail page works same as delete from list (confirm modal, then redirect)

### API Endpoints
- GET /api/settings/webhooks — returns user's webhooks, no secret_hash field
- POST /api/settings/webhooks — creates webhook, 201 response, requires HTTPS URL
- PATCH /api/settings/webhooks/:id — partial update (url, events, enabled, secret)
- DELETE /api/settings/webhooks/:id — 204 response, cascade-deletes deliveries
- POST /api/settings/webhooks/:id/test — fires real HTTP request, logs to fd_webhook_deliveries
- GET /api/settings/webhooks/:id/deliveries — last 50 entries ordered sent_at DESC

### Routes
- /dashboard/settings/webhooks
- /dashboard/settings/webhooks/new
- /dashboard/settings/webhooks/[id]

---

## Webhook Settings UX Improvements (Issue #77)
_Added: 2026-03-13_

### REQ-WHK-001: Auto-apply preset from query param

- [ ] [auth] Navigate to /dashboard/settings/webhooks/new?preset=discord — Discord preset tile (data-testid="preset-discord") is pre-selected (aria-selected="true"), URL field pre-filled with Discord placeholder, events pre-checked
- [ ] [auth] Navigate to /dashboard/settings/webhooks/new?preset=slack — Slack preset tile (data-testid="preset-slack") is pre-selected (aria-selected="true"), URL field pre-filled with Slack placeholder, events pre-checked
- [ ] [auth] Navigate to /dashboard/settings/webhooks/new (no preset param) — no preset tile has aria-selected="true", form is blank

### REQ-WHK-002: Settings page links to Webhooks

- [ ] [auth] Navigate to /dashboard/settings — a "Webhooks & Integrations" card is visible under an "Integrations" section label
- [ ] [auth] Click the "Webhooks & Integrations" card (data-testid="webhooks-settings-card") — navigates to /dashboard/settings/webhooks

### REQ-WHK-003: Events validation error has data-testid

- [ ] [auth] Navigate to /dashboard/settings/webhooks/new — click "Create Webhook" with no events selected — an element with data-testid="events-error" becomes visible
- [ ] [auth] When no validation error, data-testid="events-error" element is NOT present in the DOM

### Routes/Endpoints
- /dashboard/settings (settings page with webhooks card)
- /dashboard/settings/webhooks/new?preset=discord
- /dashboard/settings/webhooks/new?preset=slack
- /dashboard/settings/webhooks/new
