#!/usr/bin/env bash
# post-pr-evidence.sh — commits screenshots and posts them as a PR comment
# Usage: bash scripts/post-pr-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── 1. Check that there are screenshots to post ────────────────────────────
if ! ls qa-evidence/screenshot-*.png &>/dev/null; then
  echo "No screenshots found in qa-evidence/. Run npm run qa:screenshot first."
  exit 1
fi

# ── 2. Get current branch and PR info ─────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")

PR_NUMBER=$(gh pr view --json number -q '.number' 2>/dev/null || echo "")
if [ -z "$PR_NUMBER" ]; then
  echo "No open PR found for branch '$BRANCH'."
  echo "Create a PR first with: gh pr create"
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
echo "Posting QA evidence to PR #$PR_NUMBER ($REPO)..."

# ── 3. Commit screenshots to the branch ───────────────────────────────────
git add qa-evidence/
if git diff --cached --quiet; then
  echo "No new screenshots to commit (already up to date)."
else
  git commit -m "chore: add QA evidence screenshots [$COMMIT]

  Branch: $BRANCH
  Captured: $TIMESTAMP
  [skip ci]"
  git push
  echo "Screenshots committed and pushed."
fi

# ── 4. Build the PR comment with embedded images ──────────────────────────
RAW_BASE="https://raw.githubusercontent.com/$REPO/$BRANCH"

COMMENT="## QA Evidence — \`$BRANCH\`

| Screenshot | View |
|------------|------|"

for PNG in qa-evidence/screenshot-*.png; do
  LABEL=$(basename "$PNG" .png | sed 's/screenshot-[0-9T-]*-//' | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
  URL="$RAW_BASE/$PNG"
  COMMENT+="
| **$LABEL** | ![$LABEL]($URL) |"
done

COMMENT+="

---
*Commit \`$COMMIT\` · $TIMESTAMP*"

# ── 5. Post comment on the PR ─────────────────────────────────────────────
gh pr comment "$PR_NUMBER" --body "$COMMENT"
echo "✓ QA evidence posted to PR #$PR_NUMBER"
echo "  https://github.com/$REPO/pull/$PR_NUMBER"
