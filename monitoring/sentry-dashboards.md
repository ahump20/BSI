# Sentry Observability Runbook

**Objective:** Track Core Web Vitals and ingestion health for BlazeSportsIntel web properties.

## Instrumentation Summary

- `src/monitoring/sentry.ts` initializes Sentry only when `VITE_SENTRY_DSN` is provided. PII is scrubbed automatically.
- `src/monitoring/webVitals.ts` pushes CLS/FCP/FID/INP/LCP/TTFB as `core-web-vital:*` info events tagged with the metric name and rating.
- `src/monitoring/ingestion.ts` records `ingestion:success` info messages and captures exceptions for failures with contextual metadata.

## Dashboards

Create two dashboards inside Sentry → BlazeSportsIntel project:

1. **Core Web Vitals (Front Door)**
   - **Chart:** Timeseries on event count filtered by `message:core-web-vital*` grouped by `tags.metric`.
   - **Widget:** Table showing 95th percentile `extra.value` for each metric; highlight if CLS ≥ 0.1 or INP ≥ 200 ms.
   - **Alert:** Issue alert when `count()` of `core-web-vital:CLS` with `extra.value >= 0.1` exceeds 5 within 10 minutes. Route to `#ops-alerts` in Slack.

2. **Ingestion Reliability**
   - **Chart:** Failure rate using `count()` of events with `tags.scope:data-ingestion` and level `error` divided by total ingestion events.
   - **Widget:** List latest ingestion failures showing `extra.endpoint`, `extra.status`, and `extra.metadata.eventCount`.
   - **Alert:** Notify PagerDuty service **Data Pipeline** when failures ≥ 3 over 5 minutes or status >= 500.

## Alert Routing

- **Slack:** Webhook `SLACK_ALERT_WEBHOOK` configured in Sentry → Alerts → Integrations. Route web-vital alerts to `#ops-alerts`.
- **PagerDuty:** Service `Diamond-Insights-Data`. Link via Sentry integration; use the `Ingestion Reliability` alert condition above.

## Success Metrics

- **Core Web Vitals:**
  - CLS p95 < 0.1
  - LCP p75 < 2.5s
  - INP p75 < 200ms
- **Ingestion:**
  - Error budget: ≤ 0.5% failed requests per rolling 7-day window.
  - MTTR < 15 minutes (tracked via Sentry Issue durations).

## Runbook

1. **Investigate Alert:** Open alert → linked Sentry issue. Review breadcrumbs & `extra.metadata` payload.
2. **Correlate with Deploys:** Check release field (`__SENTRY_RELEASE__`). Roll back via Vercel if regression.
3. **Escalate:** If ingestion failure persists > 10 minutes or correlates with upstream outage, escalate to Data Provider on-call (Context7) after notifying PagerDuty.
4. **Postmortem:** Document in `MIGRATION_LOG.md` and create follow-up issue with root cause + preventive fix.
