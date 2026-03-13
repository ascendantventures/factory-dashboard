export type PipelineEvent =
  | 'issue.created'
  | 'issue.stage_changed'
  | 'spec.completed'
  | 'spec.approved'
  | 'build.started'
  | 'build.completed'
  | 'build.failed'
  | 'qa.passed'
  | 'qa.failed'
  | 'deploy.completed'
  | 'agent.spawned'
  | 'agent.stalled'
  | 'agent.completed'
  | 'pipeline.started'
  | 'pipeline.stopped'
  | 'pipeline.error';

export interface PipelineEventDef {
  value: PipelineEvent;
  label: string;
  category: string;
}

export const PIPELINE_EVENTS: PipelineEventDef[] = [
  { value: 'issue.created',       label: 'Issue Created',       category: 'Issues' },
  { value: 'issue.stage_changed', label: 'Issue Stage Changed', category: 'Issues' },
  { value: 'spec.completed',      label: 'Spec Completed',      category: 'Spec' },
  { value: 'spec.approved',       label: 'Spec Approved',       category: 'Spec' },
  { value: 'build.started',       label: 'Build Started',       category: 'Build' },
  { value: 'build.completed',     label: 'Build Completed',     category: 'Build' },
  { value: 'build.failed',        label: 'Build Failed',        category: 'Build' },
  { value: 'qa.passed',           label: 'QA Passed',           category: 'QA' },
  { value: 'qa.failed',           label: 'QA Failed',           category: 'QA' },
  { value: 'deploy.completed',    label: 'Deploy Completed',    category: 'Deploy' },
  { value: 'agent.spawned',       label: 'Agent Spawned',       category: 'Agent' },
  { value: 'agent.stalled',       label: 'Agent Stalled',       category: 'Agent' },
  { value: 'agent.completed',     label: 'Agent Completed',     category: 'Agent' },
  { value: 'pipeline.started',    label: 'Pipeline Started',    category: 'Pipeline' },
  { value: 'pipeline.stopped',    label: 'Pipeline Stopped',    category: 'Pipeline' },
  { value: 'pipeline.error',      label: 'Pipeline Error',      category: 'Pipeline' },
];

export const EVENT_CATEGORIES = ['Issues', 'Spec', 'Build', 'QA', 'Deploy', 'Agent', 'Pipeline'] as const;
