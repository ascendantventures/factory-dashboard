// Static route manifest for /api/docs/routes
// Hand-authored — do not attempt dynamic FS scanning at request time.
// Update this file when new API routes are added.

export interface RouteParameter {
  name: string;
  in: 'query' | 'path' | 'body';
  type: string;
  required: boolean;
  description?: string;
}

export interface RouteEntry {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  category: 'issues' | 'pipeline' | 'admin' | 'settings' | 'analytics';
  parameters: RouteParameter[];
  response: Record<string, string>;
  auth_required: boolean;
  example_request?: string;
  example_response?: string;
}

export const ROUTE_MANIFEST: RouteEntry[] = [
  // ── ISSUES ───────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/api/issues',
    description: 'List all tracked GitHub issues synced from the configured repository.',
    category: 'issues',
    parameters: [],
    response: { '200': 'Issue[]' },
    auth_required: true,
    example_request: 'GET /api/issues',
    example_response: '[{ "id": 1, "title": "...", "station": "build", ... }]',
  },
  {
    method: 'POST',
    path: '/api/issues',
    description: 'Create a new GitHub issue in the configured repository with station:intake label.',
    category: 'issues',
    parameters: [
      { name: 'title', in: 'body', type: 'string', required: true, description: 'Issue title' },
      { name: 'body', in: 'body', type: 'string', required: false, description: 'Issue body (markdown)' },
      { name: 'build_repo', in: 'body', type: 'string', required: false, description: 'Target build repo (owner/repo)' },
    ],
    response: { '201': 'Issue', '400': 'ErrorResponse' },
    auth_required: true,
    example_request: 'POST /api/issues\n{ "title": "New feature", "body": "..." }',
    example_response: '{ "id": 42, "number": 42, "title": "New feature" }',
  },
  {
    method: 'GET',
    path: '/api/issues/[number]',
    description: 'Get details for a single issue including stage timeline, agent runs, and cost breakdown.',
    category: 'issues',
    parameters: [
      { name: 'number', in: 'path', type: 'integer', required: true, description: 'GitHub issue number' },
    ],
    response: { '200': 'IssueDetail', '404': 'ErrorResponse' },
    auth_required: true,
    example_request: 'GET /api/issues/31',
    example_response: '{ "issue": {...}, "transitions": [...], "agentRuns": [...] }',
  },
  {
    method: 'POST',
    path: '/api/issues/[number]/action',
    description: 'Perform a pipeline action on an issue: skip, block, retry, advance, or revert.',
    category: 'issues',
    parameters: [
      { name: 'number', in: 'path', type: 'integer', required: true, description: 'GitHub issue number' },
      { name: 'action', in: 'body', type: 'string', required: true, description: 'skip | block | retry | advance | revert' },
    ],
    response: { '200': 'ActionResult', '400': 'ErrorResponse' },
    auth_required: true,
    example_request: 'POST /api/issues/31/action\n{ "action": "advance" }',
    example_response: '{ "ok": true }',
  },

  // ── PIPELINE ──────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/api/pipeline/status',
    description: 'Returns the current harness process status: PID, active locks, backoffs, and recent audit log.',
    category: 'pipeline',
    parameters: [],
    response: { '200': 'PipelineStatus' },
    auth_required: true,
    example_request: 'GET /api/pipeline/status',
    example_response: '{ "running": true, "pid": 1234, "locks": [], "backoffs": [] }',
  },
  {
    method: 'POST',
    path: '/api/pipeline/control',
    description: 'Send a control command to the harness: start_loop, stop_loop, force_tick, clear_locks, or clear_backoff.',
    category: 'pipeline',
    parameters: [
      { name: 'action', in: 'body', type: 'string', required: true, description: 'start_loop | stop_loop | force_tick | clear_locks | clear_backoff' },
    ],
    response: { '200': 'ControlResult', '400': 'ErrorResponse' },
    auth_required: true,
    example_request: 'POST /api/pipeline/control\n{ "action": "force_tick" }',
    example_response: '{ "ok": true }',
  },
  {
    method: 'GET',
    path: '/api/pipeline/config',
    description: 'Get pipeline station configuration (model, concurrency, enabled state per station).',
    category: 'pipeline',
    parameters: [],
    response: { '200': 'StationConfig[]' },
    auth_required: true,
    example_request: 'GET /api/pipeline/config',
    example_response: '[{ "station_name": "build", "model": "claude-sonnet-4-6", "enabled": true }]',
  },
  {
    method: 'PATCH',
    path: '/api/pipeline/config',
    description: 'Update pipeline station configuration. Upserts on station_name.',
    category: 'pipeline',
    parameters: [
      { name: 'station_name', in: 'body', type: 'string', required: true, description: 'Station identifier' },
      { name: 'model', in: 'body', type: 'string', required: false, description: 'Claude model ID' },
      { name: 'enabled', in: 'body', type: 'boolean', required: false, description: 'Whether station is active' },
    ],
    response: { '200': 'StationConfig', '400': 'ErrorResponse' },
    auth_required: true,
    example_request: 'PATCH /api/pipeline/config\n{ "station_name": "build", "model": "claude-opus-4-6" }',
    example_response: '{ "station_name": "build", "model": "claude-opus-4-6", "enabled": true }',
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/api/admin/events',
    description: 'Paginated event log with optional filters for direction, event_type, status, and date range.',
    category: 'admin',
    parameters: [
      { name: 'page', in: 'query', type: 'integer', required: false, description: 'Page number (default 1)' },
      { name: 'per_page', in: 'query', type: 'integer', required: false, description: 'Results per page (default 50, max 200)' },
      { name: 'direction', in: 'query', type: 'string', required: false, description: 'in | out' },
      { name: 'event_type', in: 'query', type: 'string', required: false, description: 'Filter by event_type (exact match)' },
      { name: 'status', in: 'query', type: 'string', required: false, description: 'received | delivered | failed' },
      { name: 'from', in: 'query', type: 'string', required: false, description: 'ISO8601 start date' },
      { name: 'to', in: 'query', type: 'string', required: false, description: 'ISO8601 end date' },
    ],
    response: { '200': 'EventLogListResponse', '401': 'ErrorResponse' },
    auth_required: true,
    example_request: 'GET /api/admin/events?direction=in&status=received&page=1',
    example_response: '{ "data": [...], "pagination": { "page": 1, "per_page": 50, "total": 342 } }',
  },
  {
    method: 'POST',
    path: '/api/admin/events/[id]/retry',
    description: 'Retry a failed outgoing webhook delivery by re-dispatching the stored payload.',
    category: 'admin',
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Event UUID' },
    ],
    response: { '200': 'RetryResult', '400': 'ErrorResponse', '404': 'ErrorResponse' },
    auth_required: true,
    example_request: 'POST /api/admin/events/abc-123/retry',
    example_response: '{ "success": true, "status": "delivered" }',
  },

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/api/config/templates',
    description: 'List all build templates in the template registry.',
    category: 'settings',
    parameters: [],
    response: { '200': 'Template[]' },
    auth_required: true,
    example_request: 'GET /api/config/templates',
    example_response: '[{ "id": "uuid", "slug": "nextjs-supabase", "name": "Next.js + Supabase" }]',
  },
  {
    method: 'POST',
    path: '/api/config/templates',
    description: 'Create a new build template. Admin only. 409 if slug taken.',
    category: 'settings',
    parameters: [
      { name: 'slug', in: 'body', type: 'string', required: true, description: 'Unique slug identifier' },
      { name: 'name', in: 'body', type: 'string', required: true, description: 'Human-readable name' },
      { name: 'repo_url', in: 'body', type: 'string', required: true, description: 'GitHub template repo URL' },
    ],
    response: { '201': 'Template', '400': 'ErrorResponse', '409': 'ErrorResponse' },
    auth_required: true,
    example_request: 'POST /api/config/templates\n{ "slug": "nextjs-supabase", "name": "Next.js + Supabase", "repo_url": "..." }',
    example_response: '{ "id": "uuid", "slug": "nextjs-supabase", ... }',
  },
  {
    method: 'PATCH',
    path: '/api/config/templates/[id]',
    description: 'Update a build template. Admin only. Handles is_default atomically.',
    category: 'settings',
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Template UUID' },
    ],
    response: { '200': 'Template', '404': 'ErrorResponse' },
    auth_required: true,
    example_request: 'PATCH /api/config/templates/uuid\n{ "is_default": true }',
    example_response: '{ "id": "uuid", "is_default": true, ... }',
  },
  {
    method: 'DELETE',
    path: '/api/config/templates/[id]',
    description: 'Delete a build template. Admin only. 400 if it is the only default for a project type.',
    category: 'settings',
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Template UUID' },
    ],
    response: { '200': 'SuccessResponse', '400': 'ErrorResponse', '404': 'ErrorResponse' },
    auth_required: true,
    example_request: 'DELETE /api/config/templates/uuid',
    example_response: '{ "ok": true }',
  },
  {
    method: 'GET',
    path: '/api/config/env-status',
    description: 'Returns all required environment variables with set/missing status and masked preview. Never returns values.',
    category: 'settings',
    parameters: [],
    response: { '200': 'EnvStatus[]' },
    auth_required: true,
    example_request: 'GET /api/config/env-status',
    example_response: '[{ "name": "GITHUB_TOKEN", "set": true, "masked_preview": "ghp_****...***abc" }]',
  },
  {
    method: 'POST',
    path: '/api/config/health-check',
    description: 'Live connectivity tests to GitHub, Supabase, Vercel, and Anthropic. Not cached.',
    category: 'settings',
    parameters: [],
    response: { '200': 'HealthCheckResults' },
    auth_required: true,
    example_request: 'POST /api/config/health-check',
    example_response: '{ "github": { "ok": true, "latency_ms": 120 }, ... }',
  },
  {
    method: 'GET',
    path: '/api/config/keys',
    description: 'API key status and rotation history. Admin only.',
    category: 'settings',
    parameters: [],
    response: { '200': 'ApiKeyStatus[]' },
    auth_required: true,
    example_request: 'GET /api/config/keys',
    example_response: '[{ "name": "GITHUB_TOKEN", "last_rotated_at": "2026-01-01T00:00:00Z" }]',
  },
  {
    method: 'POST',
    path: '/api/config/keys/rotate',
    description: 'Log an API key rotation event. Admin only.',
    category: 'settings',
    parameters: [
      { name: 'key_name', in: 'body', type: 'string', required: true, description: 'Name of the rotated key' },
      { name: 'notes', in: 'body', type: 'string', required: false, description: 'Optional rotation notes' },
    ],
    response: { '200': 'SuccessResponse', '400': 'ErrorResponse' },
    auth_required: true,
    example_request: 'POST /api/config/keys/rotate\n{ "key_name": "GITHUB_TOKEN" }',
    example_response: '{ "ok": true }',
  },

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/api/metrics',
    description: 'Aggregated pipeline metrics: throughput by station, average time in stage, cost per issue.',
    category: 'analytics',
    parameters: [
      { name: 'from', in: 'query', type: 'string', required: false, description: 'ISO8601 start date' },
      { name: 'to', in: 'query', type: 'string', required: false, description: 'ISO8601 end date' },
    ],
    response: { '200': 'MetricsResponse' },
    auth_required: true,
    example_request: 'GET /api/metrics?from=2026-03-01',
    example_response: '{ "throughput": {...}, "stage_times": {...}, "costs": {...} }',
  },
  {
    method: 'GET',
    path: '/api/runs',
    description: 'List all agent runs with cost, duration, model, and status.',
    category: 'analytics',
    parameters: [
      { name: 'issue_id', in: 'query', type: 'string', required: false, description: 'Filter by issue UUID' },
      { name: 'status', in: 'query', type: 'string', required: false, description: 'running | completed | failed' },
    ],
    response: { '200': 'AgentRun[]' },
    auth_required: true,
    example_request: 'GET /api/runs?status=running',
    example_response: '[{ "id": "uuid", "model": "claude-sonnet-4-6", "run_status": "running", ... }]',
  },
  {
    method: 'GET',
    path: '/api/docs/routes',
    description: 'Returns the static route manifest for the API documentation page.',
    category: 'admin',
    parameters: [],
    response: { '200': 'RouteManifestResponse' },
    auth_required: true,
    example_request: 'GET /api/docs/routes',
    example_response: '{ "routes": [...] }',
  },
  {
    method: 'GET',
    path: '/api/sync',
    description: 'Triggers a pull-based sync of GitHub issues into the Supabase dash_issues table.',
    category: 'pipeline',
    parameters: [],
    response: { '200': 'SyncResult' },
    auth_required: true,
    example_request: 'GET /api/sync',
    example_response: '{ "synced": 12, "updated": 3, "skipped": 1 }',
  },
  {
    method: 'GET',
    path: '/api/sync/status',
    description: 'Returns the timestamp and status of the last sync operation.',
    category: 'pipeline',
    parameters: [],
    response: { '200': 'SyncStatus' },
    auth_required: true,
    example_request: 'GET /api/sync/status',
    example_response: '{ "lastSync": "2026-03-12T16:00:00Z", "status": "ok" }',
  },
  {
    method: 'POST',
    path: '/api/webhooks/github',
    description: 'Receives incoming GitHub webhook events (HMAC-verified). Processes issue label changes to update station.',
    category: 'pipeline',
    parameters: [
      { name: 'x-hub-signature-256', in: 'body', type: 'string', required: true, description: 'HMAC-SHA256 signature header' },
      { name: 'x-github-event', in: 'body', type: 'string', required: true, description: 'GitHub event type' },
    ],
    response: { '200': 'WebhookResult', '401': 'ErrorResponse' },
    auth_required: false,
    example_request: 'POST /api/webhooks/github\n[GitHub webhook payload]',
    example_response: '{ "ok": true }',
  },
  {
    method: 'GET',
    path: '/api/build-repos',
    description: 'Fetches and caches the list of build repos from BUILD COMPLETE comments. 1hr TTL.',
    category: 'pipeline',
    parameters: [],
    response: { '200': 'BuildRepo[]' },
    auth_required: true,
    example_request: 'GET /api/build-repos',
    example_response: '[{ "repo": "org/repo", "url": "https://...", "issue_number": 1 }]',
  },
  {
    method: 'GET',
    path: '/api/activity',
    description: 'Unified activity feed from stage transitions and agent runs, newest first.',
    category: 'analytics',
    parameters: [
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Max results (default 50)' },
    ],
    response: { '200': 'ActivityEvent[]' },
    auth_required: true,
    example_request: 'GET /api/activity?limit=20',
    example_response: '[{ "event_type": "stage_completed", "issue_title": "...", "created_at": "..." }]',
  },
];

export const ROUTE_CATEGORIES = ['admin', 'issues', 'pipeline', 'settings', 'analytics'] as const;
export type RouteCategory = typeof ROUTE_CATEGORIES[number];
