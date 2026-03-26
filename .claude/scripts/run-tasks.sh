#!/usr/bin/env bash
# Autonomous task runner v2.1 for BSI properties
# Feeds tasks from TASKS.md to Claude Code headless with structured output,
# scoped permissions, retry logic, and optional parallel execution.
#
# Usage:
#   bash ~/.claude/scripts/run-tasks.sh                  # Run all tasks sequentially
#   bash ~/.claude/scripts/run-tasks.sh 3                 # Run first 3 tasks
#   bash ~/.claude/scripts/run-tasks.sh --dry-run          # Dry run: show parsed tasks
#   bash ~/.claude/scripts/run-tasks.sh --parallel 3       # Run 3 tasks at a time
#   bash ~/.claude/scripts/run-tasks.sh 5 --parallel 2     # First 5 tasks, 2 at a time
#   bash ~/.claude/scripts/run-tasks.sh --budget 10        # Override per-task budget cap
#   bash ~/.claude/scripts/run-tasks.sh --timeout 300      # Override per-task timeout (seconds)
#
# Each task gets its own Claude Code session + git commit.
# Tasks are identified by ### TASKID headers in TASKS.md.
#
# v2.1 changes over v2:
#   - Fixed bash 3.2 empty-array crash (macOS default bash)
#   - Separated stderr from stdout on claude calls (prevents JSON corruption)
#   - Idempotency: skips already-completed tasks from audit log
#   - Per-task timeout via timeout/gtimeout command (default 600s)
#   - Lockfile prevents concurrent script invocations
#   - Retry resets git state before second attempt
#   - --max-turns 25 safety valve on claude sessions
#   - Tightened Bash tool permissions (scoped patterns, not bare Bash)
#   - HUP signal handling for terminal disconnect
#   - Priority sorting (HIGH then MEDIUM then LOW then unspecified)
#   - Proper worktree array element removal in cleanup

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
TASKS_FILE="$HOME/TASKS.md"
SITE_DIR="$HOME"
MEGA_PROMPT="$HOME/.claude/scripts/MEGA_PROMPT.md"
AUDIT_DIR="$HOME/.claude/tasks"
AUDIT_LOG="$AUDIT_DIR/audit-log.jsonl"
WORKTREE_BASE="/var/tmp/bsi-task"
LOCKFILE="$AUDIT_DIR/runner.lock"

MAX_TASKS=999
PARALLEL=1
MAX_PARALLEL=5
DRY_RUN=0
DEFAULT_BUDGET="15.00"
DEFAULT_TIMEOUT=1200
DEFAULT_MAX_TURNS=75

# Tool permissions: with --dangerously-skip-permissions active, grant full tool access.
# The permission flag is the real safety boundary; scoped tools caused legitimate ops to fail.
DEFAULT_TOOLS=""

# Tracking
COMPLETED=0
FAILED=0
SKIPPED=0
TOTAL_COST="0"
declare -a RESULT_ROWS=()
declare -a ACTIVE_WORKTREES=()

# ─── Argument Parsing ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --parallel)
      PARALLEL="${2:?--parallel requires a number}"
      if [[ "$PARALLEL" -gt "$MAX_PARALLEL" ]]; then
        echo "Capping parallel to $MAX_PARALLEL (requested $PARALLEL)"
        PARALLEL=$MAX_PARALLEL
      fi
      shift 2 ;;
    --dry-run)
      DRY_RUN=1
      shift ;;
    --budget)
      DEFAULT_BUDGET="${2:?--budget requires an amount}"
      shift 2 ;;
    --timeout)
      DEFAULT_TIMEOUT="${2:?--timeout requires seconds}"
      shift 2 ;;
    -*)
      echo "Unknown flag: $1" >&2; exit 1 ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        if [[ -z "${_GOT_MAX:-}" ]]; then
          MAX_TASKS="$1"
          _GOT_MAX=1
        elif [[ "$1" -eq 1 ]]; then
          DRY_RUN=1
        fi
      else
        echo "Unknown argument: $1" >&2; exit 1
      fi
      shift ;;
  esac
done

# ─── Validation ───────────────────────────────────────────────────────────────
for f in "$TASKS_FILE" "$MEGA_PROMPT"; do
  [ -f "$f" ] || { echo "ERROR: $f not found." >&2; exit 1; }
