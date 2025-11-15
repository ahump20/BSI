# Competitive Advantage Gap Plan

## Overview
This document outlines a phased plan to close critical capability gaps identified for BlazeSportsIntel's college baseball intelligence platform. The approach embraces our mobile-first, data-driven, dark-mode defaults while respecting the modular Next.js 15 + React 19 architecture, Prisma/Postgres data layer, and Redis-backed live data caching.

## 1. Predictive Intelligence Roadmap
- **Player Development Trajectories**
  - Extend Prisma models with longitudinal player feature tables (strength metrics, pitch velocity trends, defensive metrics).
  - Train gradient boosted models (XGBoost/LightGBM) via scheduled Cloudflare Worker jobs pulling labeled outcomes (MLB draft position, year-over-year WAR equivalents).
  - Serve projections through `/api/v1/players/[id]/projection` with Redis caching and clear free vs. Diamond Pro access tiers.
- **Injury Risk Scoring**
  - Instrument pitch/workload ingestion to enforce <1 minute TTL caches for live bullpen usage.
  - Deploy survival-analysis models (e.g., Cox regression) that compute risk deltas based on pitch counts, rest days, and biomechanics flags.
  - Surface alerts in Live Game Center and bullpen dashboards with “Why” explanations for trust.
- **MLB Draft Projection**
  - Integrate historical draft dataset into Postgres, keyed by NCAA player IDs.
  - Build stacked regression (statistical + scouting report embeddings) to predict expected draft round.
  - Publish cohort trends on `/baseball/ncaab/draft` with interactive charts.
- **Game Outcome Models**
  - Replace static EPA with an online-learning win probability model updating after each game.
  - Use Monte Carlo simulations seeded by learned run expectancy matrix and bullpen fatigue scores.
  - Expose uncertainty bands in the Live Game Center using Tailwind-powered sparkline components.

## 2. Personalization Engine
- Implement Clerk-enhanced profiles storing followed teams/players with preference weights.
- Launch an event scoring service that ranks notifications by user affinity, importance, and recency decay.
- Build configurable notification templates (scores, injury alerts, projections) with opt-in compliance.
- Use a federated recommendation service to tailor the home feed, defaulting to Diamond Pro exclusives for premium users.

## 3. Historical Research Toolkit
- Backfill schedule/event tables with 15+ years of NCAA data, indexed for full-text search.
- Ship `/api/v1/research/query` endpoints supporting filters: elimination games, coaching decisions, umpire assignments.
- Provide UI modules: elimination matchup explorer, cross-season player lookup, bullpen usage timelines, umpire scorecards with leverage metrics.
- Gate advanced exports (CSV/JSON) to Diamond Pro.

## 4. Actionable Intelligence Layer
- Create a rules engine (Edge runtime) that translates raw metrics into narratives (e.g., pitcher fatigue, exit velocity drops).
- Embed callouts in game cards and team pages with contextual tooltips.
- Offer DFS-friendly projections via opt-in reports that exclude betting guidance while highlighting lineup optimizations.

## 5. Community Flywheel
- Add prediction contests tied to major events (e.g., CWS) with leaderboard persistence in Redis and long-term storage in Postgres.
- Enable user-generated scouting reports using moderated rich text, linked to team/player profiles.
- Implement debate threads focused on key plays, leveraging phase-gated feature flags.
- Introduce shared watchlists for prospects with collaborative editing permissions.

## 6. Multi-Sport Context Engine
- Extend core schemas with a `sport` discriminator to unify recruiting records across football, baseball, and other sports.
- Surface dual-sport insights in recruit profiles (impact on availability, strength/conditioning load).
- Build department health dashboards aggregating performance, NIL commitments, and transfer portal activity.
- Model transfer ripple effects with dependency graphs stored in Neo4j or Postgres adjacency lists.

## 7. Real-Time Situational Awareness
- Integrate weather APIs with microservice publishing updates to Redis for Live Game overlays.
- Monitor lineup/injury feeds (beat writers, official releases) via ingestion workers with confidence scoring.
- Display umpire crew assignments alongside historical tendency metrics within game previews.
- Automate bullpen and rotation alerts based on real-time workloads and travel schedules.

## 8. In-Game Win Probability System (Flagship Gap)
- Collect pitch-level data streams, normalizing to pitch outcome events and run state transitions.
- Train hybrid models combining empirical run expectancy with reinforcement learning for decision-point evaluation.
- Update probabilities pitch-by-pitch with Monte Carlo uncertainty envelopes; render in Live Game Center with accessible contrast.
- Offer API endpoints for media partners with strict rate limiting and analytics tracking.

## 9. Pitcher Health & Workload Monitoring (Secondary Flagship)
- Aggregate pitch counts, velocity, mechanics markers, and recovery intervals into time-series datasets.
- Build risk classification tiers surfaced in coach dashboards and fan alerts.
- Provide proactive intervention suggestions (rest schedules, role changes) using explainable AI outputs.
- Coordinate with compliance to anonymize sensitive data where required; expose aggregated insights to general users.

## Implementation Phasing
1. **Phase 1 (0-3 months)**: Data ingestion hardening, schema extensions, baseline personalization, MVP win probability prototype.
2. **Phase 2 (3-6 months)**: Injury risk models, historical research UI, actionable narratives, community beta features.
3. **Phase 3 (6-12 months)**: Multi-sport context integration, full personalization engine, DFS optimizer, production-grade win probability service.
4. **Phase 4 (12+ months)**: Continuous model retraining pipelines, cross-sport expansion readiness, premium analytics bundles.

## Success Metrics
- Win probability model accuracy vs. historical outcomes (<5% calibration error).
- Injury risk alert precision/recall validated against real injury reports.
- Personalization-driven retention lift (DAU/MAU +15%).
- Historical research query volume and Diamond Pro conversion rate.
- Community engagement (contest entries, scouting report submissions) growth month-over-month.

## Next Steps
- Socialize this plan with product, data science, and engineering leads.
- Create GitHub issues for each major workstream with labels (foundation, MVP, polish, off-season).
- Update `MIGRATION_LOG.md` and `/product/ux/specs` as new modules progress through design.
