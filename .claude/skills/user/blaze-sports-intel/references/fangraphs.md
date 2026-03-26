# FanGraphs Leaderboard Data Ingestion

This document describes the workflow for ingesting FanGraphs leaderboard data into Blaze Sports Intel infrastructure.

## Overview

FanGraphs provides advanced baseball metrics via leaderboard CSV exports. Store raw CSVs in R2 for audit trails, then normalize with citation metadata before further processing.

## Ingestion Workflow

### 1. Export CSV from FanGraphs

Navigate to desired leaderboard (batting, pitching, etc.) and use the CSV export option.

Available leaderboards:
- Batting: Standard, Advanced, Batted Ball, Plate Discipline
- Pitching: Standard, Advanced, Pitch Type, Batted Ball
- Fielding: Standard, Advanced

### 2. Upload to R2

Store raw CSV in R2 with path convention:

```
fangraphs/leaderboards/{type}/{YYYY-MM-DD}_{leaderboard_name}.csv
```

Example:
```
fangraphs/leaderboards/batting/2025-03-15_standard.csv
```

### 3. Normalize with Citations

When processing the CSV, append citation metadata to each row:

```python
import pandas as pd
from datetime import datetime, timezone, timedelta

# Load raw CSV
df = pd.read_csv('/path/to/leaderboard.csv')

# Add citation columns
cst = timezone(timedelta(hours=-6))  # America/Chicago (CST)
fetch_date = datetime.now(cst).date().isoformat()

df['source'] = 'FanGraphs'
df['timestamp'] = fetch_date
df['timezone'] = 'America/Chicago'

# Type conversions and cleaning
# ... perform necessary transformations ...

# Write to R2 as Parquet or insert into D1
```

### 4. Record Import Metadata

Track imports in D1 for audit purposes:

```sql
INSERT INTO fangraphs_imports (
  leaderboard_type, season, r2_path, row_count, imported_at
) VALUES (
  'batting_standard', 2025, 'fangraphs/leaderboards/batting/2025-03-15_standard.csv', 
  150, datetime('now','localtime')
);
```

## Citation Requirements

Every statistic derived from FanGraphs must maintain citation metadata:

```typescript
{
  value: 0.325,  // e.g., batting average
  source: 'FanGraphs',
  timestamp: '2025-03-15',
  timezone: 'America/Chicago',
  note: 'Standard batting leaderboard'
}
```

## Column Mapping Reference

### Standard Batting Leaderboard

Common columns to expect:
- `Name`, `Team`, `G` (games), `PA` (plate appearances)
- `HR` (home runs), `R` (runs), `RBI` (runs batted in)
- `SB` (stolen bases), `BB%` (walk rate), `K%` (strikeout rate)
- `ISO` (isolated power), `BABIP`, `wOBA`, `wRC+`
- `BsR` (baserunning runs), `Off` (offensive runs), `Def` (defensive runs)
- `WAR` (wins above replacement)

### Standard Pitching Leaderboard

Common columns to expect:
- `Name`, `Team`, `W`, `L`, `ERA`, `G`, `GS`
- `IP` (innings pitched), `K/9`, `BB/9`, `HR/9`
- `BABIP`, `LOB%`, `GB%`, `HR/FB`
- `FIP`, `xFIP`, `SIERA`, `WAR`

## Data Quality Considerations

1. **Player Name Normalization:** FanGraphs may use different name formats than MLB StatsAPI
2. **Team Abbreviations:** Standardize team codes for cross-referencing
3. **Minimum PA/IP Thresholds:** FanGraphs applies filters; document these in metadata
4. **Missing Values:** Handle null/empty cells appropriately (use `None` or `NaN`)

## Licensing and Terms

Respect FanGraphs' terms of service when downloading and redistributing data. If licensing restrictions change:

1. Update this documentation
2. Adjust ingestion workflows accordingly
3. Document the change in import metadata

## Example Worker Snippet

```typescript
// Fetch latest batting leaderboard from R2, apply citations
export default {
  async fetch(req: Request, env: { BLAZE_R2: R2Bucket }) {
    const obj = await env.BLAZE_R2.get('fangraphs/leaderboards/batting/latest.csv');
    if (!obj) return new Response('Not found', { status: 404 });
    
    const csv = await obj.text();
    // Parse CSV, add citation metadata, return JSON
    const ts = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    
    return new Response(JSON.stringify({
      meta: { source: 'FanGraphs', fetched_at: ts, timezone: 'America/Chicago' },
      data: parsedData
    }), {
      headers: { 'content-type': 'application/json' }
    });
  }
};
```

## Automation Considerations

For production workflows, consider:

1. **Scheduled imports:** Daily/weekly Worker cron jobs to fetch new leaderboards
2. **Version control:** Keep previous versions in R2 for historical analysis
3. **Change detection:** Compare new imports against previous data to detect updates
4. **Notification:** Alert when new data becomes available