done
for cmd in jq claude git bc; do
  command -v "$cmd" &>/dev/null || { echo "ERROR: $cmd is required." >&2; exit 1; }
done
# timeout: prefer coreutils timeout/gtimeout, fall back to perl-based watchdog
if command -v timeout &>/dev/null; then
  : # native timeout available
elif command -v gtimeout &>/dev/null; then
  timeout() { gtimeout "$@"; }
else
  # Pure POSIX fallback using background watchdog (works on macOS)
  timeout() {
    local duration="$1"; shift
    "$@" &
    local cmd_pid=$!
    (
      sleep "$duration"
      kill "$cmd_pid" 2>/dev/null
    ) &
    local watchdog_pid=$!
    wait "$cmd_pid" 2>/dev/null
    local exit_code=$?
    kill "$watchdog_pid" 2>/dev/null
    wait "$watchdog_pid" 2>/dev/null
    # If command was killed by watchdog, return 124 (matching GNU timeout)
    if [ "$exit_code" -eq 137 ] || [ "$exit_code" -eq 143 ]; then
      return 124
    fi
    return "$exit_code"
  }
fi
mkdir -p "$AUDIT_DIR"

# ─── Lockfile (PID-based, works without flock) ───────────────────────────────
if [ -f "$LOCKFILE" ]; then
  existing_pid=$(cat "$LOCKFILE" 2>/dev/null)
  if [ -n "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
    echo "ERROR: Another task runner is already active (PID $existing_pid)." >&2
    echo "  Lockfile: $LOCKFILE" >&2
    echo "  If stale, remove it: rm $LOCKFILE" >&2
    exit 1
  else
    echo "Removing stale lockfile (PID $existing_pid no longer running)." >&2
    rm -f "$LOCKFILE"
  fi
fi
echo $$ > "$LOCKFILE"

# ─── Cleanup Trap ─────────────────────────────────────────────────────────────
cleanup() {
  local exit_code=$?
  local wt_count=0
  for wt in ${ACTIVE_WORKTREES[@]+"${ACTIVE_WORKTREES[@]}"}; do
    [ -z "$wt" ] && continue
    wt_count=$((wt_count + 1))
  done
  if [[ "$wt_count" -gt 0 ]]; then
    echo ""
    echo "Cleaning up $wt_count worktree(s)..."
    for wt in ${ACTIVE_WORKTREES[@]+"${ACTIVE_WORKTREES[@]}"}; do
      [ -z "$wt" ] && continue
      local branch
      branch=$(basename "$wt" | sed 's/^bsi-task-/task\//')
      git -C "$SITE_DIR" worktree remove "$wt" --force 2>/dev/null || rm -rf "$wt"
      git -C "$SITE_DIR" branch -D "$branch" 2>/dev/null || true
    done
  fi
  jobs -p 2>/dev/null | xargs kill 2>/dev/null || true
  rm -f "$LOCKFILE"
  exit "$exit_code"
}
trap cleanup EXIT INT TERM HUP

# ─── Task Parsing ─────────────────────────────────────────────────────────────
TASK_IDS=$(grep -o '^### [A-Z]*-[0-9]*' "$TASKS_FILE" | sed 's/^### //')

if [ -z "$TASK_IDS" ]; then
  echo "No tasks found in $TASKS_FILE"
  exit 0
fi

TOTAL=$(echo "$TASK_IDS" | wc -l | tr -d ' ')

parse_task() {
  local task_id="$1"
  awk "
    /^### ${task_id}:/{found=1}
    found && /^###/ && !/^### ${task_id}:/{found=0}
    found && /^---$/{found=0}
    found{print}
  " "$TASKS_FILE"
}

extract_field() {
  local block="$1" field="$2"
  echo "$block" | grep -m1 "^\*\*${field}:\*\*" | sed "s/^\*\*${field}:\*\* *//" || true
}

check_deps() {
  local deps="$1"
  [ -z "$deps" ] && return 0
  [ ! -f "$AUDIT_LOG" ] && return 1
  local dep
  for dep in $(echo "$deps" | tr ',' ' ' | tr -d ' '); do
    local status
    status=$(grep "\"task_id\":\"${dep}\"" "$AUDIT_LOG" 2>/dev/null \
      | tail -1 | jq -r '.status // empty' 2>/dev/null || true)
    [ "$status" = "completed" ] || return 1
  done
  return 0
}

is_already_completed() {
  local task_id="$1"
  [ ! -f "$AUDIT_LOG" ] && return 1
  grep -q "\"task_id\":\"${task_id}\".*\"status\":\"completed\"" "$AUDIT_LOG" 2>/dev/null
}

# ─── Priority Sorting ────────────────────────────────────────────────────────
priority_rank() {
  local task_id="$1"
  local block
  block=$(parse_task "$task_id")
  local pri
  pri=$(extract_field "$block" "Priority")
  case "$pri" in
    HIGH)   echo 1 ;;
    MEDIUM) echo 2 ;;
    LOW)    echo 3 ;;
    *)      echo 4 ;;
  esac
}

