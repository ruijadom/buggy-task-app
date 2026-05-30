# Broadvoice Bugfix Agent

An autonomous multi-agent pipeline that reads a Jira bug ticket, writes a fix, opens a Pull Request on Bitbucket, validates the build via Codefresh, and posts a code review — all without human involvement until the final approval step.

Built with [Sandcastle](https://github.com/mattpocock/sandcastle) and the Anthropic Claude API.

---

## How it works

```
Jira Ticket (input)
       │
       ▼
  Fix Agent  ── claude-opus-4-6
  ├─ reads ticket + steps to reproduce
  ├─ explores the codebase
  ├─ writes the fix & commits
  └─ opens branch agent/fix-<ticket>
       │
       ▼
  Bitbucket PR opened automatically
       │
       ▼
  Codefresh CI build  (optional gate)
  └─ build must pass before review
       │
       ▼
  Review Agent  ── claude-sonnet-4-6
  ├─ reads the full PR diff
  ├─ checks correctness, types, React patterns, tests
  └─ posts structured review on the PR
       │
       ▼
  Slack notification → human reviews & merges
```

Each agent runs in an isolated Docker sandbox via Sandcastle — full filesystem and terminal access with zero risk to your main working directory.

---

## Requirements

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20 | |
| Docker | any recent | Must be running |
| pnpm | ≥ 8 | `npm i -g pnpm` |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com) |
| Jira account | Cloud | API token required |
| Bitbucket account | Cloud | App Password required |
| Codefresh | optional | CI build gate |
| Slack bot | optional | notifications |

---

## Setup

### 1. Clone and install

```bash
git clone https://bitbucket.org/yourworkspace/broadvoice-bugfix-agent.git
cd broadvoice-bugfix-agent
pnpm install
```

### 2. Configure environment

```bash
cp .sandcastle/.env.example .sandcastle/.env
```

Open `.sandcastle/.env` and fill in your credentials. Every variable is documented. Minimum required:

- `ANTHROPIC_API_KEY`
- `JIRA_EMAIL` + `JIRA_API_TOKEN` + `JIRA_BASE_URL` + `JIRA_PROJECT_KEY`
- `BITBUCKET_WORKSPACE` + `BITBUCKET_REPO_SLUG` + `BITBUCKET_APP_PASSWORD` + `BITBUCKET_USERNAME`

Codefresh and Slack are optional — set `CODEFRESH_ENABLED=false` and `SLACK_ENABLED=false` to skip them.

### 3. Find your Jira custom field ID

Your Jira may use a different field ID for "Steps to Reproduce":

```bash
curl -u your@email.com:YOUR_API_TOKEN \
  "https://yourcompany.atlassian.net/rest/api/3/field" \
  | jq '.[] | select(.name | test("Steps"; "i")) | {id, name}'
```

Set the result as `JIRA_STEPS_TO_REPRODUCE_FIELD` in your `.env`.

### 4. Test connections

```bash
pnpm run test:connections
```

Validates Jira, Bitbucket, Codefresh, and Slack before you spend any tokens.

### 5. Initialize Sandcastle

```bash
npx sandcastle init
```

Builds the Docker base image. Only needed once.

---

## Usage

### Run the pipeline

```bash
JIRA_TICKET_ID=BUG-42 pnpm run pipeline
```

### Dry run (no API calls, mock data)

```bash
JIRA_TICKET_ID=BUG-42 pnpm run pipeline:dry-run
```

Use this to verify prompt formatting and pipeline logic without spending tokens or touching Jira/Bitbucket.

### Test integrations only

```bash
pnpm run test:connections
```

---

## Project structure

```
broadvoice-bugfix-agent/
├── .sandcastle/
│   ├── .env.example            # All env variables, documented
│   ├── .env                    # Your credentials (gitignored)
│   ├── logs/                   # Timestamped run logs (gitignored)
│   └── prompts/
│       ├── fix-agent.md        # System prompt for the Fix Agent
│       └── review-agent.md     # System prompt for the Review Agent
├── src/
│   └── integrations/
│       ├── jira.ts             # Jira REST API v3
│       ├── bitbucket.ts        # Bitbucket REST API v2
│       ├── codefresh.ts        # Codefresh build polling
│       └── slack.ts            # Slack notifications
├── scripts/
│   ├── pipeline.ts             # Main orchestrator — entry point
│   └── test-connections.ts     # Pre-flight checks
├── architecture.drawio         # System diagram (open in draw.io)
├── package.json
└── tsconfig.json
```

---

## Agents

### Fix Agent

**Model:** `claude-opus-4-6` (set via `FIX_AGENT_MODEL`)

Reads the Jira ticket, explores the repo, writes the minimal fix, commits it to a new branch, and signals completion.

**Prompt:** `.sandcastle/prompts/fix-agent.md`
**Completion signal:** `<promise>COMPLETE</promise>`
**Max iterations:** `MAX_FIX_ITERATIONS` (default: 3)

### Review Agent

**Model:** `claude-sonnet-4-6` (set via `REVIEW_AGENT_MODEL`)

Reads the PR diff and posts a structured review with `OUTCOME: APPROVED` or `OUTCOME: CHANGES_REQUESTED`, a summary, and specific required changes if any.

**Prompt:** `.sandcastle/prompts/review-agent.md`
**Max iterations:** `MAX_REVIEW_ITERATIONS` (default: 2)

---

## Logs

Each run creates a timestamped log:

```
.sandcastle/logs/run-2026-05-29T21-30-00-000Z.log
```

Contains: ticket details, agent output, PR URL, build status, review outcome, and errors.

---

## Cost estimate

| Component | Cost |
|-----------|------|
| Sandcastle | Free (open source) |
| Docker | Free |
| Bitbucket API | Free (your plan) |
| Jira API | Free (your plan) |
| Codefresh | Free (your plan) |
| Claude API | ~$0.15–$0.80 per run |

A typical run uses ~8,000–15,000 output tokens on Opus (Fix Agent) and ~2,000–4,000 on Sonnet (Review Agent).

---

## Which bugs are good candidates?

**Works well:**
- Bug is clearly described with steps to reproduce
- Isolated to one module or component
- No domain knowledge required (not WebRTC internals, SIP signaling, audio pipeline)
- Reproducible without a running backend

**Will likely fail:**
- Race conditions in async WebRTC flows
- Bugs that only appear in production under load
- Bugs that need understanding of real-time audio/video state machines

A good practice: add label `agent-ready` to Jira tickets that are suitable.

---

## Troubleshooting

**`sandcastle init` fails** — Make sure Docker is running: `docker ps`

**Jira 401** — `JIRA_EMAIL` and `JIRA_API_TOKEN` must be a Jira API token, not your Atlassian password.

**Bitbucket 403** — App Password needs "Repositories: Read/Write" and "Pull requests: Read/Write" permissions.

**Fix Agent loops without completing** — The bug may be too complex. Check the log and add more context to the Jira description.

**Review posted but empty changes list** — Check the raw log file; the Bitbucket comment may be truncated.

---

## License

Internal use — Broadvoice.
