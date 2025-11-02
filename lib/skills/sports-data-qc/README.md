# Sports Data Quality Control (QC) Skill

Production-ready data quality control system for Blaze Sports Intel. Validates scraped sports data from ESPN, NCAA, and other sources before ingestion into Cloudflare D1.

## Features

✅ **MAD-Based Outlier Detection** - Robust statistical outlier detection using Median Absolute Deviation
✅ **Rule-Based Validation** - Range, completeness, consistency, and temporal checks
✅ **Production-Ready** - TypeScript, proper types, comprehensive error handling
✅ **Cloudflare Workers Native** - Built for D1, KV, and R2 integration
✅ **Permissive Philosophy** - Flag suspicious data, don't auto-delete (inspired by scverse)
✅ **Multiple Output Formats** - JSON, Markdown, HTML, Console reports
✅ **Batch Processing** - Handle millions of records efficiently

## Quick Start

### Installation

```bash
# Clone or copy the skill directory
cp -r /mnt/skills/user/sports-data-qc /your/project/lib/

# Install dependencies (if using package manager)
cd /your/project
bun install
```

### Basic Usage

```typescript
import { runQCPipeline } from './sports-data-qc/scripts/qc_analysis';
import { formatReportConsole } from './sports-data-qc/scripts/qc_reporting';

// Run QC on your data
const { report, filtered_data } = await runQCPipeline({
  games: scrapedGames,
  player_stats: scrapedPlayerStats,
  data_source: 'ESPN_API'
});

// Print report
console.log(formatReportConsole(report));

// Ingest only validated data
await db.insert(filtered_data.games);
```

### Run Example

```bash
cd /mnt/skills/user/sports-data-qc
bun run examples/example_usage.ts
```

## Architecture

```
/mnt/skills/user/sports-data-qc/
├── SKILL.md                      # When to use, approach guide, examples
├── README.md                     # This file
├── package.json                  # Package configuration
├── scripts/
│   ├── qc_core.ts               # Core validation functions, MAD detection, types
│   ├── qc_analysis.ts           # CLI wrapper, runs full pipeline
│   └── qc_reporting.ts          # Generate QC reports (JSON, Markdown, HTML)
├── references/
│   └── validation_rules.md      # Detailed validation logic, thresholds, edge cases
└── examples/
    ├── README.md                 # Example documentation
    ├── test_data.json            # Realistic test data
    ├── example_usage.ts          # CLI example
    └── qc_worker_integration.ts  # Cloudflare Worker example
```

## Validation Checks

### 1. Range Validation
- **Batting Average:** 0.000 - 1.000
- **Pitch Velocity:** 40-110 mph
- **Exit Velocity:** 0-120 mph
- **ERA:** 0.00 - 99.99
- **Spin Rate:** 0-4000 rpm

### 2. Completeness Checks
- Required fields present (game_id, timestamp, teams)
- No null values in critical fields
- Proper data types

### 3. Consistency Checks
- Box score totals match play-by-play
- Win probabilities sum to 1.0
- Score distributions are valid

### 4. Temporal Validation
- No future dates (except scheduled games)
- Season aligns with game date
- Valid ISO 8601 timestamps

### 5. Statistical Outliers (MAD-based)
- **ACCEPT:** < 5 MADs from median
- **FLAG:** 5-7 MADs (review recommended)
- **REJECT:** > 7 MADs (likely error)

See [references/validation_rules.md](./references/validation_rules.md) for complete details.

## Configuration

### QCPipelineConfig Options

```typescript
interface QCPipelineConfig {
  mad_threshold?: number;           // Default: 5.0
  auto_reject_failures?: boolean;   // Default: false
  auto_reject_outliers?: boolean;   // Default: false
  include_flagged?: boolean;        // Default: true
  min_confidence_score?: number;    // Default: 0.0
}
```

### Recommended Configurations

**Production Pipeline (Conservative)**
```typescript
{
  mad_threshold: 5.0,
  auto_reject_failures: true,
  auto_reject_outliers: false,
  include_flagged: false,
  min_confidence_score: 0.8
}
```

**Development Testing (Permissive)**
```typescript
{
  mad_threshold: 7.0,
  auto_reject_failures: false,
  auto_reject_outliers: false,
  include_flagged: true,
  min_confidence_score: 0.0
}
```

## Use Cases

### 1. Real-Time Scraping Pipeline

```typescript
// Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const scraped = await scrapeESPN(date);

    const { report, filtered_data } = await runQCPipeline({
      games: scraped.games,
      player_stats: scraped.player_stats,
      data_source: 'ESPN_API'
    }, {
      auto_reject_failures: true,
      min_confidence_score: 0.7
    });

    await env.DB.insert(filtered_data.games);
    await saveReportToKV(report, env.CACHE);

    return Response.json({ qc_report_id: report.report_id });
  }
};
```

### 2. Batch Historical Migration

```typescript
// Process millions of records in batches
const { report } = await runQCPipelineBatch({
  games: historicalGames,
  data_source: 'HISTORICAL_MIGRATION'
}, {
  auto_reject_failures: true,
  auto_reject_outliers: true
}, 1000); // Batch size

console.log(`Processed ${report.total_records} records`);
```

