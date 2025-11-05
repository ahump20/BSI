# Baseball Top 25 Rankings Data Pipeline

The Worker bundles `data/baseball-rankings.json` at build time and serves it from `/baseball/rankings`. Use this workflow to refresh the dataset with the latest D1Baseball Top 25 standings.

## Update cadence
- **Source:** ESPN's College Baseball rankings endpoint (D1Baseball.com Top 25)
- **URL:** `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings`
- **Recommended frequency:** Weekly on Monday after new poll is published (or immediately when an update is released).

## Refresh steps
1. Pull the latest data and overwrite the JSON file:
   ```bash
   cd /workspace/BSI
   curl -s "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings" \
     | jq '{
         lastUpdated: (.rankings[0].ranks | map(.lastUpdated) | max),
         rankings: (
           .rankings[0].ranks
           | map({
               rank: .current,
               team: (.team.location + " " + .team.name),
               record: (.recordSummary // "")
             })
         )
       }' > data/baseball-rankings.json
   ```
2. Validate the JSON format before committing:
   ```bash
   jq empty data/baseball-rankings.json
   ```
3. Run the worker type check to ensure the bundle picks up the new payload:
   ```bash
   pnpm run build:functions
   ```
4. Commit the changes and deploy through the normal Cloudflare Pages + Worker pipeline.

## Runtime behavior
- The Worker exposes the dataset at `GET /baseball/rankings` with a 30-minute edge cache (`Cache-Control: public, max-age=1800, stale-while-revalidate=900`).
- Because the JSON is statically imported, updates require a new deploy. Publish after every refresh so the Worker serves the current poll.

## Troubleshooting
- If the ESPN endpoint schema changes, inspect the raw payload with:
  ```bash
  curl -s "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings" | jq '.' | less
  ```
- Adjust the jq transformation accordingly and rerun the steps above.

