#!/usr/bin/env bash
# Blaze Sports Intel - One-Command Production Deployment
# Deploys to Cloudflare Pages with validation and health checks
set -euo pipefail

# ==============================================================================
# CONFIGURATION
# ==============================================================================
PROJECT_NAME="${PROJECT_NAME:-sandlot-sluggers}"
BRANCH="${BRANCH:-main}"
BUILD_DIR="${BUILD_DIR:-apps/web/.next}"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
HEALTH_CHECK_TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# LOGGING FUNCTIONS
# ==============================================================================
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

# ==============================================================================
# VALIDATION
# ==============================================================================
validate_environment() {
  log_info "Validating environment..."

  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
  fi
  log_info "Node.js version: $(node --version)"

  # Check npm
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
  fi
  log_info "npm version: $(npm --version)"

  # Check for Cloudflare API Token
  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    log_error "CLOUDFLARE_API_TOKEN is not set"
    log_info "Set it with: export CLOUDFLARE_API_TOKEN=your_token"
    exit 1
  fi
  log_success "CLOUDFLARE_API_TOKEN is set"

  # Check for wrangler
  if ! command -v npx &> /dev/null; then
    log_error "npx is not available"
    exit 1
  fi
  log_success "Environment validation complete"
}

# ==============================================================================
# PRE-DEPLOYMENT CHECKS
# ==============================================================================
run_pre_deployment_checks() {
  log_info "Running pre-deployment checks..."

  # Check if we're in the right directory
  if [[ ! -f "package.json" ]]; then
    log_error "package.json not found. Are you in the project root?"
    exit 1
  fi

  # Check git status
  if command -v git &> /dev/null; then
    if [[ -n $(git status --porcelain) ]]; then
      log_warning "You have uncommitted changes"
      read -p "Continue anyway? (y/N) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
      fi
    fi

    # Get current git info
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    log_info "Git commit: $GIT_COMMIT on branch $GIT_BRANCH"
  fi

  log_success "Pre-deployment checks complete"
}

# ==============================================================================
# DEPENDENCY INSTALLATION
# ==============================================================================
install_dependencies() {
  log_info "Installing dependencies..."

  if [[ -f "pnpm-lock.yaml" ]]; then
    log_info "Using pnpm..."
    if ! command -v pnpm &> /dev/null; then
      log_warning "pnpm not found, falling back to npm"
      npm ci
    else
      pnpm install --frozen-lockfile
    fi
  elif [[ -f "package-lock.json" ]]; then
    log_info "Using npm..."
    npm ci
  elif [[ -f "yarn.lock" ]]; then
    log_info "Using yarn..."
    if ! command -v yarn &> /dev/null; then
      log_error "yarn.lock found but yarn not installed"
      exit 1
    fi
    yarn install --frozen-lockfile
  else
    log_warning "No lockfile found, running npm install"
    npm install
  fi

  log_success "Dependencies installed"
}

# ==============================================================================
# BUILD
# ==============================================================================
run_build() {
  log_info "Building application..."

  # Run type check
  log_info "Running TypeScript type check..."
  if npm run typecheck 2>&1; then
    log_success "Type check passed"
  else
    log_error "Type check failed"
    exit 1
  fi

  # Run lint
  log_info "Running linter..."
  if npm run lint 2>&1 | grep -q "No ESLint warnings or errors"; then
    log_success "Linting passed"
  else
    log_warning "Linting produced warnings (continuing)"
  fi

  # Build the application
  log_info "Building Next.js application..."
  if npm run build 2>&1; then
    log_success "Build complete"
  else
    log_error "Build failed"
    exit 1
  fi
}

