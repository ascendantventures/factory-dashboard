import { Octokit } from '@octokit/rest';
import { Station, STATIONS } from './constants';

let octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!octokit) {
    octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return octokit;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  user: { login: string } | null;
  assignee: { login: string } | null;
  labels: Array<{ name?: string }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export function extractStation(labels: Array<{ name?: string }>): Station | null {
  for (const label of labels) {
    if (!label.name) continue;
    const match = label.name.match(/^station:(.+)$/);
    if (match) {
      const station = match[1].toLowerCase();
      if (STATIONS.includes(station as Station)) {
        return station as Station;
      }
    }
  }
  return null;
}

export function extractComplexity(labels: Array<{ name?: string }>): string | null {
  for (const label of labels) {
    if (!label.name) continue;
    const match = label.name.match(/^complexity:(.+)$/i);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

export function extractIssueType(labels: Array<{ name?: string }>): string | null {
  for (const label of labels) {
    if (!label.name) continue;
    const match = label.name.match(/^type:(.+)$/i);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

export async function fetchRepoIssues(
  owner: string,
  repo: string,
  since?: string
): Promise<GitHubIssue[]> {
  const kit = getOctokit();
  const issues: GitHubIssue[] = [];
  let page = 1;

  while (true) {
    const response = await kit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      page,
      ...(since ? { since } : {}),
    });

    if (response.data.length === 0) break;
    // Filter out pull requests
    const filtered = response.data.filter((i) => !i.pull_request);
    issues.push(...(filtered as unknown as GitHubIssue[]));
    if (response.data.length < 100) break;
    page++;
  }

  return issues;
}

export interface GitHubComment {
  id: number;
  body: string;
  created_at: string;
}

export async function fetchIssueComments(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubComment[]> {
  const kit = getOctokit();
  const response = await kit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });
  return response.data as GitHubComment[];
}

export async function updateIssueLabel(
  owner: string,
  repo: string,
  issueNumber: number,
  oldStation: Station | null,
  newStation: Station
): Promise<void> {
  const kit = getOctokit();

  // Get current labels
  const { data: issue } = await kit.issues.get({ owner, repo, issue_number: issueNumber });
  const currentLabels = issue.labels
    .map((l) => (typeof l === 'string' ? l : l.name))
    .filter((n): n is string => !!n)
    .filter((n) => !n.startsWith('station:'));

  currentLabels.push(`station:${newStation}`);

  await kit.issues.setLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: currentLabels,
  });
}
