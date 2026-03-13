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

## UAT Follow-up UX Enhancements (Issue #76)
_Added: 2026-03-13_

### REQ-001: UUID Resolution in Breadcrumbs and Page Titles [auth]
- [ ] Navigate to /dashboard/apps/[repoId]/designs — page title (data-testid="page-title") SHALL show "[App Name] — Designs", NOT a raw UUID
- [ ] Breadcrumb nav (aria-label="breadcrumb") SHALL show human-readable app name, NOT a raw UUID
- [ ] Navigate to /dashboard/apps/[repoId]/designs/[issueNumber] — ONLY ONE breadcrumb SHALL be rendered (aria-label="breadcrumb" on the page's <nav>). The design detail page renders its own breadcrumb; `PenFileViewer` does NOT render a secondary breadcrumb. All breadcrumb segments show human-readable names (Apps / [App Name] / Designs / Issue #N).
- [ ] If app name cannot be resolved — breadcrumb shows "Unknown App" (not a full UUID)

### REQ-002: Gallery Card Thumbnails [auth]
- [ ] Navigate to /dashboard/apps/[repoId]/designs with at least one design present
- [ ] Each design card (data-testid="design-gallery-item") SHALL contain a thumbnail container (data-testid="design-thumbnail")
- [ ] Thumbnail shows shimmer/skeleton animation while the .pen file loads
- [ ] After load, thumbnail renders a canvas preview of the first frame
- [ ] If render fails, thumbnail shows "Preview unavailable" text (NOT blank grey box)
- [ ] Cards off-screen do NOT render canvas until they scroll into view (lazy loading)

### REQ-003: App Cards — Anchor Navigation [auth]
- [ ] Navigate to /dashboard/apps
- [ ] Each app card (data-testid="app-card") SHALL be wrapped in an `<a>` tag with href="/dashboard/apps/[id]"
- [ ] Right-clicking an app card — browser context menu shows "Open in New Tab"
- [ ] Hovering over app card — destination URL appears in browser status bar
- [ ] Clicking app card — navigates to /dashboard/apps/[repoId]
- [ ] Tab key focuses app cards; Enter key navigates to detail page

### REQ-004: Mobile Nav — Missing Pages [auth, mobile viewport]
- [ ] Set viewport to 375px width, navigate to /dashboard
- [ ] Mobile bottom nav (data-testid="mobile-nav") SHALL be visible
- [ ] Nav shows 4 primary items: Dashboard, Apps, Pipeline, Activity
- [ ] "More" button (data-testid="mobile-more-btn") is present
- [ ] Tapping "More" opens bottom sheet (data-testid="mobile-more-sheet")
- [ ] Sheet contains: API Docs, Event Log, Metrics, Settings items (data-testid="mobile-sheet-item")
- [ ] Tapping "API Docs" navigates to /dashboard/docs
- [ ] Tapping "Event Log" navigates to /dashboard/admin/events
- [ ] Tapping backdrop or X button closes the sheet
- [ ] Active route is highlighted correctly in primary nav and overflow items

### REQ-005: Deployment Table Empty State [auth]
- [ ] Navigate to /dashboard/apps/[repoId] for an app with no Vercel deployments
- [ ] After data loads, deployment list SHALL show "No deployments found" text (data-testid="empty-deployments")
- [ ] NO skeleton shimmer rows SHALL be visible alongside the empty state message
- [ ] Skeleton rows SHALL only appear while loading (before query resolves)

### REQ-006: Kanban Horizontal Scroll Indicator [auth]
- [ ] Navigate to /dashboard, set viewport to 1280px width
- [ ] Kanban scroll container (data-testid="kanban-scroll-container") is present
- [ ] When all columns do NOT fit in viewport — a right-edge gradient fade indicator is visible
- [ ] After scrolling to rightmost column — fade indicator disappears

### REQ-007: Create Issue Modal Accessibility [auth]
- [ ] Click "New Issue" button on /dashboard to open modal
- [ ] Modal container SHALL have role="dialog", aria-modal="true", aria-labelledby="new-issue-modal-title"
- [ ] Title element SHALL have id="new-issue-modal-title" with text "Create New Issue"
- [ ] Modal opens with focus on the title input field
- [ ] Pressing Escape SHALL close the modal

### REQ-008: Upload Zone Visibility [auth]
- [ ] Navigate to /dashboard/apps/[repoId]/designs
- [ ] A drag-drop upload zone (data-testid="design-upload-zone") SHALL be visible above the design cards
- [ ] Zone displays "Drop .pen files here or browse" text and an Upload icon
- [ ] Dragging a file over the zone — shows active/highlighted border state
- [ ] Dropping a .txt or .png file — error message (data-testid="upload-error", role="alert") appears: "Only .pen files are supported"
- [ ] Clicking anywhere in the zone — file picker opens
- [ ] Zone is visible even when gallery is empty (before any designs exist)

### Routes/Endpoints
- /dashboard/apps — AppCard anchor navigation
- /dashboard/apps/[repoId]/designs — gallery page title + upload zone + thumbnails
- /dashboard/apps/[repoId]/designs/[issueNumber] — breadcrumb UUID fix
- /dashboard (mobile) — mobile nav overflow menu
- /dashboard/apps/[repoId] — deployment table empty state
- /dashboard (1280px) — Kanban scroll indicator
