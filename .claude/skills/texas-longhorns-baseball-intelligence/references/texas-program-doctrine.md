# Texas Program Doctrine

This file is the stable identity layer for Texas Longhorns baseball intelligence. Use it for framing, context, and program knowledge — not as a substitute for live data.

## Doctrine Tier Structure

This file operates on three tiers. Do not mix them.

### Program constants
Durable facts that survive coaching changes: titles, CWS appearances, venue quality, in-state recruiting geography, Austin market weight, Omaha standard. These are immutable anchors.

### Regime context
Coaching philosophy is era-specific and must be labeled as such. Historical questions use the relevant era (Garrido, Pierce). Current questions use the active coaching context in force at answer time. For 2025-forward: Jim Schlossnagle + SEC.

Do not present a prior coaching era's methods as timeless program truth.

### Live layer
Anything involving current roster composition, performance, roles, injuries, standings, SEC positioning, or this season's form requires live tool verification before stating. If unavailable, return `unknown` and name the missing dependency.

## Program Identity

Texas baseball operates under a national championship standard. Six College World Series titles (1949, 1950, 1975, 1983, 2002, 2005), 38 CWS appearances through 2025. The expectation is not "make a regional" — it's host a regional, win the super regional, compete in Omaha. Anything less demands an explanation.

UFCU Disch-Falk Field is one of the best venues in the sport. 7,273 capacity, first-class player development facility, recruiting showpiece. The Austin market — warm weather, major metro, UT brand — creates structural advantages in prospect attraction that persist across coaching eras and conference membership.

## Coaching Eras

**Augie Garrido (1997-2016):** Two national titles (2002, 2005). Program identity builder. Garrido's Texas was mental toughness, competitive fire, and the belief that Texas should be the standard in college baseball. His decline years (2012-2016) created a development debt the program spent years repaying.

**David Pierce (2017-2024):** Rebuilt after Garrido's decline years. Pierce's fingerprint: pitching depth, defensive positioning, competitive at-bats. 2022 CWS appearance. Departed after 2024 season. Evaluate his era by draft output and postseason advancement, not regular-season record alone.

**Jim Schlossnagle (2025-present):** Active head coach as of 2025. Schlossnagle brought SEC credibility (previous success at TCU and Texas A&M). His staff structure, rotation management, bullpen usage patterns, and recruiting approach differ from Pierce's. Any current-season analysis of player development philosophy, lineup identity, or pitching construction must use live data and Schlossnagle-era framing, not Pierce-era generalizations.

## Roster Construction

**Development model:** Texas recruits elite Texas high school talent and develops it. The in-state pipeline is the foundation — Texas produces more D1 baseball talent per capita than nearly any state. The program's competitive advantage starts with geography.

**Portal strategy:** Selective. Texas uses the portal to fill specific roster gaps, not to rebuild annually. Portal additions should complement the development core, not replace it. Evaluate portal acquisitions by what gap they fill and whether they fit the competitive-at-bat, pitching-depth identity.

**Draft attrition management:** High-end Texas recruits get drafted. This is a feature, not a bug — it means the recruiting pipeline is working. Evaluate each class knowing that 2-3 top prospects may sign pro contracts. The question is whether the program has depth behind the departures.

## SEC-Era Recalibration

Texas joined the SEC in 2024. This changes three things and leaves two things alone.

**What changes:**

- **Schedule intensity:** SEC weekend series are the hardest in the sport, every week. A .500 conference record in the SEC is not a .500 conference record in the Big 12. Use `cbb_conference_strength` to quantify the difference.
- **Competition for Omaha bids:** The SEC routinely sends 8-10 teams to the NCAA tournament. Texas is no longer the presumptive conference front-runner — they must earn it against deeper competition.
- **Recruiting competition:** SEC membership puts Texas in direct recruiting battles with LSU, Vanderbilt, Florida, Arkansas, and Mississippi State for the best Southern talent. The in-state pipeline matters even more because national recruiting gets harder.

**What stays:**

- **Facility edge:** UFCU Disch-Falk remains one of the best venues in college baseball. SEC membership doesn't change the physical plant advantage.
- **In-state talent:** Texas high school baseball produces at an elite level regardless of conference affiliation. The pipeline is geographic, not conference-dependent.
- **Omaha standard:** The expectation was always national championship contention. SEC membership raises the difficulty but not the standard.

## Season Calendar Anchors

| Phase | Window | What to Evaluate | Key MCP Tools |
|-------|--------|-----------------|---------------|
| Fall workouts | Sep-Nov | Roster composition, position battles, new arrivals | `cbb_player_lookup`, `cbb_team_analytics` (prior year baseline) |
| Preseason | Dec-Jan | Projected lineup, rotation depth, preseason rankings | `cbb_conference_strength`, `cbb://teams` |
| Opening weekend | Feb Wk 1 | First live data, lineup construction, bullpen usage | `cbb_team_analytics`, `cbb_player_stats` |
| Non-conference | Feb-Mar | Sample building, stat stabilization, identity formation | `cbb_leaderboard`, `cbb_park_factor`, `cbb_havf_player` |
| SEC play opens | Mid-Mar | Conference crucible begins — every series matters | `cbb_conference_strength`, `cbb_mmi_game` |
| SEC grind | Apr | Roster depth tested, midweek management, fatigue patterns | `cbb_team_analytics`, `cbb_compute_batting` (what-ifs) |
| Selection Sunday | Late May | Resume evaluation, RPI, tournament seeding | `cbb_conference_strength`, `cbb_leaderboard` |
| Regionals/Supers | Jun Wk 1-2 | Short-series pitching, bullpen leverage, clutch hitting | `cbb_mmi_game`, `cbb_havf_player` |
| College World Series | Jun Wk 3+ | Peak performance, matchup advantage, program moment | All tools in combination |

## Historical Baselines

Program expectations — what "normal" looks like for Texas baseball:

| Metric | Expected Range | Red Flag Below | Elite Above |
|--------|---------------|---------------|-------------|
| Team ERA | 3.50-4.20 | 4.50+ | 3.20- |
| Team OPS | .750-.830 | .700- | .850+ |
| BB% (pitching) | 8-11% | 13%+ | 7%- |
| K% (pitching) | 22-28% | 18%- | 30%+ |
| Run differential/game | +1.5-2.5 | +0.5- | +3.0+ |
| Fielding % | .970-.978 | .965- | .980+ |
| Regional hosting | Expected | Failure to host | #1 national seed |

These baselines are Big 12-era calibrated. SEC competition may compress the expected ranges — use `cbb_conference_strength` to adjust expectations in real time.

## Offensive Identity Standards

Texas at its best plays competitive at-bats: high pitch counts per plate appearance, disciplined chase rates, situational hitting with runners in scoring position. Power is welcome but not the identity — contact quality and plate discipline are the foundation.

Evaluate the lineup by: K/BB ratio, two-strike approach quality, RISP performance relative to overall line, and whether the lineup manufactures runs or depends on extra-base hits.

## Pitching and Defensive Identity

Texas historically values pitching depth over pure stuff, command alongside velocity, and up-the-middle defensive stability (C, SS, CF) as a multiplier for pitching effectiveness.

For current-season pitching identity — rotation construction, bullpen structure, deployment patterns — use live data. These are regime-dependent and Schlossnagle's approach differs from Pierce's.
