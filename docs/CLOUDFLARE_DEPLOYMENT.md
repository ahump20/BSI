# Cloudflare Pages Deployment Guide

## Overview

This guide covers deploying the Texas Longhorns platform to Cloudflare Pages with native Next.js support, KV caching, and Images integration.

## Prerequisites

1. **Cloudflare Account** with Pages enabled
2. **GitHub Repository** connected to Cloudflare Pages
3. **Wrangler CLI** installed: `pnpm install -g wrangler`
4. **Cloudflare Authentication** configured

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

Cloudflare Pages automatically deploys when you push to the main branch.

#### Setup Steps:

1. **Connect Repository to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Workers & Pages → Create Application → Pages
   - Connect to GitHub repository: `ahump20/BSI`
   - Configure build settings:
     - Framework preset: **Next.js**
     - Build command: `pnpm install && pnpm build`
     - Build output directory: `apps/web/.next`
     - Root directory: `/`

2. **Configure Environment Variables:**
   Add these in Cloudflare Pages → Settings → Environment Variables:
   ```
   NODE_VERSION=22
   NEXT_TELEMETRY_DISABLED=1
   NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH=your_account_hash
   ```

3. **Merge Pull Request:**
   Once the PR is merged to main, Cloudflare Pages will automatically build and deploy.

### Method 2: Manual Deploy with Wrangler

For manual deployments or testing:

#### 1. Authenticate with Cloudflare

```bash
pnpm wrangler login
```

This opens a browser for OAuth authentication.

#### 2. Build the Application

```bash
# From repository root
pnpm --filter @bsi/web build
```

#### 3. Deploy to Cloudflare Pages

```bash
# Create or update Pages project
pnpm wrangler pages deploy apps/web/.next --project-name=blazesportsintel

# For production deployment
pnpm wrangler pages deploy apps/web/.next --project-name=blazesportsintel --branch=main
```

## Cloudflare KV Setup

### Automated Setup (Recommended)

Run the setup script from the repository root:

```bash
chmod +x scripts/setup-cloudflare-kv.sh
./scripts/setup-cloudflare-kv.sh
```

This script will:
- Create production and preview KV namespaces
- Update wrangler.toml with namespace IDs
- Seed all Texas Longhorns MCP data
- Create cache entries for all 4 sports

### Manual Setup

If you prefer manual setup:

```bash
# 1. Create KV namespaces
pnpm wrangler kv:namespace create "LONGHORNS_CACHE"
pnpm wrangler kv:namespace create "LONGHORNS_CACHE" --preview

# 2. Note the namespace IDs from output
# Example output: { binding = "LONGHORNS_CACHE", id = "abc123..." }

# 3. Update apps/api-worker/wrangler.toml:
[[kv_namespaces]]
binding = "LONGHORNS_CACHE"
id = "YOUR_PRODUCTION_ID"
preview_id = "YOUR_PREVIEW_ID"

# 4. Bind KV namespace to Pages project
pnpm wrangler pages deployment create --project-name=blazesportsintel \
  --kv LONGHORNS_CACHE:YOUR_NAMESPACE_ID

# 5. Seed MCP data
pnpm wrangler kv:key put --namespace-id=YOUR_NAMESPACE_ID \
  "longhorns:mcp:baseball" \
  "$(cat mcp/texas-longhorns/feeds/baseball.json)"

pnpm wrangler kv:key put --namespace-id=YOUR_NAMESPACE_ID \
  "longhorns:mcp:football" \
  "$(cat mcp/texas-longhorns/feeds/football.json)"

pnpm wrangler kv:key put --namespace-id=YOUR_NAMESPACE_ID \
  "longhorns:mcp:basketball" \
  "$(cat mcp/texas-longhorns/feeds/basketball.json)"

pnpm wrangler kv:key put --namespace-id=YOUR_NAMESPACE_ID \
  "longhorns:mcp:track-field" \
  "$(cat mcp/texas-longhorns/feeds/track-field.json)"
```

