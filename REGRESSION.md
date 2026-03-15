# REGRESSION.md — Feature Test Manifest

This file lists every testable feature in the app. QA and UAT agents run through
this ENTIRE list on every build — not just new features. If any existing feature
breaks, the build fails.

**Format:** Each feature has a category, test steps, and expected result.
Mark tests with `[auth]` if they require login first.

---

## Notification Bell & Panel (Issue #101)

### Test Steps
- [ ] Navigate to `/dashboard` — bell icon visible in header (44×44px)
- [ ] Click bell — notification panel opens
- [ ] Click bell again — panel closes
- [ ] Click outside panel — panel closes
- [ ] Press Escape with panel open — panel closes
- [ ] If unread notifications exist: badge shows count
- [ ] Click "Mark all read" — badge disappears
- [ ] GET `/api/notifications` without auth — returns 401
- [ ] POST `/api/notifications/read-all` without auth — returns 401

### Routes/Endpoints
- `GET /api/notifications`
- `PATCH /api/notifications/[id]/read`
- `POST /api/notifications/read-all`

---

## Notification Center Phase 2 — Delivery Channels & Quiet Hours (Issue #109)
_Added: 2026-03-15_

### Notification Create API
- [ ] `POST /api/notifications/create` without `x-factory-secret` → returns 401
- [ ] `POST /api/notifications/create` with wrong secret → returns 401
- [ ] `POST /api/notifications/create` with invalid type → returns 400
- [ ] `POST /api/notifications/create` with valid secret, type, user_id, title → returns `{ id: "..." }` and notification appears in bell

### Preferences Page — Notification Types
- [ ] `[auth]` Navigate to `/dashboard/settings/notifications`
- [ ] `[auth]` Page shows exactly 7 type toggles (spec_ready, build_complete, qa_passed, qa_failed, deploy_complete, agent_stalled, pipeline_error)
- [ ] `[auth]` Toggle `spec_ready` off → shows "Saved" indicator → reload → toggle remains off
- [ ] `[auth]` Toggle `spec_ready` back on → shows "Saved"

### Preferences Page — Quiet Hours
- [ ] `[auth]` Quiet hours toggle OFF by default
- [ ] `[auth]` Toggle quiet hours ON → time inputs (From/To) appear
- [ ] `[auth]` Toggle quiet hours OFF → time inputs disappear
- [ ] `[auth]` Set quiet hours start=22:00 end=08:00 → shows "Saved"

### Preferences Page — Delivery Channels
- [ ] `[auth]` "Delivery Channels" section is visible with all 4 elements:
  - `[data-testid="email-enabled-toggle"]`
  - `[data-testid="discord-enabled-toggle"]`
  - `[data-testid="discord-webhook-input"]`
  - `[data-testid="timezone-select"]`
- [ ] `[auth]` Discord toggle is disabled when webhook URL is empty
- [ ] `[auth]` Enter invalid webhook URL (not discord.com) → blur → error message shown
- [ ] `[auth]` Enter valid Discord webhook URL (`https://discord.com/api/webhooks/...`) → blur → "Saved" shows, Discord toggle becomes enabled
- [ ] `[auth]` Click "Send test email" → shows loading state → shows success or error inline
- [ ] `[auth]` Click "Send test message" with valid webhook URL → shows loading state → shows success or error inline

### Preferences Page — Timezone
- [ ] `[auth]` Timezone select shows `UTC` by default
- [ ] `[auth]` Select `America/New_York` → shows "Saved" → reload → still `America/New_York`
- [ ] `[auth]` Popular timezones listed first (UTC, America/New_York, etc.)
- [ ] `[auth]` All IANA timezones available in dropdown

### Test Delivery API
- [ ] `POST /api/notifications/test-delivery` without session → returns 401
- [ ] `POST /api/notifications/test-delivery` with `channel: "discord"` and invalid URL → returns `{ ok: false, error: "..." }`

### Routes/Endpoints
- `POST /api/notifications/create`
- `GET /api/notifications/preferences`
- `PATCH /api/notifications/preferences`
- `POST /api/notifications/test-delivery`
- `/dashboard/settings/notifications`
