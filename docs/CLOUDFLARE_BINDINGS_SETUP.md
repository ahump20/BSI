# Cloudflare Bindings Configuration Guide

**Critical**: Production deployment requires manual binding configuration

---

## Overview

Cloudflare Pages Functions require manual binding configuration in the dashboard for:
- KV Namespaces (caching)
- D1 Databases (historical data)
- Analytics Engine (metrics)
- R2 Buckets (file storage)
- Secrets (environment variables)

---

## Required Bindings

### 1. KV Namespace - Cache

**Purpose**: Store API response cache and rate limiting data

**Binding Name**: `CACHE`
**Namespace ID**: `a53c3726fc3044be82e79d2d1e371d26`

#### Steps to Configure:

1. Open Cloudflare Dashboard
2. Navigate to **Workers & Pages** → **college-baseball-tracker**
3. Click **Settings** → **Functions** → **KV namespace bindings**
4. Click **Add binding**
   - **Variable name**: `CACHE`
   - **KV namespace**: Select `bsi-cache` or create new
5. Click **Save**

#### Test Binding:

```bash
# Create a test KV namespace if needed
wrangler kv:namespace create "bsi-cache"

# Test write/read
wrangler kv:key put "test" "value" --namespace-id=a53c3726fc3044be82e79d2d1e371d26
wrangler kv:key get "test" --namespace-id=a53c3726fc3044be82e79d2d1e371d26
```

---

### 2. D1 Database - Historical Data

**Purpose**: Store teams, games, and historical statistics

**Binding Name**: `DB`
**Database Name**: `bsi-historical-db`
**Database ID**: `9cecff0f-a3ab-433f-bf10-d2664d9542b0`

> **Note:** The database was renamed from `blazesports-historical` to `bsi-historical-db` per BSI naming conventions. Ensure you select the correct database in the dashboard.

#### Steps to Configure:

1. Navigate to **Workers & Pages** → **college-baseball-tracker** → **Settings**
2. Click **Functions** → **D1 database bindings**
3. Click **Add binding**
   - **Variable name**: `DB`
   - **D1 database**: Select `bsi-historical-db`
4. Click **Save**

#### Test Binding:

```bash
# List databases
wrangler d1 list

# Execute test query
wrangler d1 execute blazesports-historical --remote --command="SELECT COUNT(*) FROM teams"

# Run migrations
wrangler d1 execute blazesports-historical --remote --file=schema/003_migration_drop_and_recreate.sql
```

---

### 3. Analytics Engine

**Purpose**: Track API usage, performance metrics, and user analytics

**Binding Name**: `ANALYTICS`

#### Steps to Configure:

1. Navigate to **Workers & Pages** → **college-baseball-tracker** → **Settings**
2. Click **Functions** → **Analytics Engine bindings**
3. Click **Add binding**
   - **Variable name**: `ANALYTICS`
   - **Dataset**: `bsi_analytics`
4. Click **Save**

#### Usage Example:

```typescript
// Log analytics event
await env.ANALYTICS.writeDataPoint({
  blobs: [
    request.method,
    request.url,
    userAgent,
  ],
  doubles: [
    responseTime,
    responseSize,
  ],
  indexes: [
    userId,
  ],
});
```

---

### 4. R2 Bucket - File Storage (Optional)

**Purpose**: Store uploaded files, backups, and static assets

**Binding Name**: `STORAGE`

#### Steps to Configure:

1. Create R2 bucket first:
   ```bash
   wrangler r2 bucket create bsi-storage
   ```

2. Navigate to **Workers & Pages** → **college-baseball-tracker** → **Settings**
3. Click **Functions** → **R2 bucket bindings**
4. Click **Add binding**
   - **Variable name**: `STORAGE`
   - **R2 bucket**: Select `bsi-storage`
5. Click **Save**

---

### 5. Secrets Configuration

**Critical Security Step**: Never commit secrets to version control

#### Required Secrets:

```bash
# Database
wrangler secret put POSTGRES_PASSWORD
wrangler secret put DATABASE_URL

# Storage
wrangler secret put MINIO_ROOT_PASSWORD

# Authentication
wrangler secret put JWT_SECRET
wrangler secret put SESSION_SECRET
wrangler secret put CSRF_SECRET
wrangler secret put API_KEY_SALT
wrangler secret put ENCRYPTION_KEY

# Monitoring
wrangler secret put GRAFANA_PASSWORD
wrangler secret put SENTRY_DSN
wrangler secret put DD_API_KEY

# API Keys
wrangler secret put MLB_API_KEY
wrangler secret put NFL_API_KEY
wrangler secret put SPORTSDATAIO_API_KEY
```

#### Generate Strong Secrets:

```bash
# Generate 32-byte base64 secrets
openssl rand -base64 32

# Or use UUID
uuidgen
```

#### List Current Secrets:

```bash
wrangler secret list --name college-baseball-tracker
```

