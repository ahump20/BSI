#!/bin/bash

# Sports Data QC - Infrastructure Setup Script
# Creates D1 database, KV namespaces, R2 bucket, and deploys Worker

set -e  # Exit on error

echo "=========================================="
echo "Sports Data QC - Infrastructure Setup"
echo "=========================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

# Check if we're logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Not logged in to Cloudflare. Running wrangler login..."
    wrangler login
fi

echo "✅ Wrangler CLI ready"
echo ""

# =============================================================================
# 1. Create D1 Database
# =============================================================================

echo "📊 Creating D1 database 'blaze-qc-logs'..."

# Check if database already exists
DB_ID=$(wrangler d1 list --json 2>/dev/null | grep -o '"database_id":"[^"]*"' | grep -o '[0-9a-f-]*' | head -1 || echo "")

if [ -n "$DB_ID" ]; then
    echo "⚠️  D1 database 'blaze-qc-logs' already exists (ID: $DB_ID)"
    read -p "Do you want to use existing database? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Creating new database..."
        DB_RESULT=$(wrangler d1 create blaze-qc-logs --json)
        DB_ID=$(echo "$DB_RESULT" | grep -o '"database_id":"[^"]*"' | cut -d'"' -f4)
    fi
else
    DB_RESULT=$(wrangler d1 create blaze-qc-logs --json)
    DB_ID=$(echo "$DB_RESULT" | grep -o '"database_id":"[^"]*"' | cut -d'"' -f4)
fi

echo "✅ D1 Database ID: $DB_ID"

# Update wrangler.toml with D1 database ID
sed -i "s/database_id = \".*\" # Will be populated by setup.sh/database_id = \"$DB_ID\"/" wrangler.toml

# =============================================================================
# 2. Initialize D1 Schema
# =============================================================================

echo ""
echo "📋 Initializing D1 schema..."

# Create schema.sql
cat > schema.sql << 'EOF'
-- QC Logs Table
CREATE TABLE IF NOT EXISTS qc_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL UNIQUE,
    timestamp TEXT NOT NULL,
    data_source TEXT NOT NULL,

    -- Summary stats
    total_records INTEGER NOT NULL,
    records_passed INTEGER NOT NULL,
    records_flagged INTEGER NOT NULL,
    records_rejected INTEGER NOT NULL,
    overall_pass_rate REAL NOT NULL,

    -- Failure details
    critical_failures INTEGER DEFAULT 0,
    warnings INTEGER DEFAULT 0,

    -- Full report (JSON)
    full_report TEXT,

    -- Metadata
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_timestamp (timestamp),
    INDEX idx_data_source (data_source),
    INDEX idx_pass_rate (overall_pass_rate)
);

-- Outliers Table (for tracking flagged records over time)
CREATE TABLE IF NOT EXISTS outliers_detected (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value REAL NOT NULL,
    mad_score REAL NOT NULL,
    recommendation TEXT NOT NULL,
    timestamp TEXT NOT NULL,

    -- Link to source data
    source_url TEXT,
    player_id TEXT,
    game_id TEXT,

    FOREIGN KEY (report_id) REFERENCES qc_logs(report_id),
    INDEX idx_metric_name (metric_name),
    INDEX idx_mad_score (mad_score DESC)
);

-- Validation Failures Table (for debugging scrapers)
CREATE TABLE IF NOT EXISTS validation_failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL,
    check_name TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    affected_records INTEGER DEFAULT 1,
    timestamp TEXT NOT NULL,

    FOREIGN KEY (report_id) REFERENCES qc_logs(report_id),
    INDEX idx_check_name (check_name),
    INDEX idx_timestamp (timestamp)
);
EOF

# Execute schema on D1 database
wrangler d1 execute blaze-qc-logs --file=schema.sql

echo "✅ D1 schema initialized"

# Clean up
rm schema.sql

# =============================================================================
# 3. Create KV Namespaces
# =============================================================================

echo ""
echo "🗄️  Creating KV namespaces..."

# QC Cache namespace
echo "Creating QC_CACHE namespace..."
CACHE_RESULT=$(wrangler kv:namespace create QC_CACHE --json 2>/dev/null || echo '{"id":""}')
CACHE_ID=$(echo "$CACHE_RESULT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CACHE_ID" ]; then
    # Try to get existing namespace
    CACHE_ID=$(wrangler kv:namespace list --json | grep -B2 "QC_CACHE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)
fi

echo "✅ QC_CACHE Namespace ID: $CACHE_ID"

# QC Whitelist namespace
echo "Creating QC_WHITELIST namespace..."
WHITELIST_RESULT=$(wrangler kv:namespace create QC_WHITELIST --json 2>/dev/null || echo '{"id":""}')
WHITELIST_ID=$(echo "$WHITELIST_RESULT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$WHITELIST_ID" ]; then
    WHITELIST_ID=$(wrangler kv:namespace list --json | grep -B2 "QC_WHITELIST" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)
fi

echo "✅ QC_WHITELIST Namespace ID: $WHITELIST_ID"

# Update wrangler.toml with KV IDs (replace second occurrence)
awk -v cache="$CACHE_ID" -v whitelist="$WHITELIST_ID" '
/\[\[kv_namespaces\]\]/ { kv_count++ }
/^id = ""/ && kv_count == 1 { print "id = \"" cache "\""; next }
/^id = ""/ && kv_count == 2 { print "id = \"" whitelist "\""; next }
{ print }
' wrangler.toml > wrangler.toml.tmp && mv wrangler.toml.tmp wrangler.toml

# =============================================================================
# 4. Create R2 Bucket (optional - for storing detailed reports)
# =============================================================================

echo ""
echo "📦 Creating R2 bucket 'sports-qc-reports'..."

# Check if bucket exists
if wrangler r2 bucket list | grep -q "sports-qc-reports"; then
    echo "⚠️  R2 bucket 'sports-qc-reports' already exists"
else
    wrangler r2 bucket create sports-qc-reports || echo "⚠️  Failed to create R2 bucket (may need paid plan)"
fi

# =============================================================================
# 5. Deploy Worker
# =============================================================================

echo ""
echo "🚀 Deploying Sports Data QC Worker..."

wrangler deploy

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Resources created:"
echo "  - D1 Database: blaze-qc-logs ($DB_ID)"
echo "  - KV Namespace: QC_CACHE ($CACHE_ID)"
echo "  - KV Namespace: QC_WHITELIST ($WHITELIST_ID)"
echo "  - R2 Bucket: sports-qc-reports"
echo ""
echo "Worker deployed at:"
wrangler deployments list --name sports-data-qc 2>/dev/null | grep "https://" || echo "  Run 'wrangler deployments list --name sports-data-qc' to get URL"
echo ""
echo "Next steps:"
echo "  1. Test the worker: ./test.sh"
echo "  2. Integrate with scrapers (see SKILL.md)"
echo "  3. Monitor QC logs: wrangler d1 execute blaze-qc-logs --command 'SELECT * FROM qc_logs LIMIT 10'"
echo ""
