/**
 * Unified Git provider interface.
 *
 * The pipeline only talks to this — it never imports github.ts or bitbucket.ts directly.
 * Switch providers by setting GIT_PROVIDER=github or GIT_PROVIDER=bitbucket in .env.
 */

import 'dotenv/config';

export interface PR {
  /** Provider-specific numeric ID */
  id: number;
  /** PR number (same as id on Bitbucket; separate on GitHub) */
  number: number;
  title: string;
  url: string;
  branch: string;
}

export interface GitProvider {
  name: 'github' | 'bitbucket';
  /** SHA/hash of the tip of the base branch — used to create the agent branch */
  getBaseBranchSha(): Promise<string>;
  createBranch(branchName: string, fromSha: string): Promise<void>;
  openPullRequest(title: string, branch: string, body: string): Promise<PR>;
  getPRDiff(prNumber: number): Promise<string>;
  /** Post the review result. On GitHub this submits a formal review; on Bitbucket a comment. */
  submitReview(prNumber: number, outcome: 'APPROVED' | 'CHANGES_REQUESTED', body: string): Promise<void>;
  addLabels(prNumber: number, labels: string[]): Promise<void>;
  testConnection(): Promise<boolean>;
}

// ─── GitHub adapter ───────────────────────────────────────────────────────────

async function makeGitHubProvider(): Promise<GitProvider> {
  const gh = await import('./github.ts');
  return {
    name: 'github',
    getBaseBranchSha: gh.getBaseBranchSha,
    createBranch: gh.createBranch,
    openPullRequest: async (title, branch, body) => {
      const pr = await gh.openPullRequest(title, branch, body);
      return { id: pr.id, number: pr.number, title: pr.title, url: pr.url, branch: pr.branch };
    },
    getPRDiff: gh.getPRDiff,
    submitReview: gh.submitReview,
    addLabels: gh.addLabels,
    testConnection: gh.testConnection,
  };
}

// ─── Bitbucket adapter ────────────────────────────────────────────────────────

async function makeBitbucketProvider(): Promise<GitProvider> {
  const bb = await import('./bitbucket.ts');
  return {
    name: 'bitbucket',
    getBaseBranchSha: bb.getDefaultBranchCommit,
    createBranch: bb.createBranch,
    openPullRequest: async (title, branch, body) => {
      const pr = await bb.openPullRequest(title, branch, body);
      return { id: pr.id, number: pr.id, title: pr.title, url: pr.url, branch: pr.branch };
    },
    getPRDiff: bb.getPRDiff,
    submitReview: async (prNumber, _outcome, body) => {
      // Bitbucket doesn't have a formal review state via API — post as comment
      await bb.addPRComment(prNumber, body);
    },
    addLabels: async () => {
      // Bitbucket uses "tags" on PRs — not supported in this version
      console.log('[bitbucket] addLabels: not implemented (Bitbucket uses PR tags, not labels)');
    },
    testConnection: bb.testConnection,
  };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export type ProviderName = 'github' | 'bitbucket';

export async function getGitProvider(): Promise<GitProvider> {
  const raw = (process.env['GIT_PROVIDER'] ?? 'github').toLowerCase();

  if (raw === 'github') return makeGitHubProvider();
  if (raw === 'bitbucket') return makeBitbucketProvider();

  throw new Error(
    `Unknown GIT_PROVIDER "${raw}". Valid values: github, bitbucket`,
  );
}
