# /bsi-ingest — data ingestion workflow

When working on sports data ingestion:

## Pre-flight checklist
1. Which data source? (ESPN, NCAA, SportsDataIO, etc.)
2. Which sport/league?
3. Live data or historical backfill?
4. Target storage? (D1, KV, R2)

## Ingestion steps
1. **Fetch:** Call external API with proper auth
2. **Validate:** Parse response with Zod schema
3. **Transform:** Map to BSI internal format
4. **Store:** Write to appropriate storage
5. **Log:** Record success/failure with counts

## Error handling
- Rate limits: Back off exponentially
- Timeouts: Retry with jitter
- Bad data: Log and skip, don't fail entire batch
- Auth failures: Alert immediately

## Verification
```bash
# Test ingestion script
node scripts/ingest-{sport}.js --dry-run

# Check data freshness
node scripts/check-data-freshness.js
```

## Common scripts
| Script | Purpose |
|--------|---------|
| `ingest-live-data.js` | Real-time scores |
| `ingest-college-baseball.js` | NCAA baseball |
| `ingest-historical-data.js` | Backfill |
| `batch-ingest-games.js` | Bulk game data |

## Output
- Summary of records fetched/stored
- Any errors or skipped records
- Recommendations for next steps