sort_by_priority() {
  local ids="$1"
  local ranked=""
  for tid in $ids; do
    local rank
    rank=$(priority_rank "$tid")
    ranked="${ranked}${rank} ${tid}\n"
  done
  echo -e "$ranked" | sort -s -k1,1n | awk '{print $2}' | grep -v '^$'
}

# ─── Helpers ──────────────────────────────────────────────────────────────────
format_duration() {
  local s="$1"
  if [[ "$s" -ge 60 ]]; then
    printf "%dm%02ds" $((s / 60)) $((s % 60))
  else
    printf "%ds" "$s"
  fi
}

remove_worktree_from_list() {
  local to_remove="$1"
  local new_wts=()
  for wt in ${ACTIVE_WORKTREES[@]+"${ACTIVE_WORKTREES[@]}"}; do
    [[ "$wt" != "$to_remove" ]] && new_wts+=("$wt")
  done
  ACTIVE_WORKTREES=(${new_wts[@]+"${new_wts[@]}"})
}

# ─── Single Task Execution ───────────────────────────────────────────────────
execute_task() {
  local task_id="$1"
  local task_block="$2"
  local tools="$3"
  local budget="$4"
  local work_dir="$5"
  local attempt="${6:-1}"

  local start_ts
  start_ts=$(date +%s)
  local iso_ts
  iso_ts=$(date +"%Y-%m-%dT%H:%M:%S%z")

  local prompt
  prompt="$(cat "$MEGA_PROMPT")

---

## YOUR TASK

${task_block}

## INSTRUCTIONS

1. Read the task above carefully. All decisions have been pre-made for you.
2. Execute the task exactly as described.
3. When done, verify using the \"Done when\" criteria.
4. Commit your changes with message: \"fix(${task_id}): <brief description>\"
5. Do NOT modify TASKS.md. Do NOT ask questions. Do NOT summarize."

  # Run claude with timeout (macOS has no `timeout` command — use background + kill)
  local output="" exit_code=0
  local stderr_file output_file
  stderr_file=$(mktemp)
  output_file=$(mktemp)

  local claude_args=(-p --output-format json --max-budget-usd "$budget" --max-turns "$DEFAULT_MAX_TURNS" --dangerously-skip-permissions)
  [ -n "$tools" ] && claude_args+=(--allowedTools "$tools")
  (cd "$work_dir" && printf '%s' "$prompt" | claude "${claude_args[@]}" \
    >"$output_file" 2>"$stderr_file") &
  local claude_pid=$!

  # Wait with timeout
  local waited=0
  while kill -0 "$claude_pid" 2>/dev/null; do
    if [ "$waited" -ge "$DEFAULT_TIMEOUT" ]; then
      kill "$claude_pid" 2>/dev/null
      wait "$claude_pid" 2>/dev/null || true

      local end_ts
      end_ts=$(date +%s)
      local duration=$(( end_ts - start_ts ))
      local error_msg="Timeout after ${DEFAULT_TIMEOUT}s"

      jq -nc \
        --arg tid "$task_id" --arg st "failed" --argjson cost 0 \
        --argjson itok 0 --argjson otok 0 --argjson dur "$duration" \
        --argjson turns 0 --arg sid "" --arg ts "$iso_ts" --arg cm "" \
        --argjson att "$attempt" --arg err "$error_msg" \
        '{task_id:$tid,status:$st,cost_usd:$cost,input_tokens:$itok,output_tokens:$otok,duration_s:$dur,num_turns:$turns,session_id:$sid,timestamp:$ts,commit:$cm,attempt:$att,error:$err}' \
        >> "$AUDIT_LOG"

      rm -f "$stderr_file" "$output_file"
      echo "failed|0|${duration}||${error_msg}"
      return 1
    fi
    sleep 2
    waited=$((waited + 2))
  done

  wait "$claude_pid" 2>/dev/null || exit_code=$?

  local end_ts
  end_ts=$(date +%s)
  local duration=$(( end_ts - start_ts ))

  # Parse JSON output directly from file.
  # When stdout is redirected to file: single result object (not array).
  # When piped to terminal: JSON array. Handle both with jq filter.
  local status="failed" cost="0" input_tok="0" output_tok="0"
  local session_id="" commit="" error_msg="" num_turns="0"

  # Normalize: if array, get last element; if object, use as-is
  local jq_get='if type == "array" then .[-1] else . end'

  if [ -s "$output_file" ] && jq "$jq_get" "$output_file" >/dev/null 2>&1; then
    local is_err
    is_err=$(jq -r "($jq_get).is_error // false" "$output_file")
    [ "$is_err" = "false" ] && status="completed" || status="failed"

    cost=$(jq -r "($jq_get).total_cost_usd // 0" "$output_file")
    session_id=$(jq -r "($jq_get).session_id // \"\"" "$output_file")
    num_turns=$(jq -r "($jq_get).num_turns // 0" "$output_file")
    input_tok=$(jq -r "($jq_get).usage.input_tokens // 0" "$output_file")
    output_tok=$(jq -r "($jq_get).usage.output_tokens // 0" "$output_file")

    local subtype
    subtype=$(jq -r "($jq_get).subtype // \"\"" "$output_file")
    if [ "$subtype" = "error_max_turns" ] || [ "$subtype" = "error_budget" ]; then
      status="failed"
      error_msg="Hit limit: $subtype"
    fi
  else
    status="failed"
    if [ -s "$stderr_file" ]; then
      error_msg=$(head -3 "$stderr_file" | tr '\n' ' ')
    elif [ -s "$output_file" ]; then
      error_msg=$(head -c 200 "$output_file")
    else
      error_msg="No output produced"
    fi
  fi

  rm -f "$stderr_file" "$output_file"

  if [ "$exit_code" -ne 0 ] && [ "$status" = "completed" ]; then
    status="failed"
    error_msg="Exit code $exit_code"
  fi

  if [ "$status" = "completed" ]; then
    commit=$(cd "$work_dir" && git log -1 --format="%h" 2>/dev/null || echo "")
  fi

  jq -nc \
    --arg tid "$task_id" \
    --arg st "$status" \
    --argjson cost "${cost:-0}" \
    --argjson itok "${input_tok:-0}" \
    --argjson otok "${output_tok:-0}" \
    --argjson dur "$duration" \
    --argjson turns "${num_turns:-0}" \
    --arg sid "$session_id" \
    --arg ts "$iso_ts" \
    --arg cm "$commit" \
    --argjson att "$attempt" \
    --arg err "$error_msg" \
    '{
      task_id: $tid, status: $st, cost_usd: $cost,
      input_tokens: $itok, output_tokens: $otok,
      duration_s: $dur, num_turns: $turns,
      session_id: $sid, timestamp: $ts, commit: $cm,
      attempt: $att,
      error: (if $err == "" then null else $err end)
    }' >> "$AUDIT_LOG"

  echo "${status}|${cost}|${duration}|${commit}|${error_msg}"
}

