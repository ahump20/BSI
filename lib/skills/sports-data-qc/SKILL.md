# Sports Data Quality Control Skill

## Overview

The Sports Data QC skill validates scraped sports data from ESPN, NCAA, and other sources before ingestion into Cloudflare D1. It combines statistical outlier detection (MAD-based) with rule-based validation to ensure data quality while being permissive enough to capture legitimate exceptional performances.

**Primary Use Cases:**
- Validating college baseball box scores and player statistics
- Checking MLB pitch tracking data quality
- Verifying NFL game simulator outputs
- Pre-ingestion QC for any sports data pipeline

**Tech Stack:**
- TypeScript/JavaScript (Cloudflare Workers compatible)
- D1 database for persistence
- KV storage for QC reports
- No external dependencies

## When to Use This Skill

### ✅ Use this skill when:

1. **Scraping new data sources** - Validate data quality before first ingestion
2. **Production data pipelines** - Run QC checks before writing to D1
3. **Debugging data issues** - Identify problematic scrapers or API endpoints
4. **Data quality monitoring** - Track metrics over time
5. **Post-scrape validation** - Check batch data imports

### ❌ Don't use this skill when:

1. **Real-time game updates** - Too slow for live data (sub-second latency required)
2. **Historical data already in D1** - Use SQL queries instead
3. **Simple null checks** - Use basic validation, this is overkill
4. **Non-sports data** - Thresholds are sports-specific

## Approach 1: Inline QC (Recommended for Production)

**When to use:** Real-time scraping pipelines, data ingestion workers

**How it works:**
1. Scraper fetches data
2. QC validation runs inline
3. Only validated data reaches D1
4. QC report stored in KV for monitoring

**Advantages:**
- Prevents bad data from entering database
- Fast (adds ~50ms per batch)
- Automatic filtering

**Example:**

```typescript
import { runQCPipeline } from '/mnt/skills/user/sports-data-qc/scripts/qc_analysis';
import { saveReportToKV, formatReportConsole } from '/mnt/skills/user/sports-data-qc/scripts/qc_reporting';

// In your Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Scrape data from ESPN
    const scrapedData = await scrapeESPNBoxScores(date);

    // 2. Run QC pipeline
    const { report, filtered_data } = await runQCPipeline({
      games: scrapedData.games,
      player_stats: scrapedData.player_stats,
      data_source: 'ESPN_API'
    }, {
      auto_reject_failures: true,  // Auto-reject invalid data
      auto_reject_outliers: false, // Flag outliers but don't reject (could be legit)
      mad_threshold: 5.0,          // Standard permissive threshold
      min_confidence_score: 0.7    // Only accept high-confidence scrapes
    });

    // 3. Save QC report to KV
    await saveReportToKV(report, env.CACHE);

    // 4. Log summary
    console.log(formatReportConsole(report));

    // 5. Insert validated data into D1
    await insertGamesIntoD1(filtered_data.games, env.DATABASE_URL);
    await insertPlayerStatsIntoD1(filtered_data.player_stats, env.DATABASE_URL);

    // 6. Return success response
    return new Response(JSON.stringify({
      success: true,
      qc_report_id: report.report_id,
      records_ingested: report.records_passed + report.records_flagged,
      records_rejected: report.records_rejected
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## Approach 2: Batch QC Analysis (For Large Datasets)

**When to use:** Historical data imports, weekly batch processing, quality audits

**How it works:**
1. Data already scraped/staged
2. Run QC in large batches (1000+ records)
3. Generate comprehensive reports
4. Human review before ingestion

**Advantages:**
- Handles millions of records
- Comprehensive metrics
- Better for one-time migrations

**Example:**

```typescript
import { runQCPipelineBatch } from '/mnt/skills/user/sports-data-qc/scripts/qc_analysis';
import { formatReportMarkdown } from '/mnt/skills/user/sports-data-qc/scripts/qc_reporting';

