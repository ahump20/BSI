#!/bin/bash
set -e

echo "🔥 Setting up BSI Development Environment..."

# Git configuration
echo "📝 Configuring Git..."
git config --global user.name "Austin Humphrey"
git config --global user.email "Austin@BlazeSportsIntel.com"
git config --global init.defaultBranch main
git config --global pull.rebase false

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install Wrangler globally
echo "⚡ Installing Wrangler CLI..."
npm install -g wrangler

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps chromium

# Make scripts executable
echo "🔐 Setting script permissions..."
chmod +x .devcontainer/postCreate.sh

# Verify installation
echo "✅ Verifying environment..."
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Wrangler version: $(wrangler --version)"
echo "Git version: $(git --version)"

# Run type check to ensure everything compiles
echo "🔍 Running type check..."
npm run typecheck || echo "⚠️  Type check failed - may need environment variables"

echo ""
echo "✨ BSI Development Environment Ready!"
echo ""
echo "Next steps:"
echo "  1. Set up Cloudflare credentials: wrangler login"
echo "  2. Configure secrets in GitHub Codespaces settings"
echo "  3. Start dev server: npm run dev"
echo "  4. Start worker dev: npm run dev:worker"
echo "  5. Both together: npm run dev:hybrid"
echo ""
