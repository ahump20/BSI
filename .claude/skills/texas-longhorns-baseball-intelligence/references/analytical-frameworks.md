# Analytical Frameworks

This file defines the analytical capabilities available for Texas Longhorns intelligence. Each framework specifies what it measures, when to use it, and which MCP tools power it.

## HAV-F (Hit, Approach, Value, Field)

**What it measures:** A composite player evaluation score that integrates four dimensions into a single value. HAV-F captures what traditional stats miss — a player who walks, plays defense, and puts the ball in play with authority will score higher than a player with a flashy batting average but poor plate discipline and fielding.

**Components:**
- **Hit (H):** Contact quality, barrel rate, hard-hit rate, batting average on balls in play
- **Approach (A):** Plate discipline — walk rate, chase rate, called-strike rate, pitch count per PA
- **Value (V):** Run production — wOBA, wRC+, isolated power, RISP performance
- **Field (F):** Defensive contribution — fielding percentage, range metrics, position value

**Interpretation bands:**
| HAV-F Score | Rating | Texas Context |
|-------------|--------|---------------|
| 80+ | Elite | Omaha-caliber contributor, potential first-round draft pick |
| 65-79 | Above average | Reliable starter on a regional-hosting team |
| 50-64 | Average | Roster player, adequate for SEC play |
| 35-49 | Below average | Weakness in the lineup, development needed |
| Below 35 | Poor | Liability — roster spot should be contested |

**Texas-specific use:** Compare current roster HAV-F scores against the program baselines in texas-program-doctrine.md. A Texas lineup with an average HAV-F below 55 is underperforming its talent level. An average above 70 signals a CWS-caliber roster.

**MCP call:** `cbb_havf_player` with `player_id`. Returns component breakdown and composite score.

## MMI (Momentum Index)

**What it measures:** A game-level momentum timeline that quantifies how win probability shifted across innings. MMI captures the shape of a game — was it a wire-to-wire blowout, a back-and-forth dogfight, or a late-inning collapse?

**When to use:**
- Postgame analysis: what happened and when the game turned
- Series analysis: momentum patterns across a weekend
- Leverage evaluation: did the coaching staff make the right moves at the high-leverage moments?
- Identifying clutch or collapse patterns in Texas's season

**Connection to leverage analysis:** MMI identifies the moments; leverage analysis evaluates the decisions made at those moments. A high-MMI game (lots of swings) with poor leverage decisions means the coaching staff had opportunities and missed them.

**MCP call:** `cbb_mmi_game` with `game_id`. Returns inning-by-inning momentum timeline with WP shifts.

## Park Factors

**UFCU Disch-Falk context:** Austin's climate (warm, humid), the park dimensions, and altitude create a specific run environment. Park factor adjustments are essential when comparing Texas hitters at home vs. on the road, or when evaluating opponents who play in pitcher-friendly or hitter-friendly venues.

**Road adjustments:** When Texas plays at LSU (Alex Box Fund), Vanderbilt (Hawkins Field), or other SEC venues, park factor adjustments change the expected performance baseline. A .280 hitter at a pitcher's park is performing better than a .300 hitter at a bandbox.

**SEC venue factors:** The SEC has extreme park variation — Alex Box Fund (LSU) plays as a hitter's park, Hawkins Field (Vanderbilt) plays neutral-to-pitchers, Swayze Field (Ole Miss) plays as a moderate hitter's park. Always check park factors before evaluating road performance.

**MCP call:** `cbb_park_factor` with `team_id`. Returns venue park factor for runs, hits, home runs.

## Conference Strength

**What it measures:** A 0-100 composite score quantifying conference competitive depth. Accounts for win-loss records, run differentials, RPI contributions, and head-to-head cross-conference performance.

**SEC positioning:** Use conference strength to understand where Texas sits within the SEC hierarchy. The SEC's composite score is typically the highest in D1 baseball — context that matters when evaluating Texas's conference record.

**Cross-conference comparison:** When Texas plays non-conference opponents, use conference strength to calibrate expectations. A team from a 40-rated conference with a .700 winning percentage is not necessarily better than a .550 team from an 85-rated conference.

**MCP call:** `cbb_conference_strength` with optional `conference` parameter. Returns composite scores, rankings, and component breakdowns.

## Leverage Framework

**When it activates:** Any game-state question where a managerial decision (pitching change, pinch hit, steal attempt, intentional walk) could materially alter win probability.

**Win probability heuristics:**
- WP > .85: game is effectively decided; leverage is low
- WP .60-.85: meaningful lead, but one big inning can flip it
- WP .40-.60: high leverage — every decision matters
- WP .15-.40: trailing significantly, need to maximize variance
- WP < .15: game is nearly lost; desperation moves are rational

**Managerial decision structure:**
1. Identify the game state (score, inning, base-out, pitcher fatigue)
2. Calculate approximate WP using MMI data if available
3. Evaluate the decision against the WP — did it increase or decrease Texas's chance of winning?
4. Consider the series and season context — a game 2 decision differs from an elimination game decision

