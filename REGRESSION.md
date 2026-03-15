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

---

## UAT Fix: Preset Auto-apply + Webhook List Crash (Issue #87)
_Added: 2026-03-13_

### REQ-WHK-FIX-001: Preset query param auto-applies on page load

- [ ] [auth] Navigate to /dashboard/settings/webhooks/new?preset=discord — Discord tile has aria-selected="true", URL input is pre-filled (not empty), build.completed + qa.passed + deploy.completed events are checked
- [ ] [auth] Navigate to /dashboard/settings/webhooks/new?preset=slack — Slack tile has aria-selected="true", URL input is pre-filled with Slack placeholder, default events are checked
- [ ] [auth] Navigate to /dashboard/settings/webhooks/new (no preset param) — no tile has aria-selected="true", URL field is empty, no events checked

### REQ-WHK-FIX-002: Webhook list page renders without server error

- [ ] [auth] Navigate to /dashboard/settings/webhooks — page renders (HTTP status < 500), no Vercel error digest visible
- [ ] [auth] "Add Webhook" button is visible on /dashboard/settings/webhooks
- [ ] [auth] Discord and Slack preset cards are visible on /dashboard/settings/webhooks
- [ ] [auth] (with at least one webhook) Webhook list shows webhook cards with toggle, edit, delete controls
- [ ] Vercel error digest "2416468996" is NOT visible on any webhook page

### Routes/Endpoints
- /dashboard/settings/webhooks
- /dashboard/settings/webhooks/new?preset=discord
- /dashboard/settings/webhooks/new?preset=slack

## User Management & Admin Panel [auth] (Issue #24)
_Added: 2026-03-12_

### Admin User List [admin-auth]
- [ ] Log in as admin, navigate to /dashboard/admin/users — page loads with user table
- [ ] Table shows columns: checkbox, User (name+email), Role badge, Status badge, Last Login, Actions (⋮)
- [ ] At least one user row appears in the table
- [ ] Log in as operator or viewer, navigate to /dashboard/admin/users — redirects to /dashboard

### Invite User [admin-auth]
- [ ] On /dashboard/admin/users, click "Invite User" button (data-testid="invite-user-btn") — InviteUserModal opens
- [ ] Enter email `test+regression@example.com`, select role "operator", click "Send Invite" — success toast appears (data-testid="toast-success")
- [ ] Try inviting the same email again — error "User already exists" (409)
- [ ] Close modal without submitting — modal closes, no user added

### Edit User Role [admin-auth]
- [ ] Click ⋮ actions on a non-admin user row (data-testid="row-actions-btn") — dropdown shows "Edit Role" and "Deactivate"
- [ ] Click "Edit Role" — EditRoleModal opens with user name and current role
- [ ] Select new role and click "Update Role" — role badge updates in table, success toast shows

### Deactivate / Reactivate [admin-auth]
- [ ] Click ⋮ on an active non-admin user, click "Deactivate" (data-testid="deactivate-btn") — DeactivateModal shows warning
- [ ] Click "Deactivate" confirm button (data-testid="confirm-deactivate-btn") — user status badge changes to "Deactivated" (data-testid="status-badge")
- [ ] Click ⋮ on the now-deactivated user, click "Reactivate" — user status badge changes to "Active"
- [ ] Try to deactivate own (admin) account — option not shown or blocked with error

### Self-demotion blocked [admin-auth]
- [ ] On own user row (labeled "(you)") — no checkbox shown
- [ ] If editing own role via API PATCH: returns 400 "Cannot demote your own admin role"

### Bulk Actions [admin-auth]
- [ ] Select 2+ non-own user checkboxes — BulkActionsBar appears above table showing selected count
- [ ] Click "Change Role" → "Viewer" — all selected users updated, success toast shows count
- [ ] Click "Deactivate" bulk button — all selected users deactivated
- [ ] Click "Clear" — BulkActionsBar disappears, checkboxes unchecked

### Search & Filter [admin-auth]
- [ ] Type in search box — table filters in real-time (300ms debounce) by name or email
- [ ] Select "Admin" from Role filter — only admin users shown
- [ ] Select "Deactivated" from Status filter — only deactivated users shown
- [ ] Click "Clear filters" — all filters reset, full user list returns

