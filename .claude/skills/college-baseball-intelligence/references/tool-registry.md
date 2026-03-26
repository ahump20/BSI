# Tool Registry — College Baseball Intelligence

All BSI college baseball data routes through the College Baseball Sabermetrics
MCP server at sabermetrics.blazesportsintel.com/mcp.

## MCP Tool Reference

### get_college_baseball_scoreboard
Purpose: Today's scores, live games, final results across all D1 programs.
Inputs: date (YYYY-MM-DD, optional), conference (optional)
Outputs: Array of game objects — home/away teams, scores, innings/status, venue
Cache TTL: 60 seconds
Fallback: ESPN scoreboard

### get_college_baseball_standings
Purpose: Conference standings with W/L, win%, run differential, streak.
Inputs: conference (optional — omit for all conferences)
Outputs: Array grouped by conference; each team has wins, losses, winPct, runsScored, runsAllowed, runDiff, streak, gamesBack
Cache TTL: 1 hour
Fallback: ESPN standings (less enriched)

### get_college_baseball_rankings
Purpose: National Top 25 poll.
Inputs: None
Outputs: rank, team, record, previousRank, trend, points, firstPlaceVotes
Cache TTL: 1 hour
Known issue: "Preseason" label may appear during regular season — ESPN artifact. Data is current.

### get_team_sabermetrics
Purpose: Advanced metrics for any D1 team — wOBA, wRC+, FIP, ERA-, BABIP, ISO.
Inputs: team (lowercase kebab-slug, e.g. "vanderbilt", "dallas-baptist")
Outputs: batting (team-level), pitching (team-level), all_hitters (individual array)
Cache TTL: 6 hours
Known issue: Pitching arrays may return empty during sync gap. State: "pitching data pending this cycle."

### get_sabermetrics_leaderboard
Purpose: Ranked leader lists by advanced metric across all D1 programs.
Inputs: metric (woba, wrc_plus, ops_plus, fip, era_minus, babip, iso), type (batting/pitching), limit (max 50), conference (optional)
Outputs: Ranked array of players with name, team, value
Cache TTL: 6 hours

### get_conference_power_index
Purpose: Conference-level ranking by win% and run differential.
Inputs: None
Outputs: Array of conferences — avgWinPct, totalWins, totalLosses, avgRunDiff, teamCount
Cache TTL: 6 hours

### get_player_stats
Purpose: Individual player search.
Inputs: player (name string), team (optional but recommended)
Outputs: Player stat object or not-found message
Note: Always provide team parameter to avoid false matches.

### get_team_schedule
Purpose: Full season schedule — past results and upcoming games.
Inputs: team (slug)
Outputs: Array of games — date, opponent, home/away, result, venue
Cache TTL: 1 hour

### get_match_detail
Purpose: Deep game data — venue, weather, win predictions, play-by-play.
Inputs: matchId (Highlightly ID from scoreboard results)
Outputs: Full match object — score, innings, plays (capped at 50), predictions, weather
Cache TTL: 2 minutes

## Data Source Hierarchy

1. Highlightly Pro (primary — 330 D1 teams, live, via RapidAPI)
2. BSI Savant proxy (blazesportsintel.com — sabermetrics engine)
3. ESPN (fallback — standings, rankings, schedules)

meta.source identifies the serving layer. meta.fetched_at provides the ISO timestamp.

## Secondary Sources (chained as needed)

| Source | Tool | Use Case |
|--------|------|----------|
| Web intelligence | WebSearch + WebFetch | News, recruiting, portal, coaching changes |
| Cloudflare infra | Cloudflare MCP | BSI Workers, D1, KV, R2 for data pipeline work |
| GitHub | Zapier MCP | BSI repo issues, PRs, project management |

## Common Team Slugs

SEC: texas, lsu, tennessee, florida, vanderbilt, arkansas, ole-miss, texas-am, auburn, alabama, mississippi-state, georgia, south-carolina, kentucky, missouri, oklahoma
ACC: florida-state, clemson, nc-state, virginia, wake-forest, louisville, duke, north-carolina, miami-fl, georgia-tech, notre-dame, stanford, cal, smu
Big 12: tcu, texas-tech, oklahoma-state, west-virginia, kansas-state, baylor, byu, ucf, arizona, arizona-state
Big Ten: michigan, indiana, ohio-state, maryland, nebraska, iowa, oregon, washington, usc, ucla
Non-Power: dallas-baptist, coastal-carolina, east-carolina, southern-miss, louisiana, liberty, oral-roberts, campbell

## Failure Protocol

1. State what failed: [tool name] returned [error/empty] for [input]
2. State what is unknown as a result
3. State what would resolve it
4. Proceed with what is known; never substitute inference for missing data
