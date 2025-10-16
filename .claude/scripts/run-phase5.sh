#!/bin/bash

##############################################################################
# Phase 5 Component Runner
#
# Unified script to run all Phase 5 components:
# - MCP Servers
# - ESPN Gap Analyzer
# - Documentation Generators
#
# Usage:
#   ./run-phase5.sh [command] [options]
#
# Commands:
#   test            Run Phase 5 test suite
#   mcp-test        Test all MCP servers
#   gap-analysis    Run ESPN gap analyzer
#   docs            Generate all documentation
#   docs-api        Generate API documentation only
#   docs-changelog  Generate changelog only
#   docs-readme     Generate README only
#   docs-code       Generate code docs only
#   all             Run everything (gap analysis + docs)
#
# @author Blaze Sports Intel
# @version 1.0.0
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
BSI_DIR="/Users/AustinHumphrey/BSI"
CLAUDE_DIR="$BSI_DIR/.claude"
MCP_DIR="$CLAUDE_DIR/mcp-servers"
ESPN_DIR="$CLAUDE_DIR/espn-gap-analyzer"
DOCS_DIR="$CLAUDE_DIR/documentation-generators"
TESTS_DIR="$CLAUDE_DIR/tests"

# Helper functions
print_header() {
  echo -e "${BLUE}=================================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}=================================================================${NC}"
  echo ""
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

# Check if node is installed
check_node() {
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
  fi
}

# Test Phase 5 components
test_phase5() {
  print_header "🧪 Running Phase 5 Test Suite"

  cd "$TESTS_DIR"

  if [ ! -f "phase5-test-suite.js" ]; then
    print_error "Test suite not found: $TESTS_DIR/phase5-test-suite.js"
    exit 1
  fi

  # Make executable
  chmod +x phase5-test-suite.js

  # Run tests
  node phase5-test-suite.js

  if [ $? -eq 0 ]; then
    print_success "All tests passed!"
  else
    print_error "Some tests failed"
    exit 1
  fi
}

# Test MCP servers
test_mcp() {
  print_header "📡 Testing MCP Servers"

  cd "$MCP_DIR"

  servers=("cardinals-analytics" "sportsdataio" "perfect-game" "context7-research")

  for server in "${servers[@]}"; do
    echo ""
    print_info "Testing: $server"

    if [ ! -d "$server" ]; then
      print_error "Server directory not found: $server"
      continue
    fi

    cd "$server"

    # Check package.json
    if [ ! -f "package.json" ]; then
      print_error "$server: package.json not found"
      cd ..
      continue
    fi

    # Check index.js
    if [ ! -f "index.js" ]; then
      print_error "$server: index.js not found"
      cd ..
      continue
    fi

    # Test syntax
    if node -c index.js 2>/dev/null; then
      print_success "$server: Syntax valid"
    else
      print_error "$server: Syntax errors detected"
    fi

    cd ..
  done

  echo ""
  print_success "MCP server testing complete"
}

# Run ESPN gap analyzer
run_gap_analysis() {
  print_header "🔍 Running ESPN Gap Analyzer"

  cd "$ESPN_DIR"

  # Run coverage checker
  print_info "Step 1: Running coverage checker..."
  if [ -f "espn-coverage-checker.js" ]; then
    node espn-coverage-checker.js
    print_success "Coverage check complete"
  else
    print_error "espn-coverage-checker.js not found"
  fi

  echo ""

  # Run gap reporter
  print_info "Step 2: Generating gap report..."
  if [ -f "gap-reporter.js" ]; then
    node gap-reporter.js
    print_success "Gap report generated"
  else
    print_error "gap-reporter.js not found"
  fi

  echo ""

  # Run opportunity identifier
  print_info "Step 3: Identifying opportunities..."
  if [ -f "opportunity-identifier.js" ]; then
    node opportunity-identifier.js
    print_success "Opportunity analysis complete"
  else
    print_error "opportunity-identifier.js not found"
  fi

  echo ""
  print_info "Reports generated in: $ESPN_DIR/reports/"
}

# Generate all documentation
generate_docs_all() {
  print_header "📝 Generating All Documentation"

  cd "$DOCS_DIR"

  # API docs
  print_info "Step 1: Generating API documentation..."
  if [ -f "api-docs-generator.js" ]; then
    node api-docs-generator.js
    print_success "API docs generated"
  else
    print_error "api-docs-generator.js not found"
  fi

  echo ""

  # Changelog
  print_info "Step 2: Generating changelog..."
  if [ -f "changelog-generator.js" ]; then
    node changelog-generator.js
    print_success "Changelog generated"
  else
    print_error "changelog-generator.js not found"
  fi

  echo ""

  # README
  print_info "Step 3: Generating README..."
  if [ -f "readme-generator.js" ]; then
    node readme-generator.js
    print_success "README generated"
  else
    print_error "readme-generator.js not found"
  fi

  echo ""

  # Code docs
  print_info "Step 4: Generating code documentation..."
  if [ -f "code-docs-generator.js" ]; then
    node code-docs-generator.js
    print_success "Code docs generated"
  else
    print_error "code-docs-generator.js not found"
  fi

  echo ""
  print_success "All documentation generated!"
  print_info "Check docs/ directory for outputs"
}

# Generate API documentation only
generate_docs_api() {
  print_header "📝 Generating API Documentation"

  cd "$DOCS_DIR"

  if [ -f "api-docs-generator.js" ]; then
    node api-docs-generator.js
    print_success "API documentation generated"
    print_info "Output: $BSI_DIR/docs/api/"
  else
    print_error "api-docs-generator.js not found"
    exit 1
  fi
}

# Generate changelog only
generate_docs_changelog() {
  print_header "📝 Generating Changelog"

  cd "$DOCS_DIR"

  if [ -f "changelog-generator.js" ]; then
    node changelog-generator.js
    print_success "Changelog generated"
    print_info "Output: $BSI_DIR/CHANGELOG.md"
  else
    print_error "changelog-generator.js not found"
    exit 1
  fi
}

# Generate README only
generate_docs_readme() {
  print_header "📝 Generating README"

  cd "$DOCS_DIR"

  if [ -f "readme-generator.js" ]; then
    node readme-generator.js
    print_success "README generated"
    print_info "Outputs:"
    print_info "  - $BSI_DIR/README.md"
    print_info "  - $BSI_DIR/CONTRIBUTING.md"
    print_info "  - $BSI_DIR/docs/QUICK_START.md"
  else
    print_error "readme-generator.js not found"
    exit 1
  fi
}

# Generate code documentation only
generate_docs_code() {
  print_header "📝 Generating Code Documentation"

  cd "$DOCS_DIR"

  if [ -f "code-docs-generator.js" ]; then
    node code-docs-generator.js
    print_success "Code documentation generated"
    print_info "Output: $BSI_DIR/docs/code/"
  else
    print_error "code-docs-generator.js not found"
    exit 1
  fi
}

# Run everything
run_all() {
  print_header "🚀 Running All Phase 5 Components"

  echo ""
  run_gap_analysis

  echo ""
  generate_docs_all

  echo ""
  print_success "Phase 5 execution complete!"
}

# Show usage
show_usage() {
  cat << EOF
Phase 5 Component Runner

Usage: $0 [command]

Commands:
  test              Run Phase 5 test suite
  mcp-test          Test all MCP servers
  gap-analysis      Run ESPN gap analyzer
  docs              Generate all documentation
  docs-api          Generate API documentation only
  docs-changelog    Generate changelog only
  docs-readme       Generate README only
  docs-code         Generate code docs only
  all               Run everything (gap analysis + docs)
  help              Show this help message

Examples:
  $0 test                    # Run all tests
  $0 gap-analysis            # Analyze ESPN coverage
  $0 docs                    # Generate all docs
  $0 docs-api                # Generate API docs only
  $0 all                     # Run gap analysis + docs

EOF
}

# Main execution
main() {
  # Check prerequisites
  check_node

  # Parse command
  case "${1:-help}" in
    test)
      test_phase5
      ;;
    mcp-test)
      test_mcp
      ;;
    gap-analysis)
      run_gap_analysis
      ;;
    docs)
      generate_docs_all
      ;;
    docs-api)
      generate_docs_api
      ;;
    docs-changelog)
      generate_docs_changelog
      ;;
    docs-readme)
      generate_docs_readme
      ;;
    docs-code)
      generate_docs_code
      ;;
    all)
      run_all
      ;;
    help|--help|-h)
      show_usage
      ;;
    *)
      print_error "Unknown command: $1"
      echo ""
      show_usage
      exit 1
      ;;
  esac
}

# Run main with all arguments
main "$@"
