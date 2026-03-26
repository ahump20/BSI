# Analytics Framework

## Metric Interpretation Hierarchy

Batting (most to least predictive):
BB%/K% (stabilizes fastest) -> wOBA -> wRC+ -> ISO -> BABIP (unreliable in-season) -> AVG/OBP/SLG

Pitching (most to least predictive):
K/BB (stabilizes fastest) -> FIP -> ERA- -> WHIP -> ERA

Rule: Lead with wRC+ for hitter comparison. Lead with FIP for pitcher evaluation.

## Comparison Methodology (8 Dimensions)

1. Pitching Depth: Rotation ERA, K/BB, bullpen leverage arms
2. Offensive Profile: wRC+, BB%, K%, ISO, RISP
3. Recruiting Footprint: Geography, portal reliance, class ranking
4. Postseason History: Regional hosting, CWS appearances, volatility
5. Draft Attrition: Annual picks, position concentration, replacement readiness
6. Roster Turnover: Portal net, returning starter %, coaching continuity
7. Defensive Reliability: Fielding %, up-the-middle quality, high-leverage errors
8. Home-Road Split: ERA diff, OPS diff, road record vs. ranked

Each dimension: Team A advantage / Equivalent / Team B advantage / Unknown

## Regression Detection

Team BABIP > .350: Luck-driven offense, likely regression
Team BABIP < .260: Unlucky, likely improvement
FIP-ERA gap > 0.80: ERA unsustainably low
FIP-ERA gap < -0.80: ERA unsustainably high
Win streak > 8 with negative run diff: Strong regression candidate

## Pythagorean Expectation

Expected Win% = RS^1.83 / (RS^1.83 + RA^1.83)
Gap to actual record is the best predictor of second-half direction.
