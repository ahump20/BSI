#!/bin/bash
# Long autonomous run — launches the task runner in background.
# Usage: bash ~/.claude/scripts/bsi-6hr-run.sh
#
# Runs all tasks from ~/TASKS.md with elevated budget/timeout.
# Logs to ~/.claude/tasks/autonomous-run-<timestamp>.log
# Audit trail: ~/.claude/tasks/audit-log.jsonl

set -euo pipefail

LOG_DIR="$HOME/.claude/tasks"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/autonomous-run-$(date +%Y%m%d-%H%M).log"

nohup bash "$HOME/.claude/scripts/run-tasks.sh" --budget 15 --timeout 1200 \
  > "$LOG_FILE" 2>&1 &

PID=$!
echo "Runner started in background. PID: $PID"
echo "Log:    tail -f $LOG_FILE"
echo "Audit:  cat $LOG_DIR/audit-log.jsonl | jq -r '.task_id + \": \" + .status'"
echo "Stop:   kill $PID"
