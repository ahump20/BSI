Check BSI infrastructure health. Run all checks, then report a single status summary.

## Checks to run

1. **Site health**
   - `curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/` — expect 200
   - `curl -s https://blazesportsintel.com/api/health` — parse and report

2. **Live scores**
   - `curl -s "https://blazesportsintel.com/api/scores/cached"` — check if response contains game data
   - If scores exist, report how many games and whether timestamps look fresh (within last 30 minutes)
   - If empty or error, report "scores stale" or "scores down"

3. **Error tracker**
   - `curl -s https://blazesportsintel.com/api/bugs` — parse for active bug count
   - Report: X active bugs

4. **Key pages** (spot-check 200 status)
   - `curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/college-baseball/`
   - `curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/mlb/`
   - `curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/scores/`

## Report format

```
BSI Status — [timestamp]
Site:    UP / DOWN (HTTP status)
Scores:  FRESH / STALE / DOWN (game count, last update)
Bugs:    X active
Pages:   college-baseball ✓/✗ | mlb ✓/✗ | scores ✓/✗
```

If anything is DOWN or STALE, flag it clearly. If everything is healthy, say so and move on.
