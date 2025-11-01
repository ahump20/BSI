#!/bin/bash

# Automated setup script for Live Game Win Probability Simulation
# Creates all necessary Cloudflare resources and configures the worker

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔥 Blaze Sports Intel - Live Sim Setup"
echo "======================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: jq not found (optional, for parsing JSON)"
    echo "Install with: apt-get install jq  or  brew install jq"
fi

echo "✅ Prerequisites OK"
echo ""

# Login check
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare"
    echo "Run: wrangler login"
    exit 1
fi

ACCOUNT=$(wrangler whoami | grep "Account Name" | awk -F': ' '{print $2}' || echo "Unknown")
echo "✅ Logged in as: $ACCOUNT"
echo ""

# Step 1: Create D1 Database
echo "📊 Step 1: Creating D1 database..."
if wrangler d1 list | grep -q "live-sim"; then
    echo "ℹ️  Database 'live-sim' already exists"
    DB_ID=$(wrangler d1 list | grep "live-sim" | awk '{print $1}')
else
    echo "Creating D1 database..."
    CREATE_OUTPUT=$(wrangler d1 create live-sim 2>&1)
    echo "$CREATE_OUTPUT"

    # Extract database ID
    DB_ID=$(echo "$CREATE_OUTPUT" | grep -oP 'database_id\s*=\s*"\K[^"]+' || echo "")

    if [ -z "$DB_ID" ]; then
        echo "❌ Failed to create D1 database"
        exit 1
    fi

    echo "✅ Created D1 database: $DB_ID"
fi
echo ""

# Step 2: Create KV Namespace
echo "💾 Step 2: Creating KV namespace..."

# Production KV
if wrangler kv:namespace list | grep -q "live-sim-CACHE"; then
    echo "ℹ️  Production KV namespace already exists"
    KV_ID=$(wrangler kv:namespace list | grep "live-sim-CACHE" | grep -v "preview" | awk '{print $1}' | head -1)
else
    echo "Creating production KV namespace..."
    KV_OUTPUT=$(wrangler kv:namespace create CACHE 2>&1)
    echo "$KV_OUTPUT"

    KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id\s*=\s*"\K[^"]+' || echo "")

    if [ -z "$KV_ID" ]; then
        echo "❌ Failed to create KV namespace"
        exit 1
    fi

    echo "✅ Created production KV: $KV_ID"
fi

# Preview KV
if wrangler kv:namespace list | grep -q "live-sim-CACHE.*preview"; then
    echo "ℹ️  Preview KV namespace already exists"
    KV_PREVIEW_ID=$(wrangler kv:namespace list | grep "live-sim-CACHE" | grep "preview" | awk '{print $1}' | head -1)
else
    echo "Creating preview KV namespace..."
    KV_PREVIEW_OUTPUT=$(wrangler kv:namespace create CACHE --preview 2>&1)
    echo "$KV_PREVIEW_OUTPUT"

    KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep -oP 'preview_id\s*=\s*"\K[^"]+' || echo "")

    if [ -z "$KV_PREVIEW_ID" ]; then
        echo "⚠️  Warning: Failed to create preview KV namespace"
        KV_PREVIEW_ID="$KV_ID"  # Fallback to production
    else
        echo "✅ Created preview KV: $KV_PREVIEW_ID"
    fi
fi
echo ""

# Step 3: Create R2 Bucket (optional)
echo "🪣 Step 3: Creating R2 bucket..."
if wrangler r2 bucket list | grep -q "blazesports-live-sim-data"; then
    echo "ℹ️  R2 bucket already exists"
else
    echo "Creating R2 bucket..."
    if wrangler r2 bucket create blazesports-live-sim-data 2>&1; then
        echo "✅ Created R2 bucket: blazesports-live-sim-data"
    else
        echo "⚠️  Warning: Failed to create R2 bucket (optional)"
    fi
fi
echo ""

# Step 4: Update wrangler.toml
echo "⚙️  Step 4: Updating wrangler.toml..."

cd "$PROJECT_DIR"

# Backup original
if [ -f "wrangler.toml" ]; then
    cp wrangler.toml wrangler.toml.backup
    echo "✅ Backed up wrangler.toml → wrangler.toml.backup"
fi

# Update D1 database ID
if [ -n "$DB_ID" ]; then
    sed -i.tmp "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
    echo "✅ Updated D1 database_id"
fi

# Update KV IDs
if [ -n "$KV_ID" ]; then
    sed -i.tmp "s/id = \"\" # Set after creating/id = \"$KV_ID\"/" wrangler.toml
    echo "✅ Updated KV id"
fi

if [ -n "$KV_PREVIEW_ID" ]; then
    sed -i.tmp "s/preview_id = \"\" # Set after creating/preview_id = \"$KV_PREVIEW_ID\"/" wrangler.toml
    echo "✅ Updated KV preview_id"
fi

# Clean up temp files
rm -f wrangler.toml.tmp

echo ""

# Step 5: Initialize database schema
echo "🗄️  Step 5: Initializing database schema..."
if [ -f "migrations/0001_init.sql" ]; then
    echo "Running migration..."
    wrangler d1 execute live-sim --file=migrations/0001_init.sql --yes
    echo "✅ Database schema initialized"
else
    echo "⚠️  Warning: Migration file not found"
fi
echo ""

# Step 6: Set secrets
echo "🔐 Step 6: Setting secrets..."
echo ""
echo "Generate a random secret for ingestion protection:"
RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
echo "Suggested secret: $RANDOM_SECRET"
echo ""
echo "Set this secret with:"
echo "  wrangler secret put INGEST_SECRET"
echo ""
read -p "Do you want to set the secret now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$RANDOM_SECRET" | wrangler secret put INGEST_SECRET
    echo "✅ Secret set"

    # Save to .env.local for reference (not committed)
    echo "INGEST_SECRET=$RANDOM_SECRET" >> .env.local
    echo "✅ Saved to .env.local (add to .gitignore!)"
else
    echo "ℹ️  Skipped - you can set it later with: wrangler secret put INGEST_SECRET"
fi
echo ""

# Step 7: Verify tables
echo "🔍 Step 7: Verifying database tables..."
TABLES=$(wrangler d1 execute live-sim --command "SELECT name FROM sqlite_master WHERE type='table'" --json 2>/dev/null || echo "[]")
if echo "$TABLES" | grep -q "games"; then
    echo "✅ Tables created successfully:"
    wrangler d1 execute live-sim --command "SELECT name FROM sqlite_master WHERE type='table'"
else
    echo "⚠️  Warning: Could not verify tables"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Resources created:"
echo "  • D1 Database:       $DB_ID"
echo "  • KV Namespace:      $KV_ID"
echo "  • KV Preview:        $KV_PREVIEW_ID"
echo "  • R2 Bucket:         blazesports-live-sim-data"
echo ""
echo "Next steps:"
echo ""
echo "  1. Install dependencies:"
echo "     npm install"
echo ""
echo "  2. Test locally:"
echo "     npm run dev"
echo ""
echo "  3. Deploy to production:"
echo "     npm run deploy"
echo ""
echo "  4. View dashboard:"
echo "     open http://localhost:8788/dashboard.html?gameId=test"
echo ""
echo "  5. Run test simulation:"
echo "     ./test-data/simulate-game.sh http://localhost:8788 3"
echo ""
echo "For integration with existing BSI infrastructure:"
echo "  See INTEGRATION.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
