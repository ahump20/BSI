# Reliability Guardrails — BlazeSportsIntel Web

## Service Boundaries

| Surface | Description | Owner |
| --- | --- | --- |
| Fan Experience | `/` live scoreboard + sport switcher | Frontend Platform |
| API Aggregation | `/api/football/scores` ingestion → redis cache | Data Platform |

## SLOs

### Fan Experience (Web Core)
- **Availability:** 99.5% over 30 days measured via Vercel uptime checks.
- **Performance:** p75 Core Web Vitals thresholds — LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **Error Budget:** 0.5% downtime (~3.6h/month). Consumed by unserved HTML or JS errors causing blank screen.

### API Aggregation (Ingestion)
- **Availability:** 99.0% (allows 7.3h downtime per month) measured via Sentry ingestion success/failure ratio.
- **Freshness:** 90% of scoreboard updates < 60s old during live windows.
- **Error Budget:** 1% failed pulls per rolling 7-day window. Breach triggers on-call escalation.

## Alerting Matrix

| Signal | Threshold | Channel |
| --- | --- | --- |
| Core Web Vitals CLS p95 ≥ 0.1 for 2 consecutive 5-min windows | Slack `#ops-alerts` | Frontend on-call |
| Sentry ingestion failures ≥ 3 in 5 minutes OR status ≥ 500 | PagerDuty `Diamond-Insights-Data` | Data on-call |
| Vercel uptime < 99.5% rolling 24h | Slack `#ops-alerts` + PagerDuty secondary | Shared |

## Response Policies

1. **Triage within 5 minutes** of alert receipt.
2. **Mitigation ETA:** 30 minutes for ingestion, 60 minutes for frontend regressions.
3. **Post-Incident Review:** within 48 hours; capture in `MIGRATION_LOG.md` + Confluence handoff.

## Maintenance Cadence

- Review SLO adherence monthly in analytics ops sync.
- Update thresholds prior to postseason traffic spikes.
- Re-run manual accessibility audit each quarter (see `/docs/accessibility/a11y-audit.md`).
