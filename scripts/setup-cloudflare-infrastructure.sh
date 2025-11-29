#!/bin/bash
# ============================================================================
# BSI CLOUDFLARE INFRASTRUCTURE SETUP
# Creates KV namespaces, D1 database, R2 bucket, and deploys API gateway
# ============================================================================
#
# Prerequisites:
#   - wrangler CLI installed (npm install -g wrangler)
#   - Authenticated with Cloudflare (wrangler login)
#   - CLOUDFLARE_ACCOUNT_ID set in environment or .env
#
# Usage:
#   ./scripts/setup-cloudflare-infrastructure.sh
#
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        log_error "wrangler CLI not found. Install with: npm install -g wrangler"
        exit 1
    fi
    log_success "wrangler CLI found"
}

# ============================================================================
# Configuration
# ============================================================================

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    log_info "Loaded environment variables from .env"
fi

# Project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

log_info "Working directory: $PROJECT_ROOT"

# ============================================================================
# Phase 1: Create KV Namespaces
# ============================================================================

create_kv_namespaces() {
    log_info "Creating KV namespaces..."

    # BSI_CACHE_SCORES
    if wrangler kv:namespace list 2>/dev/null | grep -q "BSI_CACHE_SCORES"; then
        log_warning "BSI_CACHE_SCORES already exists, skipping"
    else
        log_info "Creating BSI_CACHE_SCORES..."
        SCORES_ID=$(wrangler kv:namespace create BSI_CACHE_SCORES 2>&1 | grep -oP 'id = "\K[^"]+')
        if [ -n "$SCORES_ID" ]; then
            log_success "Created BSI_CACHE_SCORES with ID: $SCORES_ID"
            echo "BSI_CACHE_SCORES_ID=$SCORES_ID" >> .env.cloudflare
        else
            log_error "Failed to create BSI_CACHE_SCORES"
        fi
    fi

    # BSI_CACHE_ODDS
    if wrangler kv:namespace list 2>/dev/null | grep -q "BSI_CACHE_ODDS"; then
        log_warning "BSI_CACHE_ODDS already exists, skipping"
    else
        log_info "Creating BSI_CACHE_ODDS..."
        ODDS_ID=$(wrangler kv:namespace create BSI_CACHE_ODDS 2>&1 | grep -oP 'id = "\K[^"]+')
        if [ -n "$ODDS_ID" ]; then
            log_success "Created BSI_CACHE_ODDS with ID: $ODDS_ID"
            echo "BSI_CACHE_ODDS_ID=$ODDS_ID" >> .env.cloudflare
        else
            log_error "Failed to create BSI_CACHE_ODDS"
        fi
    fi

    # BSI_SESSION_DATA
    if wrangler kv:namespace list 2>/dev/null | grep -q "BSI_SESSION_DATA"; then
        log_warning "BSI_SESSION_DATA already exists, skipping"
    else
        log_info "Creating BSI_SESSION_DATA..."
        SESSION_ID=$(wrangler kv:namespace create BSI_SESSION_DATA 2>&1 | grep -oP 'id = "\K[^"]+')
        if [ -n "$SESSION_ID" ]; then
            log_success "Created BSI_SESSION_DATA with ID: $SESSION_ID"
            echo "BSI_SESSION_DATA_ID=$SESSION_ID" >> .env.cloudflare
        else
            log_error "Failed to create BSI_SESSION_DATA"
        fi
    fi
}

# ============================================================================
# Phase 2: Create D1 Database
# ============================================================================

create_d1_database() {
    log_info "Creating D1 database..."

    # Check if bsi-core-db exists
    if wrangler d1 list 2>/dev/null | grep -q "bsi-core-db"; then
        log_warning "bsi-core-db already exists"
        DB_ID=$(wrangler d1 list 2>/dev/null | grep "bsi-core-db" | awk '{print $1}')
        log_info "Existing database ID: $DB_ID"
    else
        log_info "Creating bsi-core-db..."
        DB_OUTPUT=$(wrangler d1 create bsi-core-db 2>&1)
        DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+')
        if [ -n "$DB_ID" ]; then
            log_success "Created bsi-core-db with ID: $DB_ID"
            echo "BSI_CORE_DB_ID=$DB_ID" >> .env.cloudflare
        else
            log_error "Failed to create bsi-core-db"
            echo "$DB_OUTPUT"
        fi
    fi

    # Apply schema
    if [ -f "db/bsi-core-schema.sql" ]; then
        log_info "Applying schema to bsi-core-db..."
        if wrangler d1 execute bsi-core-db --file=db/bsi-core-schema.sql 2>&1; then
            log_success "Schema applied successfully"
        else
            log_warning "Schema may already be applied or there was an error"
        fi
    else
        log_warning "Schema file not found: db/bsi-core-schema.sql"
    fi
}

# ============================================================================
# Phase 3: Create R2 Bucket
# ============================================================================