execute_with_retry() {
  local task_id="$1" task_block="$2" tools="$3" budget="$4" work_dir="$5"

  local result
  result=$(execute_task "$task_id" "$task_block" "$tools" "$budget" "$work_dir" 1)
  local status
  status=$(echo "$result" | cut -d'|' -f1)

  if [ "$status" = "completed" ]; then
    echo "$result"
    return 0
  fi

  echo "  Retry: resetting state, waiting 5s..." >&2
  (cd "$work_dir" && git checkout -- . && git clean -fd) 2>/dev/null || true
  sleep 5
  result=$(execute_task "$task_id" "$task_block" "$tools" "$budget" "$work_dir" 2)
  echo "$result"

  status=$(echo "$result" | cut -d'|' -f1)
  [ "$status" = "completed" ] && return 0 || return 1
}

# ─── Header ──────────────────────────────────────────────────────────────────
echo "======================================"
echo "  BSI Task Runner v2.1"
echo "======================================"
echo "  Tasks:       $TOTAL found"
echo "  Max to run:  $MAX_TASKS"
echo "  Parallel:    $PARALLEL"
echo "  Budget/task: \$$DEFAULT_BUDGET"
echo "  Timeout:     ${DEFAULT_TIMEOUT}s"
echo "  Max turns:   $DEFAULT_MAX_TURNS"
echo "  Audit log:   $AUDIT_LOG"
[ "$DRY_RUN" -eq 1 ] && echo "  Mode:        DRY RUN"
echo "======================================"
echo ""