### 3. Scraper Development

```typescript
// Test scraper output quality
const { report } = await runQCPipeline({
  games: scraperOutput,
  data_source: 'SCRAPER_TEST'
});

if (report.records_rejected > 0) {
  console.error('Fix scraper before deploying');
  process.exit(1);
}
```

## Output Formats

### JSON (API Responses)
```typescript
import { formatReportJSON } from './scripts/qc_reporting';
return Response.json(formatReportJSON(report));
```

### Markdown (Documentation)
```typescript
import { formatReportMarkdown } from './scripts/qc_reporting';
writeFileSync('qc_report.md', formatReportMarkdown(report));
```

### HTML (Dashboards)
```typescript
import { formatReportHTML } from './scripts/qc_reporting';
return new Response(formatReportHTML(report), {
  headers: { 'Content-Type': 'text/html' }
});
```

### Console (CLI)
```typescript
import { formatReportConsole } from './scripts/qc_reporting';
console.log(formatReportConsole(report));
```

## MAD-Based Outlier Detection

### Why MAD?

- **Robust:** Not affected by outliers (unlike standard deviation)
- **Reliable:** Works with small sample sizes (common in college sports)
- **Intuitive:** Similar interpretation to standard deviation

### How It Works

1. Calculate median of all values
2. Calculate absolute deviations from median
3. MAD = median of absolute deviations
4. MAD Score = |value - median| / MAD

### Example

```
Pitch velocities: [88, 89, 90, 91, 92, 150]  // 150 is an error

Median: 90.5
MAD: 1.5
MAD Score for 150: |150 - 90.5| / 1.5 = 39.67

39.67 > 7.0 → REJECT (extreme outlier)
```

## Performance

- **Small batches (<100 records):** ~10-50ms
- **Medium batches (100-1000):** ~50-200ms
- **Large batches (>1000):** Use `runQCPipelineBatch` for chunking

## Data Sources Supported

### College Baseball (Priority)
- ESPN API - Box scores, play-by-play
- NCAA Stats - Team records, player stats, conference standings
- SportsDataIO - Comprehensive college baseball data

### MLB
- ESPN API
- SportsDataIO
- Custom pitch tracking systems

### NFL
- ESPN API
- SportsDataIO
- Game simulator outputs

### NOT Supported
- Soccer (per project requirements)

## Philosophy: Permissive by Design

Inspired by the **scverse** philosophy for scientific data:

✅ **Flag suspicious data** - Don't auto-delete
✅ **Preserve legitimate outliers** - Career-high performances happen
✅ **Human review for borderline cases** - Trust but verify
✅ **Maintain data provenance** - Keep source URLs, timestamps

❌ **Don't auto-delete** unless clearly impossible
❌ **Don't be strict** on outliers in college sports (high variance)
❌ **Don't lose data** - Better to flag than delete

## Common Issues

### High Rejection Rate (>10%)

**Causes:**
- Scraper logic errors
- Data source reliability issues
- Thresholds too strict

**Solutions:**
- Review scraper code
- Check validation_rules.md for threshold explanations
- Adjust `mad_threshold` or `min_confidence_score`

### Too Many Flagged Records

**Causes:**
- Normal for college baseball (small samples, high variance)
- Legitimate exceptional performances

**Solutions:**
- Review flagged records manually
- Use more permissive thresholds
- Document known outliers

### Zero Outliers Detected

**Causes:**
- Data is very consistent (good!)
- Or MAD threshold too permissive

**Solutions:**
- Verify data has actual variance
- Lower `mad_threshold` if needed (try 4.0)

## Documentation

- [SKILL.md](./SKILL.md) - When to use, approach guide, examples
- [validation_rules.md](./references/validation_rules.md) - Detailed validation logic
- [examples/README.md](./examples/README.md) - Example usage documentation

## Integration with Blaze Sports Intel

### Cloudflare Workers Setup

1. Copy skill to `/lib/sports-data-qc`
2. Import in your worker:
   ```typescript
   import { runQCPipeline } from '../lib/sports-data-qc/scripts/qc_analysis';
   ```
3. Configure D1 binding in `wrangler.toml`
4. Deploy: `wrangler deploy`

### Existing Scrapers

Integrate QC with existing scrapers in `/lib/adapters/`:

```typescript
// lib/adapters/espn-api.ts
import { runQCPipeline } from '../sports-data-qc/scripts/qc_analysis';

async getGames(params: GamesQueryParams): Promise<ProviderGame[]> {
  const raw = await this.fetchESPN(params);

  // Run QC before returning
  const { filtered_data } = await runQCPipeline({
    games: raw,
    data_source: 'ESPN_API'
  });

  return filtered_data.games || [];
}
```

## Testing

```bash
# Run example with test data
bun run examples/example_usage.ts

# Expected output:
# - 9 records pass
# - 2 records flagged (legitimate outliers)
# - 3 records rejected (validation failures)
```

## License

MIT

## Support

For issues or questions:
1. Check [validation_rules.md](./references/validation_rules.md) for threshold explanations
2. Review [examples/](./examples/) for similar use cases
3. File issue on Blaze Sports Intel GitHub

## Credits

Developed for Blaze Sports Intel following the scverse permissive QC philosophy.
