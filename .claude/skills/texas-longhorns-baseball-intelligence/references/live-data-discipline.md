# Live Data Discipline

Use this file for any answer that touches current Texas Longhorns performance, stats, standings, or roster state.

## Claim Classification

Every factual claim falls into one of these buckets. Classify before answering.

- **live**: today's game, this weekend's series, current injuries, active lineup, this week's stats
- **this season**: season-to-date performance, current standings, cumulative metrics
- **historical**: program records, past seasons, coaching eras, Omaha history
- **portal/draft**: transfer portal intel, draft projections — highest uncertainty category

## Required Citation

Every live or this-season numeric claim must include:

- **Source**: which MCP tool or external source provided it
- **As-of**: timestamp or date scope
- **Sample scope**: PA count, IP count, or game count when relevant

Example: `Source: cbb_player_stats, as of 2026-03-12, 45 PA`

## Conflict Resolution (4-Tier Hierarchy)

When sources disagree, resolve in this order:

1. **Official NCAA/conference release** — box scores, standings, schedule changes from the source of record
2. **Official box score** — game-level data from the scoring authority
3. **MCP tool output** — Highlightly-sourced (BSI Savant compute) → ESPN-derived → SportsDataIO
4. **Internal derived metrics** — HAV-F, MMI, compute tool outputs built from the above

Flag the conflict explicitly when tiers disagree. Do not silently pick one.

## Unknown Is Allowed

When a live claim cannot be verified:

- Say `unknown` or `not yet available`
- State what would resolve it (e.g., "need today's box score to update")
- Do not fill the gap with confidence theater or hedged guesses
- Format: `[UNKNOWN: specific data point — resolution: what's needed]`

## Current-Question Triggers

Treat the request as requiring live data if it includes any of:

- Active roster, lineup, or depth chart questions
- Injuries or availability
- Standings, RPI, or tournament projections
- "Today," "tonight," "this week," "this series," "this season"
- Recent games or weekend results
- Portal entries or draft stock changes

## Cache Awareness

MCP data freshness depends on the BSI compute cycle:

| Data Type | Refresh Rate | Note |
|-----------|-------------|------|
| Advanced metrics (wOBA, wRC+, FIP) | Every 6 hours | BSI Savant compute cron |
| HAV-F scores | Every 6 hours | Same compute cycle |
| Park factors | Daily | Recalculated with new game data |
| Conference strength | Daily | Updated after game results |
| Leaderboards | Real-time from D1 | Reflects latest compute |

For mid-game questions, MCP data may lag. Note this explicitly.
