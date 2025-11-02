#!/bin/bash

# Conflict Resolution Script for BSI Repository
# This script merges main into all diverged feature branches
# Generated: $(date)

set -e

echo "=========================================="
echo "BSI Branch Conflict Resolution Tool"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Array of diverged branches to resolve
BRANCHES=(
    "claude/add-sports-tools-showcase-011CUXFbrvFkrKfhEMzQk4jT"
    "claude/update-legal-pages-011CUPreh3JubX8oFSe6aJbB"
    "claude/verify-sports-data-accuracy-011CUPg3N2RaHk3CjZ5752NZ"
    "claude/analyze-blazesports-value-011CUPo4BspqrUaQJjYGqTf9"
    "claude/update-sports-data-011CUPWvbEfsrJiSFojaCyBy"
    "claude/ai-feedback-system-011CUPVfYQj2YYiqhVrDZfaz"
    "claude/improve-production-quality-011CUPFPtdq7SYsNKy435q8A"
    "claude/longhorns-mcp-builder-011CUP1fZ6eDSeThjFfLiuLX"
)

# Fetch latest from origin
echo -e "${BLUE}Fetching latest changes from origin...${NC}"
git fetch origin

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}Current branch: $CURRENT_BRANCH${NC}"
echo ""

# Statistics
TOTAL_BRANCHES=${#BRANCHES[@]}
RESOLVED=0
CONFLICTS=0
ERRORS=0

# Process each branch
for branch in "${BRANCHES[@]}"; do
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}Processing: $branch${NC}"
    echo -e "${YELLOW}========================================${NC}"

    # Check if branch exists
    if ! git rev-parse --verify "origin/$branch" >/dev/null 2>&1; then
        echo -e "${RED}Branch not found on remote, skipping...${NC}"
        ERRORS=$((ERRORS + 1))
        echo ""
        continue
    fi

    # Checkout the branch
    if ! git checkout "$branch" 2>/dev/null; then
        echo -e "${BLUE}Creating local branch from remote...${NC}"
        git checkout -b "$branch" "origin/$branch"
    fi

    # Check divergence status
    BEHIND=$(git rev-list --count ${branch}..origin/main 2>/dev/null || echo "0")
    AHEAD=$(git rev-list --count origin/main..${branch} 2>/dev/null || echo "0")

    echo -e "${BLUE}Branch status:${NC}"
    echo -e "  Behind main by: $BEHIND commits"
    echo -e "  Ahead of main by: $AHEAD commits"

    if [ "$BEHIND" -eq "0" ]; then
        echo -e "${GREEN}Branch is up to date with main${NC}"
        RESOLVED=$((RESOLVED + 1))
        echo ""
        continue
    fi

    # Attempt merge
    echo -e "${BLUE}Attempting to merge main into branch...${NC}"
    if git merge origin/main --no-edit; then
        echo -e "${GREEN}✓ Merge successful!${NC}"

        # Note: Cannot push due to session ID mismatch
        echo -e "${YELLOW}Note: Branch merged locally but cannot push due to session ID restrictions${NC}"
        echo -e "${YELLOW}The branch needs to be pushed by a session matching its ID${NC}"

        RESOLVED=$((RESOLVED + 1))
    else
        echo -e "${RED}✗ Merge conflicts detected!${NC}"
        echo -e "${YELLOW}Conflicting files:${NC}"
        git diff --name-only --diff-filter=U

        echo -e "${YELLOW}Aborting merge...${NC}"
        git merge --abort

        CONFLICTS=$((CONFLICTS + 1))
    fi

    echo ""
done

# Return to original branch
echo -e "${BLUE}Returning to original branch: $CURRENT_BRANCH${NC}"
git checkout "$CURRENT_BRANCH"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}RESOLUTION SUMMARY${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Total branches processed: $TOTAL_BRANCHES"
echo -e "Successfully resolved: ${GREEN}$RESOLVED${NC}"
echo -e "Conflicts detected: ${RED}$CONFLICTS${NC}"
echo -e "Errors: ${YELLOW}$ERRORS${NC}"
echo ""

if [ $CONFLICTS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warning: Some branches have merge conflicts that require manual resolution${NC}"
    exit 1
elif [ $RESOLVED -eq $TOTAL_BRANCHES ]; then
    echo -e "${GREEN}✓ All branches successfully synchronized with main!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some branches could not be processed${NC}"
    exit 1
fi
