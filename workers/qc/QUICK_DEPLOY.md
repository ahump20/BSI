# Quick Deployment Guide - QC Worker

## Prerequisites
- Cloudflare account
- Wrangler CLI installed (already done ✅)
- ~2 minutes

## One-Command Deployment

```bash
cd /home/user/BSI/workers/qc
./deploy.sh
```

This script will:
1. Check authentication
2. Create R2 bucket for QC reports
3. Set API secret (you'll be prompted)
4. Deploy the worker to Cloudflare

## Manual Step-by-Step

If the automated script doesn't work, follow these steps:

### 1. Authenticate with Cloudflare
```bash
wrangler login
```

This will open a browser for authentication.

### 2. Create R2 Bucket
```bash
wrangler r2 bucket create bsi-qc-reports
```

### 3. Set API Secret
```bash
# Generate a secure random secret
export QC_SECRET=$(openssl rand -base64 32)
echo $QC_SECRET  # Save this!

# Set in Cloudflare
echo $QC_SECRET | wrangler secret put QC_API_SECRET
```

### 4. Deploy Worker
```bash
wrangler deploy
```

### 5. Verify Deployment
```bash
# Get your worker URL
wrangler deployments list

# Test health endpoint
curl https://bsi-qc-worker.[YOUR-SUBDOMAIN].workers.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "sports-data-qc",
  "timestamp": "2025-10-31T...",
  "version": "1.0.0"
}
```

## Test the API

### Validate Sample Data
```bash
curl -X POST https://bsi-qc-worker.[YOUR-SUBDOMAIN].workers.dev/qc/validate \
  -H "Authorization: Bearer YOUR_QC_SECRET" \
  -H "Content-Type: application/json" \
  -d @../../lib/skills/sports-data-qc/examples/test_data.json
```

### View QC Report
```bash
# Get report ID from validation response
REPORT_ID="qc-20251031-abc123"

# View JSON
curl https://bsi-qc-worker.[YOUR-SUBDOMAIN].workers.dev/qc/report/$REPORT_ID

# View HTML (open in browser)
curl https://bsi-qc-worker.[YOUR-SUBDOMAIN].workers.dev/qc/report/$REPORT_ID?format=html > report.html
open report.html
```

### List Recent Reports
```bash
curl https://bsi-qc-worker.[YOUR-SUBDOMAIN].workers.dev/qc/reports
```

## Troubleshooting

### Authentication Issues
```bash
# Check authentication
wrangler whoami

# Re-authenticate
wrangler logout
wrangler login
```

### R2 Bucket Issues
```bash
# List buckets
wrangler r2 bucket list

# If bucket exists with different name, update wrangler.toml
```

### Deployment Failures
```bash
# Check logs
wrangler tail

# Validate TypeScript
npx tsc --noEmit index.ts

# Check wrangler.toml syntax
wrangler deploy --dry-run
```

## What Gets Deployed

- **Worker Name:** bsi-qc-worker
- **URL:** https://bsi-qc-worker.[YOUR-SUBDOMAIN].workers.dev
- **KV Namespace:** Using existing (a53c3726fc3044be82e79d2d1e371d26)
- **R2 Bucket:** bsi-qc-reports (new)
- **Analytics:** Enabled
- **Scheduled Job:** Daily at 3am UTC

## Post-Deployment

1. **Save your worker URL**
   ```bash
   echo "QC_WORKER_URL=https://bsi-qc-worker.[YOUR-SUBDOMAIN].workers.dev" >> .env
   ```

2. **Save your API secret**
   ```bash
   echo "QC_API_SECRET=YOUR_SECRET" >> .env.local
   ```

3. **Test with real data**
   - Wait for next ingest worker run (every 5 minutes)
   - Check KV for QC reports
   - Review Analytics Engine metrics

4. **Monitor performance**
   - Cloudflare Dashboard → Workers & Pages → bsi-qc-worker
   - Check Analytics Engine for QC metrics
   - Review R2 bucket for archived reports

## Integration with Ingest Worker

The ingest worker is already configured to use QC validation. Once deployed, it will:

1. Validate all scraped data automatically
2. Store QC reports in KV (24hr TTL)
3. Track metrics in Analytics Engine
4. Reject batches with >20% failure rate

No additional configuration needed - it's already integrated!

## Estimated Time

- Authentication: 1 minute
- R2 bucket creation: 30 seconds
- Secret setup: 30 seconds
- Deployment: 1 minute
- **Total: ~3 minutes**

## Support

If you encounter issues:

1. Check deployment logs: `wrangler tail`
2. Review wrangler.toml configuration
3. Verify R2 bucket exists: `wrangler r2 bucket list`
4. Check Analytics Engine for errors
5. See full deployment guide: `../../DEPLOYMENT.md`

---

**Ready?** Run `./deploy.sh` to get started!