// Scheduled Worker (runs daily at 3am)
export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // 1. Load yesterday's scraped data
    const yesterdayData = await loadStagedData(env.DATABASE_URL);

    // 2. Run batch QC (processes 1000 records at a time)
    const { report, filtered_data } = await runQCPipelineBatch({
      games: yesterdayData.games,
      player_stats: yesterdayData.player_stats,
      simulations: yesterdayData.simulations,
      data_source: 'DAILY_BATCH'
    }, {
      auto_reject_failures: true,
      auto_reject_outliers: false,
      include_flagged: true // Include flagged records with warnings
    }, 1000); // Batch size

    // 3. Generate detailed markdown report
    const markdownReport = formatReportMarkdown(report);

    // 4. Save report to R2 for long-term storage
    await env.R2_BUCKET.put(
      `qc-reports/${report.report_id}.md`,
      markdownReport
    );

    // 5. If too many failures, alert and don't ingest
    const failureRate = report.records_rejected / report.total_records;
    if (failureRate > 0.1) {
      await sendAlert(env, `QC failure rate ${(failureRate * 100).toFixed(1)}% exceeds threshold`);
      return; // Don't ingest
    }

    // 6. Ingest validated data
    await bulkInsertData(filtered_data, env.DATABASE_URL);

    console.log(`QC batch complete. Report: ${report.report_id}`);
  }
};
```

## Approach 3: CLI Analysis (Development/Debugging)

**When to use:** Testing scrapers, investigating data issues, one-off analysis

**How it works:**
1. Load sample data from file or API
2. Run QC analysis
3. View report in terminal
4. Iterate on scraper fixes

**Example:**

```typescript
// qc_cli.ts - Run locally with Node.js or Bun
import { runQCPipeline } from './scripts/qc_analysis';
import { formatReportConsole, formatReportMarkdown } from './scripts/qc_reporting';
import { readFileSync, writeFileSync } from 'fs';

