# Baseball Top 25 Rankings Dataset

- **Source:** [ESPN College Baseball Rankings API](https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings) (D1Baseball.com Top 25 poll).
- **Refresh cadence:** Weekly during the season (ESPN publishes new poll data each Monday). Update the JSON file after each new poll is released or when postseason polls are published.
- **Schema:** Matches Worker expectation: `{ "lastUpdated": string, "rankings": RankingEntry[] }` with each `RankingEntry` providing `rank`, `team`, `record`, `previousRank`, `trend`, and an entry-level `lastUpdated` timestamp.
- **Usage:** Workers fetch `data/baseball-rankings.json` directly without transformation.
