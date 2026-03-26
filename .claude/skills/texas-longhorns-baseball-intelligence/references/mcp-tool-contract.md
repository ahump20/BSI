# MCP Tool Contract

This file defines the exact tools and resources available from the `college-baseball-sabermetrics` MCP server. Every tool name, parameter, and resource URI here is canonical. Do not guess tool names — use only what is listed.

## Tools (12)

| Tool | Description | Parameters | When to Use |
|------|-------------|------------|-------------|
| `cbb_player_lookup` | Find player by name or ID | `query` (string) or `player_id` (string) | First step for any player question — get the ID before calling other player tools |
| `cbb_player_stats` | Advanced stats for a player | `player_id` (string), `type?` ("batting" or "pitching") | After lookup — get wOBA, wRC+, FIP, OPS+, and all advanced metrics |
| `cbb_compare_players` | Head-to-head player comparison | `player_ids` (string[]), `type` ("batting" or "pitching") | When comparing two or more players side-by-side |
| `cbb_leaderboard` | Leaderboard for any metric | `metric` (string), `conference?`, `position?`, `limit?` | Rankings, "who leads the SEC in wOBA," top-N queries |
| `cbb_team_analytics` | Team aggregate stats | `team_id` (string) | Team-level performance — batting, pitching, fielding aggregates |
| `cbb_park_factor` | Venue park factor | `team_id` (string) | Adjusting stats for venue, understanding UFCU Disch-Falk context |
| `cbb_conference_strength` | Conference power rankings | `conference?` (string) | SEC positioning, cross-conference comparison, strength-of-schedule context |
| `cbb_compute_batting` | Stateless batting computation | `pa, ab, h, doubles, triples, hr, bb, hbp, so, sf` (all numbers) | What-if scenarios, manual stat lines, hypothetical projections |
| `cbb_compute_pitching` | Stateless pitching computation | `ip, h, er, hr, bb, hbp, so` (all numbers) | Same — pitching what-ifs and scenario modeling |
| `cbb_havf_player` | HAV-F composite breakdown | `player_id` (string) | Holistic player value assessment — hit, approach, value, field |
| `cbb_mmi_game` | Momentum timeline for a game | `game_id` (string) | In-game or postgame momentum analysis, leverage turning points |
| `cbb_glossary` | Explain a metric | `metric` (string) | Defining terms — wOBA, FIP, HAV-F, wRC+, etc. |

## Resources (8)

| URI | Purpose |
|-----|---------|
| `cbb://methodology/woba` | wOBA formula and linear weight table |
| `cbb://methodology/fip` | FIP formula and constant derivation |
| `cbb://methodology/havf` | HAV-F component breakdown and weights |
| `cbb://methodology/mmi` | MMI (Momentum Index) formula and components |
| `cbb://weights/current` | Current-season linear weights and league context values |
| `cbb://glossary` | Full metric glossary — all terms and definitions |
| `cbb://conferences` | Conference list with strength indices |
| `cbb://teams` | All 244 D1 teams with IDs |

## Tool Chaining Patterns

Common multi-tool sequences for Texas questions:

**Player question:**
`cbb_player_lookup` (get ID) → `cbb_player_stats` (advanced metrics) → `cbb_havf_player` (composite value)

**Team assessment:**
`cbb_team_analytics` (aggregates) → `cbb_leaderboard` (where they rank) → `cbb_conference_strength` (SEC context)

**Matchup preview:**
`cbb_team_analytics` (both teams) → `cbb_park_factor` (venue) → `cbb_conference_strength` (relative strength) → `cbb_leaderboard` (key matchups by position)

**Player comparison:**
`cbb_player_lookup` (both names → IDs) → `cbb_compare_players` (side-by-side) → `cbb_havf_player` (both) for composite ranking

**Postgame analysis:**
`cbb_mmi_game` (momentum timeline) → `cbb_team_analytics` (both teams for context) → `cbb_leaderboard` (individual performances in broader context)

**Scenario modeling:**
`cbb_compute_batting` or `cbb_compute_pitching` (hypothetical stat line) → compare against `cbb_leaderboard` results for context

## Normalization Rules

Use canonical names when querying tools:

- **Team names:** Use official names as they appear in `cbb://teams`. "Texas" not "UT" or "Longhorns" when passing as parameters.
- **Conference names:** "SEC", "Big 12", "ACC", "Big Ten" — use abbreviations as they appear in `cbb://conferences`.
- **Metric labels:** Use the exact metric names from `cbb://glossary` — `wOBA`, `wRC+`, `FIP`, `OPS+`, `HAV-F`, `K%`, `BB%`, not alternative capitalizations or abbreviations.

## Failure Protocol

When a tool returns empty, null, or an error:

1. State that the data is unavailable and name the specific tool that failed.
2. If the question can be partially answered with other tools, do so and flag the gap.
3. If the failure is a lookup (player not found), try alternative name spellings or check `cbb://teams` for the correct team ID.
4. Never fill a tool-failure gap with invented data.
