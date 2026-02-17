#!/usr/bin/env bash
# D1 Backup Script — exports all BSI databases to local SQL dumps.
#
# Usage:
#   ./scripts/backup-d1.sh              # exports all databases
#   ./scripts/backup-d1.sh bsi-prod-db  # exports a single database
#
# Outputs:
#   backups/<database-name>-<YYYY-MM-DD>.sql
#
# Prerequisites:
#   - wrangler CLI authenticated (`wrangler login`)
#   - Sufficient permissions on the Cloudflare account

set -euo pipefail

BACKUP_DIR="backups"
DATE=$(date +%Y-%m-%d)

# All D1 databases in the BSI account
DATABASES=(
  "bsi-prod-db"
  "bsi-game-db"
  "bsi-historical-db"
  "bsi-fanbase-db"
  "blazecraft-leaderboards"
)

# Allow single-database mode
if [[ ${1:-} ]]; then
  DATABASES=("$1")
fi

mkdir -p "$BACKUP_DIR"

for db in "${DATABASES[@]}"; do
  outfile="$BACKUP_DIR/${db}-${DATE}.sql"
  echo "Exporting $db → $outfile"
  if npx wrangler d1 export "$db" --output "$outfile" 2>/dev/null; then
    echo "  Done ($(wc -c < "$outfile" | tr -d ' ') bytes)"
  else
    echo "  Warning: export failed for $db (may not exist or insufficient permissions)"
  fi
done

echo ""
echo "Backups complete. Files in $BACKUP_DIR/"
ls -lh "$BACKUP_DIR"/*-"${DATE}".sql 2>/dev/null || echo "No backup files created."
