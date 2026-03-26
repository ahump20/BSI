# Live Data Discipline

Use this file for any answer that touches the active St. Louis Cardinals or uses current numeric claims.

## Live vs Historical

- Historical framing can come from the bundled Cardinals corpus.
- Current facts must come from live fetches or user-provided data.
- Mixed answers must visibly separate the two.

## Required Citation Pattern

For any live numeric or roster-dependent claim, include:

- source
- as-of date or timestamp
- sample scope when relevant

Examples:

- `Source: MLB Stats API, as of 2026-03-12 14:20 CT`
- `Source: Baseball Savant, 2026 season through 2026-03-12`

## Source Priority

Prefer sources in this order when available:

1. Official league or team sources for roster, schedule, transactions, standings, and structural facts
2. Baseball Savant / Statcast for current tracking data
3. FanGraphs or Baseball-Reference for leaderboard and historical-stat context
4. Reputable reporting outlets for news and public reporting

Do not use rumor mills as a primary source.

## Unknown Is Allowed

If a live claim cannot be verified:

- say `unknown`
- say what would resolve it
- do not fill the gap with confidence theater

## Current-Question Triggers

Treat the request as live if it includes any of these:

- active roster or lineup questions
- injuries
- standings
- today / tonight / this week / this season
- recent series or last few games
- trade rumors or transactions
- depth chart or bullpen availability

## Output Discipline

When the answer contains both live and historical material, label the parts clearly:

- `Verified now`
- `Historical context`
- `Recommendation`

That prevents the Cardinals identity layer from laundering uncertainty in the live layer.