### Audit Log [admin-auth]
- [ ] Navigate to /dashboard/admin/audit — page loads with audit log table
- [ ] Table shows columns: Timestamp, Actor, Action (badge), Target
- [ ] After invite/role change/deactivate — corresponding entries appear in log
- [ ] Click on an audit row with details — expands inline JSON details block
- [ ] Log in as operator/viewer, navigate to /dashboard/admin/audit — redirects to /dashboard

### Profile Settings [auth — any role]
- [ ] Navigate to /dashboard/settings/profile — page loads with Profile Information card and Change Password card
- [ ] Profile card shows current display name (editable), email (read-only with lock icon), role badge (read-only)
- [ ] Edit display name to "Regression Tester", click "Save Changes" (data-testid="save-profile-btn") — success toast (data-testid="toast-success"), name updates
- [ ] Try display name < 2 chars — inline validation error shown before submit
- [ ] Try display name > 50 chars — inline validation error shown before submit

### Change Password [auth — any role]
- [ ] On /dashboard/settings/profile, enter current password, new password, confirm password and click "Update Password" (data-testid="change-password-btn") — success toast appears
- [ ] Enter wrong current password — error message (data-testid="error-message") contains "Incorrect"
- [ ] Enter new password < 8 chars — inline validation error before submit
- [ ] Enter mismatched confirm password — inline validation error before submit

### Routes/Endpoints
- /dashboard/admin/users (admin only)
- /dashboard/admin/audit (admin only)
- /dashboard/settings/profile (any authenticated role)
- GET /api/admin/users
- POST /api/admin/users/invite
- PATCH /api/admin/users/:id
- POST /api/admin/users/bulk
- GET /api/admin/audit
- POST /api/auth/change-password
- PATCH /api/auth/profile

---

## Cost Analytics & ROI Dashboard (Issue #25)
_Added: 2026-03-12_

### Test Steps [auth]
- [ ] Navigate to /dashboard/analytics — page renders with "Analytics" H1, no JS errors
- [ ] Verify 4 totals cards visible: All-Time Spend, This Month, This Week, Today — each shows $X.XXXX format (data-testid: total-all-time, total-this-month, total-this-week, total-today)
- [ ] Verify ROI metrics grid visible: Cost per Issue, Avg Time-to-Deploy, QA First-Try Rate, Issues Completed (data-testid: roi-cost-per-issue, roi-time-to-deploy, roi-qa-first-try, roi-issues-completed)
- [ ] Verify Spend Over Time line chart renders (data-testid: chart-spend-over-time)
- [ ] Verify Spend by Station pie chart renders (data-testid: chart-spend-by-station)
- [ ] Verify Spend by App bar chart renders (data-testid: chart-spend-by-app)
- [ ] Verify Spend by Model horizontal bar chart renders (data-testid: chart-spend-by-model)
- [ ] Click "Week" granularity toggle — chart re-renders for weekly data; button has aria-pressed="true"
- [ ] Click "Month" granularity toggle — chart re-renders; button shows monthly view
- [ ] Change date range (From/To inputs) — all charts and totals refresh with new range
- [ ] Select a repo from the repo dropdown (filter-repo) — URL updates with ?repo=..., charts filter to that repo
- [ ] Click "Reset filters" — from/to/repo/granularity reset to defaults
- [ ] Verify filter state persists in URL (copy URL, paste in new tab — same filters applied)
- [ ] Click "Export CSV" button — file download triggers, filename matches analytics-export-YYYY-MM-DD.csv
- [ ] Verify CSV has header row: id,submission_id,station,model,build_repo,cost_usd,duration_seconds,status,created_at
- [ ] Navigate to /dashboard/analytics without auth (incognito) — redirected to /auth/login
- [ ] Verify "Analytics" link appears in sidebar navigation
- [ ] Click Analytics sidebar link — navigates to /dashboard/analytics

### Routes/Endpoints
- /dashboard/analytics — main analytics page
- GET /api/analytics/costs?from=&to=&repo= — cost aggregations
- GET /api/analytics/roi?from=&to=&repo= — ROI metrics
- GET /api/analytics/trends?from=&to=&repo=&granularity= — time-series data
- GET /api/analytics/export?from=&to=&repo= — CSV download

---

## Pencil.dev Design Integration [auth]
_Core: Issue #37_

