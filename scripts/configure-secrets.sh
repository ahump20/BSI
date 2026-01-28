#!/bin/bash
# =============================================================================
# BSI Secrets Configuration Script
# =============================================================================
# This script configures all required secrets for:
#   - blazesportsintel.com (Pages + Workers)
#   - blazecraft.app (Pages)
#
# Usage:
#   ./scripts/configure-secrets.sh [--dry-run] [--site blazesportsintel|blazecraft|all]
#
# Prerequisites:
#   - wrangler CLI authenticated (npx wrangler login)
#   - All secret values in environment or .env.secrets file
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DRY_RUN=false
TARGET_SITE="all"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --site)
            TARGET_SITE="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}BSI Secrets Configuration${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Load secrets from .env.secrets if exists
if [[ -f ".env.secrets" ]]; then
    echo -e "${GREEN}Loading secrets from .env.secrets${NC}"
    set -a
    source .env.secrets
    set +a
fi

# =============================================================================
# BLAZESPORTSINTEL.COM SECRETS
# =============================================================================
# These workers/pages require secrets:
#   - college-baseball-tracker (main Pages site)
#   - bsi-home (production worker)
#   - bsi-api
#   - bsi-ingest
#   - bsi-college-data-sync
# =============================================================================

BSI_WORKERS=(
    "college-baseball-tracker"
    "bsi-home"
    "bsi-api"
    "bsi-ingest"
    "bsi-college-data-sync"
    "bsi-cfb-ai"
    "bsi-cbb-gateway"
    "bsi-cbb-sync"
    "bsi-prediction-api"
    "bsi-nil-sync"
    "bsi-cache-warmer"
    "bsi-news-ticker"
    "bsi-chatgpt-app"
)

# Required secrets for BSI
BSI_SECRETS=(
    # Sports Data APIs
    "SPORTSDATAIO_API_KEY|Sports Data IO API key for MLB/NFL/NBA data"
    "CFBDATA_API_KEY|College Football Data API key"
    "THEODDS_API_KEY|The Odds API key for betting lines (optional)"

    # Payment Processing
    "STRIPE_SECRET_KEY|Stripe secret key (sk_live_... or sk_test_...)"
    "STRIPE_WEBHOOK_SECRET|Stripe webhook signing secret (whsec_...)"
    "STRIPE_PRO_PRICE_ID|Stripe Pro tier price ID (price_1SX9voLvpRBk20R2pW0AjUIv)"
    "STRIPE_ENTERPRISE_PRICE_ID|Stripe Enterprise tier price ID (price_1SX9w7LvpRBk20R2DJkKAH3y)"

    # Authentication
    "GOOGLE_CLIENT_ID|Google OAuth client ID"
    "GOOGLE_CLIENT_SECRET|Google OAuth client secret"
    "JWT_SECRET|JWT signing secret (min 32 chars)"
    "SESSION_SECRET|Session encryption secret"

    # Email
    "RESEND_API_KEY|Resend email API key"

    # AI Services (fallback chain)
    "GOOGLE_GEMINI_API_KEY|Google Gemini API key (primary LLM)"
    "OPENAI_API_KEY|OpenAI API key (fallback LLM)"
    "ANTHROPIC_API_KEY|Anthropic Claude API key (fallback LLM)"

    # Notion (portfolio sync)
    "NOTION_TOKEN|Notion integration token"
    "NOTION_DATABASE_ID|Notion portfolio database ID"

    # Cloudflare Services
    "CLOUDFLARE_ACCOUNT_ID|Cloudflare account ID (a12cb329d84130460eed99b816e4d0d3)"
    "CLOUDFLARE_STREAM_TOKEN|Cloudflare Stream API token"

    # Internal
    "ADMIN_API_KEY|Admin API key for protected endpoints"
)

# =============================================================================
# BLAZECRAFT.APP SECRETS
# =============================================================================
# These workers/pages require secrets:
#   - blazecraft (main Pages site)
#   - blazecraft-assets
#   - blazecraft-events
# =============================================================================

