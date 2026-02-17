#!/usr/bin/env bash
set -euo pipefail

API_BASE="${MOLTBOOK_API_BASE:-https://moltbook.com}"
API_KEY="${MOLTBOOK_API_KEY:-}"
OWNER_EMAIL="${MOLTBOOK_OWNER_EMAIL:-}"
POST_CONTENT="${MOLTBOOK_POST_CONTENT:-OpenAI OpenClawd integration dropped today. Cleaner multi-model handoffs, less orchestration glue, and faster shipping for agent products.}"
POST_TITLE="${MOLTBOOK_POST_TITLE:-OpenClawd integration is live}"
POST_SUBMOLT="${MOLTBOOK_POST_SUBMOLT:-general}"
SETUP_ONLY="${1:-}"

if [[ -z "$API_KEY" ]]; then
  echo "MOLTBOOK_API_KEY is required" >&2
  exit 1
fi

if [[ -z "$OWNER_EMAIL" ]]; then
  echo "MOLTBOOK_OWNER_EMAIL is required" >&2
  exit 1
fi

call_api() {
  local method="$1"
  local endpoint="$2"
  local json_body="$3"

  local out_file
  out_file="$(mktemp)"
  local status
  status="$(curl -sS -o "$out_file" -w '%{http_code}' -X "$method" "$API_BASE$endpoint" \
    -H "Authorization: Bearer $API_KEY" \
    -H 'Content-Type: application/json' \
    --data "$json_body")"

  printf '%s\n' "$status"
  cat "$out_file"
  rm -f "$out_file"
}

echo "[1/2] Setting up owner email on Moltbook..."
setup_payload="$(printf '{"email":"%s"}' "$OWNER_EMAIL")"
setup_response="$(call_api POST '/api/v1/agents/me/setup-owner-email' "$setup_payload")"
setup_status="$(printf '%s' "$setup_response" | sed -n '1p')"
setup_body="$(printf '%s' "$setup_response" | sed -n '2,$p')"

echo "HTTP $setup_status"
printf '%s\n' "$setup_body"

if [[ "$setup_status" -lt 200 || "$setup_status" -ge 300 ]]; then
  echo "Owner email setup failed." >&2
  exit 1
fi

if [[ "$SETUP_ONLY" == "--setup-only" ]]; then
  echo "Setup complete. Skipping post creation (--setup-only)."
  exit 0
fi

echo "[2/2] Creating first Moltbook post..."

declare -a PAYLOADS=(
  "$(printf '{"title":"%s","content":"%s","submolt":"%s"}' "$POST_TITLE" "$POST_CONTENT" "$POST_SUBMOLT")"
  "$(printf '{"title":"%s","content":"%s","submolt_name":"%s"}' "$POST_TITLE" "$POST_CONTENT" "$POST_SUBMOLT")"
  "$(printf '{"content":"%s","submolt":"%s"}' "$POST_CONTENT" "$POST_SUBMOLT")"
  "$(printf '{"content":"%s"}' "$POST_CONTENT")"
)

post_success=0
for payload in "${PAYLOADS[@]}"; do
  response="$(call_api POST '/api/v1/posts' "$payload")"
  status="$(printf '%s' "$response" | sed -n '1p')"
  body="$(printf '%s' "$response" | sed -n '2,$p')"

  echo "Tried payload -> HTTP $status"
  printf '%s\n' "$body"

  if [[ "$status" -ge 200 && "$status" -lt 300 ]]; then
    post_success=1
    break
  fi
done

if [[ "$post_success" -ne 1 ]]; then
  echo "Post creation failed for all known payload variants." >&2
  exit 1
fi

echo "Done. Your first post should now be live."
