#!/usr/bin/env bash
set -euo pipefail

# PR Sweep helper
# Searches for open pull requests authored by a specific user and prints a summary.

usage() {
  cat <<USAGE
Usage: AUTHOR=<github-handle> [DRY_RUN=true] ${0##*/}

Environment variables:
  AUTHOR        GitHub handle to search for (required if no positional argument).
  REPO          Optional GitHub repository (owner/name). Defaults to the current git remote origin.
  DRY_RUN       When "true", the script only prints actions but still fetches PR data. (default: false)
  PER_PAGE      Number of results per page when hitting the GitHub API. (default: 30)
USAGE
}

# Resolve author from ENV or first argument.
AUTHOR=${AUTHOR:-${1:-}}
if [[ -z "${AUTHOR}" ]]; then
  echo "AUTHOR is required." >&2
  usage
  exit 1
fi

# Resolve repository (owner/name). Only needed for display; the search endpoint is global.
resolve_repo() {
  if [[ -n "${REPO:-}" ]]; then
    printf '%s' "$REPO"
    return
  fi

  if git remote get-url origin >/dev/null 2>&1; then
    local remote
    remote=$(git remote get-url origin)
    remote=${remote%.git}
    remote=${remote#git@}
    remote=${remote#https://}
    remote=${remote#ssh://}
    remote=${remote#git://}
    remote=${remote#github.com[:/]}
    printf '%s' "$remote"
    return
  fi

  printf 'unknown/unknown'
}

REPO_SLUG=$(resolve_repo)
DRY_RUN=${DRY_RUN:-false}
PER_PAGE=${PER_PAGE:-30}

# Maintain the original human-readable search string for logging.
SEARCH="is:pr is:open author:${AUTHOR}"

# URL-encode helper (RFC 3986 compliant for query components).
urlencode() {
  local string="${1}"
  local length=${#string}
  local encoded=''
  local pos char code
  for (( pos = 0; pos < length; pos++ )); do
    char=${string:pos:1}
    case "$char" in
      [a-zA-Z0-9._~-])
        encoded+="$char"
        ;;
      ' ')
        encoded+="+"
        ;;
      *)
        printf -v code '%%%02X' "'$char"
        encoded+="$code"
        ;;
    esac
  done
  printf '%s' "$encoded"
}

ENCODED_AUTHOR=$(urlencode "$AUTHOR")
QUERY=$(printf 'is:pr+is:open+author:%s' "$ENCODED_AUTHOR")

API_PATH="search/issues"
API_FLAGS=(
  "-f" "q=${QUERY}"
  "-f" "sort=updated"
  "-f" "order=desc"
  "-f" "per_page=${PER_PAGE}"
)

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "[DRY RUN] Searching for: ${SEARCH}"
fi

echo "Repository context: ${REPO_SLUG}" >&2

fetch_with_gh() {
  gh api "${API_PATH}" "${API_FLAGS[@]}" -f page=1 --paginate=false
}

fetch_with_curl() {
  local url="https://api.github.com/${API_PATH}?q=${QUERY}&sort=updated&order=desc&per_page=${PER_PAGE}&page=1"
  local headers=("-H" "Accept: application/vnd.github+json" "-H" "User-Agent: pr-sweep-script")
  local response

  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    if ! response=$(curl -fsSL "${headers[@]}" -H "Authorization: Bearer ${GITHUB_TOKEN}" "$url" 2>/dev/null); then
      response=$(curl -fsSL "${headers[@]}" "$url")
    fi
    printf '%s' "$response"
    return
  fi

  curl -fsSL "${headers[@]}" "$url"
}

RESPONSE=''
if command -v gh >/dev/null 2>&1; then
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "[DRY RUN] gh api ${API_PATH} ${API_FLAGS[*]} -f page=1" >&2
  fi
  RESPONSE=$(fetch_with_gh)
else
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "[DRY RUN] gh CLI not found; falling back to curl." >&2
  fi
  RESPONSE=$(fetch_with_curl)
fi

if [[ -z "${RESPONSE}" ]]; then
  echo "No response received from GitHub API." >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  JQ_FILTER=$(cat <<'JQ'
    "Total open PRs by \($author): " + (.total_count|tostring),
    "",
    (.items[] | "#" + (.number|tostring) + " " + .title + " [" + (.repository_url | split("/")[-2:] | join("/")) + "] updated " + .updated_at)
JQ
  )
  echo "$RESPONSE" | jq -r --arg author "$AUTHOR" "$JQ_FILTER"
else
  echo "$RESPONSE"
fi
