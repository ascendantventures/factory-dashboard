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
  log_file_path: string | null;
  pid: number | null;
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

export interface DashTemplate {
  template_id: string;
  template_slug: string;
  template_name: string;
  description: string | null;
  source_repo: string;
  deploy_target: string;
  project_type: string;
  is_default: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FdIssueTemplate {
  id: string;
  name: string;
  description: string;
  title_prefix: string;
  body_template: string;
  labels: string[];
  estimated_cost: string;
  complexity: 'simple' | 'medium' | 'complex';
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashKeyRotationLog {
  id: string;
  key_name: string;
  rotated_by: string | null;
  rotated_at: string;
  notes: string | null;
  metadata: Record<string, unknown>;
}