**Bullpen leverage indexing:** Texas's bullpen should be deployed by leverage, not by inning. The closer should enter at the highest-leverage moment, not automatically in the 9th. Evaluate Pierce's bullpen management against this principle.

**MCP tools:** `cbb_mmi_game` for the momentum timeline, `cbb_player_stats` for pitcher fatigue and matchup data.

## Program Comparison Framework

**8-dimension Texas-vs-X structure:**

When comparing Texas against another program, evaluate across these dimensions:

| Dimension | What to Measure | MCP Tool |
|-----------|----------------|----------|
| Offensive production | Team OPS, wOBA, wRC+, run scoring rate | `cbb_team_analytics` |
| Pitching quality | Team ERA, FIP, K/BB ratio, innings depth | `cbb_team_analytics` |
| Player development | HAV-F distribution, freshman-to-junior improvement | `cbb_havf_player`, `cbb_player_stats` |
| Recruiting/portal | Incoming class quality, portal additions | Qualitative + `cbb_player_lookup` |
| Venue advantage | Park factors, home record | `cbb_park_factor` |
| Conference context | Conference strength, strength of schedule | `cbb_conference_strength` |
| Postseason track record | Regional/Super/CWS history | Historical — no MCP tool |
| Momentum trajectory | Recent series results, win streaks, MMI trends | `cbb_mmi_game`, `cbb_team_analytics` |

Always specify which dimensions Texas wins, which they lose, and which are genuinely close.

## NIL Efficiency Framework

**What it measures:** The relationship between a player's on-field production value (HAV-F composite) and their NIL market valuation. The framework identifies whether a player's NIL compensation is aligned with, above, or below their actual baseball contribution.

**Core metric:** NIL Efficiency Ratio = HAV-F Score / NIL Index Score
- Ratio > 1.2: undervalued — on-field production exceeds market price
- Ratio 0.8–1.2: fairly valued
- Ratio < 0.8: overvalued — NIL market price exceeds on-field contribution

**Texas-specific use:**
- Evaluate the roster's collective NIL efficiency: is the Texas program getting fair value for its NIL spend?
- Identify undervalued players who could be retention targets (high HAV-F, low NIL) vs. flight risks (high NIL elsewhere offers)
- Draft leverage analysis: players projected in rounds 1-5 have signing bonus leverage that reduces NIL importance for retention; later-round projections increase NIL criticality

**Quadrant mapping (NIL vs Draft Projection):**
| Quadrant | Profile | Strategy |
|----------|---------|----------|
| High NIL + Early Draft | Blue chip — will leave after junior year | Maximize current value, don't overpay for retention |
| High NIL + Late Draft | Marketable but not elite prospect | NIL is primary retention lever |
| Low NIL + Early Draft | Undervalued talent — draft is their exit | NIL won't keep them; draft stock matters |
| Low NIL + Late Draft | Development player | NIL is secondary; coaching is the retention tool |

**Hub page integration:** The Texas Intelligence NIL page at `/college-baseball/texas-intelligence/nil/` surfaces this analysis with live data from `/api/nil/leaderboard` and `/api/nil/draft-leverage`.

**MCP calls:** `cbb_havf_player` for on-field value, then cross-reference with `/api/nil/player/:id` for market valuation.

## Opponent Intelligence Template

**When to use:** Before any series, generate a structured opponent brief.

**Sections:**
1. **Record & Rankings** — overall, conference, RPI, national rank
2. **Offensive Profile** — team wOBA, wRC+, K%, BB%, ISO. Contact vs power lean.
3. **Pitching Profile** — team FIP, K/9, BB/9. Weekend rotation: Friday/Saturday/Sunday arms with individual FIP and K/BB.
4. **Key Players** — top 3 hitters by wRC+, top 3 pitchers by FIP. HAV-F if available.
5. **Recent Form** — last 3 series results, momentum direction
6. **Park Factor** — if playing away, how does the opponent's venue affect run scoring?
7. **Texas Matchup Edge** — where does Texas have an advantage? Where is the risk?

**MCP calls:** `cbb_team_analytics` (opponent), `cbb_player_stats` (key players), `cbb_conference_strength`, `cbb_park_factor` (if away).

## Lineup and Defensive Analysis

**Handedness stacking:** Evaluate how Texas's lineup is constructed against LHP vs. RHP. A lineup that is platoon-neutral performs more consistently in SEC play where opponents have multiple quality arms.

**Contact vs. power profile:** Is the lineup built on contact and plate discipline (Texas identity) or dependent on home runs? Use `cbb_team_analytics` to see team ISO, HR/FB%, and K%.

**Two-strike execution:** A hallmark of well-coached college hitters. Use `cbb_player_stats` to evaluate individual K% and chase rates. Texas should be below league average in strikeout rate.

**Up-the-middle stability:** Catcher, shortstop, center field. If these three positions are defensively strong, the pitching staff gets a multiplier. If any of the three is a liability, it shows up in ERA-FIP differential and BABIP against.

**MCP tools:** `cbb_team_analytics` for team-level profiles, `cbb_player_stats` and `cbb_havf_player` for individual evaluation, `cbb_leaderboard` to rank individuals against peers.
