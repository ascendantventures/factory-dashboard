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

## UX Enhancements — User Management Panel (Issue #61)
_Added: 2026-03-13_

### REQ-UMP-001: Email + Addressing [auth]
- [ ] Go to /dashboard/admin/users — click "Invite User"
- [ ] Enter `test+regression@example.com` in the email field, then blur — no "invalid" error appears
- [ ] Enter `notanemail` in the email field, then blur — "Email address is invalid." error appears
- [ ] Enter valid plain email `user@example.com` — no error

### REQ-UMP-002: Profile Save Toast [auth]
- [ ] Go to /dashboard/settings/profile — change display name, click "Save Changes"
- [ ] A Sonner success toast appears with "Profile updated" (role="status")
- [ ] No custom fixed-position div toast is shown (old pattern removed)

### REQ-UMP-003: Friendly Rate Limit Error [auth]
- [ ] If invite API returns rate limit error, UI shows: "Too many invites sent. Please wait a moment before trying again."
- [ ] Raw Supabase error string "email rate limit exceeded" is NOT shown to users

### REQ-UMP-004: Invite Button Loading State [auth]
- [ ] Go to /dashboard/admin/users — click "Invite User"
- [ ] Enter `valid@example.com`, click "Send Invite"
- [ ] Button immediately becomes disabled and shows Loader2 spinner + "Sending..." text
- [ ] After API resolves (success or error), button re-enables and reverts to "Send Invite"
- [ ] Double-clicking does not submit twice (button is disabled after first click)

### REQ-UMP-005: Admin Mobile Bottom Nav [auth, admin role required]
- [ ] Using 375px viewport, log in as admin — bottom nav shows "Admin" item with Shield icon
- [ ] Tapping "Admin" navigates to /dashboard/admin/users
- [ ] `data-testid="bottom-nav-admin"` element is present
- [ ] Log in as non-admin (operator/viewer) — "Admin" item is NOT in bottom nav

### REQ-UMP-006: Responsive Users Table [auth]
- [ ] Go to /dashboard/admin/users at 375px viewport width
- [ ] Users table is horizontally scrollable (overflow-x: auto or scroll)
- [ ] All columns (User, Role, Status, Last Login, Actions) are accessible via horizontal scroll
- [ ] Right scroll shadow fades in when content overflows right
- [ ] Left scroll shadow fades in when scrolled right and content overflows left
- [ ] `aria-label="Users table"` on the scroll container

### Routes/Endpoints
- /dashboard/admin/users — table scroll, invite modal enhancements
- /dashboard/settings/profile — save toast
- MobileBottomNav — admin entry (mobile only, admin role only)