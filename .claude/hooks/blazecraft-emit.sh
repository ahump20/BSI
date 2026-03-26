#!/bin/bash
#
# BlazeCraft Telemetry Emitter
#
# Emits tool use events to BlazeCraft SSE endpoint for real-time visualization.
# Called by Claude Code hooks on PostToolUse events.
#
# Environment variables (set by Claude Code):
#   CLAUDE_AGENT_ID      - Unique agent identifier
#   CLAUDE_AGENT_NAME    - Human-readable agent name
#   CLAUDE_TOOL_NAME     - Name of the tool that was used
#   CLAUDE_TOOL_FILES    - JSON array of files affected (optional)
#
# Configuration:
#   BLAZECRAFT_URL       - BlazeCraft API endpoint (default: https://blazecraft.app)
#   BLAZECRAFT_TOKEN     - Auth token for BlazeCraft API

set -euo pipefail

# Configuration with defaults
BLAZECRAFT_URL="${BLAZECRAFT_URL:-https://blazecraft.app}"
BLAZECRAFT_TOKEN="${BLAZECRAFT_TOKEN:-}"

# Agent info from Claude Code environment
AGENT_ID="${CLAUDE_AGENT_ID:-unknown-$(date +%s)}"
AGENT_NAME="${CLAUDE_AGENT_NAME:-Claude Agent}"
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"
TOOL_FILES="${CLAUDE_TOOL_FILES:-[]}"

# Determine event type based on tool
EVENT_TYPE="task_complete"
if [[ "$TOOL_NAME" == "Bash" ]]; then
  EVENT_TYPE="command"
elif [[ "$TOOL_NAME" == "Read" ]]; then
  EVENT_TYPE="status"
fi

# Map tool to region based on file paths (simplified heuristic)
REGION="townhall"
if echo "$TOOL_FILES" | grep -q "src/core"; then
  REGION="src_core"
elif echo "$TOOL_FILES" | grep -q "src/ui"; then
  REGION="src_ui"
elif echo "$TOOL_FILES" | grep -q "tests"; then
  REGION="tests"
elif echo "$TOOL_FILES" | grep -q "config"; then
  REGION="config"
elif echo "$TOOL_FILES" | grep -q "docs"; then
  REGION="docs"
fi

# Build payload
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PAYLOAD=$(cat <<EOF
{
  "type": "$EVENT_TYPE",
  "agentId": "$AGENT_ID",
  "agentName": "$AGENT_NAME",
  "timestamp": "$TIMESTAMP",
  "data": {
    "tool": "$TOOL_NAME",
    "files": $TOOL_FILES,
    "region": "$REGION"
  }
}
EOF
)

# Send to BlazeCraft (non-blocking, fail silently)
if [[ -n "$BLAZECRAFT_TOKEN" ]]; then
  curl -s -X POST "${BLAZECRAFT_URL}/api/events/ingest" \
    -H "Authorization: Bearer $BLAZECRAFT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    --max-time 2 \
    > /dev/null 2>&1 || true
else
  # No auth token, skip sending
  : # No-op
fi