async function main() {
  // Load test data
  const rawData = JSON.parse(readFileSync('test_data.json', 'utf-8'));

  // Run QC
  const { report, filtered_data } = await runQCPipeline({
    games: rawData.games,
    player_stats: rawData.player_stats,
    data_source: 'TEST_FILE'
  }, {
    mad_threshold: 5.0,
    auto_reject_failures: false, // See all failures for debugging
    auto_reject_outliers: false
  });

  // Print to console
  console.log(formatReportConsole(report));

  // Save detailed markdown report
  writeFileSync('qc_report.md', formatReportMarkdown(report));

  // Save filtered data
  writeFileSync('filtered_data.json', JSON.stringify(filtered_data, null, 2));

  console.log(`\nFiltered data saved to filtered_data.json`);
  console.log(`Full report saved to qc_report.md`);

  // Exit with error code if too many failures
  if (report.records_rejected > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
```

## Configuration Options

### QCPipelineConfig

```typescript
interface QCPipelineConfig {
  // MAD outlier detection threshold
  mad_threshold?: number; // Default: 5.0 (permissive), 7.0 (strict)

  // Auto-reject validation failures
  auto_reject_failures?: boolean; // Default: false

  // Auto-reject extreme outliers (>7 MADs)
  auto_reject_outliers?: boolean; // Default: false

  // Include flagged records in filtered output
  include_flagged?: boolean; // Default: true

  // Minimum confidence score (0-1) from scraper
  min_confidence_score?: number; // Default: 0.0
}
```

### Recommended Configurations

#### Production Pipeline (Conservative)
```typescript
{
  mad_threshold: 5.0,
  auto_reject_failures: true,
  auto_reject_outliers: false, // Flag only, human review
  include_flagged: false,      // Only accept clean data
  min_confidence_score: 0.8    // High confidence only
}
```

#### Development Testing (Permissive)
```typescript
{
  mad_threshold: 7.0,
  auto_reject_failures: false, // See all issues
  auto_reject_outliers: false,
  include_flagged: true,
  min_confidence_score: 0.0
}
```

#### Historical Migration (Strict)
```typescript
{
  mad_threshold: 5.0,
  auto_reject_failures: true,
  auto_reject_outliers: true,  // Reject extreme outliers
  include_flagged: false,
  min_confidence_score: 0.9
}
```

## Validation Checks Performed

### 1. Range Validation
- **Batting Average:** 0.000 - 1.000
- **Pitch Velocity:** 40-110 mph
- **Exit Velocity:** 0-120 mph
- **ERA:** 0.00 - 99.99
- **Spin Rate:** 0-4000 rpm

### 2. Completeness Checks
- Required fields present (game_id, timestamp, teams, etc.)
- No null values in critical fields
- Proper data types

### 3. Consistency Checks
- Box score totals match play-by-play
- Win probabilities sum to 1.0
- Score distributions are valid

### 4. Temporal Validation
- No future dates (except scheduled games)
- Season year aligns with game date
- Timestamps in valid ISO 8601 format

### 5. Statistical Outliers (MAD-based)
- Detects values >5 MADs from median
- Flags extreme outliers (>7 MADs)
- Permissive for legitimate exceptional performances

See [validation_rules.md](./references/validation_rules.md) for detailed explanations.

## Integration Patterns

### Pattern 1: Pre-Ingestion Gate

```typescript
// Only validated data reaches D1
const { filtered_data } = await runQCPipeline(scraped_data);
await db.insert(filtered_data);
```

### Pattern 2: Post-Ingestion Audit

```typescript
// Data ingested, QC report used for monitoring
await db.insert(scraped_data);
const { report } = await runQCPipeline(scraped_data);
await monitoringService.trackQCMetrics(report);
```

### Pattern 3: Hybrid (Recommended)

```typescript
// Basic validation inline, detailed QC async
const basicChecks = validateRequired(data);
if (!basicChecks.passed) return error;

await db.insert(data);

// Run full QC in background
ctx.waitUntil(runDetailedQC(data));
```

## Output Formats

### JSON (API Responses)
```typescript
import { formatReportJSON } from './scripts/qc_reporting';
const json = formatReportJSON(report);
```

### Markdown (Documentation)
```typescript
import { formatReportMarkdown } from './scripts/qc_reporting';
const markdown = formatReportMarkdown(report);
```

### HTML (Dashboards)
```typescript
import { formatReportHTML } from './scripts/qc_reporting';
const html = formatReportHTML(report);
```

### Console (CLI)
```typescript
import { formatReportConsole } from './scripts/qc_reporting';
console.log(formatReportConsole(report));
```

## Performance Characteristics

- **Small batches (<100 records):** ~10-50ms
- **Medium batches (100-1000 records):** ~50-200ms
- **Large batches (>1000 records):** Use `runQCPipelineBatch` for chunking

## Philosophy: Permissive by Design

This QC system follows the **scverse philosophy** - be permissive and flag suspicious data rather than auto-deleting:

✅ **Flag outliers** - Don't reject automatically
✅ **College baseball is wild** - Small sample sizes, weird stats
✅ **Human review for borderline cases** - Trust but verify
✅ **Preserve data provenance** - Keep source URLs and timestamps

❌ **Don't auto-delete** unless clearly impossible (negative scores, future dates)
❌ **Don't be strict** on outliers - could be career-high performances
❌ **Don't lose data** - Better to flag than delete

## Troubleshooting

### High rejection rate (>10%)
- Check scraper logic
- Review data source reliability
- Adjust `mad_threshold` if too strict
- Check `min_confidence_score` setting

### Too many flagged records
- Normal for college baseball (high variance)
- Review flagged records manually
- Consider more permissive thresholds

### Zero outliers detected
- Good! Your data is consistent
- Or... MAD threshold too permissive
- Check if you're getting actual variance in metrics

## Examples

See the [examples/](./examples/) directory for:
- `college_baseball_qc.ts` - Complete college baseball pipeline
- `pitch_tracking_qc.ts` - Pitch-by-pitch data validation
- `simulation_qc.ts` - Monte Carlo output validation
- `batch_migration.ts` - Historical data migration

## Further Reading

- [validation_rules.md](./references/validation_rules.md) - Detailed validation logic
- [mad_detection.md](./references/mad_detection.md) - MAD algorithm explained
- [integration_guide.md](./references/integration_guide.md) - Cloudflare Workers setup

## Support

For issues or questions:
1. Check validation_rules.md for threshold explanations
2. Review examples/ for similar use cases
3. File issue on Blaze Sports Intel GitHub
