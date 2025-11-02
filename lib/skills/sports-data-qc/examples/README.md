# Sports Data QC - Examples

This directory contains example implementations and test data for the Sports Data QC skill.

## Files

- **test_data.json** - Sample dataset with clean data, outliers, and validation failures
- **example_usage.ts** - CLI script demonstrating QC pipeline usage
- **qc_worker_integration.ts** - Production Cloudflare Worker integration example

## Running Examples

### Example 1: CLI Usage

Run the example QC pipeline on test data:

```bash
# Using Bun (recommended for Cloudflare Workers development)
bun run examples/example_usage.ts

# Using Node.js
npx tsx examples/example_usage.ts
```

This will:
1. Load test data from `test_data.json`
2. Run QC pipeline with permissive settings
3. Generate reports in JSON, Markdown, and HTML formats
4. Save filtered data to `filtered_data.json`

### Example 2: Cloudflare Worker Deployment

Deploy the QC worker to Cloudflare:

```bash
# 1. Create wrangler.toml for the QC worker
cat > wrangler.toml << EOF
name = "sports-data-qc-worker"
main = "examples/qc_worker_integration.ts"
compatibility_date = "2025-03-01"

[[d1_databases]]
binding = "DB"
database_name = "blaze-sports-intel"
database_id = "YOUR_D1_DATABASE_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "qc-reports"

[vars]
INGEST_SECRET = "your-secret-key-here"
EOF

# 2. Deploy to Cloudflare
wrangler deploy
```

### Example 3: Testing with curl

```bash
# Test the /ingest endpoint
curl -X POST https://sports-data-qc-worker.YOUR_SUBDOMAIN.workers.dev/ingest \
  -H "Authorization: Bearer your-secret-key-here" \
  -H "Content-Type: application/json" \
  -d @test_data.json

# Retrieve a QC report
curl https://sports-data-qc-worker.YOUR_SUBDOMAIN.workers.dev/qc/qc-20250315-abc123
```

## Test Data Overview

### Clean Data (✅ Should Pass)

- **player-001 (Dylan Crews):** Normal college batting stats
- **player-002 (Paul Skenes):** Elite pitcher with high velocity
- **player-007 (Normal Pitcher):** Average pitcher stats

### Outliers (⚠️ Should Flag)

- **player-005 (Tommy White):** Perfect 1.000 batting average (small sample, legitimate)
- **player-003 (Ivan Melendez):** High exit velocity 112.3 mph (elite contact)

### Invalid Data (❌ Should Reject)

- **INVALID-PLAYER-001:** Multiple failures
  - Batting average 3.333 (impossible, >1.0)
  - Pitch velocity 150 mph (physically impossible)
  - Exit velocity 250 mph (measurement error)
  - ERA -5.00 (negative, calculation error)
  - Confidence score 0.05 (very low)

- **INVALID-GAME-001:** Multiple failures
  - Timestamp in 2030 (future date)
  - Negative home score -5
  - Invalid away score 999

- **INVALID-SIM-001:** Probability errors
  - Win probabilities sum to 1.4 (should be 1.0)
  - Score distribution probability 1.5 (should be ≤1.0)
  - Negative simulations count -100

## Expected Output

After running `example_usage.ts`, you should see:

### Console Output
```
==========================================
Sports Data QC - Example Usage
==========================================

📁 Loading test data...
   - Games: 4
   - Player Stats: 8
   - Simulations: 2

🔍 Running QC Pipeline (Permissive Mode)...

================================================================================
  DATA QUALITY CONTROL REPORT
================================================================================
Report ID:    qc-20250315-abc123
Timestamp:    2025-03-15T18:30:00.000Z
Data Source:  TEST_DATA

SUMMARY
--------------------------------------------------------------------------------
Total Records:   14
  ✓ Passed:      9 (64.3%)
  ⚠ Flagged:     2 (14.3%)
  ✗ Rejected:    3 (21.4%)
...
```

### Generated Files

1. **qc_report.json** - Full QC report in JSON format (for APIs)
2. **qc_report.md** - Markdown report (for documentation)
3. **qc_report.html** - HTML report (open in browser for visualization)
4. **filtered_data.json** - Cleaned dataset ready for D1 ingestion

## Integration Patterns

### Pattern 1: Pre-Ingestion Gate
```typescript
const { filtered_data } = await runQCPipeline(scraped_data);
await db.insert(filtered_data); // Only validated data
```

### Pattern 2: Continuous Monitoring
```typescript
// Scheduled worker runs daily
await runQCPipeline(yesterdayData);
// Track QC metrics over time
```

### Pattern 3: Scraper Development
```typescript
// Test scraper output before deploying
const { report } = await runQCPipeline(scraper_output);
if (report.records_rejected > 0) {
  console.error('Fix scraper issues');
  process.exit(1);
}
```

## Troubleshooting

### "Cannot find module" errors

Install dependencies:
```bash
bun install zod
```

### High rejection rate

1. Check `test_data.json` for data quality
2. Adjust `min_confidence_score` threshold
3. Review validation thresholds in `qc_core.ts`

### No outliers detected

This is expected for the test data - only 2 legitimate outliers (player-005 and player-003).

## Next Steps

1. Replace `test_data.json` with your real scraped data
2. Adjust QC thresholds in `qc_core.ts` for your use case
3. Deploy QC worker to Cloudflare
4. Integrate with existing scrapers
5. Monitor QC reports for data quality trends
