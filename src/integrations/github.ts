import 'dotenv/config';

const TOKEN = process.env['GITHUB_TOKEN']!;
const OWNER = process.env['GITHUB_OWNER']!;
const REPO = process.env['GITHUB_REPO']!;
const BASE_BRANCH = process.env['GITHUB_BASE_BRANCH'] ?? 'main';
const BASE = 'https://api.github.com';

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  url: string;
  branch: string;
}

// ─── Branch ──────────────────────────────────────────────────────────────────

export async function getBaseBranchSha(): Promise<string> {
  const res = await fetch(
    `${BASE}/repos/${OWNER}/${REPO}/git/ref/heads/${BASE_BRANCH}`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error(`getBaseBranchSha failed [${res.status}]: ${await res.text()}`);
  const data = (await res.json()) as { object: { sha: string } };
  return data.object.sha;
}

export async function createBranch(branchName: string, fromSha: string): Promise<void> {
  const res = await fetch(`${BASE}/repos/${OWNER}/${REPO}/git/refs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`createBranch failed [${res.status}]: ${err}`);
  }
}

// ─── Pull Request ─────────────────────────────────────────────────────────────

export async function openPullRequest(
  title: string,
  branch: string,
  body: string,
  draft = false,
): Promise<GitHubPR> {
  const res = await fetch(`${BASE}/repos/${OWNER}/${REPO}/pulls`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      title,
      body,
      head: branch,
      base: BASE_BRANCH,
      draft,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`openPullRequest failed [${res.status}]: ${err}`);
  }

  const data = (await res.json()) as {
    id: number;
    number: number;
    title: string;
    html_url: string;
    head: { ref: string };
  };

  return {
    id: data.id,
    number: data.number,
    title: data.title,
    url: data.html_url,
    branch: data.head.ref,
  };
}

// ─── Diff ─────────────────────────────────────────────────────────────────────

export async function getPRDiff(prNumber: number): Promise<string> {
  const res = await fetch(`${BASE}/repos/${OWNER}/${REPO}/pulls/${prNumber}`, {
    headers: {
      ...headers(),
      Accept: 'application/vnd.github.diff',
    },
  });
  if (!res.ok) throw new Error(`getPRDiff failed [${res.status}]`);
  return res.text();
}

// ─── Review / Comments ────────────────────────────────────────────────────────

/**
 * Posts a general PR comment (not a line-level review comment).
 */
export async function addPRComment(prNumber: number, body: string): Promise<void> {
  const res = await fetch(
    `${BASE}/repos/${OWNER}/${REPO}/issues/${prNumber}/comments`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`addPRComment failed [${res.status}]: ${err}`);
  }
}

/**
 * Submits a formal GitHub review (APPROVE or REQUEST_CHANGES).
 * This sets the PR review state — more visible than a plain comment.
 */
export async function submitReview(
  prNumber: number,
  outcome: 'APPROVED' | 'CHANGES_REQUESTED',
  body: string,
): Promise<void> {
  const event = outcome === 'APPROVED' ? 'APPROVE' : 'REQUEST_CHANGES';

  const res = await fetch(
    `${BASE}/repos/${OWNER}/${REPO}/pulls/${prNumber}/reviews`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ event, body }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    // Fallback: if review submission fails (e.g. author can't review own PR), post as comment
    console.warn(`[github] submitReview failed [${res.status}]: ${err} — falling back to comment`);
    await addPRComment(prNumber, body);
  }
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export async function addLabels(prNumber: number, labels: string[]): Promise<void> {
  await fetch(`${BASE}/repos/${OWNER}/${REPO}/issues/${prNumber}/labels`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ labels }),
  });
}

// ─── Connection test ──────────────────────────────────────────────────────────

export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/repos/${OWNER}/${REPO}`, {
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
