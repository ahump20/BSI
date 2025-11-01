# Validation Rules

## Range Validation
- **Batting average (BA)**: `0 ≤ BA ≤ 1.000`. Applies to individual player lines and aggregated NCAA team stats. Values outside this window are flagged and marked for manual investigation.
- **Pitch velocity**: `40 mph ≤ velocity ≤ 110 mph`. Derived from TrackMan/Hawkeye samples and ESPN pitch tables. Anything outside is classified as impossible for Division I/MLB arms.
- **Exit velocity**: `0 mph ≤ exit velocity ≤ 120 mph`. Tracked for batted balls when available.
- **ERA**: Must be non-negative. Extreme values trigger MAD outlier warnings but are not auto-filtered.

## Completeness
Required metadata for every payload:
- `game_id`, `timestamp`, `home_team`, `away_team`, `final_score` for ESPN feeds.
- `team_id`, `overall_record`, `conference_record` for NCAA standings.
- `pitch_id`, `pitcher_id`, `velocity`, `release_point`, `timestamp` for pitch tracking.
- `simulation_id`, `iterations`, `results` for simulator output.

Missing fields = `fail` status with direct scraper remediation guidance.

## Consistency Checks
- ESPN box scores: Play-by-play totals must equal the box score final tallies for runs/hits/RBI.
- NCAA records: Overall wins/losses must be ≥ conference wins/losses.
- Simulator outcomes: Sum of `winProbability` across outcomes must equal 1.0 (±0.02 tolerance for rounding).

## Temporal Rules
- All timestamps converted and stored in America/Chicago. Future timestamps or invalid formats return `warn` or `fail` statuses.
- Season year alignment: ESPN/NCAA payloads must match the calendar year of the timestamp (with July offseason tolerance flagged as `warn`).

## MAD-Based Outlier Detection
- Applies to batting averages, ERA, pitch velocities, exit velocities, and simulator scoring distributions.
- Uses Modified Z-Score with threshold `|z| ≥ 3.5`. Outliers are flagged (`warn`) but retained for human review. Severity escalates above `|z| ≥ 5.25`.

## Output Expectations
- Every QC report includes pass/fail per check, flagged outliers, before/after record counts, distribution shifts relative to the stored baseline, and actionable recommendations tailored to the data source.
- Confidence score reflects penalties for failures, warnings, and outlier density. Values closer to `1.0` indicate safe ingestion.

## Edge Cases
- Small sample sizes (<5 records) bypass MAD detection to avoid noisy alerts.
- Doubleheaders on New Year’s week (Dec/Jan) will flag a temporal warning; manual override required.
- Simulator payloads allow a `draw` outcome for NFL scenarios even if the probability is zero for baseball data.
