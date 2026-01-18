# Sports Data QC - Production Deployment Guide

This document provides instructions for deploying the Sports Data QC system to production on Cloudflare Workers.

## Overview

The QC system consists of:

1. **QC Skill Library** - Core validation logic (`lib/skills/sports-data-qc/`)
2. **Ingest Worker** - Integrated QC into data ingestion pipeline (`workers/ingest/`)
3. **QC Worker** - Standalone QC API service (`workers/qc/`)

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed: `npm install -g wrangler`
- Authenticated with Wrangler: `wrangler login`
- KV namespace created for QC reports
- R2 bucket created for report archival

## Step 1: Create Required Resources

### Create KV Namespace for QC Reports

```bash
# Production KV namespace
wrangler kv:namespace create "CACHE"
# Note the ID returned, e.g., "abc123..."

# Preview KV namespace
wrangler kv:namespace create "CACHE" --preview
# Note the preview ID
```

### Create R2 Bucket for Report Archival

```bash
# Create production bucket
wrangler r2 bucket create bsi-qc-reports

# Create preview bucket
wrangler r2 bucket create bsi-qc-reports-preview
```

## Step 2: Configure Environment Variables

### Update wrangler.toml

Edit `workers/qc/wrangler.toml` and replace placeholder IDs:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # Replace with actual ID from Step 1
preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID"  # Replace with preview ID
```

### Set Secrets

```bash
cd workers/qc

# Set QC API secret (generate a strong random key)
wrangler secret put QC_API_SECRET
# Enter your secret key when prompted

# Optional: Set secrets for staging environment
wrangler secret put QC_API_SECRET --env staging
```

## Step 3: Deploy QC Worker

### Deploy to Staging (Test First)

```bash
cd workers/qc

# Deploy to staging environment
wrangler deploy --env staging

# Test staging endpoint
curl https://qc-staging.blazesportsintel.com/health
```

### Deploy to Production

```bash
cd workers/qc

# Deploy to production
wrangler deploy --env production

# Verify deployment
curl https://qc.blazesportsintel.com/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "sports-data-qc",
  "timestamp": "2025-03-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

## Step 4: Deploy Updated Ingest Worker

The ingest worker now includes QC validation. Deploy the updated version:

```bash
cd workers/ingest

# Deploy with updated QC integration
wrangler deploy
```

## Step 5: Verify Integration

### Test QC Validation API

```bash
# Set your API secret
export QC_API_SECRET="your-secret-key"

# Test validation endpoint with sample data
curl -X POST https://qc.blazesportsintel.com/qc/validate \
  -H "Authorization: Bearer $QC_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "games": [
      {
        "game_id": "test-001",
        "timestamp": "2025-03-15T14:00:00-05:00",
        "season": 2025,
        "home_team": "Texas",
        "away_team": "Oklahoma",
        "home_score": 5,
        "away_score": 3,
        "status": "FINAL",
        "metadata": {
          "source_url": "https://test.com",
          "scrape_timestamp": "2025-03-15T18:00:00-05:00",
          "confidence_score": 0.95,
          "provider_name": "NCAA_API"
        }
      }
    ],
    "data_source": "TEST_API"
  }'
```

Expected response:

```json
{
  "success": true,
  "report_id": "qc-20250315-abc123",
  "summary": {
    "total_records": 1,
    "records_passed": 1,
    "records_flagged": 0,
    "records_rejected": 0,
    "failure_rate": "0.0000"
  },
  "report_url": "/qc/report/qc-20250315-abc123",
  "duration_ms": 25
}
```

### Retrieve QC Report

```bash
# Get report in JSON format
curl https://qc.blazesportsintel.com/qc/report/qc-20250315-abc123

# Get report in HTML format (for browser viewing)
curl https://qc.blazesportsintel.com/qc/report/qc-20250315-abc123?format=html

# Get report in Markdown format
curl https://qc.blazesportsintel.com/qc/report/qc-20250315-abc123?format=markdown
```

### List Recent Reports

```bash
# List last 50 reports
curl https://qc.blazesportsintel.com/qc/reports

# List last 100 reports
curl https://qc.blazesportsintel.com/qc/reports?limit=100
```

## Step 6: Monitor QC Metrics

### Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select `bsi-qc-worker`
3. View Analytics Engine data for QC metrics:
   - `qc_validate` - Validation requests by data source
   - `qc_metrics` - Pass/fail/flag counts
   - `qc_rejection` - High failure rate incidents

### Analytics Queries

```sql
-- Query Analytics Engine for QC metrics
SELECT
  blob1 as event_type,
  blob2 as data_source,
  double1 as total_records,
  double2 as records_passed,
  double3 as records_flagged,
  double4 as records_rejected,
  timestamp
FROM ANALYTICS_ENGINE_DATASET
WHERE blob1 = 'qc_metrics'
ORDER BY timestamp DESC
LIMIT 100
```

## Step 7: Scheduled Jobs

The QC worker includes a scheduled job that runs daily at 3am UTC:

