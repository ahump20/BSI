#!/bin/bash

# College Baseball Tracker - Deployment Script
# Deploys both frontend (Cloudflare Pages) and backend (Cloudflare Workers)

set -e

echo "🏈 College Baseball Tracker Deployment"
echo "======================================"
echo ""

# Ensure pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "⚙️  pnpm not found. Enabling via corepack..."
    corepack enable pnpm
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    pnpm add -g wrangler
fi

# Check if logged in to Cloudflare
echo "📋 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    wrangler login
fi

# Ensure database configuration is present for Prisma
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set. Export your PostgreSQL connection string before deploying."
    echo "   Example: export DATABASE_URL=postgresql://user:password@host:5432/db"
    exit 1
fi

if [ -n "$DIRECT_URL" ]; then
    echo "🔁 Using connection pool at DIRECT_URL for Prisma migrations"
fi

# Create KV namespace if it doesn't exist
echo ""
echo "📦 Setting up KV namespace for caching..."
KV_ID=$(wrangler kv:namespace list | grep "college-baseball-cache" | grep -oP 'id = "\K[^"]+')

if [ -z "$KV_ID" ]; then
    echo "Creating new KV namespace..."
    wrangler kv:namespace create "college-baseball-cache"
    echo ""
    echo "⚠️  IMPORTANT: Copy the KV namespace ID from above and update worker/wrangler.toml"
    echo "   Replace 'your_kv_namespace_id' with the actual ID"
    echo ""
    read -p "Press enter after updating wrangler.toml..."
fi

# Optional: Create D1 database
read -p "Do you want to create a D1 database for historical stats? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Creating D1 database..."
    wrangler d1 create college-baseball-stats
    echo ""
    echo "⚠️  IMPORTANT: Copy the database ID from above and uncomment the d1_databases section in worker/wrangler.toml"
    echo ""
    read -p "Press enter after updating wrangler.toml..."
fi

# Deploy the Worker (backend)
echo ""
echo "🚀 Deploying Cloudflare Worker (backend API)..."
cd worker
wrangler deploy

# Get the Worker URL
WORKER_URL=$(wrangler deployments list | head -n 2 | tail -n 1 | grep -oP 'https://[^ ]+')
echo "✅ Worker deployed to: $WORKER_URL"
cd ..

# Build the frontend
echo ""
echo "🔨 Installing frontend dependencies..."
pnpm install --frozen-lockfile

echo ""
echo "🧬 Generating Prisma client..."
pnpm prisma generate

echo ""
echo "🔨 Building frontend..."
pnpm run build

# Deploy to Cloudflare Pages
echo ""
echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name=college-baseball-tracker

# Get the Pages URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📱 Your app is now live!"
echo ""
echo "Backend API: $WORKER_URL"
echo "Frontend: Check Cloudflare dashboard for Pages URL"
echo ""
echo "Next steps:"
echo "1. Update your frontend to use the Worker API URL"
echo "2. Integrate real data sources (see worker/scrapers.js)"
echo "3. Test on mobile devices"
echo "4. Set up custom domain (optional)"
echo ""
echo "🏈 Go fix college baseball coverage!"
