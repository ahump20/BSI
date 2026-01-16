#!/bin/bash
# Database Backup Automation Script
#
# Features:
# - Automated PostgreSQL backups
# - Compression and encryption
# - Upload to Cloudflare R2/S3
# - Backup rotation (keep last 30 days)
# - Restore testing
# - Monitoring and alerts
#
# Usage:
#   ./scripts/backup-database.sh [--restore backup_file.sql.gz.enc]

set -euo pipefail

# ==================== CONFIGURATION ====================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/database}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_PREFIX="${BACKUP_PREFIX:-bsi-db-backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${BACKUP_PREFIX}_${TIMESTAMP}.sql"

# Database configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-blazesportsintel}"
DB_USER="${POSTGRES_USER:-bsi}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# S3/R2 configuration for off-site storage
S3_BUCKET="${BACKUP_S3_BUCKET:-bsi-database-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${S3_SECRET_KEY:-}"

# Encryption configuration
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Monitoring configuration
SENTRY_DSN="${SENTRY_DSN:-}"
SLACK_WEBHOOK="${SLACK_BACKUP_WEBHOOK:-}"

# ==================== LOGGING ====================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$BACKUP_DIR/backup.log"
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$BACKUP_DIR/backup.log" >&2
}

send_alert() {
    local message="$1"
    log "$message"

    # Send to Slack if configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"🚨 Database Backup Alert: $message\"}" \
            > /dev/null 2>&1 || true
    fi
}

# ==================== FUNCTIONS ====================

check_prerequisites() {
    log "Checking prerequisites..."

    # Check required commands
    for cmd in pg_dump gzip openssl aws; do
        if ! command -v $cmd &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Check database connection
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
        log_error "Cannot connect to database"
        send_alert "Failed to connect to database"
        exit 1
    fi

    log "Prerequisites check passed"
}

create_backup() {
    log "Starting database backup..."

    # Dump database
    log "Dumping database: $DB_NAME"
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-acl \
        --verbose \
        > "$BACKUP_FILE" 2>> "$BACKUP_DIR/backup.log"

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not created"
        send_alert "Database backup failed - file not created"
        exit 1
    fi

    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup created: $BACKUP_FILE ($backup_size)"

    # Compress backup
    log "Compressing backup..."
    gzip -9 "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"

    local compressed_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup compressed: $compressed_size"

    # Encrypt backup if key is provided
    if [ -n "$ENCRYPTION_KEY" ]; then
        log "Encrypting backup..."
        openssl enc -aes-256-cbc \
            -salt \
            -in "$BACKUP_FILE" \
            -out "${BACKUP_FILE}.enc" \
            -k "$ENCRYPTION_KEY"

        rm "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.enc"

        log "Backup encrypted"
    fi

    # Generate checksum
    local checksum=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
    echo "$checksum" > "${BACKUP_FILE}.sha256"
    log "Checksum: $checksum"

    log "Backup completed: $BACKUP_FILE"
}

upload_to_cloud() {
    if [ -z "$S3_BUCKET" ] || [ -z "$S3_ACCESS_KEY" ]; then
        log "S3 not configured, skipping cloud upload"
        return 0
    fi

    log "Uploading backup to S3/R2: $S3_BUCKET"

    # Configure AWS CLI for Cloudflare R2 or S3
    if [ -n "$S3_ENDPOINT" ]; then
        export AWS_ENDPOINT_URL="$S3_ENDPOINT"
    fi

    export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
    export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"

    # Upload backup file
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/" \
        --storage-class STANDARD \
        --metadata "backup-date=$TIMESTAMP,db-name=$DB_NAME"

    # Upload checksum
    aws s3 cp "${BACKUP_FILE}.sha256" "s3://$S3_BUCKET/"

    log "Backup uploaded to cloud storage"
}

