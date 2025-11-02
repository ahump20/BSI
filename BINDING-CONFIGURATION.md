# Cloudflare Pages Binding Configuration Guide

## Overview

This document explains how to configure the required bindings for the College Baseball Tracker Pages Functions to work in production.

## Why Bindings Are Required

Cloudflare Pages Functions need bindings configured in the dashboard even if your Functions don't directly use them. The bindings in `wrangler.toml` only work for local development (`wrangler pages dev`).

**Current Issue**: Production Functions timeout (error 522) because bindings aren't configured in the dashboard.

## Required Bindings

Your Functions require these three bindings:

1. **KV Namespace** (for caching)
2. **D1 Database** (for team/schedule data)
3. **Analytics Engine** (for API monitoring)

## Step-by-Step Configuration

### 1. Navigate to Pages Project Settings

Open: [College Baseball Tracker Project Settings](https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/college-baseball-tracker)

### 2. Access Functions Bindings

1. Click on **Settings** tab (left sidebar)
2. Scroll to **Functions** section
3. Click **Add binding** under the Bindings subsection

### 3. Configure KV Namespace Binding

**Type**: KV Namespace

**Configuration**:
- **Variable name**: `KV`
- **KV namespace**: Select the namespace with ID `a53c3726fc3044be82e79d2d1e371d26`
  - If you need to create a new namespace, use: `npx wrangler kv namespace create "CACHE"`

Click **Save**

### 4. Configure D1 Database Binding

**Type**: D1 Database

**Configuration**:
- **Variable name**: `DB`
- **D1 database**: Select `blazesports-historical` (ID: `612f6f42-226d-4345-bb1c-f0367292f55e`)
  - If the database doesn't exist, create it with: `npx wrangler d1 create blazesports-historical`

Click **Save**

### 5. Configure Analytics Engine Binding

**Type**: Analytics Engine

**Configuration**:
- **Variable name**: `ANALYTICS`
- **Dataset**: Use the default or create a new dataset

Click **Save**

### 6. Verify Configuration

After adding all three bindings, you should see them listed in the Bindings section:

```
KV              → [namespace-name] (a53c3726fc3044be82e79d2d1e371d26)
DB              → blazesports-historical (612f6f42-226d-4345-bb1c-f0367292f55e)
ANALYTICS       → [dataset-name]
```

## Environment Variables (Optional)

If needed, you can also add environment variables in the **Environment variables** section:

- `ENVIRONMENT` = `production`
- `LOG_LEVEL` = `info`

These are optional as they have defaults in the code.

## Testing After Configuration

Once bindings are configured, run the automated deployment script:

```bash
chmod +x scripts/deploy-after-bindings.sh
./scripts/deploy-after-bindings.sh
```

This will:
1. Restore the optimization Function
2. Deploy to production
3. Test both the simple and optimization endpoints
4. Provide verification results

## Manual Testing

If you prefer to test manually:

```bash
# Get latest deployment URL
DEPLOYMENT_URL=$(npx wrangler pages deployment list --project-name college-baseball-tracker 2>/dev/null | grep -oE 'https://[a-z0-9]+\.college-baseball-tracker\.pages\.dev' | head -1)

# Test simple endpoint
curl "$DEPLOYMENT_URL/api/test"

# Test optimization endpoint
curl "$DEPLOYMENT_URL/api/scheduling/optimize?teamId=texas&iterations=100"
```

## Troubleshooting

### Still Getting Error 522?

1. **Clear browser cache**: The CDN may be caching the error
2. **Wait 30 seconds**: Binding changes may need time to propagate
3. **Check binding names**: Variable names must match exactly (`KV`, `DB`, `ANALYTICS`)
4. **Verify IDs**: Ensure namespace/database IDs are correct

### Function Returns "Binding not found"?

This means the binding is missing or named incorrectly. Double-check the variable names in the dashboard match the code.

### How to Verify Bindings Are Active?

Check the deployment logs in the dashboard:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check the **Functions** section for any binding errors

## Reference

- **wrangler.toml**: `/Users/AustinHumphrey/BSI/wrangler.toml` (local dev config)
- **Functions directory**: `/Users/AustinHumphrey/BSI/dist/_functions/`
- **Deployment script**: `/Users/AustinHumphrey/BSI/scripts/deploy-after-bindings.sh`

## Support

If you continue experiencing issues after configuration:

1. Check Cloudflare Pages Functions documentation: https://developers.cloudflare.com/pages/functions/bindings/
2. Review deployment logs in the dashboard
3. Verify the bindings exist in your account:
   ```bash
   npx wrangler kv namespace list
   npx wrangler d1 list
   ```
