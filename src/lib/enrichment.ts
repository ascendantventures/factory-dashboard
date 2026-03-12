export interface IssueEnrichment {
  total_cost_usd: number;
  active_runs: number;
  entered_at: string | null;
}

export type EnrichmentMap = Map<number, IssueEnrichment>;

// Format elapsed time as "12m", "2h", "3d"
export function formatTimeInStage(enteredAt: string | null): string | null {
  if (!enteredAt) return null;
  const now = Date.now();
  const entered = new Date(enteredAt).getTime();
  const diffMs = now - entered;
  if (diffMs < 0) return null;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays >= 2) return `${diffDays}d`;
  if (diffHours >= 1) return `${diffHours}h`;
  return `${Math.max(diffMins, 1)}m`;
}

// Format cost as "$0.04"
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

// Get issue type from labels array
export function getIssueType(labels: string[] | null): 'feature' | 'bug' | 'phase2' | 'default' {
  if (!labels) return 'default';
  const labelsLower = labels.map(l => {
    if (typeof l === 'string') return l.toLowerCase();
    // Handle case where label might be an object like { name: 'type:feature' }
    const lobj = l as unknown;
    if (typeof lobj === 'object' && lobj !== null && 'name' in (lobj as object)) {
      return ((lobj as { name: string }).name || '').toLowerCase();
    }
    return String(l).toLowerCase();
  });
  if (labelsLower.some(l => l.includes('type:feature') || l === 'feature')) return 'feature';
  if (labelsLower.some(l => l.includes('type:bug') || l === 'bug')) return 'bug';
  if (labelsLower.some(l => l.includes('type:phase2') || l.includes('phase2'))) return 'phase2';
  return 'default';
}
