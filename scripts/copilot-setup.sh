#!/usr/bin/env bash

# ============================================================================
# Scouting Intel Copilot - Week 1 Setup Script
# ============================================================================
# This script creates all required Cloudflare resources for the AI Copilot
# feature without modifying any existing frontend pages.
#
# Prerequisites:
#   - wrangler CLI installed and authenticated
#   - Cloudflare account with Pages, D1, R2, Vectorize, and Workers AI access
#
# Usage:
#   chmod +x scripts/copilot-setup.sh
#   ./scripts/copilot-setup.sh
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🤖 Blaze Sports Intel - Scouting Copilot Week 1 Setup         ║${NC}"
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}✗ Error: wrangler CLI not found${NC}"
    echo "  Install: npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✓ wrangler CLI found${NC}"

# Determine wrangler path
WRANGLER_CMD="wrangler"
if [ -f "/Users/AustinHumphrey/.npm-global/bin/wrangler" ]; then
    WRANGLER_CMD="/Users/AustinHumphrey/.npm-global/bin/wrangler"
    echo -e "${GREEN}✓ Using local wrangler: ${WRANGLER_CMD}${NC}"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Create R2 Bucket for Embeddings Storage${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if $WRANGLER_CMD r2 bucket list | grep -q "bsi-embeddings"; then
    echo -e "${GREEN}✓ R2 bucket 'bsi-embeddings' already exists${NC}"
else
    echo "Creating R2 bucket 'bsi-embeddings'..."
    if $WRANGLER_CMD r2 bucket create bsi-embeddings; then
        echo -e "${GREEN}✓ R2 bucket 'bsi-embeddings' created successfully${NC}"
    else
        echo -e "${RED}✗ Failed to create R2 bucket${NC}"
        echo "  This might already exist. Continuing..."
    fi
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Create Vectorize Index for Semantic Search${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if $WRANGLER_CMD vectorize list | grep -q "sports-scouting-index"; then
    echo -e "${GREEN}✓ Vectorize index 'sports-scouting-index' already exists${NC}"
else
    echo "Creating Vectorize index with 768 dimensions (bge-base-en-v1.5 model)..."
    if $WRANGLER_CMD vectorize create sports-scouting-index \
        --dimensions=768 \
        --metric=cosine; then
        echo -e "${GREEN}✓ Vectorize index 'sports-scouting-index' created successfully${NC}"
    else
        echo -e "${RED}✗ Failed to create Vectorize index${NC}"
        echo "  This might already exist. Continuing..."
    fi
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Verify Existing Resources${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking existing infrastructure..."
echo ""

echo "📦 R2 Buckets:"
$WRANGLER_CMD r2 bucket list | grep -E "bsi-embeddings|Name" || echo "  None found"
echo ""

echo "🔍 Vectorize Indexes:"
$WRANGLER_CMD vectorize list | grep -E "sports-scouting-index|Name" || echo "  None found"
echo ""

echo "💾 D1 Databases:"
$WRANGLER_CMD d1 list | grep -E "blazesports-db|Name" || echo "  None found"
echo ""

echo "🗄️  KV Namespaces:"
$WRANGLER_CMD kv:namespace list | grep -E "CACHE|title" || echo "  None found"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Infrastructure Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📋 Next Steps:"
echo ""
echo "  1. Deploy the backend:"
echo "     ${WRANGLER_CMD} pages deploy . --project-name blazesportsintel --branch main"
echo ""
echo "  2. Test the health endpoint:"
echo "     curl https://blazesportsintel.com/api/copilot/health"
echo ""
echo "  3. Run the verification script:"
echo "     ./scripts/test-copilot.sh"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
