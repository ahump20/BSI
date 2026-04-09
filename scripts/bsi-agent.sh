#!/usr/bin/env bash
# bsi-agent — dispatch a task to the BSI Builder Managed Agent and stream the result.
#
# Usage:
#   scripts/bsi-agent.sh "Your task here"
#   scripts/bsi-agent.sh --title "Quick Name" "Your task here"
#   scripts/bsi-agent.sh --file task.txt
#
# Requires: ANTHROPIC_API_KEY exported. jq and python3 for output parsing.

set -euo pipefail

# ── Resources (from memory/reference_managed-agents.md) ──
AGENT_ID="agent_011CZs65h3UHn2BC8eRAA67S"
ENV_ID="env_019k3WL1KH4nV3T8QTCKP5Fe"
API_BASE="https://api.anthropic.com/v1"
BETA_HEADER="managed-agents-2026-04-01"

# ── Required headers (used everywhere) ──
auth_headers=(
  -H "x-api-key: ${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY not set}"
  -H "anthropic-version: 2023-06-01"
  -H "anthropic-beta: ${BETA_HEADER}"
)

# ── Parse args ──
TITLE="BSI Agent Task"
TASK=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --title) TITLE="$2"; shift 2 ;;
    --file)  TASK="$(cat "$2")"; shift 2 ;;
    --help|-h)
      grep '^# ' "$0" | sed 's/^# //'
      exit 0 ;;
    *) TASK="$1"; shift ;;
  esac
done

if [[ -z "${TASK}" ]]; then
  echo "Error: no task provided. Usage: $0 \"Your task\"" >&2
  exit 1
fi

echo "▶ Dispatching to BSI Builder (agent v3, visual verification enabled)"
echo "  Title: ${TITLE}"
echo

# ── 1. Create session ──
SESSION_PAYLOAD=$(python3 -c "
import json
print(json.dumps({
  'agent': {'type': 'agent', 'id': '${AGENT_ID}', 'version': 3},
  'environment_id': '${ENV_ID}',
  'title': '''${TITLE}'''
}))
")

SESSION_JSON=$(curl -sS -X POST "${API_BASE}/sessions" \
  "${auth_headers[@]}" \
  -H "Content-Type: application/json" \
  -d "${SESSION_PAYLOAD}")

SESSION_ID=$(echo "${SESSION_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "✓ Session created: ${SESSION_ID}"

# ── 2. Start stream in background ──
STREAM_LOG=$(mktemp -t bsi-agent-stream.XXXXXX)
trap 'rm -f "${STREAM_LOG}"' EXIT

curl -sS -N "${API_BASE}/sessions/${SESSION_ID}/events/stream" \
  "${auth_headers[@]}" \
  -H "Accept: text/event-stream" > "${STREAM_LOG}" 2>&1 &
STREAM_PID=$!

sleep 1

# ── 3. Send the user message ──
MESSAGE_PAYLOAD=$(python3 -c "
import json, sys
task = sys.stdin.read()
print(json.dumps({
  'events': [{
    'type': 'user.message',
    'content': [{'type': 'text', 'text': task}]
  }]
}))
" <<< "${TASK}")

curl -sS -X POST "${API_BASE}/sessions/${SESSION_ID}/events" \
  "${auth_headers[@]}" \
  -H "Content-Type: application/json" \
  -d "${MESSAGE_PAYLOAD}" > /dev/null

echo "✓ Task sent. Agent is working..."
echo "  (Streaming live progress. Ctrl+C to detach — session keeps running.)"
echo

# ── 4. Poll until idle, showing progress ──
LAST_TOOLS=0
while true; do
  sleep 15
  STATUS=$(curl -sS "${API_BASE}/sessions/${SESSION_ID}" "${auth_headers[@]}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{d[\"status\"]}|{d[\"usage\"][\"output_tokens\"]}')")
  STATE=${STATUS%|*}
  TOKENS=${STATUS#*|}
  TOOLS=$(grep -c '"agent.tool_use"' "${STREAM_LOG}" 2>/dev/null | head -1)
  TOOLS=${TOOLS:-0}

  if (( TOOLS > LAST_TOOLS )); then
    echo "  [$(date +%H:%M:%S)] ${STATE} · ${TOOLS} tool calls · ${TOKENS} tokens"
    LAST_TOOLS=${TOOLS}
  fi

  if [[ "${STATE}" == "idle" || "${STATE}" == "terminated" ]]; then
    break
  fi
done

{ kill ${STREAM_PID} 2>/dev/null && wait ${STREAM_PID} 2>/dev/null; } || true

echo
echo "✓ Agent finished. Pulling final report..."
echo "───────────────────────────────────────────────────"
echo

# ── 5. Extract and print the final agent message ──
curl -sS "${API_BASE}/sessions/${SESSION_ID}/events" \
  "${auth_headers[@]}" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
events = data.get('data', [])
for ev in reversed(events):
    if ev['type'] == 'agent.message':
        for block in ev.get('content', []):
            if block.get('type') == 'text':
                print(block['text'])
        break
"

echo
echo "───────────────────────────────────────────────────"
echo "Session: ${SESSION_ID}"
echo "Re-fetch report:  curl -sS ${API_BASE}/sessions/${SESSION_ID}/events ..."
