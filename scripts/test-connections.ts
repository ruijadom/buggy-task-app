/**
 * Pre-flight connection check.
 * Validates credentials for all configured integrations before running the pipeline.
 *
 * Usage: pnpm run test:connections
 */

import 'dotenv/config';
import * as jira from '../src/integrations/jira.ts';
import * as github from '../src/integrations/github.ts';
import * as bitbucket from '../src/integrations/bitbucket.ts';
import * as codefresh from '../src/integrations/codefresh.ts';
import * as slack from '../src/integrations/slack.ts';

const GIT_PROVIDER = (process.env['GIT_PROVIDER'] ?? 'github').toLowerCase();

// ─── Build check list based on active provider ────────────────────────────────

const CHECKS: Array<{ name: string; fn: () => Promise<boolean>; required: boolean }> = [
  {
    name: 'Jira',
    fn: jira.testConnection,
    required: true,
  },
];

if (GIT_PROVIDER === 'github') {
  CHECKS.push({
    name: 'GitHub',
    fn: github.testConnection,
    required: true,
  });
} else if (GIT_PROVIDER === 'bitbucket') {
  CHECKS.push({
    name: 'Bitbucket',
    fn: bitbucket.testConnection,
    required: true,
  });
} else {
  console.error(`Unknown GIT_PROVIDER="${GIT_PROVIDER}". Valid values: github, bitbucket`);
  process.exit(1);
}

CHECKS.push(
  { name: 'Codefresh (optional)', fn: codefresh.testConnection, required: false },
  { name: 'Slack     (optional)', fn: slack.testConnection,     required: false },
);

// ─── Run checks ───────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Broadvoice Bugfix Agent — Connection Tests ===');
  console.log(`    Git provider: ${GIT_PROVIDER}\n`);

  let allRequired = true;

  for (const check of CHECKS) {
    process.stdout.write(`  Checking ${check.name}… `);
    try {
      const ok = await check.fn();
      if (ok) {
        console.log('✅  OK');
      } else {
        console.log('❌  FAILED');
        if (check.required) allRequired = false;
      }
    } catch (err) {
      console.log(`❌  ERROR — ${(err as Error).message}`);
      if (check.required) allRequired = false;
    }
  }

  console.log('');

  if (allRequired) {
    console.log('✅ All required connections are healthy. Ready to run the pipeline.\n');
    console.log('Next step:');
    console.log(`  JIRA_TICKET_ID=BUG-42 pnpm run pipeline:dry-run\n`);
  } else {
    console.log('❌ One or more required connections failed. Fix the errors above before running the pipeline.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
