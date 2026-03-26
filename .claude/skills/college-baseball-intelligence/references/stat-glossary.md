# Stat Glossary — BSI Platform Definitions

## Batting (Advanced)

wOBA (Weighted On-Base Average): Run-scoring value per PA on a common scale. ~.320 average. Primary offensive metric. Stabilizes ~150 PA.
wRC+ (Weighted Runs Created Plus): Park/conference-adjusted offense. 100 = average. Best cross-team comparison. Stabilizes ~200 PA.
ISO (Isolated Power): SLG minus AVG. Raw extra-base hit power. Stabilizes ~160 PA.
BABIP (Batting Average on Balls in Play): Contact quality + luck filter. Regression detector. Stabilizes ~400 PA (rarely reliable in-season).
BB% (Walk Rate): Plate discipline. College norm ~10%. Stabilizes fastest (~60 PA).
K% (Strikeout Rate): Contact tendency. College norm ~22%. Stabilizes ~60 PA.
OBP/SLG/OPS: Traditional triple. Context without adjustment. Always note park context.

## Pitching (Advanced)

FIP (Fielding Independent Pitching): ERA estimator using only Ks, BBs, HBPs, HRs. Strips defense. Better ERA predictor than ERA. Stabilizes ~60 IP.
ERA- (ERA Minus): Park/conference-adjusted ERA. 100 = average. 80 = 20% better. Best cross-conference pitching comparison. Stabilizes ~60 IP.
WHIP (Walks + Hits per IP): Baserunner rate. ~1.20 is solid in college. Stabilizes ~50 IP.
K/BB (Strikeout-to-Walk Ratio): Command efficiency. >3.0 is strong. Stabilizes fastest (~25 IP).
HR/9 (Home Runs per 9 IP): Hard contact proxy. Less reliable in small parks or early season.

## Team-Level Constructs

Run differential (conference): True quality signal. Sustained +8 over 10 games = real.
Conference Power Index: BSI conference strength ranking via get_conference_power_index.
Pythagorean Win%: RS^1.83 / (RS^1.83 + RA^1.83). Gap to actual record predicts regression.
FIP-ERA team gap: >0.50 = defense/luck carrying; investigate which.

## Small Sample Thresholds

BB%, K%: 60 PA | wOBA, wRC+: 150 PA | ISO: 160 PA | BABIP: 400 PA
ERA, FIP: 30 IP | K/BB: 25 IP | WHIP: 50 IP

Always state sample size when below threshold.
