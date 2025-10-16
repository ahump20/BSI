#!/bin/bash

##############################################################################
# Daily Workflow Script
#
# Automates common Phase 5 workflows:
# - Pre-deployment validation
# - Daily documentation updates
# - Weekly competitive analysis
#
# Usage:
#   ./daily-workflow.sh [workflow]
#
# Workflows:
#   pre-deploy        Pre-deployment checks (gap analysis + docs)
#   daily-docs        Daily documentation update
#   weekly-analysis   Weekly competitive analysis
#   morning           Morning startup routine
#   release VERSION   Prepare release with docs and analysis
#
# @author Blaze Sports Intel
# @version 1.0.0
##############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Directories
BSI_DIR="/Users/AustinHumphrey/BSI"
SCRIPTS_DIR="$BSI_DIR/.claude/scripts"

print_header() {
  echo ""
  echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${MAGENTA}║ $1${NC}"
  echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo -e "${BLUE}➜ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Pre-deployment workflow
pre_deploy_workflow() {
  print_header "🚀 PRE-DEPLOYMENT WORKFLOW"

  print_step "Running ESPN gap analysis for competitive intelligence..."
  $SCRIPTS_DIR/run-phase5.sh gap-analysis

  echo ""
  print_step "Generating fresh documentation for deployment..."
  $SCRIPTS_DIR/run-phase5.sh docs

  echo ""
  print_step "Running Phase 5 test suite..."
  $SCRIPTS_DIR/run-phase5.sh test

  echo ""
  print_success "Pre-deployment checks complete!"
  print_info "Review outputs:"
  print_info "  - Gap Analysis: .claude/espn-gap-analyzer/reports/"
  print_info "  - API Docs: docs/api/"
  print_info "  - Changelog: CHANGELOG.md"
  print_info "  - README: README.md"
  echo ""
  print_info "Ready to deploy? Run: npm run deploy"
}

# Daily documentation update
daily_docs_workflow() {
  print_header "📝 DAILY DOCUMENTATION UPDATE"

  print_step "Checking for code changes..."
  cd "$BSI_DIR"

  # Check if there are uncommitted changes
  if git diff --quiet && git diff --cached --quiet; then
    print_info "No code changes detected. Documentation is up to date."
    return
  fi

  print_step "Generating API documentation..."
  $SCRIPTS_DIR/run-phase5.sh docs-api

  echo ""
  print_step "Updating changelog..."
  $SCRIPTS_DIR/run-phase5.sh docs-changelog

  echo ""
  print_step "Refreshing README..."
  $SCRIPTS_DIR/run-phase5.sh docs-readme

  echo ""
  print_success "Daily documentation update complete!"
  print_info "Updated files:"
  print_info "  - docs/api/openapi.json"
  print_info "  - CHANGELOG.md"
  print_info "  - README.md"
}

# Weekly competitive analysis
weekly_analysis_workflow() {
  print_header "🔍 WEEKLY COMPETITIVE ANALYSIS"

  print_step "Running comprehensive ESPN gap analysis..."
  $SCRIPTS_DIR/run-phase5.sh gap-analysis

  echo ""
  print_step "Generating analysis summary..."

  # Check if reports exist
  REPORTS_DIR="$BSI_DIR/.claude/espn-gap-analyzer/reports"

  if [ -f "$REPORTS_DIR/coverage-validation/espn-coverage-validation.json" ]; then
    echo ""
    print_success "Analysis complete! Key findings:"
    echo ""

    # Extract key metrics (requires jq)
    if command -v jq &> /dev/null; then
      COLLEGE_BASEBALL_GAPS=$(jq -r '.validation.college_baseball_gaps_confirmed.gaps_confirmed // 0' \
        "$REPORTS_DIR/coverage-validation/espn-coverage-validation.json")
      TOTAL_SPORTS=$(jq -r '.summary.total_sports_checked // 0' \
        "$REPORTS_DIR/coverage-validation/espn-coverage-validation.json")

      echo -e "  ${YELLOW}College Baseball Gaps:${NC} $COLLEGE_BASEBALL_GAPS confirmed"
      echo -e "  ${YELLOW}Sports Analyzed:${NC} $TOTAL_SPORTS"
      echo ""
    fi

    print_info "Full reports:"
    print_info "  - Coverage: $REPORTS_DIR/coverage-validation/"
    print_info "  - Gaps: $REPORTS_DIR/gaps/"
    print_info "  - Opportunities: $REPORTS_DIR/opportunities/"
  else
    print_error "Analysis reports not found"
  fi

  echo ""
  print_success "Weekly analysis complete!"
}

# Morning startup routine
morning_workflow() {
  print_header "☀️ MORNING STARTUP ROUTINE"

  print_step "Testing MCP servers..."
  $SCRIPTS_DIR/run-phase5.sh mcp-test

  echo ""
  print_step "Checking documentation freshness..."

  cd "$BSI_DIR"

  # Check when docs were last updated
  if [ -f "CHANGELOG.md" ]; then
    CHANGELOG_AGE=$(find CHANGELOG.md -mtime +1 2>/dev/null | wc -l)

    if [ "$CHANGELOG_AGE" -gt 0 ]; then
      print_info "Documentation is stale (>24 hours old)"
      print_step "Refreshing documentation..."
      $SCRIPTS_DIR/run-phase5.sh docs
    else
      print_success "Documentation is up to date"
    fi
  else
    print_info "No CHANGELOG.md found. Generating documentation..."
    $SCRIPTS_DIR/run-phase5.sh docs
  fi

  echo ""
  print_success "Morning routine complete! You're ready to code. 🎉"
}

# Release preparation workflow
release_workflow() {
  VERSION=$1

  if [ -z "$VERSION" ]; then
    print_error "Version required"
    echo "Usage: $0 release VERSION"
    echo "Example: $0 release 1.3.0"
    exit 1
  fi

  print_header "🎉 RELEASE PREPARATION v$VERSION"

  cd "$BSI_DIR"

  print_step "Step 1: Running pre-deployment checks..."
  $SCRIPTS_DIR/run-phase5.sh test

  echo ""
  print_step "Step 2: Generating fresh documentation..."
  $SCRIPTS_DIR/run-phase5.sh docs

  echo ""
  print_step "Step 3: Running competitive analysis..."
  $SCRIPTS_DIR/run-phase5.sh gap-analysis

  echo ""
  print_step "Step 4: Updating package version..."
  npm version "$VERSION" --no-git-tag-version

  echo ""
  print_step "Step 5: Creating git commit..."

  git add .
  git commit -m "chore: Release v$VERSION

📦 Version bump to $VERSION
📝 Updated all documentation
🔍 Latest ESPN gap analysis

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

  echo ""
  print_step "Step 6: Creating git tag..."
  git tag -a "v$VERSION" -m "Release v$VERSION"

  echo ""
  print_success "Release v$VERSION prepared!"
  echo ""
  print_info "Next steps:"
  print_info "  1. Review changes: git log -1 --stat"
  print_info "  2. Push to GitHub: git push origin main && git push origin v$VERSION"
  print_info "  3. Deploy to production: npm run deploy"
  print_info "  4. Create GitHub release from tag: gh release create v$VERSION"
}

# Show usage
show_usage() {
  cat << EOF
${BLUE}Daily Workflow Script${NC}

Automates common Phase 5 workflows for Blaze Sports Intel.

${YELLOW}Usage:${NC}
  $0 [workflow] [options]

${YELLOW}Workflows:${NC}
  ${GREEN}pre-deploy${NC}        Pre-deployment validation
                      - Gap analysis
                      - Documentation generation
                      - Test suite

  ${GREEN}daily-docs${NC}        Daily documentation update
                      - API docs
                      - Changelog
                      - README

  ${GREEN}weekly-analysis${NC}   Weekly competitive analysis
                      - ESPN gap validation
                      - Opportunity identification

  ${GREEN}morning${NC}           Morning startup routine
                      - MCP server health check
                      - Documentation freshness check

  ${GREEN}release VERSION${NC}   Prepare release
                      - Run all checks
                      - Update version
                      - Create git tag

${YELLOW}Examples:${NC}
  $0 pre-deploy                 # Before deploying to production
  $0 daily-docs                 # Update docs after coding
  $0 weekly-analysis            # Sunday competitive review
  $0 morning                    # Start of day routine
  $0 release 1.3.0              # Prepare v1.3.0 release

${YELLOW}Recommended Schedule:${NC}
  ${BLUE}Daily${NC}    - morning, daily-docs
  ${BLUE}Weekly${NC}   - weekly-analysis (Sunday)
  ${BLUE}As-needed${NC} - pre-deploy, release

EOF
}

# Main execution
main() {
  case "${1:-help}" in
    pre-deploy)
      pre_deploy_workflow
      ;;
    daily-docs)
      daily_docs_workflow
      ;;
    weekly-analysis)
      weekly_analysis_workflow
      ;;
    morning)
      morning_workflow
      ;;
    release)
      release_workflow "${2:-}"
      ;;
    help|--help|-h)
      show_usage
      ;;
    *)
      print_error "Unknown workflow: $1"
      echo ""
      show_usage
      exit 1
      ;;
  esac
}

main "$@"
