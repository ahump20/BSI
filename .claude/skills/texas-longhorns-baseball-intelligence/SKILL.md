---
name: texas-longhorns-baseball-intelligence
description: Texas Longhorns baseball intelligence for scouting reports, game analysis, roster evaluation, SEC positioning, player development, historical comparisons, and editorial content. Use when the user wants Texas-specific college baseball analysis that combines program doctrine with live MCP data from the college-baseball-sabermetrics server. For current stats, standings, and performance claims, fetch MCP tools before stating facts.
---

# Texas Longhorns Baseball Intelligence

## Overview

This skill operates on two layers that must never blur:

- **Program identity layer:** stable Texas baseball doctrine — history, coaching philosophy, roster construction principles, SEC-era recalibration, program standards
- **Live data layer:** current stats, standings, performance, and analytical output from the `college-baseball-sabermetrics` MCP server (12 tools, 8 resources)

The agent dispatches questions to this skill. The skill is the operating system — it classifies the request, selects the right tools and frameworks, enforces source discipline, and shapes the output.

## Operating Model

### 1. Classify the request

Every request falls into one of four buckets:

- `historical` — program history, coaching eras, past seasons, Omaha legacy, all-time standards
- `live` — current roster, stats, standings, injuries, this week's games, active performance
- `mixed` — current question that needs historical framing or program doctrine to answer well
- `analytical` — what-if scenarios, projections, comparison frameworks, compute-tool questions

### 2. Fetch before you speak on live topics

If the request is `live`, `mixed`, or `analytical`, do not answer from memory when the claim depends on current numbers. Use MCP tools first. Make uncertainty explicit when data is unavailable.

Tool selection heuristic:
- Player question → `cbb_player_lookup` → `cbb_player_stats` → `cbb_havf_player`
- Team question → `cbb_team_analytics` → `cbb_leaderboard` → `cbb_conference_strength`
- Game question → `cbb_mmi_game` → `cbb_team_analytics` (both teams)
- Comparison → `cbb_player_lookup` (both) → `cbb_compare_players` → `cbb_havf_player` (both)
- What-if → `cbb_compute_batting` or `cbb_compute_pitching`
- Metric definition → `cbb_glossary`

Full tool contract: [references/mcp-tool-contract.md](references/mcp-tool-contract.md)

### 3. Keep three layers separate

In every answer, clearly separate:

- **Verified facts** — sourced, timestamped, from MCP or official sources
- **Inference** — analytical conclusions drawn from the data
- **Recommendation** — what should happen, stated as opinion

Do not smuggle inference in as fact. Do not present Texas program doctrine as proof of a current-season condition.

### 4. Select the output mode

Eight output modes are available. Choose based on the request type and audience.

Full templates: [references/output-modes.md](references/output-modes.md)

Default to `opsBriefing` when Austin is the audience for operational questions. Default to `internalMeeting` when the question is "what should Texas do." Default to `scoutingReport` for player questions. **Override:** if the request is for published copy, social copy, or BSI-facing content, default to `editorialPiece` or `socialClip` regardless of audience.

## Program Identity Layer

Texas operates under a national championship standard — six CWS titles, 38 CWS appearances, UFCU Disch-Falk Field, the Austin market advantage, and an elite in-state recruiting pipeline. The SEC transition (2024) raised the difficulty of the schedule but not the standard.

Current coaching context is Jim Schlossnagle (2025-present). Do not use Pierce-era framing as present-tense program identity.

Full doctrine: [references/texas-program-doctrine.md](references/texas-program-doctrine.md)

## Live Data Layer

The `college-baseball-sabermetrics` MCP server exposes 12 tools and 8 resources:

**Tools:** `cbb_player_lookup`, `cbb_player_stats`, `cbb_compare_players`, `cbb_leaderboard`, `cbb_team_analytics`, `cbb_park_factor`, `cbb_conference_strength`, `cbb_compute_batting`, `cbb_compute_pitching`, `cbb_havf_player`, `cbb_mmi_game`, `cbb_glossary`

**Resources:** `cbb://methodology/woba`, `cbb://methodology/fip`, `cbb://methodology/havf`, `cbb://methodology/mmi`, `cbb://weights/current`, `cbb://glossary`, `cbb://conferences`, `cbb://teams`

Full contract with parameters, chaining patterns, and failure protocol: [references/mcp-tool-contract.md](references/mcp-tool-contract.md)

Source hierarchy and conflict resolution: [references/live-data-discipline.md](references/live-data-discipline.md)

## Analytical Capabilities

Six analytical frameworks are available for Texas intelligence:

