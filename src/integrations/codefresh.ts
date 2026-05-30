import 'dotenv/config';

const API_KEY = process.env['CODEFRESH_API_KEY'] ?? '';
const PIPELINE = process.env['CODEFRESH_PIPELINE_NAME'] ?? '';
const TIMEOUT_SEC = Number(process.env['CODEFRESH_TIMEOUT_SECONDS'] ?? 300);
const ENABLED = process.env['CODEFRESH_ENABLED'] === 'true';
const BASE = 'https://g.codefresh.io/api';

function headers() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export type BuildStatus = 'success' | 'failure' | 'timeout' | 'skipped';

/**
 * Wait for the most recent Codefresh build for the given PR branch to complete.
 * Returns 'skipped' if Codefresh integration is disabled.
 */
export async function waitForBuild(branch: string): Promise<BuildStatus> {
  if (!ENABLED) {
    console.log('[codefresh] Integration disabled — skipping build gate.');
    return 'skipped';
  }

  console.log(`[codefresh] Waiting for build on branch "${branch}" (timeout: ${TIMEOUT_SEC}s)…`);

  const deadline = Date.now() + TIMEOUT_SEC * 1000;

  while (Date.now() < deadline) {
    const status = await pollLatestBuild(branch);
    if (status === 'running') {
      await sleep(15_000);
      continue;
    }
    console.log(`[codefresh] Build finished with status: ${status}`);
    return status;
  }

  console.warn('[codefresh] Build timed out.');
  return 'timeout';
}

async function pollLatestBuild(branch: string): Promise<BuildStatus | 'running'> {
  try {
    const res = await fetch(
      `${BASE}/workflow?pipeline=${encodeURIComponent(PIPELINE)}&branch=${encodeURIComponent(branch)}&limit=1`,
      { headers: headers() },
    );

    if (!res.ok) {
      console.warn(`[codefresh] Poll failed [${res.status}] — retrying…`);
      return 'running';
    }

    const data = (await res.json()) as {
      docs?: Array<{ status: string }>;
    };

    const build = data.docs?.[0];
    if (!build) return 'running'; // Build not triggered yet

    switch (build.status) {
      case 'success':
        return 'success';
      case 'error':
      case 'failed':
      case 'terminated':
        return 'failure';
      default:
        return 'running';
    }
  } catch (err) {
    console.warn('[codefresh] Poll error:', err);
    return 'running';
  }
}

export async function testConnection(): Promise<boolean> {
  if (!ENABLED) return true; // Not configured — skip
  try {
    const res = await fetch(`${BASE}/user`, { headers: headers() });
    return res.ok;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
