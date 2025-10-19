# Decision Primitives & KPI Guardrails

This reference codifies the decision primitives we surface to users and the metrics we monitor to prove value and reliability.

## Decision Primitives

Each primitive must be backed by live model outputs with audit trails referencing pitch-by-pitch data. Publish the recommended coaching cue whenever the trigger condition evaluates to true.

### Protect Arm
- **Trigger**: `risk >= 70` **and** `pitches_3d >= 180`
- **Recommendation**: "Reduce next start workload."
- **Context**: Limits fatigue-driven injury risk for high-volume arms by constraining workload targets in subsequent appearances.

### Late Edge
- **Trigger**: `opp_bullpen_freshness <= 30` **and** `tie_after_7`
- **Recommendation**: "+7–10% W% if close; work counts."
- **Context**: Encourages aggressive plate discipline and pitch sequencing when opponent relief corps is depleted in late innings.

### Cold Bat Watch
- **Trigger**: `EV_10d <= EV_60d - 3.5 mph` **and** `Z-Contact%_10d <= Z-Contact%_60d - 5%`
- **Recommendation**: "Slump/injury watch."
- **Context**: Flags hitters whose recent contact quality and zone contact deteriorate enough to warrant mechanical or health review.

## Core KPIs

Track these metrics weekly and feed them into the product operations dashboard. All thresholds assume mobile-first usage and should be monitored for both free and Diamond Pro cohorts.

### Model Quality
- **Brier Score** (↓): Maintain probabilistic accuracy for win and outcome models.
- **Calibration Error** (↓): Validate that predicted win probabilities align with realized outcomes.
- **Lift vs Baseline** (↑): Quantify improvement over public betting lines or naive models.

### User Value
- **Alert CTR** (↑): Measures engagement with push and in-app decision alerts.
- **Hides** (↓): Monitor opt-outs or dismissals to gauge alert fatigue.
- **Saves/Session** (↑): Track how often users add items to watchlists per session.
- **7-Day Return Rate** (↑): Primary retention signal for both subscription tiers.

### Network Effects
- **Contest Entries** (↑): Count entries submitted via co-branded contests and pick'em games.
- **UGC Scout Reports/Week** (↑): Volume of community-sourced scouting notes that pass moderation.
- **Shared Watchlists** (↑): Measures collaborative scouting activity between teammates and analysts.

### Speed & Reliability
- **P95 Query Latency < 1s**: Upper bound for user-triggered queries across the mobile app.
- **Live W% Latency < 1s**: Ensure win probability updates land within one second of each scoring event.