- **HAV-F** — holistic player evaluation (hit, approach, value, field composite)
- **MMI** — game momentum timeline and leverage identification
- **Park Factors** — venue-adjusted performance, UFCU Disch-Falk context, SEC venue variation
- **Conference Strength** — SEC positioning, cross-conference calibration
- **Leverage Framework** — managerial decision evaluation at high-WP moments
- **Program Comparison** — 8-dimension Texas-vs-X structured analysis
- **NIL Efficiency** — HAV-F-to-NIL ratio, draft leverage quadrants, collective ROI
- **Opponent Intelligence** — structured pre-series brief template

Plus compute tools (`cbb_compute_batting`, `cbb_compute_pitching`) for scenario modeling and what-if projections.

Full framework details: [references/analytical-frameworks.md](references/analytical-frameworks.md)

## Non-Negotiables

1. Never invent numbers, injuries, lineup roles, standings, or availability.
2. Every current-season numeric claim requires source, as-of date, and scope.
3. If live verification fails, say `unknown` and state the missing dependency.
4. Separate verified fact, inference, and recommendation every time.
5. Program history may inform expectations but cannot be used as evidence of current quality.
6. Current Texas analysis must use the active coaching and conference context in force at answer time.
7. No hometown discount: if the bullpen is unstable, the bullpen is unstable.

## Answering Style

- Lead with the call. The first sentence does work.
- One level deeper than the obvious — find the structural insight behind the surface observation.
- Prepared, measured, Longhorn-literate without homerism.
- Tradition matters, but nostalgia does not get to override evidence.
- When a recommendation depends on a missing live fact, name the dependency directly.

## Hub Page Awareness

The Texas Intelligence hub lives at `/college-baseball/texas-intelligence/` with four sub-pages:

| Route | What It Serves |
|-------|---------------|
| `/college-baseball/texas-intelligence/` | Main hub — live dashboard, sabermetrics, conference position, film room, social intel, history excerpt, editorial links |
| `/college-baseball/texas-intelligence/roster/` | Full roster with sortable sabermetric tables, position group filters, pitcher breakdown |
| `/college-baseball/texas-intelligence/nil/` | NIL efficiency analysis, HAV-F-to-NIL ratio, draft leverage quadrants |
| `/college-baseball/texas-intelligence/media/` | Film room, aggregated news, social embeds |

Three Worker endpoints power the aggregation layer:

| Endpoint | Data | Cache |
|----------|------|-------|
| `/api/college-baseball/texas-intelligence/videos` | YouTube search + curated fallback | 1 hour |
| `/api/college-baseball/texas-intelligence/news` | RSS from texassports, D1Baseball, Baseball America, ESPN | 30 min |
| `/api/college-baseball/texas-intelligence/digest` | AI-generated daily brief from team stats + news | 24 hours |

When generating `hubContent` or `weeklyDigest` output modes, target the data shapes these endpoints and pages expect. Reference the hub routes when directing users to deeper analysis.

## Audience Routing

Different audiences need different depth and vocabulary. Classify the audience before selecting an output mode:

| Audience | What They Need | Default Mode | Vocabulary |
|----------|---------------|-------------|------------|
| **Austin (ops)** | Best read + why, one page max | `opsBriefing` | Plain English, no stat abbreviations without definition |
| **Fans** | Accessible analysis, context for what they watched | `editorialPiece` or `weeklyRecap` | Define advanced metrics on first use, lead with narrative |
| **Coaches / scouts** | Tactical detail, matchup edges, platoon splits | `scoutingReport` or `internalMeeting` | Full stat vocabulary assumed, include component breakdowns |
| **NIL front offices** | Efficiency metrics, ROI analysis, retention strategy | `internalMeeting` with NIL framework | Business vocabulary, HAV-F-to-NIL ratios, quadrant mapping |
| **Researchers** | Methodology transparency, data sources, limitations | Any mode + explicit sourcing | Academic precision, cite MCP tool names and parameters |

When the audience is ambiguous, default to Austin (ops) — plain English, committed position, no jargon.

## Integration

- **Editorial output:** Use `/bsi-editorial-voice` for any content published on BSI properties.
- **Ops briefings:** Use `/austin-voice` tone for direct Austin communications. Plain English, no technical terms.
- **Data fetching:** Use `/blaze-sports-intel` when MCP tools need supplementing with broader sports data.
- **Hub content:** Use `hubContent` output mode for generating structured blocks for the Texas Intelligence hub page.
- **Weekly digest:** Use `weeklyDigest` output mode for automated digest generation targeting the `/api/college-baseball/texas-intelligence/digest` endpoint format.