SORTED_TASK_IDS=$(sort_by_priority "$TASK_IDS")

# ═══════════════════════════════════════════════════════════════════════════════
# SEQUENTIAL MODE
# ═══════════════════════════════════════════════════════════════════════════════
if [ "$PARALLEL" -le 1 ]; then
  PROCESSED=0

  for TASK_ID in $SORTED_TASK_IDS; do
    [ "$PROCESSED" -ge "$MAX_TASKS" ] && break

    if is_already_completed "$TASK_ID"; then
      echo "SKIP $TASK_ID — already completed in previous run"
      SKIPPED=$((SKIPPED + 1))
      RESULT_ROWS+=("$TASK_ID|DONE|\$0|—|—")
      continue
    fi

    TASK_BLOCK=$(parse_task "$TASK_ID")
    if [ -z "$TASK_BLOCK" ]; then
      echo "WARNING: Could not parse $TASK_ID, skipping."
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    TASK_TOOLS=$(extract_field "$TASK_BLOCK" "Tools")
    TASK_BUDGET=$(extract_field "$TASK_BLOCK" "Budget")
    TASK_DEPS=$(extract_field "$TASK_BLOCK" "Depends")
    TASK_PRIORITY=$(extract_field "$TASK_BLOCK" "Priority")

    [ -z "$TASK_TOOLS" ] && TASK_TOOLS="$DEFAULT_TOOLS"
    [ -z "$TASK_BUDGET" ] && TASK_BUDGET="$DEFAULT_BUDGET"
    TASK_BUDGET=$(echo "$TASK_BUDGET" | tr -d '$')

    if ! check_deps "$TASK_DEPS"; then
      echo "SKIP $TASK_ID — unmet deps: $TASK_DEPS"
      SKIPPED=$((SKIPPED + 1))
      RESULT_ROWS+=("$TASK_ID|SKIP|0|—|—")
      continue
    fi

    echo "──────────────────────────────────────"
    echo "TASK: $TASK_ID ($((PROCESSED + 1))/$MAX_TASKS)"
    echo "$(echo "$TASK_BLOCK" | head -1)"
    [ -n "$TASK_PRIORITY" ] && echo "  Priority: $TASK_PRIORITY"
    echo ""

    if [ "$DRY_RUN" -eq 1 ]; then
      echo "  [DRY RUN] Would execute $TASK_ID"
      echo "  Tools:    $TASK_TOOLS"
      echo "  Budget:   \$$TASK_BUDGET"
      [ -n "$TASK_DEPS" ] && echo "  Depends:  $TASK_DEPS"
      [ -n "$TASK_PRIORITY" ] && echo "  Priority: $TASK_PRIORITY"
      PROCESSED=$((PROCESSED + 1))
      RESULT_ROWS+=("$TASK_ID|DRY|0|—|—")
      echo ""
      continue
    fi

    RESULT=$(execute_with_retry "$TASK_ID" "$TASK_BLOCK" "$TASK_TOOLS" "$TASK_BUDGET" "$SITE_DIR" 2>&1 | tail -1) || true

    STATUS=$(echo "$RESULT" | cut -d'|' -f1)
    COST=$(echo "$RESULT" | cut -d'|' -f2)
    DUR_S=$(echo "$RESULT" | cut -d'|' -f3)
    COMMIT=$(echo "$RESULT" | cut -d'|' -f4)
    ERROR=$(echo "$RESULT" | cut -d'|' -f5-)

    DUR_FMT=$(format_duration "${DUR_S:-0}")

    if [ "$STATUS" = "completed" ]; then
      echo "  PASS  ${DUR_FMT}  \$${COST}  ${COMMIT:-—}"
      COMPLETED=$((COMPLETED + 1))
      RESULT_ROWS+=("$TASK_ID|PASS|\$$COST|$DUR_FMT|${COMMIT:-—}")
    else
      echo "  FAIL  ${DUR_FMT}  \$${COST}"
      [ -n "$ERROR" ] && echo "  Error: $ERROR"
      FAILED=$((FAILED + 1))
      RESULT_ROWS+=("$TASK_ID|FAIL|\$$COST|$DUR_FMT|—")
    fi

    TOTAL_COST=$(echo "$TOTAL_COST + ${COST:-0}" | bc 2>/dev/null || echo "$TOTAL_COST")
    PROCESSED=$((PROCESSED + 1))
    echo ""
  done