## Cloudflare Images Setup

### Enable Cloudflare Images

1. Go to Cloudflare Dashboard → Images
2. Enable Cloudflare Images for your account
3. Note your account hash (found in Images settings)

### Configure Environment Variables

Add to Cloudflare Pages environment variables:

```bash
NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH=your_account_hash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token_with_images_permissions
```

### Upload Images via API

```bash
# Using Wrangler
pnpm wrangler images upload path/to/image.jpg --name=longhorns-logo

# Using curl
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1" \
  -H "Authorization: Bearer {api_token}" \
  -F file=@/path/to/image.jpg \
  -F id=longhorns-logo
```

## Verification

After deployment, verify:

### 1. Texas Longhorns Page
```bash
curl https://blazesportsintel.com/texas-longhorns
```

### 2. MCP API Endpoints
```bash
# Get all sports data
curl https://blazesportsintel.com/api/longhorns

# Get specific sport
curl https://blazesportsintel.com/api/longhorns?sport=baseball

# Search MCP data
curl -X POST https://blazesportsintel.com/api/longhorns \
  -H "Content-Type: application/json" \
  -d '{"sport":"football","query":"championship"}'
```

### 3. NCAA Live Data API
```bash
curl "https://blazesportsintel.com/api/ncaa/baseball?team=texas"
```

### 4. Check KV Cache Headers
```bash
curl -I https://blazesportsintel.com/api/longhorns
# Look for: X-KV-Cached: true (after first request)
```

## Monitoring

### View Deployment Logs
```bash
pnpm wrangler pages deployment list --project-name=blazesportsintel
pnpm wrangler pages deployment tail
```

### Check KV Usage
```bash
# List all keys
pnpm wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Get specific key
pnpm wrangler kv:key get --namespace-id=YOUR_NAMESPACE_ID "longhorns:mcp:baseball"

# Delete key (if needed)
pnpm wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "key-name"
```

### Analytics
- View in Cloudflare Dashboard → Pages → blazesportsintel → Analytics
- Monitor: Requests, Bandwidth, Errors, Response Times

## Troubleshooting

### Build Fails
```bash
# Check build locally first
pnpm --filter @bsi/web build

# If successful locally, check Cloudflare build logs
pnpm wrangler pages deployment list --project-name=blazesportsintel
```

### KV Not Working
```bash
# Verify namespace binding
pnpm wrangler pages project list

# Check if keys exist
pnpm wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Re-seed data if needed
./scripts/setup-cloudflare-kv.sh
```

### Images Not Loading
```bash
# Verify account hash in environment
echo $NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH

# Test image URL directly
curl https://imagedelivery.net/{account_hash}/{image_id}/public
```

## Performance Optimization

### Cache Configuration

Current cache settings:
- **Static MCP Data**: 1 hour TTL (3600s)
- **Live NCAA Data**: 5 minute TTL (300s)
- **Edge Caching**: Enabled globally

### Cost Optimization

1. **KV Reads**: ~100,000/day free tier
2. **KV Writes**: ~1,000/day free tier
3. **Pages Requests**: 100,000/day free tier
4. **Images Transformations**: 100,000/month free tier

To stay within free tier:
- Keep cache TTLs reasonable (current settings are optimized)
- Use srcSet for responsive images (reduces transformations)
- Monitor usage in Cloudflare Dashboard

## Support

For issues:
1. Check [Cloudflare Docs](https://developers.cloudflare.com/pages/)
2. Review [Next.js on Pages Guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
3. See full setup documentation in `docs/CLOUDFLARE_SETUP.md`

## Next Steps

After successful deployment:
1. Configure custom domain (blazesportsintel.com/texas-longhorns)
2. Set up preview deployments for branch testing
3. Enable Web Analytics in Cloudflare Dashboard
4. Configure Rate Limiting if needed
5. Set up monitoring alerts for errors/downtime
