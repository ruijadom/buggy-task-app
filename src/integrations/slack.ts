import 'dotenv/config';

const TOKEN = process.env['SLACK_BOT_TOKEN'] ?? '';
const CHANNEL = process.env['SLACK_CHANNEL_ID'] ?? '';
const ENABLED = process.env['SLACK_ENABLED'] === 'true';

async function post(payload: object): Promise<void> {
  if (!ENABLED) return;

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel: CHANNEL, ...payload }),
  });

  const data = (await res.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    console.warn(`[slack] Post failed: ${data.error}`);
  }
}

export async function notifyPipelineStart(ticketId: string, ticketSummary: string): Promise<void> {
  await post({
    text: `🤖 *Bugfix Agent started*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🤖 *Bugfix Agent started*\n*Ticket:* \`${ticketId}\` — ${ticketSummary}`,
        },
      },
    ],
  });
}

export async function notifyPipelineComplete(
  ticketId: string,
  prUrl: string,
  prTitle: string,
  outcome: 'APPROVED' | 'CHANGES_REQUESTED',
): Promise<void> {
  const emoji = outcome === 'APPROVED' ? '✅' : '⚠️';
  const label = outcome === 'APPROVED' ? 'Approved by Review Agent' : 'Changes requested by Review Agent';

  await post({
    text: `${emoji} PR ready for human review`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *PR ready for human review*\n*Ticket:* \`${ticketId}\`\n*PR:* <${prUrl}|${prTitle}>\n*Review outcome:* ${label}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open PR' },
            url: prUrl,
            style: 'primary',
          },
        ],
      },
    ],
  });
}

export async function notifyBuildFailed(ticketId: string, prUrl: string): Promise<void> {
  await post({
    text: `❌ Build failed — manual intervention needed`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *Build failed for \`${ticketId}\`*\nThe agent opened a PR but the Codefresh build did not pass. Manual fix needed.\n<${prUrl}|View PR>`,
        },
      },
    ],
  });
}

export async function testConnection(): Promise<boolean> {
  if (!ENABLED) return true;
  try {
    const res = await fetch('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const data = (await res.json()) as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
}
