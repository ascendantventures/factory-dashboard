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

## Issue Templates & Quick Create (Issue #27)
_Added: 2026-03-12_

### Template Library Page [auth]
- [ ] Navigate to /dashboard/templates — page loads, grid of 6 default templates appears
- [ ] Verify template names: "SaaS Application", "Landing Page", "API Service", "Internal Dashboard", "E-commerce Store", "Portfolio / Showcase" are all visible
- [ ] Verify each template card has `data-testid="template-card"`
- [ ] Verify complexity badges appear: simple=green, medium=yellow, complex=red
- [ ] Verify "Default" badge appears on all 6 seeded templates
- [ ] Verify estimated cost is shown on each card (e.g., "~3-5 credits", "~15-25 credits")
- [ ] Verify left border color matches complexity (green/yellow/red)

### Template Preview [auth]
- [ ] Click "Preview" on any template card — TemplatePreviewModal opens
- [ ] Modal shows template name, complexity badge, estimated cost, body_template content
- [ ] Modal shows "System template" badge for default templates
- [ ] Click "Use this template" button in modal — modal closes, QuickCreateModal opens on Step 1 with that template pre-selected

### Quick Create Modal — Header Button [auth]
- [ ] Click "New Issue" button in dashboard header — QuickCreateModal opens
- [ ] Step 1 shows all 6 templates + "Start blank" option
- [ ] Step indicator shows 4 steps: Template → Details → Review → Submit

### Quick Create Modal — Template Flow [auth]
- [ ] Select "SaaS Application" template — card gets indigo border, Next button enables
- [ ] Click Next — Step 2 shows title input (empty, since title_prefix is empty) and description textarea
- [ ] Fill in description "Test SaaS app" — text entered
- [ ] Click Next — Step 3 shows rendered body with "Test SaaS app" in place of {{description}}, {{description}} placeholder NOT visible
- [ ] Labels section shows "complexity:complex" badge
- [ ] Click "Create issue" — Step 4 shows loading spinner
- [ ] On success: shows CheckCircle2 icon, "Issue created!" heading, link "View issue #N on GitHub"
- [ ] Click "Create another" — resets to Step 1

### Quick Create Modal — Start Blank [auth]
- [ ] Select "Start blank" in Step 1 — dashed card gets selected state, Next enables
- [ ] Click Next — Step 2 title field is empty
- [ ] Fill title and description, proceed through Steps 3 and 4 normally

### Admin: New Template Button [auth]
- [ ] If logged in as admin, "/dashboard/templates" page shows "+ New Template" button in top-right
- [ ] Click "+ New Template" — TemplateFormModal opens with empty fields, title "Create template"
- [ ] Submit with empty name — shows inline error "name is required" (or similar)
- [ ] Fill name "Test Template", body template "## Overview\n{{description}}", click Save/Create
- [ ] New template appears in the grid

### Admin: Edit Template [auth]
- [ ] As admin, click Edit icon (pencil) on a custom template — TemplateFormModal opens pre-filled
- [ ] Change the description, click Save — card updates in place
- [ ] Modal closes after save

### Admin: Delete Template [auth]
- [ ] As admin, click Delete icon (trash) on a custom template — DeleteConfirmModal opens
- [ ] Modal shows template name, "Delete" (red) and "Keep template" buttons
- [ ] Click "Delete" — template is removed from the grid
- [ ] Try to delete a system default template — show error "System templates cannot be deleted."

### API Routes
- GET /api/templates — returns { templates: [...] } with 6+ items
- POST /api/templates — admin only, 403 for non-admin
- PATCH /api/templates/[id] — admin only, 403 for non-admin
- DELETE /api/templates/[id] — admin only, 403 for system defaults

### Routes
- /dashboard/templates
- GET /api/templates
- POST /api/templates
- PATCH /api/templates/[id]
- DELETE /api/templates/[id]
