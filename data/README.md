# Data Directory

## Baseball Rankings Dataset

- **File**: `baseball-rankings.json`
- **Source**: ESPN college baseball rankings endpoint for the D1Baseball.com Top 25 poll (`https://site.web.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings`).
- **Last Updated**: Stored in the `lastUpdated` field of the JSON payload.

### Refresh Workflow

1. Run the Python snippet below from the repository root to download the latest poll data and regenerate the JSON file:

   ```bash
   python3 - <<'PY'
   import urllib.request, json, pathlib

   url = 'https://site.web.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings'
   req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
   with urllib.request.urlopen(req) as resp:
       data = json.load(resp)

   poll = next(p for p in data['rankings'] if p['name'] == 'D1Baseball.com Top 25')
   entries = []
   for item in poll['ranks']:
       team = item['team']
       display = team.get('displayName') or f"{team.get('location', '').strip()} {team.get('name', '').strip()}".strip()
       record = item.get('recordSummary') or team.get('recordSummary')
       entries.append({'rank': item['current'], 'team': display, 'record': record})

   entries.sort(key=lambda x: x['rank'])
   payload = {
       'lastUpdated': poll['date'],
       'source': url,
       'poll': poll['name'],
       'rankings': entries,
   }

   pathlib.Path('data/baseball-rankings.json').write_text(json.dumps(payload, indent=2) + '\n')
   PY
   ```

2. Commit the regenerated `data/baseball-rankings.json` with an updated timestamp.

3. Verify any downstream UI surfaces that consume the rankings reflect the new data.

> **Note:** The ESPN endpoint updates weekly during the season (typically on Mondays). Re-run the script after each poll release to keep the dataset current.