---

## Verification

After configuring all bindings, verify deployment:

### 1. Check Bindings in Dashboard

Navigate to: **Workers & Pages** → **college-baseball-tracker** → **Settings** → **Functions**

Verify all bindings are present:
- [x] KV Namespace: `CACHE`
- [x] D1 Database: `DB`
- [x] Analytics Engine: `ANALYTICS`
- [x] R2 Bucket: `STORAGE` (if using)

### 2. Test Functions

```bash
# Deploy and test
wrangler pages deploy dist --project-name=college-baseball-tracker

# Check logs
wrangler pages deployment tail
```

### 3. Health Check

```bash
# Test API endpoints
curl https://college-baseball-tracker.pages.dev/api/v1/health

# Should return:
# {"status":"ok","timestamp":"2025-11-02T12:00:00Z"}
```

### 4. Test Database Connection

```bash
# Test teams endpoint (uses D1 binding)
curl https://college-baseball-tracker.pages.dev/api/v1/teams

# Should return team data
```

### 5. Test Cache

```bash
# Make request twice - second should be faster (cached)
time curl https://college-baseball-tracker.pages.dev/api/v1/teams/138

# Check response headers for cache status
curl -I https://college-baseball-tracker.pages.dev/api/v1/teams/138
# Look for: X-Cache-Status: HIT
```

---

## Troubleshooting

### Error: "CACHE is not defined"

**Cause**: KV namespace binding not configured

**Fix**:
1. Add KV binding in Cloudflare dashboard
2. Redeploy: `wrangler pages deploy dist`

### Error: "DB is not defined"

**Cause**: D1 database binding not configured

**Fix**:
1. Add D1 binding in Cloudflare dashboard
2. Ensure database exists: `wrangler d1 list`
3. Redeploy

### Error: HTTP 522 (Connection Timed Out)

**Cause**: Function timeout due to missing bindings or slow queries

**Fix**:
1. Check all bindings are configured
2. Review function logs: `wrangler pages deployment tail`
3. Optimize slow database queries
4. Add indexes to frequently queried columns

### Error: "Secret not found"

**Cause**: Required secret not configured

**Fix**:
```bash
# Set the missing secret
wrangler secret put SECRET_NAME --name college-baseball-tracker
```

---

## Production Deployment Checklist

Before deploying to production, verify:

- [ ] All KV namespace bindings configured
- [ ] D1 database binding configured
- [ ] Analytics Engine binding configured (optional)
- [ ] R2 bucket binding configured (if needed)
- [ ] All secrets configured (no defaults/weak passwords)
- [ ] Database migrations run successfully
- [ ] Test data seeded (if needed)
- [ ] Health check endpoint responding
- [ ] Cache working (check X-Cache-Status headers)
- [ ] Logs showing no binding errors
- [ ] Performance acceptable (< 500ms response time)

---

## Automated Verification Script

Run this script to verify bindings:

```bash
#!/bin/bash
# verify-bindings.sh

echo "🔍 Verifying Cloudflare bindings..."

# Test health check
echo "Testing health endpoint..."
curl -f https://college-baseball-tracker.pages.dev/api/v1/health || echo "❌ Health check failed"

# Test database
echo "Testing database connection..."
curl -f https://college-baseball-tracker.pages.dev/api/v1/teams | jq '.data[0]' || echo "❌ Database connection failed"

# Test cache
echo "Testing cache..."
curl -I https://college-baseball-tracker.pages.dev/api/v1/teams | grep "X-Cache-Status" || echo "⚠️  Cache headers not found"

echo "✅ Verification complete"
```

---

## Additional Resources

- [Cloudflare Workers Bindings Documentation](https://developers.cloudflare.com/workers/configuration/bindings/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [Analytics Engine Documentation](https://developers.cloudflare.com/analytics/analytics-engine/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)

---

**Last Updated**: 2026-01-07
**Next Review**: After any binding changes

---

## Appendix: Resource ID Quick Reference

| Resource Type | Name | ID |
|---------------|------|-----|
| KV | CACHE | `a53c3726fc3044be82e79d2d1e371d26` |
| KV | PREDICTION_CACHE | `eebf04d329c0419e92eec884f39a636d` |
| KV | SPORTS_CACHE | `c912d983175e4a1480225cfd57ed3434` |
| KV | CFB_CACHE | `963541b67da84e36919914e914a1bb31` |
| D1 | bsi-historical-db | `9cecff0f-a3ab-433f-bf10-d2664d9542b0` |
| D1 | bsi-game-db | `88eb676f-af0f-470c-a46a-b9429f5b51f3` |
| R2 | blazesports-assets | N/A (use bucket name) |
| R2 | blaze-sports-data-lake | N/A (use bucket name) |

> See `docs/infrastructure/CLOUDFLARE-INFRASTRUCTURE-AUDIT-2025-01-07.md` for complete resource inventory.
