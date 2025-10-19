#!/usr/bin/env bash
#
# BlazeSportsIntel PR Sweep Utility
# ---------------------------------
# Automates the discovery (and optional clean-up) of stale pull requests by
# running a GitHub search query and displaying the matching PR metadata.
#
# This script previously relied on `printf %q` to escape the search query before
# calling the GitHub Search API. That approach produced shell-escaped strings
# (for example, quoting spaces as `\ `) instead of percent-encoding, which broke
# the API request and consistently returned zero results. We now use `jq`'s
# native URI encoder so the query is encoded correctly for HTTP transmission.
#
# Requirements:
#   - `jq` for encoding and response formatting.
#   - `curl` for API requests.
#   - (Optional) `GITHUB_TOKEN` for higher rate limits and authenticated actions.
#
# Usage examples:
#   ./scripts/pr-sweep.sh --repo vercel/next.js --dry-run --limit 5
#   ./scripts/pr-sweep.sh --repo owner/name --stale-days 14 --close-stale --apply
#
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: pr-sweep.sh [options]

Options:
  --repo <owner/name>       Repository to query. Attempts to infer from git remote
                            if omitted.
  --state <open|closed|all> Filter by PR state (default: open).
  --label <label>           Filter by label. Can be repeated.
  --author <login>          Filter by PR author.
  --assignee <login>        Filter by assignee.
  --base <branch>           Filter by base branch.
  --stale-days <N>          Only include PRs not updated in the last N days.
  --search "extra terms"   Additional raw search terms appended to the query.
  --sort <updated|created|comments>
                            Sort key for GitHub search API (default: updated).
  --order <desc|asc>        Sort order (default: desc).
  --limit <N>               Limit displayed results (default: 20).
  --per-page <N>            GitHub API page size (default: 100, max: 100).
  --dry-run                 Print actions without mutating (default).
  --apply                   Execute mutating actions (disables dry-run).
  --close-stale             Close matching PRs (requires --stale-days and
                            GITHUB_TOKEN). Ignored in dry-run mode.
  -h, --help                Show this help message.
USAGE
}

REPO=""
STATE="open"
AUTHOR=""
ASSIGNEE=""
BASE_BRANCH=""
STALE_DAYS=""
EXTRA_SEARCH=""
SORT_FIELD="updated"
SORT_ORDER="desc"
LIMIT=20
PER_PAGE=100
DRY_RUN=true
CLOSE_STALE=false
LABELS=()
TOKEN_REJECTED=false

require_value() {
  local opt="$1"
  if [[ $# -lt 2 || -z "$2" ]]; then
    echo "error: $opt requires a value" >&2
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      require_value "$1" "${2:-}"
      REPO="$2"
      shift 2
      ;;
    --state)
      require_value "$1" "${2:-}"
      STATE="$2"
      shift 2
      ;;
    --label)
      require_value "$1" "${2:-}"
      LABELS+=("$2")
      shift 2
      ;;
    --author)
      require_value "$1" "${2:-}"
      AUTHOR="$2"
      shift 2
      ;;
    --assignee)
      require_value "$1" "${2:-}"
      ASSIGNEE="$2"
      shift 2
      ;;
    --base)
      require_value "$1" "${2:-}"
      BASE_BRANCH="$2"
      shift 2
      ;;
    --stale-days)
      require_value "$1" "${2:-}"
      STALE_DAYS="$2"
      shift 2
      ;;
    --search)
      require_value "$1" "${2:-}"
      EXTRA_SEARCH="$2"
      shift 2
      ;;
    --sort)
      require_value "$1" "${2:-}"
      SORT_FIELD="$2"
      shift 2
      ;;
    --order)
      require_value "$1" "${2:-}"
      SORT_ORDER="$2"
      shift 2
      ;;
    --limit)
      require_value "$1" "${2:-}"
      LIMIT="$2"
      shift 2
      ;;
    --per-page)
      require_value "$1" "${2:-}"
      PER_PAGE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --apply)
      DRY_RUN=false
      shift
      ;;
    --close-stale)
      CLOSE_STALE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown option '$1'" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$REPO" ]]; then
  if REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null); then
    if [[ $REMOTE_URL =~ github\.com[:/]{1,2}([^/]+/[^/]+?)(\.git)?$ ]]; then
      REPO="${BASH_REMATCH[1]}"
    fi
  fi
fi

if [[ -z "$REPO" ]]; then
  echo "error: unable to determine repository. Provide --repo owner/name." >&2
  exit 1
fi

case "$STATE" in
  open|closed|all) ;;
  *)
    echo "error: invalid --state value '$STATE'. Expected open, closed, or all." >&2
    exit 1
    ;;
esac

if [[ -n "$STALE_DAYS" ]] && ! [[ $STALE_DAYS =~ ^[0-9]+$ ]]; then
  echo "error: --stale-days expects a positive integer" >&2
  exit 1
fi

if ! [[ $LIMIT =~ ^[0-9]+$ ]]; then
  echo "error: --limit expects a numeric value" >&2
  exit 1
fi

if ! [[ $PER_PAGE =~ ^[0-9]+$ ]] || (( PER_PAGE < 1 || PER_PAGE > 100 )); then
  echo "error: --per-page must be between 1 and 100" >&2
  exit 1
fi

case "$SORT_FIELD" in
  updated|created|comments) ;;
  *)
    echo "error: --sort must be one of updated, created, comments" >&2
    exit 1
    ;;
esac

case "$SORT_ORDER" in
  desc|asc) ;;
  *)
    echo "error: --order must be 'desc' or 'asc'" >&2
    exit 1
    ;;
esac

if $CLOSE_STALE && [[ -z "$STALE_DAYS" ]]; then
  echo "error: --close-stale requires --stale-days to avoid closing recent PRs" >&2
  exit 1