```toml
[triggers]
crons = ["0 3 * * *"]  # Daily batch QC
```

### Verify Cron Trigger

```bash
# Check cron triggers in Cloudflare dashboard
wrangler triggers

# Test scheduled function manually
wrangler triggers cron "0 3 * * *"
```

## API Endpoints Reference

### Public Endpoints (CORS Enabled)

- `GET /health` - Health check (no auth required)
- `GET /qc/reports` - List recent reports (no auth required)
- `GET /qc/report/:id` - Get specific report (no auth required)

### Protected Endpoints (Require Authorization)

- `POST /qc/validate` - Validate sports data (requires Bearer token)

### Authentication

All protected endpoints require Bearer token authentication:

```bash
Authorization: Bearer YOUR_QC_API_SECRET
```

## Integration with Existing Scrapers

The ingest worker (`workers/ingest/index.ts`) now automatically validates all scraped data before D1 ingestion:

### What Changed

1. **Automatic QC** - All games fetched from providers are validated
2. **Failure Threshold** - Batches with >20% failure rate are rejected
3. **QC Reports** - Saved to KV with 24hr TTL
4. **Analytics Tracking** - QC metrics logged to Analytics Engine

### Configuration

QC settings in `ingestLiveGames()`:

```typescript
{
  mad_threshold: 5.0,
  auto_reject_failures: true,
  auto_reject_outliers: false,
  include_flagged: true,
  min_confidence_score: 0.7
}
```

### Monitoring Ingest QC

Check logs for QC output:

```bash
# Tail ingest worker logs
wrangler tail --name bsi-ingest-worker

# Look for lines containing:
# [Ingest] Running QC validation on scraped data...
# [Ingest] QC passed: X/Y games validated
# [Ingest] QC Report ID: qc-...
```

## Troubleshooting

### High QC Failure Rate

If you see errors like:

```
[Ingest] QC failure rate too high: 25.0%
```

**Actions:**

1. Retrieve QC report: `curl https://qc.blazesportsintel.com/qc/report/REPORT_ID`
2. Check `recommendations` array for specific issues
3. Review validation failures by type
4. Fix scraper logic or adjust thresholds

### Missing Reports

If reports are not found in KV:

1. Check R2 bucket: `wrangler r2 object get bsi-qc-reports/qc-reports/REPORT_ID.json`
2. Verify KV namespace ID in wrangler.toml
3. Check TTL settings (default 7 days for QC reports)

### Deployment Failures

```bash
# Check for syntax errors
cd workers/qc
npx tsc --noEmit index.ts

# Check worker logs
wrangler tail

# Rollback to previous version
wrangler rollback
```

## Performance Tuning

### QC Pipeline Performance

Current benchmarks:

- Small batches (<100 records): ~10-50ms
- Medium batches (100-1000): ~50-200ms
- Large batches (>1000): Use batch processing

### Optimization Options

1. **Adjust MAD threshold** - Higher = fewer outliers flagged
2. **Disable outlier detection** - Set `auto_reject_outliers: false`
3. **Lower confidence threshold** - Accept more data
4. **Batch processing** - Use `runQCPipelineBatch` for >1000 records

## Security

### API Secret Rotation

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update in Cloudflare
wrangler secret put QC_API_SECRET
# Enter new secret when prompted

# Update in application configuration
# Update any scrapers or services using the API
```

### Access Control

- QC reports are publicly readable (no sensitive data)
- Validation API requires authentication
- Rate limiting: 100 req/min per IP (Cloudflare automatic)

## Costs

### Cloudflare Workers Pricing

- **Workers Requests**: $0.50 per million requests (beyond free tier)
- **KV Reads**: $0.50 per million reads
- **KV Writes**: $5.00 per million writes
- **R2 Storage**: $0.015 per GB/month
- **R2 Operations**: $4.50 per million Class A ops

### Estimated Monthly Costs

Assuming 1 million validation requests/month:

- Workers: ~$0.50
- KV: ~$1.00
- R2: ~$0.10
- **Total: ~$1.60/month**

## Rollback Plan

If issues arise in production:

```bash
# List recent deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback --message "Rollback due to QC issues"

# Or deploy previous version manually
git checkout <previous-commit>
wrangler deploy
```

## Support

For issues or questions:

1. Check logs: `wrangler tail`
2. Review QC reports for validation details
3. Check Analytics Engine for trends
4. File issue on GitHub with QC report ID

## Next Steps

1. ✅ Deploy QC worker to production
2. ✅ Deploy updated ingest worker
3. ✅ Monitor QC metrics in Analytics Engine
4. 🔄 Integrate with additional scrapers (ESPN, NCAA)
5. 🔄 Set up alerting for high failure rates
6. 🔄 Create QC dashboard for visualization

## Documentation Links

- [QC Skill Documentation](./lib/skills/sports-data-qc/SKILL.md)
- [Validation Rules Reference](./lib/skills/sports-data-qc/references/validation_rules.md)
- [Example Usage](./lib/skills/sports-data-qc/examples/README.md)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