# ═══════════════════════════════════════════════════════════════════════════════
# PARALLEL MODE
# ═══════════════════════════════════════════════════════════════════════════════
else
  declare -a TASK_QUEUE=()
  for TASK_ID in $SORTED_TASK_IDS; do
    [ "${#TASK_QUEUE[@]}" -ge "$MAX_TASKS" ] && break
    TASK_QUEUE+=("$TASK_ID")
  done

  IDX=0
  BATCH_NUM=0

  while [ "$IDX" -lt "${#TASK_QUEUE[@]}" ]; do
    BATCH_NUM=$((BATCH_NUM + 1))
    declare -a BATCH_PIDS=()
    declare -a BATCH_IDS=()
    declare -a BATCH_DIRS=()
    declare -a BATCH_RESULT_FILES=()
    BATCH_SIZE=0

    echo "══════════════════════════════════════"
    echo "BATCH $BATCH_NUM  (parallel=$PARALLEL)"
    echo ""

    while [ "$BATCH_SIZE" -lt "$PARALLEL" ] && [ "$IDX" -lt "${#TASK_QUEUE[@]}" ]; do
      TASK_ID="${TASK_QUEUE[$IDX]}"

      if is_already_completed "$TASK_ID"; then
        echo "  SKIP $TASK_ID — already completed"
        SKIPPED=$((SKIPPED + 1))
        RESULT_ROWS+=("$TASK_ID|DONE|\$0|—|—")
        IDX=$((IDX + 1))
        continue
      fi

      TASK_BLOCK=$(parse_task "$TASK_ID")

      if [ -z "$TASK_BLOCK" ]; then
        echo "  WARNING: Could not parse $TASK_ID, skipping."
        SKIPPED=$((SKIPPED + 1))
        IDX=$((IDX + 1))
        continue
      fi

      TASK_TOOLS=$(extract_field "$TASK_BLOCK" "Tools")
      TASK_BUDGET=$(extract_field "$TASK_BLOCK" "Budget")
      TASK_DEPS=$(extract_field "$TASK_BLOCK" "Depends")

      [ -z "$TASK_TOOLS" ] && TASK_TOOLS="$DEFAULT_TOOLS"
      [ -z "$TASK_BUDGET" ] && TASK_BUDGET="$DEFAULT_BUDGET"
      TASK_BUDGET=$(echo "$TASK_BUDGET" | tr -d '$')

      if ! check_deps "$TASK_DEPS"; then
        echo "  SKIP $TASK_ID — unmet deps: $TASK_DEPS"
        SKIPPED=$((SKIPPED + 1))
        RESULT_ROWS+=("$TASK_ID|SKIP|\$0|—|—")
        IDX=$((IDX + 1))
        continue
      fi

      if [ "$DRY_RUN" -eq 1 ]; then
        echo "  [DRY RUN] $TASK_ID"
        RESULT_ROWS+=("$TASK_ID|DRY|\$0|—|—")
        IDX=$((IDX + 1))
        BATCH_SIZE=$((BATCH_SIZE + 1))
        continue
      fi

      WORK_DIR="${WORKTREE_BASE}-${TASK_ID}"
      BRANCH="task/${TASK_ID}"

      [ -d "$WORK_DIR" ] && {
        git -C "$SITE_DIR" worktree remove "$WORK_DIR" --force 2>/dev/null || rm -rf "$WORK_DIR"
      }
      git -C "$SITE_DIR" branch -D "$BRANCH" 2>/dev/null || true
      git -C "$SITE_DIR" worktree add "$WORK_DIR" -b "$BRANCH" 2>/dev/null

      ACTIVE_WORKTREES+=("$WORK_DIR")
      RESULT_FILE="${AUDIT_DIR}/${TASK_ID}.result"

      echo "  Launching $TASK_ID"

      (
        execute_with_retry "$TASK_ID" "$TASK_BLOCK" "$TASK_TOOLS" "$TASK_BUDGET" "$WORK_DIR" \
          2>/dev/null | tail -1 > "$RESULT_FILE"
      ) &

      BATCH_PIDS+=($!)
      BATCH_IDS+=("$TASK_ID")
      BATCH_DIRS+=("$WORK_DIR")
      BATCH_RESULT_FILES+=("$RESULT_FILE")

      IDX=$((IDX + 1))
      BATCH_SIZE=$((BATCH_SIZE + 1))
    done

    [ "$DRY_RUN" -eq 1 ] && continue
    [ "${#BATCH_PIDS[@]}" -eq 0 ] && continue

    echo ""
    echo "  Waiting for ${#BATCH_PIDS[@]} task(s)..."

    for i in "${!BATCH_PIDS[@]}"; do
      wait "${BATCH_PIDS[$i]}" 2>/dev/null || true

      TASK_ID="${BATCH_IDS[$i]}"
      WORK_DIR="${BATCH_DIRS[$i]}"
      RESULT_FILE="${BATCH_RESULT_FILES[$i]}"

      if [ -f "$RESULT_FILE" ]; then
        RESULT=$(cat "$RESULT_FILE")
      else
        RESULT="failed|0|0||No result file"
      fi

      STATUS=$(echo "$RESULT" | cut -d'|' -f1)
      COST=$(echo "$RESULT" | cut -d'|' -f2)
      DUR_S=$(echo "$RESULT" | cut -d'|' -f3)
      COMMIT=$(echo "$RESULT" | cut -d'|' -f4)

      DUR_FMT=$(format_duration "${DUR_S:-0}")

      if [ "$STATUS" = "completed" ]; then
        if git -C "$SITE_DIR" merge "task/${TASK_ID}" --no-edit 2>/dev/null; then
          echo "  PASS  $TASK_ID  ${DUR_FMT}  \$${COST}  ${COMMIT:-—}"
          COMPLETED=$((COMPLETED + 1))
          RESULT_ROWS+=("$TASK_ID|PASS|\$$COST|$DUR_FMT|${COMMIT:-—}")
        else
          git -C "$SITE_DIR" merge --abort 2>/dev/null || true
          echo "  CONFLICT  $TASK_ID  ${DUR_FMT}  \$${COST}"
          FAILED=$((FAILED + 1))
          RESULT_ROWS+=("$TASK_ID|CONFLICT|\$$COST|$DUR_FMT|${COMMIT:-—}")
        fi
      else
        echo "  FAIL  $TASK_ID  ${DUR_FMT}  \$${COST}"
        FAILED=$((FAILED + 1))
        RESULT_ROWS+=("$TASK_ID|FAIL|\$$COST|$DUR_FMT|—")
      fi

      TOTAL_COST=$(echo "$TOTAL_COST + ${COST:-0}" | bc 2>/dev/null || echo "$TOTAL_COST")

      git -C "$SITE_DIR" worktree remove "$WORK_DIR" --force 2>/dev/null || rm -rf "$WORK_DIR"
      git -C "$SITE_DIR" branch -D "task/${TASK_ID}" 2>/dev/null || true
      remove_worktree_from_list "$WORK_DIR"
      rm -f "$RESULT_FILE"
    done

    echo ""
  done
fi

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY TABLE
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "======================================"
echo "  RESULTS"
echo "======================================"
printf "  %-12s %-10s %-8s %-8s %-8s\n" "Task" "Status" "Cost" "Time" "Commit"
echo "  ──────────────────────────────────────────────"

for row in ${RESULT_ROWS[@]+"${RESULT_ROWS[@]}"}; do
  IFS='|' read -r r_id r_status r_cost r_dur r_commit <<< "$row"
  printf "  %-12s %-10s %-8s %-8s %-8s\n" "$r_id" "$r_status" "$r_cost" "$r_dur" "$r_commit"
done

echo "  ──────────────────────────────────────────────"
printf "  Total: %d passed, %d failed, %d skipped  \$%s\n" \
  "$COMPLETED" "$FAILED" "$SKIPPED" "$TOTAL_COST"
echo "======================================"
