#!/bin/bash
# BSI Worker Context — injected via CwdChanged hook
# When entering a satellite worker directory, outputs that worker's context.

REPO_DIR="/Users/AustinHumphrey/bsi-repo"
CWD="$PWD"

# Only trigger inside workers/ subdirectories
if [[ "$CWD" != "$REPO_DIR/workers/"* ]]; then
  exit 0
fi

# Extract worker name from path
WORKER_NAME=$(echo "$CWD" | sed "s|$REPO_DIR/workers/||" | cut -d'/' -f1)

if [ -z "$WORKER_NAME" ]; then
  exit 0
fi

WRANGLER="$REPO_DIR/workers/$WORKER_NAME/wrangler.toml"

if [ ! -f "$WRANGLER" ]; then
  exit 0
fi

echo "[Worker Context: $WORKER_NAME]"

# Extract key fields from wrangler.toml
WORKER_REAL_NAME=$(grep '^name' "$WRANGLER" | head -1 | sed 's/name *= *"//;s/"//')
echo "Deployed name: $WORKER_REAL_NAME"

# Check for cron triggers
CRONS=$(grep -A5 '\[triggers\]' "$WRANGLER" 2>/dev/null | grep 'crons' | head -1)
if [ -n "$CRONS" ]; then
  echo "Cron: $CRONS"
fi

# Check for D1 bindings
D1=$(grep -A3 '\[\[d1_databases\]\]' "$WRANGLER" 2>/dev/null | grep 'binding\|database_name' | tr '\n' ' ')
if [ -n "$D1" ]; then
  echo "D1: $D1"
fi

# Check for KV bindings
KV=$(grep -A3 '\[\[kv_namespaces\]\]' "$WRANGLER" 2>/dev/null | grep 'binding' | sed 's/.*= *"//;s/"//' | tr '\n' ', ')
if [ -n "$KV" ]; then
  echo "KV bindings: $KV"
fi

# Check for Durable Objects
DO=$(grep -A3 '\[\[durable_objects' "$WRANGLER" 2>/dev/null | grep 'class_name' | sed 's/.*= *"//;s/"//' | tr '\n' ', ')
if [ -n "$DO" ]; then
  echo "Durable Objects: $DO"
fi

# Check for R2 bindings
R2=$(grep -A3 '\[\[r2_buckets\]\]' "$WRANGLER" 2>/dev/null | grep 'binding' | sed 's/.*= *"//;s/"//' | tr '\n' ', ')
if [ -n "$R2" ]; then
  echo "R2: $R2"
fi

# List source files
SRC_COUNT=$(find "$REPO_DIR/workers/$WORKER_NAME" -name '*.ts' -o -name '*.js' 2>/dev/null | wc -l | tr -d ' ')
echo "Source files: $SRC_COUNT"
