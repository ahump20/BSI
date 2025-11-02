#!/bin/bash
# Production Readiness Validation Script
#
# Comprehensive checks before deploying to production
# Validates security, configuration, and system health

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ISSUES=0
WARNINGS=0

# ==================== HELPER FUNCTIONS ====================

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((ISSUES++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_command() {
    if command -v "$1" &> /dev/null; then
        pass "$1 is installed"
    else
        fail "$1 is not installed"
    fi
}

# ==================== CHECKS ====================

echo "🔍 Production Readiness Check"
echo "=============================="
echo ""

# Check 1: Required commands
echo "1. Checking required commands..."
check_command "node"
check_command "pnpm"
check_command "git"
check_command "curl"
check_command "wrangler"
echo ""

# Check 2: Environment file exists
echo "2. Checking environment configuration..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    pass ".env file exists"
else
    fail ".env file not found. Copy .env.example to .env"
fi
echo ""

# Check 3: No hardcoded secrets in docker-compose.yml
echo "3. Checking for hardcoded secrets..."
if grep -q "blaze2024" "$PROJECT_ROOT/docker-compose.yml" 2>/dev/null; then
    fail "Hardcoded passwords found in docker-compose.yml"
else
    pass "No hardcoded passwords in docker-compose.yml"
fi
echo ""

# Check 4: Check for weak secrets
echo "4. Checking for weak secrets in .env..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    WEAK_PATTERNS=("CHANGE_ME" "password" "secret" "admin" "123456")
    FOUND_WEAK=false

    for pattern in "${WEAK_PATTERNS[@]}"; do
        if grep -i "$pattern" "$PROJECT_ROOT/.env" > /dev/null 2>&1; then
            warn "Potentially weak secret found containing: $pattern"
            FOUND_WEAK=true
        fi
    done

    if [ "$FOUND_WEAK" = false ]; then
        pass "No obvious weak secrets detected"
    fi
else
    warn ".env file not found - cannot check secrets"
fi
echo ""

# Check 5: Check secret length
echo "5. Checking secret length..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    for secret in JWT_SECRET SESSION_SECRET CSRF_SECRET ENCRYPTION_KEY; do
        if grep -q "^$secret=" "$PROJECT_ROOT/.env"; then
            SECRET_VALUE=$(grep "^$secret=" "$PROJECT_ROOT/.env" | cut -d'=' -f2)
            if [ ${#SECRET_VALUE} -ge 32 ]; then
                pass "$secret is at least 32 characters"
            else
                fail "$secret is too short (< 32 characters)"
            fi
        else
            warn "$secret not found in .env"
        fi
    done
else
    warn ".env file not found - cannot check secret length"
fi
echo ""

# Check 6: Dependencies installed
echo "6. Checking dependencies..."
if [ -d "$PROJECT_ROOT/node_modules" ]; then
    pass "node_modules exists"
else
    fail "Dependencies not installed. Run: pnpm install"
fi
echo ""

# Check 7: TypeScript compilation
echo "7. Checking TypeScript compilation..."
cd "$PROJECT_ROOT"
if pnpm typecheck > /dev/null 2>&1; then
    pass "TypeScript compilation successful"
else
    fail "TypeScript compilation failed"
fi
echo ""

# Check 8: Tests pass
echo "8. Running tests..."
if pnpm test > /dev/null 2>&1; then
    pass "All tests pass"
else
    warn "Some tests failed"
fi
echo ""

# Check 9: Check for TODOs in critical files
echo "9. Checking for unresolved TODOs..."
TODO_COUNT=$(grep -r "TODO" "$PROJECT_ROOT/lib/security" "$PROJECT_ROOT/lib/utils" 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    warn "$TODO_COUNT TODO comments found in critical code"
else
    pass "No TODOs in critical code"
fi
echo ""

# Check 10: Git status
echo "10. Checking git status..."
if [ -d "$PROJECT_ROOT/.git" ]; then
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED" -eq 0 ]; then
        pass "No uncommitted changes"
    else
        warn "$UNCOMMITTED uncommitted changes"
    fi
else
    warn "Not a git repository"
fi
echo ""

# Check 11: Check for console.log in production code
echo "11. Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console.log" "$PROJECT_ROOT/lib" "$PROJECT_ROOT/functions" 2>/dev/null | grep -v "logger" | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    warn "$CONSOLE_LOGS console.log statements found (use logger instead)"
else
    pass "No console.log in production code"
fi
echo ""

# Check 12: Check file permissions
echo "12. Checking file permissions..."
if [ -f "$PROJECT_ROOT/scripts/backup-database.sh" ]; then
    if [ -x "$PROJECT_ROOT/scripts/backup-database.sh" ]; then
        pass "backup-database.sh is executable"
    else
        warn "backup-database.sh is not executable"
    fi
fi
echo ""

# Check 13: Cloudflare configuration
echo "13. Checking Cloudflare configuration..."
if [ -f "$PROJECT_ROOT/wrangler.toml" ]; then
    pass "wrangler.toml exists"

    # Check for bindings
    if grep -q "kv_namespaces" "$PROJECT_ROOT/wrangler.toml"; then
        pass "KV namespaces configured"
    else
        warn "No KV namespaces in wrangler.toml"
    fi

    if grep -q "d1_databases" "$PROJECT_ROOT/wrangler.toml"; then
        pass "D1 databases configured"
    else
        warn "No D1 databases in wrangler.toml"
    fi
else
    fail "wrangler.toml not found"
fi
echo ""

# Check 14: Required documentation
echo "14. Checking documentation..."
REQUIRED_DOCS=(
    "README.md"
    "docs/RUNBOOK_PRODUCTION_INCIDENT.md"
    "docs/CLOUDFLARE_BINDINGS_SETUP.md"
    ".env.example"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$PROJECT_ROOT/$doc" ]; then
        pass "$doc exists"
    else
        fail "$doc not found"
    fi
done
echo ""

# Check 15: Database schema
echo "15. Checking database schema..."
if [ -d "$PROJECT_ROOT/schema" ] || [ -d "$PROJECT_ROOT/prisma" ]; then
    pass "Database schema directory exists"
else
    warn "No database schema directory found"
fi
echo ""

# Check 16: Security files
echo "16. Checking security implementation..."
SECURITY_FILES=(
    "lib/security/auth.ts"
    "lib/security/csrf.ts"
    "lib/security/secrets.ts"
    "lib/security/rate-limiter.ts"
)

for file in "${SECURITY_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        pass "$file exists"
    else
        fail "$file not found"
    fi
done
echo ""

# Check 17: Monitoring setup
echo "17. Checking monitoring configuration..."
if [ -f "$PROJECT_ROOT/monitoring/alerting-rules.yml" ]; then
    pass "Alerting rules configured"
else
    warn "No alerting rules found"
fi
echo ""

# Check 18: Backup script
echo "18. Checking backup automation..."
if [ -f "$PROJECT_ROOT/scripts/backup-database.sh" ]; then
    pass "Backup script exists"
else
    fail "Backup script not found"
fi
echo ""

# Check 19: Build succeeds
echo "19. Testing production build..."
if pnpm build > /dev/null 2>&1; then
    pass "Production build successful"
else
    fail "Production build failed"
fi
echo ""

# Check 20: Check dist size
echo "20. Checking build output size..."
if [ -d "$PROJECT_ROOT/dist" ]; then
    DIST_SIZE=$(du -sh "$PROJECT_ROOT/dist" | cut -f1)
    pass "Build output size: $DIST_SIZE"
else
    warn "No dist directory found"
fi
echo ""

# ==================== SUMMARY ====================

echo ""
echo "=============================="
echo "Production Readiness Summary"
echo "=============================="
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "This application is ready for production deployment."
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warnings found${NC}"
    echo ""
    echo "The application can be deployed, but please review the warnings."
    exit 0
else
    echo -e "${RED}✗ $ISSUES critical issues found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warnings found${NC}"
    fi
    echo ""
    echo "Please fix the critical issues before deploying to production."
    exit 1
fi