# ==============================================================================
# CLOUDFLARE DEPLOYMENT
# ==============================================================================
deploy_to_cloudflare() {
  log_info "Deploying to Cloudflare Pages..."

  local deployment_output
  local deployment_url

  # Deploy using wrangler
  log_info "Running: npx wrangler pages deploy $BUILD_DIR --project-name=$PROJECT_NAME --branch=$BRANCH"

  if deployment_output=$(CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" npx wrangler pages deploy "$BUILD_DIR" \
    --project-name="$PROJECT_NAME" \
    --branch="$BRANCH" \
    --commit-dirty=true \
    2>&1); then

    log_success "Deployment initiated"

    # Extract deployment URL from output
    if deployment_url=$(echo "$deployment_output" | grep -oP 'https://[a-zA-Z0-9-]+\.pages\.dev' | head -1); then
      log_success "Deployment URL: $deployment_url"
      echo "$deployment_url" > .last_deployment_url
    else
      log_warning "Could not extract deployment URL from output"
      log_info "Full output:"
      echo "$deployment_output"
    fi
  else
    log_error "Deployment failed"
    log_error "$deployment_output"
    exit 1
  fi
}

# ==============================================================================
# HEALTH CHECKS
# ==============================================================================
run_health_checks() {
  log_info "Running post-deployment health checks..."

  if [[ ! -f ".last_deployment_url" ]]; then
    log_warning "No deployment URL found, skipping health checks"
    return 0
  fi

  local deployment_url
  deployment_url=$(cat .last_deployment_url)

  log_info "Waiting for deployment to be live..."
  sleep 10

  # Check if the site is accessible
  log_info "Checking site accessibility..."
  if curl -sf --max-time "$HEALTH_CHECK_TIMEOUT" "$deployment_url" > /dev/null; then
    log_success "Site is accessible at $deployment_url"
  else
    log_error "Site is not accessible at $deployment_url"
    exit 1
  fi

  # Check API health endpoint
  log_info "Checking API health..."
  if curl -sf --max-time "$HEALTH_CHECK_TIMEOUT" "$deployment_url/api/health" > /dev/null; then
    log_success "API health check passed"
  else
    log_warning "API health check failed (endpoint may not exist yet)"
  fi

  # Check specific sport endpoints
  log_info "Testing sport endpoints..."
  local endpoints=("api/mlb/teams/138" "api/nfl/teams/TEN" "api/nba/teams/MEM")
  local failed_endpoints=0

  for endpoint in "${endpoints[@]}"; do
    if curl -sf --max-time 10 "$deployment_url/$endpoint" > /dev/null; then
      log_success "✓ $endpoint"
    else
      log_warning "✗ $endpoint (may need data initialization)"
      ((failed_endpoints++))
    fi
  done

  if [[ $failed_endpoints -eq ${#endpoints[@]} ]]; then
    log_error "All sport endpoints failed"
    exit 1
  fi

  log_success "Health checks complete"
}

# ==============================================================================
# DEPLOYMENT SUMMARY
# ==============================================================================
print_deployment_summary() {
  local deployment_url
  deployment_url=$(cat .last_deployment_url 2>/dev/null || echo "Unknown")

  echo ""
  echo "========================================================================"
  echo "  DEPLOYMENT COMPLETE"
  echo "========================================================================"
  echo ""
  echo "  🚀 Project:       $PROJECT_NAME"
  echo "  🌐 URL:           $deployment_url"
  echo "  🌿 Branch:        $BRANCH"
  echo "  📦 Commit:        ${GIT_COMMIT:-unknown}"
  echo "  ⏰ Deployed:      $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo ""
  echo "========================================================================"
  echo ""
  echo "Next steps:"
  echo "  • Visit your site: $deployment_url"
  echo "  • Check logs: npx wrangler pages deployment list --project-name=$PROJECT_NAME"
  echo "  • Monitor: https://dash.cloudflare.com"
  echo ""
}

# ==============================================================================
# ROLLBACK FUNCTION
# ==============================================================================
rollback_deployment() {
  log_warning "Rollback requested"
  log_info "To rollback, use: npx wrangler pages deployment list --project-name=$PROJECT_NAME"
  log_info "Then: npx wrangler pages deployment rollback <deployment-id>"
}

# ==============================================================================
# CLEANUP
# ==============================================================================
cleanup() {
  log_info "Cleaning up temporary files..."
  # Add any cleanup tasks here
}

# ==============================================================================
# ERROR HANDLING
# ==============================================================================
handle_error() {
  log_error "Deployment failed on line $1"
  cleanup
  exit 1
}

trap 'handle_error $LINENO' ERR
trap cleanup EXIT

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
main() {
  log_info "Starting Blaze Sports Intel deployment..."
  log_info "Environment: $DEPLOYMENT_ENV"
  echo ""

  validate_environment
  run_pre_deployment_checks
  install_dependencies
  run_build
  deploy_to_cloudflare
  run_health_checks
  print_deployment_summary

  log_success "🎉 Deployment complete!"
}

# Handle script arguments
case "${1:-deploy}" in
  deploy)
    main
    ;;
  rollback)
    rollback_deployment
    ;;
  check)
    validate_environment
    run_pre_deployment_checks
    log_success "All checks passed"
    ;;
  *)
    echo "Usage: $0 {deploy|rollback|check}"
    echo ""
    echo "Commands:"
    echo "  deploy   - Deploy to Cloudflare Pages (default)"
    echo "  rollback - Show rollback instructions"
    echo "  check    - Run validation checks without deploying"
    exit 1
    ;;
esac