### Test Steps
- [ ] `/dashboard/apps/[repoId]/designs` tab is visible on app detail page
- [ ] Designs gallery loads without errors and shows empty state when no designs exist
- [ ] `.pen` upload zone visible on designs page (drag-drop or click to upload)
- [ ] Uploading a valid `.pen` file stores it in Supabase Storage (`pencil-designs` bucket)
- [ ] Uploaded `.pen` appears in the gallery after upload
- [ ] Clicking a design navigates to `/dashboard/apps/[repoId]/designs/[issueNumber]`
- [ ] Design detail page renders frame previews via HTML Canvas
- [ ] Frames tab shows all frames as clickable thumbnails
- [ ] Tokens tab displays design tokens: colors, typography, spacing
- [ ] "Open in Pencil" button renders with correct `pencil://` deep link
- [ ] "Download .pen" button triggers file download
- [ ] Version history accordion shows design evolution across issues
- [ ] Unauthenticated access to `/dashboard/apps/*/designs` redirects to login

### Routes
- /dashboard/apps/[repoId]/designs
- /dashboard/apps/[repoId]/designs/[issueNumber]
- /api/designs/[repoId] (GET)
- /api/designs/[repoId]/[issueNumber] (GET)
- /api/designs/attachment/[attachmentId] (GET — signed URL)
- /api/designs/parse (POST)
- /api/designs/upload (POST)

---

## Sign-out Redirect (Issue #84)
_Added: 2026-03-13_

### Test Steps
- [ ] [auth] Click the Sign Out button in the sidebar — browser redirects to `/auth/login`
- [ ] [auth] Verify the redirect URL hostname is NOT a `build-work-*.vercel.app` preview URL
- [ ] [auth] Verify the redirect URL is on the same origin as where the user was signed in
- [ ] Sign in on production (`factory-dashboard-tau.vercel.app`), sign out — redirected to `factory-dashboard-tau.vercel.app/auth/login`

### Routes/Endpoints
- Sign-out button: `[data-testid="sign-out-button"]` in sidebar

---

## Test DB Fixtures (Issue #84)
_Added: 2026-03-13_

### Test Steps
- [ ] Navigate to `/dashboard/apps` — Factory Dashboard app card appears
- [ ] App card shows `3 total` in the issue count row (with fixture data applied)
- [ ] Click the Factory Dashboard app card — navigates to detail page
- [ ] Detail page header shows `3 issues · 2 open · 1 done` (with fixture data applied)
- [ ] Issues section on detail page shows 3 issue rows (not empty)
- [ ] Stats bar timeline shows activity from the seeded issues

### Routes/Endpoints
- Apps list: `/dashboard/apps`
- App detail: `/dashboard/apps/:repoId`
- API: `GET /api/apps`, `GET /api/apps/:repoId`

---

## Stats Count Consistency (Issue #84)
_Added: 2026-03-13_

### Test Steps
- [ ] Navigate to `/dashboard/apps` — note the `X total` count on any app card (`[data-testid="app-issue-count-stats"]`)
- [ ] Click that app card to open the detail page
- [ ] Verify the number before "issues ·" in the page header (`[data-testid="app-issue-count-header"]`) matches the `X total` from step 1
- [ ] With fixture data: both header and stats bar count should show `3`

### Routes/Endpoints
- Apps list: `/dashboard/apps`
- App detail: `/dashboard/apps/:repoId`

---

## Attachment System Polish (Issue #51)
_Added: 2026-03-13_