create_r2_bucket() {
    log_info "Creating R2 bucket..."

    # Check if bsi-assets exists
    if wrangler r2 bucket list 2>/dev/null | grep -q "bsi-assets"; then
        log_warning "bsi-assets bucket already exists, skipping"
    else
        log_info "Creating bsi-assets bucket..."
        if wrangler r2 bucket create bsi-assets 2>&1; then
            log_success "Created bsi-assets bucket"
        else
            log_error "Failed to create bsi-assets bucket"
        fi
    fi
}

# ============================================================================
# Phase 4: Update Wrangler Configuration
# ============================================================================

update_wrangler_config() {
    log_info "Updating wrangler configuration..."

    # Read the generated IDs
    if [ -f .env.cloudflare ]; then
        source .env.cloudflare

        # Update api-gateway wrangler.toml
        GATEWAY_CONFIG="workers/api-gateway/wrangler.toml"
        if [ -f "$GATEWAY_CONFIG" ]; then
            if [ -n "$BSI_CACHE_SCORES_ID" ]; then
                sed -i "s/BSI_CACHE_SCORES_ID/$BSI_CACHE_SCORES_ID/g" "$GATEWAY_CONFIG"
            fi
            if [ -n "$BSI_CACHE_ODDS_ID" ]; then
                sed -i "s/BSI_CACHE_ODDS_ID/$BSI_CACHE_ODDS_ID/g" "$GATEWAY_CONFIG"
            fi
            if [ -n "$BSI_SESSION_DATA_ID" ]; then
                sed -i "s/BSI_SESSION_DATA_ID/$BSI_SESSION_DATA_ID/g" "$GATEWAY_CONFIG"
            fi
            if [ -n "$BSI_CORE_DB_ID" ]; then
                sed -i "s/BSI_CORE_DB_ID/$BSI_CORE_DB_ID/g" "$GATEWAY_CONFIG"
            fi
            log_success "Updated $GATEWAY_CONFIG with resource IDs"
        fi
    else
        log_warning "No .env.cloudflare found, skipping config update"
    fi
}

# ============================================================================
# Phase 5: Deploy API Gateway Worker
# ============================================================================

deploy_api_gateway() {
    log_info "Deploying bsi-api-gateway worker..."

    cd workers/api-gateway

    # Install dependencies if needed
    if [ ! -d "node_modules" ] && [ -f "package.json" ]; then
        log_info "Installing dependencies..."
        npm install
    fi

    # Deploy
    if wrangler deploy 2>&1; then
        log_success "bsi-api-gateway deployed successfully"
    else
        log_warning "Deployment may have issues, check output above"
    fi

    cd "$PROJECT_ROOT"
}

# ============================================================================
# Phase 6: Set Secrets
# ============================================================================

set_secrets() {
    log_info "Setting secrets for bsi-api-gateway..."

    # Read secrets from .env if available
    if [ -f .env ]; then
        declare -A SECRETS=(
            ["THEODDSAPI_KEY"]="THEODDSAPI_KEY"
            ["SPORTSDATAIO_API_KEY"]="SPORTSDATAIO_KEY"
            ["SPORTSRADAR_MASTER_API_KEY"]="SPORTSRADAR_KEY"
            ["OPENAI_API_KEY"]="OPENAI_API_KEY"
            ["ANTHROPIC_API_KEY"]="ANTHROPIC_API_KEY"
            ["JWT_SECRET"]="JWT_SECRET"
        )

        for env_var in "${!SECRETS[@]}"; do
            value=$(grep "^$env_var=" .env 2>/dev/null | cut -d'=' -f2-)
            if [ -n "$value" ] && [ "$value" != "your_api_key_here" ]; then
                secret_name="${SECRETS[$env_var]}"
                log_info "Setting secret: $secret_name"
                echo "$value" | wrangler secret put "$secret_name" --name bsi-api-gateway 2>/dev/null || true
            fi
        done

        log_success "Secrets configured"
    else
        log_warning "No .env file found, skipping secrets setup"
        log_info "Set secrets manually with: wrangler secret put <SECRET_NAME> --name bsi-api-gateway"
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "  BSI Cloudflare Infrastructure Setup"
    echo "=============================================="
    echo ""

    check_wrangler

    # Create .env.cloudflare for storing generated IDs
    echo "# BSI Cloudflare Resource IDs" > .env.cloudflare
    echo "# Generated on $(date)" >> .env.cloudflare

    # Run setup phases
    create_kv_namespaces
    echo ""
    create_d1_database
    echo ""
    create_r2_bucket
    echo ""
    update_wrangler_config
    echo ""

    # Optional: Deploy and set secrets
    read -p "Deploy bsi-api-gateway worker? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_api_gateway
        set_secrets
    fi

    echo ""
    echo "=============================================="
    echo "  Setup Complete!"
    echo "=============================================="
    echo ""
    echo "Resource IDs saved to: .env.cloudflare"
    echo ""
    echo "Next steps:"
    echo "  1. Review .env.cloudflare for generated IDs"
    echo "  2. Update workers/api-gateway/wrangler.toml if needed"
    echo "  3. Set any remaining secrets:"
    echo "     wrangler secret put THEODDSAPI_KEY --name bsi-api-gateway"
    echo "  4. Deploy the worker:"
    echo "     cd workers/api-gateway && wrangler deploy"
    echo ""
}

# Run main function
main "$@"
