# College-Specific wOBA Weights

## Status: Deferred (trigger: end of 2026 regular season)

## Problem

BSI's college baseball sabermetrics (`workers/handlers/college-baseball/savant.ts`, `lib/analytics/savant-metrics.ts`) use MLB linear weights for wOBA calculation. These weights were derived from MLB run environments where, for example, a single is worth ~0.878 runs above out and a home run ~2.031. College baseball has a different run environment — higher ERAs, more errors, smaller parks, aluminum bats — so the true run value of each event differs.

The impact: wOBA and wRC+ for college hitters are approximate. Relative comparisons (player A vs player B) remain valid since everyone uses the same weights. But absolute values don't carry the same meaning as MLB wOBA, and the scale factor (`wobaScale`) computed from league OBP/wOBA/AVG partially compensates but doesn't fully correct for structural differences.

## Current Approach

`MLB_WOBA_WEIGHTS` from `lib/analytics/savant-metrics.ts`:

```
wBB: 0.690, wHBP: 0.722, w1B: 0.878, w2B: 1.242, w3B: 1.569, wHR: 2.031
```

`savant.ts` line ~126 computes `wobaScale` from league-aggregate OBP, wOBA, and AVG using `calculateWOBAScale()`. This adjusts the denominator so wRC+ centers at 100 for the college league average, which is correct behavior. The weights themselves remain MLB-derived.

## What College-Specific Weights Require

1. A full season of D1 game-level data: at minimum, total runs scored and total plate appearance outcomes (1B, 2B, 3B, HR, BB, HBP, outs) across all ~300 programs
2. Run expectancy matrix derived from college game states (runners on / outs), OR a linear regression approach fitting events to runs scored per game
3. Validation against actual college scoring patterns — college wOBA weights should show higher value for triples and doubles relative to MLB (more aggressive baserunning, fewer park HR)

At 3 weeks into the 2026 season, the sample is too thin. Need at minimum 60% of conference play completed (~mid-April) for stable estimates, ideally a full regular season (through May).

## Trigger Condition

**End of 2026 regular season (late May / early June).** By then, `player_season_stats` in D1 should have full-season totals for 2,000+ players across all conferences. Run the regression, compare to MLB weights, and determine whether the difference is material (>5% deviation on any event weight).

## Implementation Path

1. Query `player_season_stats` and `processed_games` for season-level event counts
2. Compute college-specific linear weights via either:
   - Tom Tango's method: (runs above average for event type) / (league PA)
   - Linear regression: fit PA-level event counts to runs scored per game
3. Replace `MLB_WOBA_WEIGHTS` with a `COLLEGE_WOBA_WEIGHTS` constant in `savant-metrics.ts`
4. Update `bsi-cbb-analytics` worker to use college weights
5. Recompute all `cbb_batting_advanced` rows
6. Compare old vs new: delta report for top 50 hitters

## Risk if Never Fixed

Low. Relative rankings (wRC+ leaderboards, wOBA comparisons) remain valid. The primary consumer is BSI's own college baseball coverage, where the audience cares about "who's the best hitter" more than "what's his true run value per PA." The MLB weights give a reasonable approximation; the `wobaScale` correction keeps wRC+ centered at 100. This is a precision improvement, not a correctness fix.