### PDF Modal Close Button [auth]
- [ ] Log in and navigate to any issue detail page that has a PDF attachment
- [ ] Click the PDF attachment thumbnail to open the PDF preview modal
- [ ] Verify the close button in the modal header shows BOTH an X icon AND the text "Close" side by side
- [ ] Verify the close button has a visible border (1px solid #E2E4E9), padding, and rounded corners — matching the Download button style
- [ ] Hover over the Close button — background should shift to #F3F4F6 and border to #CBD0D8
- [ ] Click the Close button — modal closes
- [ ] Verify `button[aria-label="Close"]` is present (screen reader compatibility retained)

### Instrument Sans Font Loading
- [ ] Navigate to any page (e.g., /)
- [ ] Open browser DevTools → Network tab → filter by "Fonts" or search "Instrument"
- [ ] Verify a request is made to fonts.googleapis.com that includes "Instrument+Sans"
- [ ] Verify fonts for Inter, Space Grotesk, and JetBrains Mono are still loaded (no regressions)
- [ ] Open an issue with attachment components — text should render in Instrument Sans (not Inter fallback)

### Routes/Endpoints
- No new routes — 2-file frontend edit only

---
---

## Remove Duplicate New Issue Button (Issue #46)
_Added: 2026-03-13_

### Test Steps [auth]
- [ ] Navigate to /dashboard — Kanban board loads. Count buttons with text "New Issue" on the page — exactly 1 is visible.
- [ ] Verify the single "New Issue" button is inside the `<header>` element (top-right of the global header, indigo/purple color)
- [ ] Verify the Kanban sub-header toolbar (contains "Full"/"Simplified" toggle, "Sync" and "Activity" buttons) does NOT contain a "New Issue" button
- [ ] Click the global header "New Issue" button — the issue creation modal opens
- [ ] Fill in the modal title field and click "Create" / "Submit" — modal closes and new issue appears on the Kanban board (or sync brings it in)
- [ ] Navigate away and back to /dashboard — still only one "New Issue" button visible

### Routes/Endpoints
- /dashboard (Kanban board page)
- No new routes — UI-only change


---

## Templates Sidebar Discoverability & Mobile Nav (Issue #85)
_Added: 2026-03-13_

### Test Steps [auth]

#### Sidebar Templates Link (REQ-85-001)
- [ ] Navigate to /dashboard — sidebar must contain a "Templates" nav item visible in the left rail
- [ ] The Templates link href must be `/dashboard/templates`
- [ ] Click "Templates" in the sidebar — navigates to /dashboard/settings and the Templates tab is active
- [ ] The "Templates" item uses the FileStack icon, consistent with other nav items
- [ ] Collapse the sidebar — Templates item shows FileStack icon only (no label) with tooltip "Templates" on hover
- [ ] Active state: visiting /dashboard/templates highlights Templates link (indigo background + left border)

#### Mobile Bottom Nav Templates (REQ-85-002)
- [ ] At 375px viewport width, the bottom nav shows 6 items: Dashboard, Apps, Activity, Metrics, Templates, Settings
- [ ] "Templates" item has the FileStack icon and label "Templates"
- [ ] Items do not overflow or truncate at 375px width
- [ ] Tapping "Templates" on mobile navigates to /dashboard/templates
- [ ] Active state: FileStack icon turns indigo (#6366F1) when on /dashboard/templates

#### Repository Selector in Issue Modal (REQ-85-003)
- [ ] Click "New Issue" button (data-testid="quick-create-trigger") — modal opens
- [ ] "Target Repository" field shows a dropdown (not a free-text input with placeholder "owner/repo")
- [ ] Dropdown is populated with repositories from /api/build-repos showing display names like "Factory Dashboard (ascendantventures/factory-dashboard)"
- [ ] While repos load, a shimmer skeleton shows with "Loading repositories..." text
- [ ] Clicking "Create Issue" with no repository selected shows inline error: "Repository is required" (data-testid="repo-selector-error")
- [ ] Selecting a valid repository and submitting creates the issue successfully
- [ ] No plain `<input placeholder="owner/repo">` is visible anywhere in the modal

### Routes/Endpoints
- /dashboard (sidebar Templates link visible)
- /dashboard/templates (Templates tab renders)
- /dashboard (mobile nav at 375px viewport)
- Modal: data-testid="quick-create-trigger" → repo-selector → repo-selector-error

### QuickCreate Two-Step Flow (Issue #85 — quick-create-next)
- [ ] Click "New Issue" button (data-testid="quick-create-trigger") — Step 1 modal opens showing Title + Description + Target App
- [ ] Click "Next →" button (data-testid="quick-create-next") without filling fields — validation errors appear
- [ ] Fill Title + Description, click "Next →" — advances to Step 2 showing Repository selector
- [ ] Step 2 shows data-testid="repo-selector" dropdown populated from /api/build-repos
- [ ] Click "← Back" on Step 2 — returns to Step 1 with filled fields preserved
- [ ] On Step 2, click "Create Issue" without selecting repo — shows data-testid="repo-selector-error"

---

## Webhook Preset Auto-Apply (Issue #81) [auth]
_Added: 2026-03-14_

### Test Steps
- [ ] Navigate to `/dashboard/settings/webhooks/new?preset=discord` — Discord tile SHALL be pre-selected (`aria-selected="true"`) on page load, no manual click required
- [ ] Navigate to `/dashboard/settings/webhooks/new?preset=slack` — Slack tile SHALL be pre-selected (`aria-selected="true"`) on page load
- [ ] Navigate to `/dashboard/settings/webhooks/new` (no query param) — no preset tile is selected, form loads blank
- [ ] Inspect page.tsx TypeScript — `searchParams` is typed as `Promise<{ preset?: string }>` and awaited, no TypeScript errors

### Routes/Endpoints
- /dashboard/settings/webhooks/new?preset=discord
- /dashboard/settings/webhooks/new?preset=slack
- /dashboard/settings/webhooks/new

## Mobile Bottom Nav — Role-Aware Admin Entry (Issue #86)
_Added: 2026-03-14_

### Test Steps [auth]
- [ ] Log in as admin user (ajrrac@gmail.com), resize viewport to 375px — mobile bottom nav (data-testid="mobile-nav") shows 5 items: Dashboard, Apps, Activity, Metrics, **Admin**
- [ ] Admin link has data-testid="bottom-nav-admin" and href="/dashboard/admin/users"
- [ ] Settings link (href="/dashboard/settings") is NOT present in mobile bottom nav when logged in as admin
- [ ] Admin link uses Shield icon (lucide-react)
- [ ] Click Admin link — navigates to /dashboard/admin/users
- [ ] Log in as non-admin (viewer) user, resize viewport to 375px — mobile bottom nav shows Settings item (href="/dashboard/settings"), NOT Admin
- [ ] data-testid="bottom-nav-admin" is NOT present in DOM for non-admin user
- [ ] At desktop viewport (≥768px) — mobile bottom nav is hidden (md:hidden)

### Routes
- /dashboard (mobile bottom nav visible at <768px)
- /dashboard/admin/users (target of Admin nav link)
- /dashboard/settings (Settings link for non-admin)


## Admin Nav Data & Code Hardening (Issue #89)
_Added: 2026-03-14_

### Test Steps [auth]
- [ ] Log in as ajrrac@gmail.com (admin), resize viewport to 375px — verify `fd_user_roles` row has `is_active = true` in DB
- [ ] Admin user at 375px viewport: bottom nav 5th item has `data-testid="bottom-nav-admin"` with href `/dashboard/admin/users` and Shield icon — NOT Settings
- [ ] Admin user at 375px viewport: `data-testid="bottom-nav-settings"` is NOT present in the DOM
- [ ] Non-admin user at 375px viewport: bottom nav 5th item has `data-testid="bottom-nav-settings"` with href `/dashboard/settings`
- [ ] Non-admin user at 375px viewport: `data-testid="bottom-nav-admin"` is NOT present in the DOM
- [ ] getUserRole() returns 'admin' when fd_user_roles row has is_active = NULL (code hardening)
- [ ] getUserRole() returns 'admin' when fd_user_roles row has is_active = true

### DB Verification
- [ ] `SELECT role, is_active FROM fd_user_roles WHERE user_id = 'b4c20f13-15de-4ef4-b297-8358f9049262'` returns `role='admin', is_active=true`
- [ ] `fd_user_roles.is_active` column default is `true` (INSERT without is_active → defaults to true)

### Routes/Endpoints
- /dashboard (mobile bottom nav at 375px viewport)
- /dashboard/admin/users (Admin nav link target)

## MobileBottomNav Server-Side Role Fix (Issue #92)
_Added: 2026-03-14_

### Test Steps [auth]
- [ ] Log in as ajrrac@gmail.com (admin user), resize viewport to 375px — element with `data-testid="bottom-nav-admin"` SHALL be present in the DOM within 3 seconds of page load, WITHOUT any user interaction
- [ ] Admin user at 375px: Admin entry href is `/dashboard/admin/users` and uses Shield icon
- [ ] Admin user at 375px: Settings entry (`data-testid="bottom-nav-settings"`) is also visible (both Admin and Settings now show for admin users)
- [ ] Log in as a non-admin (viewer/member) user, resize viewport to 375px — `data-testid="bottom-nav-admin"` is NOT present in DOM
- [ ] Non-admin user at 375px: `data-testid="bottom-nav-settings"` IS present
- [ ] Admin nav entry appears immediately on page load (server-rendered, no useEffect delay) — visible within 1 second
- [ ] At desktop viewport (≥768px) — mobile bottom nav is hidden (md:hidden applies)
- [ ] Navigate to /dashboard — Admin entry still present (verify no hydration mismatch)

### Code Checks (AC-001.3)
- [ ] `src/components/layout/MobileBottomNav.tsx` contains NO `useEffect` that calls `auth.getUser()` or any Supabase client method
- [ ] `src/app/dashboard/layout.tsx` calls `getUserRole()` server-side and passes `isAdmin` prop to AppShell

### Routes/Endpoints
- /dashboard (mobile bottom nav visible at <768px)
- /dashboard/admin/users (target of Admin nav link)
- /dashboard/settings (Settings link always visible)

---

## Webhooks Error Boundary + Authenticated Flow (Issue #90)
_Added: 2026-03-14_

### Test Steps [auth]
- [ ] Log in with valid credentials and navigate to /dashboard/settings/webhooks — page renders HTTP 200, NO "Application error" or "Digest:" string visible in page content
- [ ] With no webhooks configured — empty state renders: icon, "No webhooks yet" text, and "Add your first webhook" link are visible (no crash)
- [ ] Page content does NOT contain "Digest: 2416468996" or "Application error: a server-side exception has occurred"
- [ ] Unauthenticated user navigates to /dashboard/settings/webhooks — redirected to /auth/login (not a 500)

### Error Boundary (error.tsx)
- [ ] If webhooks data fetch fails (simulate by checking network errors): error boundary shows AlertTriangle icon, "Unable to load webhooks" heading, user-friendly message, and "Try again" button
- [ ] "Try again" button re-renders the route segment without a full page reload
- [ ] Error boundary container matches design: dark #161A1F background, #2E353D border, 12px radius, centered max-width 480px

### Routes/Endpoints
- /dashboard/settings/webhooks (authenticated GET — must return 200, not 500)

## Design Detail Breadcrumb Fix (Issue #80)
_Added: 2026-03-14_

### Test Steps
- [ ] [auth] Navigate to `/dashboard/apps/3761c3bd-f41f-4600-be24-b69bea58368f/designs/37`
- [ ] Verify exactly **one** `<nav>` element is rendered on the page (no duplicate breadcrumb)
- [ ] Verify the breadcrumb has `aria-label="breadcrumb"`
- [ ] Verify the breadcrumb does NOT show the raw UUID `3761c3bd-f41f-4600-be24-b69bea58368f`
- [ ] Verify the app name segment shows a human-readable display name (e.g. "Factory Dashboard")
- [ ] Verify the issue segment reads `Issue #37` (not `#37`)
- [ ] Verify breadcrumb links: Apps → `/dashboard/apps`, App name → `/dashboard/apps/[repoId]`, Designs → `/dashboard/apps/[repoId]/designs`
- [ ] Verify the last segment (Issue #37) is not a link (it is the current page)

### Routes/Endpoints
- `/dashboard/apps/[repoId]/designs/[issueNumber]`

## Escape Guard + Success Toast in QuickCreateModal (Issue #82)
_Added: 2026-03-14, Corrected: 2026-03-14 (bugfix — fix was in wrong component; moved to QuickCreateModal)_

### Test Steps [auth]
- [ ] Navigate to /dashboard, click "New Issue" button — QuickCreateModal opens
- [ ] With modal open and idle (no submission in progress), press Escape — modal closes (AC-001.1)
- [ ] Open modal again, click Submit while form is valid — while loading spinner is visible, press Escape — modal stays open (AC-001.2)
- [ ] Open modal, fill in Title and Body, select a repo, click Submit — on success a sonner toast appears at bottom-right with text "Issue created" (AC-002.1)
- [ ] Toast includes an "Open" action button — clicking it opens the GitHub issue URL in a new tab (AC-002.2)
- [ ] Toast persists for at least 5 seconds before auto-dismissing (AC-002.3)
- [ ] Toast fires even after modal has closed/unmounted (AC-002.4)

### Notes
- Fix is in `src/components/QuickCreateModal/index.tsx` (NOT NewIssueModal.tsx — that file is dormant)
- `NewIssueButton` imports `QuickCreateModal` (default export)
- Escape handler guards on `isSubmitting` from react-hook-form
- Toast uses `action: { label: 'Open', onClick: () => window.open(url, '_blank') }` with `duration: 6000`
- Toast fires via `setTimeout(..., 0)` to escape the render cycle and survive modal unmount

### Routes/Endpoints
- /dashboard (New Issue button in header)
- POST /api/issues (issue creation endpoint)

## Settings Page Accessibility — Single <main> Landmark (Issue #107)
_Added: 2026-03-14_

### Test Steps [auth]
- [ ] Navigate to /dashboard/settings — page loads without error
- [ ] Inspect the DOM: exactly one `<main>` element exists on the page (the outer layout main)
- [ ] The settings content area renders as `<section>`, not `<main>`
- [ ] agent-browser `get text 'main'` returns exactly one element (no strict-mode violation)
- [ ] All settings tabs are accessible: General, Users, Templates, Environment, API Keys
- [ ] Click each settings tab — each tab renders content correctly
- [ ] Visual layout is identical to before the fix — no spacing or styling changes

### Routes/Endpoints
- /dashboard/settings
- /dashboard/settings?tab=general (or equivalent tab navigation)

### Notes
- Fix is in `src/app/dashboard/settings/SettingsClient.tsx` line ~852
- Inner `<main className="flex-1 md:pl-8 md:pt-0">` changed to `<section>` — outer layout main unchanged
- WCAG 2.1 SC 1.3.6 compliance: only one `<main>` landmark per page

---

## Pipeline Control Panel — Harness Heartbeat Connection (Issue #105)
_Added: 2026-03-14_

### Test Steps [auth]
- [ ] Navigate to `/pipeline` — page loads without error, shows "Pipeline Control" header
- [ ] Page shows status badge with either "Running" (green dot) or "Stopped" (red dot) — NOT static placeholder
- [ ] `data-testid="harness-status-badge"` element exists on page
- [ ] `data-testid="harness-pid"` element exists — shows a number or "—"
- [ ] `data-testid="active-agents-count"` element exists — shows a number
- [ ] `data-testid="processed-today"` element exists — shows a number
- [ ] `data-testid="processed-week"` element exists — shows a number
- [ ] `data-testid="processed-all-time"` element exists — shows a number
- [ ] "Last Heartbeat" row visible in the status card meta grid
- [ ] Wait 30 seconds — page auto-refreshes (check "Auto-refreshes every 30s" text in header)
- [ ] `GET /api/harness-status` returns JSON with keys: `status`, `pid`, `activeAgents`, `processedToday`, `processedThisWeek`, `processedAllTime`, `lastSeen`
- [ ] When harness is running: status badge is green "Running", PID is a positive integer, activeAgents ≥ 0
- [ ] When harness last heartbeat is >5 min old or missing: status shows red "Stopped", PID shows "—", agents show 0

### Routes/Endpoints
- `/pipeline` (Pipeline Control page)
- `GET /api/harness-status` (new — reads Supabase harness_heartbeat table)

### Supabase
- `harness_heartbeat` table exists with columns: `id`, `pid`, `active_agents`, `lock_snapshot`, `status`, `last_seen`, `created_at`
- RLS enabled: authenticated users can SELECT; service role handles INSERT/UPDATE

---

## Apps Portfolio UX Enhancements (Issue #113)
_Added: 2026-03-14_

### Test Steps [auth]
- [ ] Login and navigate to /dashboard/apps — app cards render
- [ ] Click anywhere on an app card (not the external URL) — browser navigates to /dashboard/apps/[repoId] (REQ-APP-001)
- [ ] Each app card has a visible "View details" text with chevron at bottom-right (AC-001.3)
- [ ] Click the external live URL link on a card — opens in new tab, /dashboard/apps list page stays active (AC-001.2)
- [ ] Verify no card shows "Add VERCEL_TOKEN to enable deployment tracking" text anywhere (AC-002.1)
- [ ] Verify cards without deployment tracking show "Deployment tracking not configured" (AC-002.1)
- [ ] Login as admin and check app card — if deployment not configured, "Configure →" link appears linking to /dashboard/settings (AC-002.2)
- [ ] Login as non-admin — "Configure →" link is NOT shown, only plain status text (AC-002.3)
- [ ] Hover over the sync badge in the top nav — tooltip appears with plain-language explanation (AC-003.1)
- [ ] Tab to the sync badge with keyboard — tooltip appears on focus (AC-003.3)
- [ ] Navigate to /dashboard/apps/[repoId] by clicking a card — page loads without knowing the URL (AC-004.1, AC-004.3)
- [ ] Click the app title or "View details →" affordance on a card — navigates to correct detail page (AC-004.2)

### Routes/Endpoints
- /dashboard/apps — app card grid, all cards now navigable
- /dashboard/apps/[repoId] — detail page, reachable via card click
- /dashboard/settings — settings page (linked from admin deployment status)

---

## Activity Feed Data Fix — Webhook Ingestion (Issue #104)
_Added: 2026-03-14_

### Test Steps [auth]

**Activity Page (after backfill)**
- [ ] Log in and navigate to `/dashboard/activity` — page loads without JavaScript error
- [ ] After running `POST /api/admin/backfill-activity`, the activity page SHALL display event cards (`data-testid="activity-item"`) — NOT the empty state ("No activity yet")
- [ ] Each activity item shows: station icon (Lucide SVG), event description, issue number and title, relative timestamp
- [ ] Events are ordered newest-first
- [ ] `data-testid="activity-item"` elements are present in the DOM (Playwright compatibility)
- [ ] Loading state: while events load, `data-testid="activity-loading"` skeleton is visible (not the empty state message)
- [ ] Error state: if API call fails, "Failed to load activity" message shown (not the empty-events message)
- [ ] Empty state: `data-testid="activity-empty"` with Radio icon (not 📡 emoji) — only shown when events are genuinely zero

**Webhook Handler (station label events)**
- [ ] POST to `/api/webhooks/github` with invalid signature returns HTTP 401 (not 500 — table must exist)
- [ ] After webhook receives `issues.labeled` with `station:build` for a new issue not yet in `dash_issues`: a row is created in `dash_issues` AND a row inserted in `dash_stage_transitions`
- [ ] After webhook receives `issues.opened` event: row created in `dash_issues` with `station = null`
- [ ] After webhook receives `issues.closed` event: `dash_issues.state` updated to `'closed'`
- [ ] `dash_webhook_events` table accepts inserts (no "relation does not exist" error)

**Backfill Endpoint**
- [ ] `POST /api/admin/backfill-activity` without `x-admin-secret` header returns HTTP 401
- [ ] `POST /api/admin/backfill-activity` with valid `x-admin-secret` and body `{"repo":"ascendantventures/harness-beta-test","limit":10}` returns HTTP 200 with `{ issues_upserted, transitions_inserted, errors }`
- [ ] After successful backfill call, `dash_issues` table has rows and `GET /api/activity` returns at least 1 event

**Icon System**
- [ ] No emoji characters (🚀 ✅ 🔨 🧪 🐛 💰 📡) are visible in the activity feed
- [ ] Each activity item has an SVG icon (Lucide) in the icon circle

### Routes/Endpoints
- `/dashboard/activity` — activity feed page
- `GET /api/activity` — returns events from `dash_stage_transitions` and `dash_agent_runs`
- `POST /api/webhooks/github` — receives GitHub webhook events
- `POST /api/admin/backfill-activity` — seeds historical data from GitHub API


## Activity Page — Direct Query Fix (Issue #104 Phase 2)
_Added: 2026-03-15_

### Test Steps [auth]

- [ ] Navigate to `/dashboard/activity` — page renders without 500/database error
- [ ] The page shows the `ActivityFeed` component (with loading skeleton, then events or empty state)
- [ ] No "column does not exist" error (previous page queried `created_at` instead of `transitioned_at`)
- [ ] `data-testid="activity-item"` elements are accessible from the `/dashboard/activity` route (not just sidebar)
- [ ] `data-testid="activity-loading"` is visible while events load
- [ ] `data-testid="activity-empty"` shows if no events exist (after backfill, should NOT show)

### Routes/Endpoints
- `/dashboard/activity` — activity feed page (now uses ActivityFeed component)