BLAZECRAFT_WORKERS=(
    "blazecraft"
    "blazecraft-assets"
    "blazecraft-events"
)

# Required secrets for Blazecraft
BLAZECRAFT_SECRETS=(
    "BSI_API_KEY|BlazeSportsIntel API key for authenticated endpoints"
    "SESSION_SECRET|Session encryption secret"
)

# =============================================================================
# Helper Functions
# =============================================================================

configure_secret() {
    local worker=$1
    local secret_name=$2
    local secret_desc=$3
    local secret_value="${!secret_name:-}"

    if [[ -z "$secret_value" ]]; then
        echo -e "  ${YELLOW}SKIP${NC} $secret_name - not set in environment"
        return 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "  ${BLUE}[DRY-RUN]${NC} Would set $secret_name on $worker"
    else
        echo "$secret_value" | npx wrangler secret put "$secret_name" --name "$worker" 2>/dev/null && \
            echo -e "  ${GREEN}SET${NC} $secret_name on $worker" || \
            echo -e "  ${RED}FAIL${NC} $secret_name on $worker"
    fi
}

configure_worker_secrets() {
    local worker=$1
    shift
    local -a secrets=("$@")

    echo ""
    echo -e "${BLUE}Configuring: $worker${NC}"
    echo "----------------------------------------"

    for secret_entry in "${secrets[@]}"; do
        IFS='|' read -r secret_name secret_desc <<< "$secret_entry"
        configure_secret "$worker" "$secret_name" "$secret_desc"
    done
}

# =============================================================================
# Main Execution
# =============================================================================

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}Running in DRY-RUN mode - no changes will be made${NC}"
    echo ""
fi

# Configure BSI secrets
if [[ "$TARGET_SITE" == "all" || "$TARGET_SITE" == "blazesportsintel" ]]; then
    echo -e "${GREEN}=== BLAZESPORTSINTEL.COM ===${NC}"
    for worker in "${BSI_WORKERS[@]}"; do
        configure_worker_secrets "$worker" "${BSI_SECRETS[@]}"
    done
fi

# Configure Blazecraft secrets
if [[ "$TARGET_SITE" == "all" || "$TARGET_SITE" == "blazecraft" ]]; then
    echo ""
    echo -e "${GREEN}=== BLAZECRAFT.APP ===${NC}"
    for worker in "${BLAZECRAFT_WORKERS[@]}"; do
        configure_worker_secrets "$worker" "${BLAZECRAFT_SECRETS[@]}"
    done
fi

echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}Configuration complete!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Create .env.secrets with your actual secret values"
echo "  2. Run: ./scripts/configure-secrets.sh"
echo "  3. Deploy workers: npx wrangler deploy"
echo ""

# =============================================================================
# SECRETS TEMPLATE (copy to .env.secrets)
# =============================================================================
cat << 'TEMPLATE'

# =====================================================
# .env.secrets template - DO NOT COMMIT THIS FILE
# =====================================================
# Copy this to .env.secrets and fill in values

# Sports Data APIs
SPORTSDATAIO_API_KEY=
CFBDATA_API_KEY=
THEODDS_API_KEY=

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_1SX9voLvpRBk20R2pW0AjUIv
STRIPE_ENTERPRISE_PRICE_ID=price_1SX9w7LvpRBk20R2DJkKAH3y

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Session/Auth
JWT_SECRET=your-32-char-minimum-secret-here
SESSION_SECRET=another-secure-secret-here

# Email (Resend)
RESEND_API_KEY=re_...

# AI Services
GOOGLE_GEMINI_API_KEY=
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Notion
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=a12cb329d84130460eed99b816e4d0d3
CLOUDFLARE_STREAM_TOKEN=

# Internal
ADMIN_API_KEY=
BSI_API_KEY=

TEMPLATE
