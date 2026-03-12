// Spec Review & Approval Flow types — Issue #18

export type ActivityType = 'approved' | 'feedback_requested' | 'skip_design';

export interface SpecActivity {
  id: string;
  issue_id: number;
  actor_id: string;
  activity_type: ActivityType;
  payload: Record<string, unknown>;
  created_at: string;
  // Joined from auth.users via API
  actor_email?: string;
}

export interface SpecApproveRequest {
  issueId: number;        // dash_issues.id (bigint)
  issueNumber: number;
  repo: string;           // e.g. "ascendantventures/factory-dashboard"
  notes?: string;
  skipDesign?: boolean;   // if true, advances station to station:design
}

export interface SpecApproveResponse {
  success: boolean;
  issueId: number;
  activity: SpecActivity;
  newStation: 'spec' | 'design';
}

export interface SpecFeedbackRequest {
  issueId: number;
  issueNumber: number;
  repo: string;
  feedback: string;       // free text, posted as GitHub comment
}

export interface SpecFeedbackResponse {
  success: boolean;
  commentUrl: string;
  activity: SpecActivity;
}

export interface SpecContentResponse {
  issueNumber: number;
  specMarkdown: string | null;
  commentId: number | null;
  commentUrl: string | null;
}
