#!/bin/bash
set -e

echo "==================================================================="
echo "  Blaze Sports Intel - QC Worker Deployment Script"
echo "==================================================================="
echo ""

# Check if wrangler is authenticated
echo "Checking Wrangler authentication..."
if ! wrangler whoami 2>/dev/null | grep -q "You are logged in"; then
    echo ""
    echo "❌ Not authenticated with Cloudflare."
    echo ""
    echo "Please run: wrangler login"
    echo "Then run this script again."
    echo ""
    exit 1
fi

echo "✅ Authenticated with Cloudflare"
echo ""

# Create R2 bucket if it doesn't exist
echo "Creating R2 bucket for QC reports..."
if wrangler r2 bucket list | grep -q "bsi-qc-reports"; then
    echo "✅ R2 bucket 'bsi-qc-reports' already exists"
else
    wrangler r2 bucket create bsi-qc-reports
    echo "✅ Created R2 bucket 'bsi-qc-reports'"
fi
echo ""

# Set API secret if not already set
echo "Setting up API secret..."
echo ""
echo "Please enter a secure API secret for QC validation:"
echo "(Press Ctrl+C to skip if already set)"
wrangler secret put QC_API_SECRET || echo "Skipped secret setup"
echo ""

# Deploy the worker
echo "Deploying QC Worker to Cloudflare..."
wrangler deploy

echo ""
echo "==================================================================="
echo "  ✅ Deployment Complete!"
echo "==================================================================="
echo ""
echo "Your QC Worker is now live at:"
wrangler deployments list --name bsi-qc-worker | head -5
echo ""
echo "Test the deployment:"
echo "  curl https://bsi-qc-worker.YOURSUBDOMAIN.workers.dev/health"
echo ""
echo "Next steps:"
echo "  1. Test health endpoint"
echo "  2. Set up custom domain (optional)"
echo "  3. Monitor first QC runs in Cloudflare dashboard"
echo ""
