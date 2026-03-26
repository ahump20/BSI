#!/bin/bash
# Stop hook: prevent Claude from stopping if AUTONOMOUS-RUN.md has unchecked tasks
TASK_FILE="/Users/AustinHumphrey/AUTONOMOUS-RUN.md"

if [ -f "$TASK_FILE" ]; then
  REMAINING=$(grep -c '^\- \[ \]' "$TASK_FILE" 2>/dev/null || echo "0")
  if [ "$REMAINING" -gt 0 ]; then
    echo "BLOCKED: $REMAINING tasks remain in AUTONOMOUS-RUN.md. Keep working." >&2
    exit 1
  fi
fi

exit 0
