#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo " BSI Pre-Deploy Verification"
echo "========================================="

echo ""
echo "[1/4] Type checking..."
npm run typecheck
echo "  -> TypeScript OK"

echo ""
echo "[2/4] Linting..."
npm run lint
echo "  -> ESLint OK"

echo ""
echo "[3/4] Running tests..."
npm run test:all
echo "  -> Tests OK"

echo ""
echo "[4/4] Building static export..."
npm run build
echo "  -> Build OK"

echo ""
echo "========================================="
echo " All checks passed. Safe to deploy."
echo "========================================="
