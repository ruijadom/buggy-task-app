import 'dotenv/config';

const WORKSPACE = process.env['BITBUCKET_WORKSPACE']!;
const REPO = process.env['BITBUCKET_REPO_SLUG']!;
const USERNAME = process.env['BITBUCKET_USERNAME']!;
const APP_PASSWORD = process.env['BITBUCKET_APP_PASSWORD']!;
const BASE_BRANCH = process.env['BITBUCKET_BASE_BRANCH'] ?? 'develop';
const BASE = 'https://api.bitbucket.org/2.0';

function headers() {
  const creds = Buffer.from(`${USERNAME}:${APP_PASSWORD}`).toString('base64');
  return {
    Authorization: `Basic ${creds}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export interface BitbucketPR {
  id: number;
  title: string;
  url: string;
  branch: string;
}

export async function getDefaultBranchCommit(): Promise<string> {
  const res = await fetch(
    `${BASE}/repositories/${WORKSPACE}/${REPO}/refs/branches/${BASE_BRANCH}`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error(`Failed to get branch: ${res.status}`);
  const data = (await res.json()) as { target: { hash: string } };
  return data.target.hash;
}

export async function createBranch(branchName: string, fromCommit: string): Promise<void> {
  const res = await fetch(`${BASE}/repositories/${WORKSPACE}/${REPO}/refs/branches`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name: branchName, target: { hash: fromCommit } }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`createBranch failed [${res.status}]: ${body}`);
  }
}

export async function openPullRequest(
  title: string,
  branch: string,
  description: string,
  reviewers: string[] = [],
): Promise<BitbucketPR> {
  const body = {
    title,
    description,
    source: { branch: { name: branch } },
    destination: { branch: { name: BASE_BRANCH } },
    reviewers: reviewers.map((uuid) => ({ uuid })),
    close_source_branch: true,
  };

  const res = await fetch(`${BASE}/repositories/${WORKSPACE}/${REPO}/pullrequests`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`openPullRequest failed [${res.status}]: ${err}`);
  }

  const data = (await res.json()) as {
    id: number;
    title: string;
    links: { html: { href: string } };
    source: { branch: { name: string } };
  };

  return {
    id: data.id,
    title: data.title,
    url: data.links.html.href,
    branch: data.source.branch.name,
  };
}

export async function getPRDiff(prId: number): Promise<string> {
  const res = await fetch(
    `${BASE}/repositories/${WORKSPACE}/${REPO}/pullrequests/${prId}/diff`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error(`getPRDiff failed [${res.status}]`);
  return res.text();
}

export async function addPRComment(prId: number, body: string): Promise<void> {
  const res = await fetch(
    `${BASE}/repositories/${WORKSPACE}/${REPO}/pullrequests/${prId}/comments`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content: { raw: body } }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`addPRComment failed [${res.status}]: ${err}`);
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/repositories/${WORKSPACE}/${REPO}`, {
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