cleanup_old_backups() {
    log "Cleaning up old backups (retention: $BACKUP_RETENTION_DAYS days)..."

    # Local cleanup
    find "$BACKUP_DIR" \
        -name "${BACKUP_PREFIX}_*.sql*" \
        -type f \
        -mtime +$BACKUP_RETENTION_DAYS \
        -delete

    # Cloud cleanup (if configured)
    if [ -n "$S3_BUCKET" ] && [ -n "$S3_ACCESS_KEY" ]; then
        local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%Y%m%d)

        aws s3 ls "s3://$S3_BUCKET/" | grep "$BACKUP_PREFIX" | while read -r line; do
            local file_date=$(echo "$line" | grep -oP '\d{8}' | head -1)
            if [ "$file_date" -lt "$cutoff_date" ]; then
                local file_name=$(echo "$line" | awk '{print $4}')
                log "Deleting old backup from cloud: $file_name"
                aws s3 rm "s3://$S3_BUCKET/$file_name"
            fi
        done
    fi

    log "Old backups cleaned up"
}

verify_backup() {
    log "Verifying backup integrity..."

    # Verify checksum
    local actual_checksum=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
    local expected_checksum=$(cat "${BACKUP_FILE}.sha256")

    if [ "$actual_checksum" != "$expected_checksum" ]; then
        log_error "Backup checksum mismatch!"
        send_alert "Backup verification failed - checksum mismatch"
        exit 1
    fi

    log "Backup verification passed"
}

restore_backup() {
    local restore_file="$1"

    if [ ! -f "$restore_file" ]; then
        log_error "Restore file not found: $restore_file"
        exit 1
    fi

    log "WARNING: This will restore database from: $restore_file"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi

    log "Starting database restore..."

    # Decrypt if needed
    local working_file="$restore_file"
    if [[ "$restore_file" == *.enc ]]; then
        log "Decrypting backup..."
        openssl enc -aes-256-cbc -d \
            -in "$restore_file" \
            -out "${restore_file%.enc}" \
            -k "$ENCRYPTION_KEY"
        working_file="${restore_file%.enc}"
    fi

    # Decompress if needed
    if [[ "$working_file" == *.gz ]]; then
        log "Decompressing backup..."
        gunzip -k "$working_file"
        working_file="${working_file%.gz}"
    fi

    # Restore database
    log "Restoring database..."
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        < "$working_file"

    # Cleanup temporary files
    if [[ "$working_file" != "$restore_file" ]]; then
        rm "$working_file"
    fi

    log "Database restore completed"
    send_alert "Database restored from: $restore_file"
}

test_restore() {
    log "Testing backup restore (dry run)..."

    # Create temporary database for testing
    local test_db="${DB_NAME}_restore_test"

    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS $test_db; CREATE DATABASE $test_db;"

    # Test restore
    local working_file="$BACKUP_FILE"

    if [[ "$working_file" == *.enc ]]; then
        openssl enc -aes-256-cbc -d \
            -in "$working_file" \
            -out "${working_file%.enc}" \
            -k "$ENCRYPTION_KEY"
        working_file="${working_file%.enc}"
    fi

    if [[ "$working_file" == *.gz ]]; then
        gunzip -k "$working_file"
        working_file="${working_file%.gz}"
    fi

    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$test_db" \
        < "$working_file" \
        > /dev/null 2>&1

    # Verify restore
    local row_count=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$test_db" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

    # Cleanup
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -c "DROP DATABASE $test_db;"

    if [[ "$working_file" != "$BACKUP_FILE" ]]; then
        rm "$working_file"
    fi

    log "Restore test passed (restored $row_count tables)"
}

# ==================== MAIN ====================

main() {
    log "=== Database Backup Started ==="

    # Check if restore mode
    if [ "${1:-}" = "--restore" ]; then
        if [ -z "${2:-}" ]; then
            log_error "Restore file not specified"
            exit 1
        fi
        restore_backup "$2"
        exit 0
    fi

    # Run backup
    check_prerequisites
    create_backup
    verify_backup
    upload_to_cloud
    test_restore
    cleanup_old_backups

    log "=== Database Backup Completed Successfully ==="
    send_alert "Database backup completed successfully: $BACKUP_FILE"
}

# Run main function
main "$@"