fi

compute_cutoff() {
  local days="$1"
  python3 - <<PY
import datetime
print((datetime.datetime.utcnow() - datetime.timedelta(days=int("$days"))).strftime("%Y-%m-%dT%H:%M:%SZ"))
PY
}

SEARCH="repo:${REPO} is:pr"
if [[ $STATE != "all" ]]; then
  SEARCH+=" is:${STATE}"
fi

for label in "${LABELS[@]}"; do
  SEARCH+=" label:\"${label}\""
done

if [[ -n "$AUTHOR" ]]; then
  SEARCH+=" author:${AUTHOR}"
fi

if [[ -n "$ASSIGNEE" ]]; then
  SEARCH+=" assignee:${ASSIGNEE}"
fi

if [[ -n "$BASE_BRANCH" ]]; then
  SEARCH+=" base:${BASE_BRANCH}"
fi

if [[ -n "$STALE_DAYS" ]]; then
  CUTOFF=$(compute_cutoff "$STALE_DAYS")
  SEARCH+=" updated:<${CUTOFF}"
fi

if [[ -n "$EXTRA_SEARCH" ]]; then
  SEARCH+=" ${EXTRA_SEARCH}"
fi

ENCODED_QUERY=$(jq -rn --arg q "$SEARCH" '$q|@uri')
API_URL="https://api.github.com/search/issues?q=${ENCODED_QUERY}&per_page=${PER_PAGE}&sort=${SORT_FIELD}&order=${SORT_ORDER}"

BASE_HEADERS=(
  -H "Accept: application/vnd.github+json"
  -H "User-Agent: bsi-pr-sweep-script"
  -H "X-GitHub-Api-Version: 2022-11-28"
)
AUTH_HEADERS=()
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  AUTH_HEADERS=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

TMP_RESPONSE=$(mktemp)
HTTP_STATUS=$(curl -sS -o "$TMP_RESPONSE" -w '%{http_code}' "${BASE_HEADERS[@]}" "${AUTH_HEADERS[@]}" "$API_URL")

if [[ "$HTTP_STATUS" == "401" && ${#AUTH_HEADERS[@]} -gt 0 ]]; then
  TOKEN_REJECTED=true
  echo "⚠️  GitHub token was rejected (HTTP 401). Retrying without token..." >&2
  AUTH_HEADERS=()
  HTTP_STATUS=$(curl -sS -o "$TMP_RESPONSE" -w '%{http_code}' "${BASE_HEADERS[@]}" "$API_URL")
fi

if [[ "$HTTP_STATUS" -ge 400 ]]; then
  echo "error: GitHub API request failed (HTTP $HTTP_STATUS)" >&2
  cat "$TMP_RESPONSE" >&2
  rm -f "$TMP_RESPONSE"
  exit 1
fi

RESPONSE=$(cat "$TMP_RESPONSE")
rm -f "$TMP_RESPONSE"

if $CLOSE_STALE && ! $DRY_RUN; then
  if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    echo "error: --close-stale without a valid GITHUB_TOKEN is not permitted" >&2
    exit 1
  fi
  if $TOKEN_REJECTED; then
    echo "error: provided GITHUB_TOKEN was rejected; cannot perform mutating actions" >&2
    exit 1
  fi
fi

TOTAL_COUNT=$(jq '.total_count // 0' <<<"$RESPONSE")

printf '\n🔎 Search query:%s\n' " $SEARCH"
printf '📦 Results returned:%s\n' " $TOTAL_COUNT"

if (( TOTAL_COUNT == 0 )); then
  if $TOKEN_REJECTED; then
    echo "⚠️  Proceeded without token due to authentication failure." >&2
  fi
  exit 0
fi

if (( LIMIT < TOTAL_COUNT )); then
  printf '📄 Showing first %d results (use --limit to adjust)\n\n' "$LIMIT"
else
  printf '\n'
fi

jq --argjson limit "$LIMIT" -r '
  def fmt_labels:
    if (.labels | length) == 0 then "" else
      "\n  Labels: " + (.labels | map(.name) | join(", "))
    end;
  .items[:$limit] | .[] |
    "- #" + (.number|tostring) + " " + (.title // "") +
    (if (.draft // false) then " [DRAFT]" else "" end) + "\n" +
    "  Author: @" + (.user.login) + "\n" +
    "  State: " + ((.state // "") | ascii_upcase) + "\n" +
    "  Updated: " + (.updated_at // "") + "\n" +
    "  URL: " + (.html_url // "") +
    fmt_labels + "\n"
' <<<"$RESPONSE"

close_pr() {
  local number="$1"
  local url="https://api.github.com/repos/${REPO}/issues/${number}"
  local payload='{"state":"closed"}'
  curl -sS --fail-with-body \
    -X PATCH \
    -H "Accept: application/vnd.github+json" \
    -H "User-Agent: bsi-pr-sweep-script" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$url" >/dev/null
}

if $CLOSE_STALE; then
  echo ""
  if $DRY_RUN; then
    echo "🧪 Dry-run: the following PRs would be closed:"
  else
    echo "🧹 Closing matching PRs..."
  fi

  jq -r '.items[].number' <<<"$RESPONSE" | while read -r pr_number; do
    if [[ -z "$pr_number" ]]; then
      continue
    fi

    if $DRY_RUN; then
      printf '  - #%s (no changes made)\n' "$pr_number"
    else
      close_pr "$pr_number"
      printf '  - Closed #%s\n' "$pr_number"
    fi
  done

  echo ""
fi

if $DRY_RUN; then
  echo "✅ Dry-run complete. No changes were made."
fi

if $TOKEN_REJECTED; then
  echo "⚠️  Results were fetched without the provided GitHub token." >&2
fi
