#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
NAME="blaze-platform-visual-design"

python3 "$ROOT/scripts/validate_skill_bundle.py" "$ROOT"
mkdir -p "$DIST"

# Remove any existing archives before recreating so that files deleted from
# references/, scripts/, or evals/ do not silently persist as stale entries.
rm -f "$DIST/$NAME.skill" "$DIST/$NAME.zip"

(
  cd "$ROOT"
  zip -rq "$DIST/$NAME.skill" SKILL.md references scripts evals CHANGELOG.md
  zip -rq "$DIST/$NAME.zip" SKILL.md references scripts evals CHANGELOG.md
)

echo "Packaged: $DIST/$NAME.skill"
echo "Packaged: $DIST/$NAME.zip"
