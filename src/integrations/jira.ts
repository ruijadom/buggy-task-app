import 'dotenv/config';

const BASE_URL = process.env['JIRA_BASE_URL']!;
const EMAIL = process.env['JIRA_EMAIL']!;
const TOKEN = process.env['JIRA_API_TOKEN']!;
const STEPS_FIELD = process.env['JIRA_STEPS_TO_REPRODUCE_FIELD'] ?? 'customfield_10034';

const auth = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

function headers() {
  return {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  stepsToReproduce: string;
  priority: string;
  labels: string[];
  reporter: string;
  assignee: string | null;
}

export async function fetchTicket(ticketId: string): Promise<JiraTicket> {
  const res = await fetch(`${BASE_URL}/rest/api/3/issue/${ticketId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira fetch failed [${res.status}]: ${body}`);
  }

  const data = (await res.json()) as {
    key: string;
    fields: Record<string, unknown>;
  };

  const fields = data.fields;

  return {
    key: data.key,
    summary: String(fields['summary'] ?? ''),
    description: extractText(fields['description']),
    stepsToReproduce: extractText(fields[STEPS_FIELD]),
    priority: extractName(fields['priority']),
    labels: Array.isArray(fields['labels']) ? (fields['labels'] as string[]) : [],
    reporter: extractDisplayName(fields['reporter']),
    assignee: fields['assignee'] ? extractDisplayName(fields['assignee']) : null,
  };
}

export async function transitionTicket(ticketId: string, statusName: string): Promise<void> {
  // Fetch available transitions
  const res = await fetch(`${BASE_URL}/rest/api/3/issue/${ticketId}/transitions`, {
    headers: headers(),
  });
  const data = (await res.json()) as { transitions: Array<{ id: string; name: string }> };
  const transition = data.transitions.find(
    (t) => t.name.toLowerCase() === statusName.toLowerCase(),
  );
  if (!transition) {
    console.warn(`Transition "${statusName}" not found for ${ticketId}. Available: ${data.transitions.map((t) => t.name).join(', ')}`);
    return;
  }

  await fetch(`${BASE_URL}/rest/api/3/issue/${ticketId}/transitions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ transition: { id: transition.id } }),
  });
}

export async function addComment(ticketId: string, body: string): Promise<void> {
  await fetch(`${BASE_URL}/rest/api/3/issue/${ticketId}/comment`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      body: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
      },
    }),
  });
}

export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/rest/api/3/myself`, { headers: headers() });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function extractText(field: unknown): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  // Atlassian Document Format
  const doc = field as { content?: Array<{ content?: Array<{ text?: string }> }> };
  return (
    doc.content
      ?.flatMap((block) => block.content?.map((inline) => inline.text ?? '') ?? [])
      .join(' ')
      .trim() ?? ''
  );
}

function extractName(field: unknown): string {
  if (!field) return 'Medium';
  return (field as { name?: string }).name ?? 'Medium';
}

function extractDisplayName(field: unknown): string {
  if (!field) return 'Unknown';
  return (field as { displayName?: string }).displayName ?? 'Unknown';
}
