import { Station } from '@/lib/constants';

export interface DashIssue {
  id: number;
  issue_number: number;
  repo: string;
  title: string;
  body: string | null;
  state: string;
  station: Station | null;
  complexity: string | null;
  issue_type: string | null;
  author: string | null;
  assignee: string | null;
  labels: string[] | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  synced_at: string | null;
  github_issue_url?: string | null;
}

export interface DashStageTransition {
  id: string;
  issue_id: number;
  repo: string;
  issue_number: number;
  from_station: Station | null;
  to_station: Station | null;
  transitioned_at: string;
  duration_seconds: number | null;
  agent_model: string | null;
  metadata: Record<string, unknown> | null;
}

export interface DashAgentRun {
  id: string;
  issue_id: number;
  repo: string;
  issue_number: number;
  station: Station | null;
  model: string | null;
  started_at: string;
  completed_at: string | null;
  run_status: string | null;
  duration_seconds: number | null;
  exit_code: number | null;
  log_summary: string | null;
  estimated_cost_usd: number | null;
  created_at: string;
  updated_at: string;
}

export interface DashDashboardConfig {
  id: string;
  user_id: string;
  tracked_repos: string[];
  notification_prefs: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DashUserRole {
  id: string;
  user_id: string;
  role: 'operator' | 'admin';
  created_at: string;
}
