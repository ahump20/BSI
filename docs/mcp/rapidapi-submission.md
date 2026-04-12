# RapidAPI Listing — Submission Checklist

Tracks everything needed to complete the Blaze Sports Intel hub listing at
[`rapidapi.com/studio/api_c94c900f-57b9-480a-b622-6719276fc0ac`](https://rapidapi.com/studio/api_c94c900f-57b9-480a-b622-6719276fc0ac/publish/general).

## General Information

| Field | Value |
|---|---|
| Name | **Blaze Sports Intel — College Baseball** |
| Category | Sports |
| Short description | Live scores, standings, rankings, and advanced sabermetric analytics for all 330 NCAA Division I college baseball teams. |
| Website | `https://blazesportsintel.com` |
| Terms of Use | `https://blazesportsintel.com/terms` |
| Privacy Policy | `https://blazesportsintel.com/privacy` |
| Logo | 500 × 500 PNG with BSI mark on dark background (source: `public/bsi-logo-square-500.png` — verify exists before upload) |

## Long description (paste into the Markdown field)

```markdown
# Blaze Sports Intel — College Baseball Intelligence API

Coverage for all **330 NCAA Division I** college baseball programs — live scores, standings, rankings, schedules, and advanced sabermetric analytics computed on a 6-hour cron.

## What's included (9 endpoints)

- **Live scoreboard** — Today's games with venue, inning, score, hits, errors. Filter by conference or date.
- **Conference standings** — Wins, losses, run differential, streak, full record. Covers SEC, ACC, Big 12, Big Ten, and every mid-major.
- **National rankings** — D1Baseball Top 25 with week-over-week movement.
- **Team sabermetrics** — wOBA, wRC+, FIP, ERA-, BABIP, ISO, K%, BB%. Park-adjusted, D1-calibrated.
- **Sabermetric leaderboards** — Top hitters or pitchers by any advanced metric, filterable by conference.
- **Conference Power Index** — SOS-adjusted conference rankings from standings and run differential.
- **Player search** — Name search across all D1 rosters returns batting or pitching stats.
- **Team schedule** — Past results and upcoming games for any team.
- **Match detail** — Venue, weather, win predictions, play-by-play, team stats for a specific game.

## Data sources

Primary: **Highlightly** for live scores and venue. **BSI Savant** (6-hour cron) for all advanced metrics. **ESPN Site API** for national rankings and schedule fallback. Every response carries a `meta` block with source and fetch timestamp, plus an `X-Request-Id` header for tracing.

## Bonus: MCP (Model Context Protocol) server

This same service also speaks MCP at `POST /mcp` — wire an AI agent (Claude Desktop, Cursor, Cline, or any custom MCP client) directly to the underlying tools without writing a REST wrapper. See the full docs and integration snippets at `https://blazesportsintel.com/mcp`.

## Rate limits

Free tier: 30 requests per minute per subscriber. Caching absorbs burst traffic (scoreboard 60s, standings 5min, team sabermetrics 6hr).

## Support

File an issue at `github.com/ahump20/BSI` or reach out via `blazesportsintel.com`.
```

## Additional Information

| Field | Value |
|---|---|
| Pricing | Free tier only (for v1) |
| Tags | `baseball`, `ncaa`, `college-sports`, `sabermetrics`, `sports-analytics`, `mcp`, `live-scores` |

## Endpoints to list

Upload the OpenAPI spec at **`https://sabermetrics.blazesportsintel.com/openapi.json`**. RapidAPI will auto-populate endpoint definitions from it.

Endpoints to surface on the listing page (all under the base URL `https://sabermetrics.blazesportsintel.com`):

- `GET /health` — Liveness
- `POST /mcp` — JSON-RPC 2.0 MCP endpoint (optional on RapidAPI; AI clients use it directly)
- `GET /v1/scoreboard`
- `GET /v1/standings`
- `GET /v1/rankings`
- `GET /v1/players`
- `GET /v1/teams/{team}/stats`
- `GET /v1/teams/{team}/schedule`
- `GET /v1/leaderboard`
- `GET /v1/power-index`
- `GET /v1/matches/{id}`

## Pre-submission verification

Before hitting **Publish**, confirm all of these pass on production:

```bash
# Health
curl -s https://sabermetrics.blazesportsintel.com/health | jq .

# Tools list
curl -sX POST https://sabermetrics.blazesportsintel.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | jq '.result.tools | length'   # expect 9

# OpenAPI spec parses
curl -s https://sabermetrics.blazesportsintel.com/openapi.json \
  | jq '.info.title, (.paths | keys | length)'

# Landing page HTML renders (not JSON)
curl -s https://sabermetrics.blazesportsintel.com/ | head -c 200

# Every REST endpoint returns data with meta block
for ep in \
  "v1/scoreboard" \
  "v1/standings?conference=SEC" \
  "v1/rankings" \
  "v1/teams/texas/stats" \
  "v1/teams/texas/schedule" \
  "v1/leaderboard?metric=woba&limit=10" \
  "v1/power-index"
do
  echo "$ep"
  curl -s "https://sabermetrics.blazesportsintel.com/$ep" | jq '.meta'
done
```

## Known limitations to disclose

Add these to the "Notes" or "Limitations" section of the listing so subscribers know what they're getting:

- **Conference W/L splits** — `confWins` and `confLosses` are currently `null` because neither ESPN nor the current Highlightly tier reliably ship conference-level win/loss splits. Will populate once a richer upstream tier is on the roadmap.
- **Team coverage** — ESPN's standings endpoint surfaces 138 teams (Power 4 and top mid-majors). Smaller conferences that don't appear in ESPN's Division I group will return `teamCount: 0` for now. Full 330-team coverage requires the Highlightly tier upgrade noted below.
- **Upstream ceiling** — The server itself holds p95 under 500ms at 10 concurrent, but Highlightly's RapidAPI tier (currently free) starts throttling past ~10 concurrent on cold-cache requests. Heavy simultaneous use at the subscriber level is OK because each subscriber hits an independent cache — but a single subscriber hammering the API will see `upstream_throttle` beyond the ceiling.

## After publishing

- Share the RapidAPI listing URL back to BSI marketing channels.
- Monitor the RapidAPI analytics dashboard for the first 30 days.
- Revisit pricing tiers after real usage signal accumulates.
- Submit the MCP endpoint separately to the Claude MCP directory and Smithery (see `docs/mcp/mcp-directory-submission.md` when it exists).
