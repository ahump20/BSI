# Observability Checklist

> **Date:** January 7, 2026
> **Status:** Audit Complete

---

## Current Stack

| Component | Purpose | Status |
|-----------|---------|--------|
| **Cloudflare Logs** | Worker request/error logs | ✅ Enabled (all workers) |
| **Sentry** | Error tracking & performance | ⚠️ Secrets needed |
| **Datadog** | RUM, browser logs, runtime signals | ⚠️ Secrets needed |
| **Applitools** | Visual regression testing | ⚠️ Secrets needed |
| **Structured Logger** | JSON logs with correlation IDs | ✅ Implemented |
| **Drift Monitoring** | Data drift detection | ✅ Configured |
| **Slack Alerts** | Workflow failure notifications | ⚠️ Webhook needed |

---

## Required Secrets

### GitHub Actions Secrets (for CI/CD)

| Secret | Required For | Status |
|--------|--------------|--------|
| `CLOUDFLARE_API_TOKEN` | All deployments | Verify |
| `CLOUDFLARE_ACCOUNT_ID` | All deployments | Verify |
| `CLOUDFLARE_ZONE_ID` | Cache purge | Verify |
| `SENTRY_DSN` | Error tracking | Configure |
| `SENTRY_AUTH_TOKEN` | Release uploads | Configure |
| `SENTRY_ORG` | Release association | Configure |
| `SENTRY_PROJECT` | Release association | Configure |
| `SLACK_WEBHOOK_URL` | Failure alerts | Configure |
| `APPLITOOLS_API_KEY` | Visual regression | Configure |
| `SOCKET_API_KEY` | Dependency security | Configure |

### Cloudflare Worker Secrets

| Secret | Workers Using It | Purpose |
|--------|-----------------|---------|
| `SENTRY_DSN` | All workers | Error capture |
| `DD_API_KEY` | All workers | Datadog logs |
| `SPORTSDATAIO_API_KEY` | Prediction, Ingest | Sports data |
| `COLLEGEFOOTBALLDATA_API_KEY` | CFB-AI | College football data |
| `SESSION_SECRET` | bsi-home | Session signing |

### Environment Variables

```bash
# Sentry Configuration
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Datadog Configuration
DATADOG_API_KEY=xxx
DD_API_KEY=xxx
DATADOG_SITE=datadoghq.com
DATADOG_ENV=production
DATADOG_SERVICE=blaze-sports-intel
NEXT_PUBLIC_DATADOG_APPLICATION_ID=xxx
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=xxx
NEXT_PUBLIC_DATADOG_SITE=datadoghq.com
NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE=100
NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE=20

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Applitools
APPLITOOLS_API_KEY=xxx
```

---

## What's Already Working

### 1. Cloudflare Worker Logs
All critical workers have `[observability.logs] enabled = true`:
- bsi-home
- bsi-prediction-api
- bsi-cfb-ai
- bsi-news-ticker
- blazesports-ingest

### 2. Structured Logger (`lib/utils/logger.ts`)
- JSON-formatted logs
- Log levels (debug, info, warn, error, fatal)
- Correlation IDs for request tracing
- Context enrichment
- Performance metrics
- Auto-integration with Sentry/Datadog when env vars present

### 3. Drift Monitoring (`observability/drift/`)
- Configured in `drift-config.yaml`
- Monitors data freshness
- Slack alerts on drift detection

### 4. GitHub Actions Alerts
- `data-freshness.yml` → Slack on stale data
- `api-tests.yml` → Slack on test failures

### 5. Production Runbook
Complete incident response documentation at:
`docs/RUNBOOK_PRODUCTION_INCIDENT.md`

---

## Setup Instructions

### 1. Configure Sentry

```bash
# In project root
npm install @sentry/cloudflare

# Set worker secrets
wrangler secret put SENTRY_DSN --name bsi-prediction-api
wrangler secret put SENTRY_DSN --name bsi-home
wrangler secret put SENTRY_DSN --name bsi-news-ticker
# ... repeat for each worker
```

### 2. Configure Datadog

```bash
# Set worker secrets
wrangler secret put DD_API_KEY --name bsi-prediction-api
wrangler secret put DD_API_KEY --name bsi-home
# ... repeat for each worker
```

### 3. Configure Slack Webhook

1. Create Slack App at https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Add webhook to #bsi-alerts channel
4. Add to GitHub Secrets: `SLACK_WEBHOOK_URL`

### 4. Configure GitHub Action Secrets

```bash
# Via GitHub CLI
gh secret set SENTRY_DSN --body "https://xxx@xxx.ingest.sentry.io/xxx"
gh secret set SENTRY_AUTH_TOKEN --body "sntrys_xxx"
gh secret set SENTRY_ORG --body "blaze-sports-intel"
gh secret set SENTRY_PROJECT --body "bsi-web"
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/xxx"
```

---

## Verification Steps

### Test Sentry Integration

```bash
# Deploy a worker with intentional error
curl https://api.blazesportsintel.com/v1/test-error

# Check Sentry dashboard for captured error
```

### Test Datadog Integration

```bash
# Generate traffic
curl https://blazesportsintel.com/

# Check Datadog RUM dashboard for captured session
```

### Test Slack Alerts

```bash
# Trigger a GitHub workflow manually
gh workflow run data-freshness.yml

# Force a failure to test alert delivery
```

---

## Monitoring Dashboards

| Platform | URL | Purpose |
|----------|-----|---------|
| Cloudflare Analytics | dash.cloudflare.com | Traffic, cache, errors |
| Sentry | sentry.io/bsi | Errors, performance |
| Datadog | app.datadoghq.com | RUM, logs, traces |
| GitHub Actions | github.com/ahump20/BSI/actions | CI/CD status |

---

## Alert Thresholds (Recommended)

| Metric | Warning | Critical |
|--------|---------|----------|
| Error rate | > 1% | > 5% |
| P95 response time | > 1s | > 3s |
| Cache hit ratio | < 80% | < 60% |
| Data staleness | > 1 hour | > 4 hours |
| Worker CPU time | > 30ms avg | > 50ms avg |

---

*Generated during Infrastructure Audit - January 7, 2026*
