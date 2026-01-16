# Deployment Guide

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GitHub Repo    │────▶│  GitHub Actions │────▶│  Cloudflare     │
│                 │     │  CI/CD          │     │  Pages + R2     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Cloudflare     │
                                               │  Workers + D1   │
                                               └─────────────────┘
```

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Local | Development | localhost:8000 |
| Staging | Testing | staging-game.blazesportsintel.com |
| Production | Live | game.blazesportsintel.com |

## Cloudflare Resources

### Pages Projects
- `backyard-baseball` - Production
- `backyard-baseball-staging` - Staging

### Workers
- `backyard-baseball-api` - Telemetry endpoint

### D1 Databases
- `bsi-game-telemetry` - Production telemetry
- `bsi-game-telemetry-staging` - Staging telemetry

### R2 Buckets
- `bsi-game-assets` - Asset CDN storage

## Initial Setup

### 1. Create Cloudflare Resources

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
cd infra/cloudflare
npx wrangler d1 create bsi-game-telemetry

# Update wrangler.toml with database ID from output

# Run migrations
npx wrangler d1 migrations apply bsi-game-telemetry --remote
```

### 2. Create Pages Projects

```bash
# Create staging project
npx wrangler pages project create backyard-baseball-staging

# Create production project
npx wrangler pages project create backyard-baseball
```

### 3. Configure Secrets

In GitHub repository settings → Secrets:

```
UNITY_LICENSE    = <base64-encoded .ulf file>
UNITY_EMAIL      = <unity account email>
UNITY_PASSWORD   = <unity account password>
CF_API_TOKEN     = <cloudflare api token with Pages/Workers/D1 permissions>
CF_ACCOUNT_ID    = a12cb329d84130460eed99b816e4d0d3
```

### 4. Configure DNS

In Cloudflare DNS for blazesportsintel.com:

```
CNAME  game          backyard-baseball.pages.dev
CNAME  staging-game  backyard-baseball-staging.pages.dev
```

## Deployment Procedures

### Automatic (CI/CD)

Push to `main` branch triggers:
1. Unity WebGL build
2. Staging deployment
3. Production deployment (after staging succeeds)

### Manual Staging

```bash
# Build locally
make build-unity

# Deploy
make deploy-staging
```

### Manual Production

```bash
# Build locally
make build-unity

# Deploy (requires confirmation)
make deploy-prod
```

### Worker Only

```bash
make deploy-worker
```

## Rollback

### Pages Rollback

```bash
# List deployments
npx wrangler pages deployment list --project-name=backyard-baseball

# Rollback
npx wrangler pages deployment rollback \
  --project-name=backyard-baseball \
  --deployment-id=<DEPLOYMENT_ID>
```

### Worker Rollback

Revert commit in git and push to main. CI/CD will deploy previous version.

## Verification Checklist

After deployment:

- [ ] Site loads without errors
- [ ] Game initializes within 10 seconds
- [ ] Controls respond (click/tap)
- [ ] Telemetry events appear in D1
- [ ] No console errors
- [ ] Performance acceptable (60 FPS target)

### Quick Health Check

```bash
# Check worker health
curl https://game.blazesportsintel.com/api/health

# Check recent telemetry
cd infra/cloudflare
npx wrangler d1 execute bsi-game-telemetry --remote \
  --command "SELECT COUNT(*) as events FROM events WHERE created_at > datetime('now', '-1 hour')"
```

## Monitoring

### Logs

```bash
# Live worker logs
npx wrangler tail backyard-baseball-api
```

### Analytics Queries

```sql
-- Sessions today
SELECT COUNT(DISTINCT session_id) FROM events
WHERE DATE(created_at) = DATE('now');

-- Average session duration
SELECT AVG(duration_seconds) FROM session_summary
WHERE DATE(session_start) = DATE('now');

-- Home run rate
SELECT
  COUNT(CASE WHEN event_type = 'home_run' THEN 1 END) * 100.0 /
  COUNT(CASE WHEN event_type = 'swing' THEN 1 END) as hr_rate
FROM events WHERE DATE(created_at) = DATE('now');
```

## Emergency Procedures

### Site Down

1. Check Cloudflare status: status.cloudflare.com
2. Check Pages deployment status in dashboard
3. Rollback to last known good deployment
4. Check worker logs for errors

### High Error Rate

1. Check browser console errors
2. Query error events in D1
3. Check worker logs
4. Deploy fix or rollback

### Performance Degradation

1. Check Cloudflare Analytics for traffic spike
2. Verify R2/CDN is serving assets
3. Check for large assets not compressed
4. Review recent changes
