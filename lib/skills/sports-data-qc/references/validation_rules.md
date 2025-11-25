# Sports Data QC Validation Rules Reference

This document provides detailed explanations of every validation check, threshold rationale, edge cases, and handling strategies.

## Table of Contents

1. [Range Validation](#range-validation)
2. [Completeness Validation](#completeness-validation)
3. [Consistency Validation](#consistency-validation)
4. [Temporal Validation](#temporal-validation)
5. [Statistical Outlier Detection](#statistical-outlier-detection)
6. [Confidence Score Filtering](#confidence-score-filtering)
7. [Edge Cases and Special Handling](#edge-cases-and-special-handling)

---

## Range Validation

Range validation ensures numeric values fall within physically possible or statistically reasonable bounds.

### Batting Average (0.000 - 1.000)

**Rule:** `0.0 ≤ batting_avg ≤ 1.0`

**Rationale:**

- Batting average is hits/at-bats, mathematically bounded by [0, 1]
- 0.000 = no hits (common for pitchers)
- 1.000 = hit every at-bat (possible in small samples)

**Edge Cases:**

- **Small sample sizes:** College player goes 3-for-3 in first game → BA = 1.000 ✅ VALID
- **Pitcher batting:** 0-for-season is normal → BA = 0.000 ✅ VALID
- **Negative values:** BA = -0.123 ❌ FAIL (data error)
- **Greater than 1:** BA = 1.234 ❌ FAIL (calculation error)

**Common Failures:**

- Scraper divides incorrectly (RBI/AB instead of H/AB)
- API returns percentage as decimal (45.6 instead of 0.456)
- Missing decimal point conversion

**Fix Strategy:**

```typescript
// Check if value is a percentage (>1 but <100)
if (ba > 1.0 && ba < 100) {
  battingAvg = ba / 100; // Convert 45.6 → 0.456
}
```

---

### Pitch Velocity (40 - 110 mph)

**Rule:** `40 mph ≤ pitch_velocity ≤ 110 mph`

**Rationale:**

- **Lower bound (40 mph):** Slowest college pitches (eephus, knuckleball)
  - Typical college fastball: 85-95 mph
  - Changeups: 75-85 mph
  - Curveballs: 70-80 mph
  - Rare eephus pitches: ~50 mph (R.A. Dickey's knuckler can be 60-70 mph)
- **Upper bound (110 mph):** Theoretical maximum
  - MLB record: Aroldis Chapman 105.8 mph
  - College max: ~102-103 mph (rare, usually draft prospects)
  - 110 mph allows headroom for measurement error

**Edge Cases:**

- **Extremely slow pitch:** 42 mph eephus in college game ✅ VALID (but flagged by MAD)
- **Radar gun error:** 115 mph reading ❌ FAIL (physically impossible)
- **KMH vs MPH confusion:** 145 kph = 90 mph ✅ (but raw 145 mph ❌ FAIL)
- **Youth baseball:** 35 mph fastball in little league ❌ FAIL (use different thresholds for youth data)

**Common Failures:**

- API returns km/h instead of mph
- Decimal point error (951 instead of 95.1)
- Radar gun calibration issues

**Fix Strategy:**

```typescript
// Check if value is likely km/h
if (velocity > 110 && velocity < 180) {
  pitchVelocity = velocity * 0.621371; // Convert kph → mph
}
```

**Sport-Specific Adjustments:**

- **MLB:** Use 40-110 mph (same)
- **College:** Use 40-105 mph (more restrictive upper bound)
- **High School:** Use 40-100 mph
- **Youth (12U):** Use 30-80 mph

---

### Exit Velocity (0 - 120 mph)

**Rule:** `0 mph ≤ exit_velocity ≤ 120 mph`

**Rationale:**

- **Lower bound (0 mph):** Foul tip, missed swing contact
- **Upper bound (120 mph):** Elite contact
  - MLB record: ~122-124 mph (Giancarlo Stanton, Aaron Judge)
  - College max: ~110-115 mph
  - 120 mph allows headroom

**Edge Cases:**

- **No contact:** exit_velocity = null/undefined (not 0) ✅ VALID
- **Weak contact:** 15 mph dribbler ✅ VALID
- **Elite contact:** 118 mph line drive ✅ VALID (flagged by MAD for college)
- **Measurement error:** 250 mph ❌ FAIL

**Common Failures:**

- Conflating exit velocity with pitch velocity
- Unit conversion errors
- Bat speed vs exit velocity confusion

---

### Earned Run Average (0.00 - 99.99)

**Rule:** `0.0 ≤ ERA ≤ 99.99`

**Rationale:**

- **Lower bound (0.00):** Perfect season (no earned runs)
- **Upper bound (99.99):** Worst possible ERA in reasonable sample
  - ERA = (Earned Runs × 9) / Innings Pitched
  - Small sample: 1 IP, 5 ER → ERA = 45.00 ✅ VALID
  - Infinite ERA (0 IP, 1 ER) → Set to 99.99 by convention

**Edge Cases:**

- **Perfect record:** 0.00 ERA in 30 IP ✅ VALID
- **Terrible outing:** 1 IP, 9 ER → ERA = 81.00 ✅ VALID (but extreme outlier)
- **Infinite ERA:** 0 IP, 1 ER → Set to 99.99 ✅ VALID (by convention)
- **Negative ERA:** -2.45 ❌ FAIL (calculation error)

**Common Failures:**

- Division by zero (0 IP)
- Unearned runs counted as earned
- Formula error (missing ×9 multiplier)

**Fix Strategy:**

```typescript
// Handle infinite ERA
if (inningsPitched === 0 && earnedRuns > 0) {
  era = 99.99;
} else if (inningsPitched > 0) {
  era = (earnedRuns * 9) / inningsPitched;
}
```

---

### Spin Rate (0 - 4000 rpm)

**Rule:** `0 rpm ≤ spin_rate ≤ 4000 rpm`

**Rationale:**

- **Lower bound (0 rpm):** Knuckleball (~500-1000 rpm typical)
- **Upper bound (4000 rpm):** Elite breaking balls
  - Fastballs: 2000-2700 rpm (high spin = "rising" fastball)
  - Curveballs: 2500-3500 rpm
  - Elite curve: ~3200 rpm (Trevor Bauer)
  - 4000 rpm allows headroom

**Edge Cases:**

- **Knuckleball:** 600 rpm ✅ VALID
- **Elite curveball:** 3400 rpm ✅ VALID
- **Measurement error:** 6000 rpm ❌ FAIL

**Note:** Spin rate is less common in college baseball data. Most college programs don't have Trackman/Rapsodo systems yet.

---

## Completeness Validation

Ensures all required fields are present and non-empty.

### Required Game Fields

**Rule:** Game records must have: `game_id`, `timestamp`, `home_team`, `away_team`

**Rationale:**

- **game_id:** Unique identifier for deduplication and lookups
- **timestamp:** When the game occurred (for time-series analysis)
- **home_team / away_team:** Core entities

**Optional but Recommended:**

- `home_score` / `away_score` (required if status = 'FINAL')
- `venue` (for home field advantage analysis)
- `season` (for year-over-year comparisons)

**Edge Cases:**

- **Scheduled game with no scores:** ✅ VALID if status = 'SCHEDULED'
- **Final game missing scores:** ❌ FAIL
- **Neutral site game:** `home_team` = lower seed by convention

**Common Failures:**

- API pagination cuts off fields
- Scraper regex misses nested fields
- Database schema mismatch

---

### Required Player Stats Fields

**Rule:** Player records must have: `player_id`, `player_name`, `team_id`

**Plus at least one stat field:**

- Batting: `at_bats`, `hits`, `batting_avg`
- Pitching: `innings_pitched`, `earned_runs`, `era`

**Rationale:**

- Empty stat lines are useless
- Need identifier for joins/lookups

**Edge Cases:**

- **DNP (Did Not Play):** Omit record entirely, don't store empty stats
- **Pitcher with 0 IP:** ❌ REJECT (didn't actually pitch)
- **Batter with 0 AB:** ✅ VALID if BB/HBP/SF (reached base without AB)

---

## Consistency Validation

Ensures data is internally coherent.

### Box Score vs Play-by-Play Consistency

**Rule:** Box score totals must match sum of play-by-play events

**Checks:**

- Total runs = sum of scoring plays
- Total hits = sum of hit events
- Total errors = sum of error plays

**Tolerance:** 0 (must be exact)

**Edge Cases:**

- **Defensive indifference:** Not an error ✅ Totals may differ
- **Catcher interference:** Reached base but no hit ✅ Check official scoring
- **Sacrifice flies:** No AB but RBI counted ✅ This is correct

**Common Failures:**

- Play-by-play data incomplete (missing innings)
- Box score includes unearned runs in totals
- Scraper double-counts events

**Example:**

```
Box Score: 5 runs, 8 hits, 1 error
Play-by-Play Sum: 5 runs, 7 hits, 1 error
→ ❌ FAIL: Hit count mismatch
```

---

### Win Probability Sum

**Rule:** `home_win_prob + away_win_prob + tie_prob = 1.0`

**Tolerance:** 0.001 (0.1% for rounding)

**Rationale:**

- Probabilities must sum to 100%
- Allow tiny rounding errors from float math

**Edge Cases:**

- **Baseball (no ties):** `tie_prob = 0` or `undefined` ✅ VALID
- **Football (overtime):** `tie_prob > 0` ✅ VALID
- **Rounding error:** Sum = 0.9997 ✅ VALID (within tolerance)
- **Bad simulation:** Sum = 1.15 ❌ FAIL

**Common Failures:**

- Monte Carlo simulation didn't normalize
- Forgot to include tie probability
- Percentage vs decimal confusion (110% vs 1.10)

---

### Score Distribution Validation

**Rule:** Each outcome probability in [0, 1] and sum ≈ 1.0

**Checks:**

1. All probabilities are valid: `0 ≤ p ≤ 1`
2. Sum of all probabilities ≈ 1.0 (within tolerance)

**Edge Cases:**

- **High-scoring game distribution:** 100+ possible outcomes ✅ VALID
- **Truncated distribution:** Only top 20 outcomes (sum = 0.85) ⚠️ WARNING (document truncation)
- **Negative probability:** ❌ FAIL

**Example:**

```json
{
  "score_distribution": [
    { "home_score": 5, "away_score": 3, "probability": 0.15 },
    { "home_score": 4, "away_score": 3, "probability": 0.12 },
    ...
  ]
}
```

---

## Temporal Validation

Ensures timestamps and dates are valid.

### Timestamp Format Validation

**Rule:** Must be valid ISO 8601 format

**Examples:**

- ✅ `2025-03-15T14:30:00Z` (UTC)
- ✅ `2025-03-15T09:30:00-05:00` (America/Chicago)
- ❌ `03/15/2025 2:30 PM` (non-ISO format)
- ❌ `2025-13-45T99:99:99Z` (invalid date/time)

**Timezone Requirement:**

- All scrape timestamps must include timezone
- Prefer `America/Chicago` for Blaze Sports Intel

---

### No Future Dates (Except Scheduled Games)

**Rule:** Game timestamps in the past (unless status = 'SCHEDULED')

**Rationale:**

- Final games can't be in the future
- Scheduled games can be future dates

**Edge Cases:**

- **Game scheduled tomorrow:** ✅ VALID if status = 'SCHEDULED'
- **Final game tomorrow:** ❌ FAIL (impossible)
- **Time zone confusion:** Game at 1am UTC is yesterday in US ✅ Handle correctly

**Common Failures:**

- Server clock drift
- Timezone conversion errors
- API returns future timestamp for completed game

---

### Season Alignment

**Rule:** Game date should align with declared season year

**Logic:**

- **College Baseball Season:** February - June
  - Feb-Jun game → season = current year
  - Oct-Dec scheduling → season = next year (fall ball)
  - Jul-Sep → warning (summer leagues)

**Edge Cases:**

- **Fall scheduling:** October 2025 game with season=2026 ✅ VALID
- **Regional playoffs:** June game is still 2025 season ✅ VALID
- **Summer league:** July game with season=2025 ⚠️ WARNING (document as summer ball)
- **Bad data:** March 2025 game with season=2030 ❌ FAIL

**Example:**

```
Game: 2025-03-15
Season: 2025
→ ✅ PASS (spring season)

Game: 2025-11-10
Season: 2026
→ ✅ PASS (fall ball for next season)

Game: 2025-03-15
Season: 2024
→ ❌ FAIL (season year mismatch)
```

---

## Statistical Outlier Detection

### MAD (Median Absolute Deviation) Method

**Why MAD instead of Standard Deviation?**

- Standard deviation is sensitive to outliers (circular logic)
- MAD is robust to outliers
- Better for small sample sizes (common in college sports)

**Formula:**

```
1. Calculate median of all values: M
2. Calculate absolute deviations: |x - M| for each x
3. MAD = median of absolute deviations
4. MAD Score = |x - M| / MAD
```

**Interpretation:**

- MAD Score < 3: Typical value
- MAD Score 3-5: Unusual but plausible
- MAD Score 5-7: Outlier, flag for review
- MAD Score > 7: Extreme outlier, likely error

---

### Threshold Selection

**Permissive Threshold (5.0 MADs):**

- Default for production
- Flags ~1-5% of records
- Minimizes false positives
- Use for college baseball (high variance)

**Strict Threshold (7.0 MADs):**

- For historical migrations
- Flags ~0.1-1% of records
- Only extreme outliers
- Use for professional sports (lower variance)

**Custom Thresholds:**

- **Batting Average:** 5.0 MADs (college has wide variance)
- **Pitch Velocity:** 4.0 MADs (tighter distribution)
- **Exit Velocity:** 5.0 MADs (equipment variance)

---

### Outlier Recommendations

**ACCEPT (MAD Score < 5.0):**

- Normal range
- Ingest without flagging

**FLAG (MAD Score 5.0 - 7.0):**

- Unusual but possible
- Could be legitimate exceptional performance
- Ingest but mark for human review
- Examples:
  - College player hits 4 HR in game (exit velo outlier)
  - Pitcher throws 105 mph (velocity outlier)
  - Team scores 20 runs (scoring outlier)

**REJECT (MAD Score > 7.0):**

- Extremely unlikely
- Probably data error
- Don't auto-delete, but flag strongly
- Examples:
  - 150 mph pitch velocity (measurement error)
  - -5 runs scored (calculation error)
  - 2.000 batting average (formula bug)

---

### Sport-Specific Outlier Handling

**College Baseball:**

- More permissive (5.0 MAD threshold)
- Small sample sizes create outliers
- Conference mismatches (D1 vs D3 scrimmage)

**MLB:**

- More strict (4.0 MAD threshold)
- Larger sample sizes
- Better data quality

**NFL:**

- Moderate (4.5 MAD threshold)
- Weekly data only (small N)
- High scoring variance normal

---

## Confidence Score Filtering

**What is Confidence Score?**

- Optional field from scraper: 0.0 - 1.0 scale
- Indicates scraper's certainty in data accuracy
- Based on parse quality, data completeness, source reliability

**Example Scoring:**

```typescript
let confidence = 1.0;

// Deduct for missing fields
if (!player.position) confidence -= 0.1;

// Deduct for data source quality
if (source === 'ESPN_API') confidence -= 0.2; // Known issues

// Deduct for parse warnings
if (parseWarnings > 0) confidence -= 0.1;

// Deduct for stale data
if (dataAge > 24_hours) confidence -= 0.15;
```

**QC Usage:**

```typescript
{
  min_confidence_score: 0.7; // Reject scores below 0.7
}
```

**Thresholds:**

- **0.9+:** High confidence (API with validation)
- **0.7-0.9:** Medium confidence (parsed HTML)
- **0.5-0.7:** Low confidence (unreliable source)
- **< 0.5:** Very low (manual review needed)

---

## Edge Cases and Special Handling

### Empty Stat Lines

**Scenario:** Player listed in roster but DNP (did not play)

**Handling:**

- ✅ Omit from data entirely (don't create empty records)
- ❌ Don't store all nulls/zeros

---

### Pinch Hitters / Pitchers

**Scenario:** Player has 1 AB or 0.1 IP

**Handling:**

- ✅ Include in dataset (valid stat line)
- ⚠️ May trigger outlier flags (small sample)
- Document role (PH, PR, defensive sub)

---

### Doubleheaders

**Scenario:** Two games same day, same teams

**Handling:**

- Must have unique `game_id` (append -1, -2 suffix)
- Same `timestamp` date but different game instances
- Validate separately

---

### Postponed / Cancelled Games

**Scenario:** Game status = 'POSTPONED' or 'CANCELLED'

**Handling:**

- ✅ Store game record with status
- ❌ Don't require scores (null is valid)
- Include reason if available (weather, COVID, etc.)

---

### Neutral Site Games

**Scenario:** NCAA tournament, bowl games

**Handling:**

- Designate `home_team` = higher seed or alphabetically first
- Store `venue` separately
- Flag as neutral site in metadata

---

### Extra Innings / Overtime

**Scenario:** Game goes beyond regulation

**Handling:**

- ✅ High scores are normal
- Don't flag as outliers
- Include `extra_innings: true` in metadata

---

### Youth / High School Data

**Scenario:** Different thresholds needed

**Handling:**

- Define separate validation profiles
- Adjust pitch velocity ranges
- Account for smaller fields (exit velo)

```typescript
const YOUTH_THRESHOLDS = {
  MIN_PITCH_VELOCITY: 30,
  MAX_PITCH_VELOCITY: 85,
  // ...
};
```

---

## Common Data Quality Issues by Source

### ESPN API

- ✅ Good: Real-time updates, comprehensive
- ❌ Issues: Rate limiting, incomplete college coverage
- **Fix:** Use as tertiary source, prefer NCAA/SportsDataIO

### NCAA Stats

- ✅ Good: Official data, complete box scores
- ❌ Issues: Delayed updates, inconsistent formatting
- **Fix:** Batch scraping at night, normalize team names

### SportsDataIO

- ✅ Good: Reliable, well-structured
- ❌ Issues: Expensive, limited free tier
- **Fix:** Cache aggressively, use for critical games

### Custom Web Scraping

- ✅ Good: Can access any source
- ❌ Issues: Fragile to HTML changes, incomplete data
- **Fix:** High confidence threshold (0.9+), manual review

---

## Validation Rule Priorities

**Critical (Auto-Reject):**

1. Negative scores
2. Future timestamps (for final games)
3. Missing required fields
4. Invalid probability ranges

**High Priority (Flag Strongly):**

1. Extreme outliers (>7 MADs)
2. Box score inconsistencies
3. Season alignment errors

**Medium Priority (Warning):**

1. Moderate outliers (5-7 MADs)
2. Low confidence scores
3. Missing optional fields

**Low Priority (Log Only):**

1. Minor outliers (3-5 MADs)
2. Formatting inconsistencies
3. Unusual but valid data

---

## Conclusion

These validation rules are designed to:

1. **Catch real errors** (impossible values, calculation bugs)
2. **Flag suspicious data** (extreme outliers, inconsistencies)
3. **Preserve legitimate outliers** (career-high performances)
4. **Maintain data provenance** (source URLs, timestamps)

Remember: **When in doubt, flag for review rather than delete.**
