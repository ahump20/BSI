#!/bin/bash
# BlazeCraft Event Hook
# Sends Claude Code tool events to BlazeCraft live backend
#
# Fires on: Edit, Write, Bash (task completion)
# Sends: spawn (session start), task_complete (file edits)

BLAZECRAFT_API="https://blazecraft.app/api/events"
SESSION_ID="${CLAUDE_SESSION_ID:-$(hostname)-$$}"
AGENT_NAME="Claude-$(echo $SESSION_ID | cut -c1-6)"

# Read the hook input from stdin
INPUT=$(cat)

# Extract tool name and parameters
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty')

# Skip if no tool name
[ -z "$TOOL_NAME" ] && exit 0

# Track if we've spawned this session (use a temp file)
SPAWN_FILE="/tmp/blazecraft-spawned-$SESSION_ID"

# Spawn agent on first tool use
if [ ! -f "$SPAWN_FILE" ]; then
  curl -s -X POST "$BLAZECRAFT_API" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"spawn\",\"agentId\":\"$SESSION_ID\",\"agentName\":\"$AGENT_NAME\",\"session\":\"main\"}" \
    > /dev/null 2>&1 &
  touch "$SPAWN_FILE"
fi

# Handle file-related tools
case "$TOOL_NAME" in
  Edit|Write)
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty')
    if [ -n "$FILE_PATH" ]; then
      curl -s -X POST "$BLAZECRAFT_API" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"task_complete\",\"agentId\":\"$SESSION_ID\",\"session\":\"main\",\"data\":{\"files\":[\"$FILE_PATH\"]}}" \
        > /dev/null 2>&1 &
    fi
    ;;
  Bash)
    # Send task_start for bash commands
    COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // empty' | head -c 100)
    if [ -n "$COMMAND" ]; then
      curl -s -X POST "$BLAZECRAFT_API" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"task_start\",\"agentId\":\"$SESSION_ID\",\"session\":\"main\",\"data\":{\"message\":\"$COMMAND\"}}" \
        > /dev/null 2>&1 &
    fi
    ;;
esac

# Always exit 0 to not block Claude
exit 0
