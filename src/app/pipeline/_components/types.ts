export interface LoopStatus {
  running: boolean;
  pid: number | null;
  uptime_seconds: number | null;
  last_tick_at: string | null;
}

export interface Counts {
  processed_today: number;
  processed_week: number;
  processed_total: number;
  active_agents: number;
  errors_today: number;
}

export interface LockEntry {
  issue: number;
  station: string;
  locked_at: string;
}

export interface BackoffEntry {
  issue: number;
  until: string;
  crash_count: number;
}

export interface PipelineStatus {
  loop: LoopStatus;
  counts: Counts;
  locks: LockEntry[];
  backoffs: BackoffEntry[];
}

export interface StationConfig {
  id: string;
  station_name: string;
  model_id: string;
  concurrency: number;
  timeout_seconds: number;
  is_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface AuditLogEntry {
  id: string;
  created_at: string;
  action_name: string;
  issue_number: number | null;
  operator_email: string | null;
  metadata: Record<string, unknown> | null;
}
