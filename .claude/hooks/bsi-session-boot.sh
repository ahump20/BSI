#!/bin/bash
# BSI Session Boot — injected via SessionStart hook
# Outputs current repo state so sessions start aware, not blind.

REPO_DIR="/Users/AustinHumphrey/bsi-repo"

# Only run if we're in the BSI repo
if [[ "$PWD" != "$REPO_DIR"* ]]; then
  exit 0
fi

cd "$REPO_DIR" 2>/dev/null || exit 0

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
LAST_5=$(git log --oneline -5 2>/dev/null || echo "no commits")
UNCOMMITTED=$(git status --short 2>/dev/null | head -10)
UNCOMMITTED_COUNT=$(git status --short 2>/dev/null | wc -l | tr -d ' ')

cat <<EOF
[BSI Session Boot]
Branch: $BRANCH
Recent commits:
$LAST_5
EOF

if [ "$UNCOMMITTED_COUNT" -gt 0 ]; then
  echo "Uncommitted changes ($UNCOMMITTED_COUNT files):"
  echo "$UNCOMMITTED"
  if [ "$UNCOMMITTED_COUNT" -gt 10 ]; then
    echo "  ... and $(($UNCOMMITTED_COUNT - 10)) more"
  fi
else
  echo "Working tree clean."
fi
