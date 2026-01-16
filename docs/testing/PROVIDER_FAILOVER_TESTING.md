# Provider Failover Testing Guide

## Overview

This document provides comprehensive instructions for testing the provider failover logic implemented in `workers/ingest/index.ts`. The failover system uses a circuit breaker pattern to ensure high availability when fetching sports data from multiple providers.

## Architecture

### Provider Priority

1. **SportsDataIO** (Primary)
   - Highest quality data
   - Paid tier with rate limits
   - Circuit breaker: 3 consecutive failures → 60s cooldown

2. **NCAA API** (Secondary)
   - Free NCAA-specific data
   - Circuit breaker: 3 consecutive failures → 60s cooldown

3. **ESPN** (Tertiary)
   - Last resort fallback
   - Higher threshold: 5 consecutive failures → 120s cooldown

### Circuit Breaker Behavior

```
Request → Success → Reset consecutive failures counter
       ↓
       Failure → Increment counter
              ↓
              Counter ≥ threshold? → Trip circuit breaker
              ↓                      ↓
              No: Retry              Yes: Mark unavailable, try next provider
                                     ↓
                                     Wait cooldown period
                                     ↓
                                     Reset circuit, try again
```

## Testing Strategy

### Phase 1: Unit Tests (Local)

**Location**: `tests/integration/provider-failover.test.ts`

**Run**:

```bash
npm run test:integration:failover
```

**Coverage**:

- ✅ Basic failover (primary → secondary → tertiary)
- ✅ Circuit breaker trip/reset logic
- ✅ Success recovery behavior
- ✅ Statistics tracking
- ✅ Edge cases (all providers down, rapid failures)
- ✅ Production scenarios (rate limits, maintenance windows)

**Expected Results**:

- All 22 tests passing
- ~95% code coverage of failover logic

### Phase 2: Deployment Testing (Staging)

#### 2.1 Normal Operation Validation

**Prerequisites**:

```bash
# Deploy ingest worker to staging
cd workers/ingest
wrangler deploy --env staging
```

**Test Steps**:

1. Trigger scheduled cron job manually:

   ```bash
   wrangler cron trigger --env staging "*/15 * * * *"
   ```

2. Monitor logs:

   ```bash
   wrangler tail --env staging --format pretty
   ```

3. Expected output:

   ```
   [Ingest] Starting scheduled game sync...
   [Provider] Using SportsDataIO (primary)
   [NCAA] Successfully fetched 247 games
   [Ingest] Sync complete: 247 games updated
   ```

4. Verify Analytics Engine:

   ```bash
   npm run monitor:providers
   ```

   Expected metrics:
   - SportsDataIO: ~100% success rate
   - NCAA_API: 0 requests (not needed)
   - ESPN: 0 requests (not needed)

#### 2.2 Primary Failure Simulation

**Simulate API Key Revocation**:

```bash
# Temporarily corrupt SportsDataIO key
wrangler secret put SPORTSDATA_API_KEY --env staging
# Enter: invalid_key_for_testing
```

**Trigger sync**:

```bash
wrangler cron trigger --env staging "*/15 * * * *"
```

**Expected logs**:

```
[Provider] Using SportsDataIO (primary)
[SportsDataIO] Error: 401 Unauthorized
[Provider] SportsDataIO failed (1/3)
[Provider] Retrying with SportsDataIO...
[SportsDataIO] Error: 401 Unauthorized
[Provider] SportsDataIO failed (2/3)
[Provider] Retrying with SportsDataIO...
[SportsDataIO] Error: 401 Unauthorized
[Provider] SportsDataIO failed (3/3) - Circuit breaker tripped
[Provider] Failing over to NCAA_API (secondary)
[NCAA] Successfully fetched 247 games
[Ingest] Sync complete: 247 games updated
```

**Validation**:

```bash
npm run monitor:providers
```

Expected:

- SportsDataIO: 3 failed requests, circuit breaker tripped
- NCAA_API: 1 successful request, 100% success rate
- ESPN: 0 requests

#### 2.3 Secondary Failure Simulation

**Simulate dual failure**:

```bash
# Corrupt both SportsDataIO and NCAA_API keys
wrangler secret put SPORTSDATA_API_KEY --env staging
# Enter: invalid_key_primary

wrangler secret put NCAA_API_KEY --env staging
# Enter: invalid_key_secondary
```

**Expected logs**:

```
[Provider] SportsDataIO circuit breaker tripped (cooldown: 57s)
[Provider] Trying NCAA_API (secondary)
[NCAA] Error: 401 Unauthorized
[Provider] NCAA_API failed (1/3)
... (after 3 failures)
[Provider] NCAA_API circuit breaker tripped
[Provider] Trying ESPN (tertiary)
[ESPN] Successfully fetched 247 games
[Ingest] Sync complete: 247 games updated
```

**Validation**:

- SportsDataIO: Circuit breaker active
- NCAA_API: Circuit breaker active
- ESPN: 100% success rate

#### 2.4 Circuit Breaker Reset

**Wait for cooldown period**:

```bash
# Wait 61 seconds (SportsDataIO 60s cooldown + buffer)
sleep 61

# Restore valid API key
wrangler secret put SPORTSDATA_API_KEY --env staging
# Enter: <valid_key>

# Trigger sync
wrangler cron trigger --env staging "*/15 * * * *"
```

**Expected logs**:

```
[Provider] SportsDataIO circuit breaker reset (60s elapsed)
[Provider] Using SportsDataIO (primary)
[SportsDataIO] Successfully fetched 247 games
[Ingest] Sync complete: 247 games updated
```

**Validation**:

- SportsDataIO: Circuit breaker reset, serving traffic again
- Consecutive failures counter: 0

#### 2.5 Total Failure Scenario

**Simulate all providers down**:

```bash
# Corrupt all three API keys
wrangler secret put SPORTSDATA_API_KEY --env staging
wrangler secret put NCAA_API_KEY --env staging
wrangler secret put ESPN_API_KEY --env staging
```

**Expected logs**:

```
[Provider] All providers exhausted after circuit breaker trips
[Error] Failed to fetch games: No available providers
[Ingest] Sync failed - will retry in 15 minutes
```

**Validation**:

- All providers: Circuit breakers tripped
- No data ingested (expected behavior)
- Cron will retry on next schedule

### Phase 3: Production Monitoring

#### 3.1 Continuous Health Monitoring

**Setup Grafana Dashboard**:

```bash
# Import dashboard template
curl -X POST https://grafana.yourdomain.com/api/dashboards/db \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -d @grafana/provider-health-dashboard.json
```

**Key Metrics to Track**:

1. **Success Rate**: Should be >99% aggregate across all providers
2. **Circuit Breaker Trips**: Should be <1 per day
3. **Response Time**: Should be <2000ms p95
4. **Failover Events**: Track when secondary/tertiary providers are used

#### 3.2 Automated Monitoring

**Run live monitoring**:

```bash
npm run monitor:providers -- --live
```

**Output**:

```
🔴 Live Monitoring Mode - Last Update: 3:45:23 PM

📊 Provider Health Metrics

┌─────────────────┬──────────┬─────────┬────────┬────────────┬────────────┬───────────────┐
│ Provider        │ Requests │ Success │ Failed │ CB Trips   │ Avg RT (ms)│ Success Rate  │
├─────────────────┼──────────┼─────────┼────────┼────────────┼────────────┼───────────────┤
│ SportsDataIO    │     1247 │    1243 │      4 │          1 │        842 │ 🟢 99.68%     │
│ NCAA_API        │       12 │      12 │      0 │          0 │        623 │ 🟢 100.00%    │
│ ESPN            │        0 │       0 │      0 │          0 │          0 │ N/A           │
└─────────────────┴──────────┴─────────┴────────┴────────────┴────────────┴───────────────┘

⏱️  Last Failure Times:

   SportsDataIO: 12 minutes ago (2025-10-13T19:33:00Z)
   NCAA_API: No failures recorded ✅
   ESPN: No failures recorded ✅

✅ No anomalies detected - all providers healthy

📈 Overall Summary:

   Total Requests: 1,259
   Successful: 1,255 (99.68%)
   Failed: 4
   Circuit Breaker Trips: 1
   Primary Provider (SportsDataIO): 99.68%

⏳ Refreshing in 30 seconds...
```

#### 3.3 Alert Configuration

**Cloudflare Workers Analytics + PagerDuty**:

```typescript
// Add to workers/ingest/index.ts
if (env.ANALYTICS) {
  const successRate = successfulRequests / totalRequests;

  // Alert if success rate drops below 95%
  if (successRate < 0.95) {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token token=${env.PAGERDUTY_TOKEN}`,
      },
      body: JSON.stringify({
        routing_key: env.PAGERDUTY_ROUTING_KEY,
        event_action: 'trigger',
        payload: {
          summary: `Provider success rate: ${(successRate * 100).toFixed(2)}%`,
          severity: 'error',
          source: 'ingest-worker',
          custom_details: {
            successRate,
            failedProviders: getFailedProviders(),
          },
        },
      }),
    });
  }
}
```

## Validation Criteria

### ✅ System is Healthy When:

1. **Primary Provider Dominance**
   - SportsDataIO handles >95% of requests
   - NCAA_API and ESPN are used only during failures

2. **Low Failure Rate**
   - Overall success rate >99%
   - Circuit breaker trips <1 per day

3. **Fast Recovery**
   - Circuit breakers reset within configured timeout
   - Primary provider resumes after recovery

4. **No Data Loss**
   - Every scheduled sync completes successfully
   - Failover happens transparently

### ⚠️ System Needs Attention When:

1. **Elevated Failure Rate**
   - Success rate <95%
   - > 3 circuit breaker trips per day

2. **Persistent Failover**
   - Secondary/tertiary providers handling >10% of requests
   - Primary provider not recovering after cooldown

3. **High Latency**
   - p95 response time >5000ms
   - Timeouts occurring frequently

### 🚨 Critical Issues:

1. **All Providers Down**
   - No successful requests in 30+ minutes
   - Data ingestion completely stopped

2. **Data Inconsistency**
   - Different providers returning conflicting data
   - Database integrity violations

## Troubleshooting Guide

### Issue: Primary provider keeps failing

**Check**:

1. API key validity: `curl -H "Authorization: Bearer $KEY" https://api.sportsdata.io/health`
2. Rate limit status: Check dashboard for 429 responses
3. Account status: Verify subscription is active

**Resolution**:

- If rate limited: Increase cooldown period or reduce cron frequency
- If key invalid: Rotate API key via `wrangler secret put`
- If account issue: Contact provider support

### Issue: Circuit breaker not resetting

**Check**:

```bash
# View current circuit breaker state
npm run monitor:providers

# Check logs for reset events
wrangler tail --search "circuit breaker reset"
```

**Resolution**:

- Verify cooldown period configuration
- Check system clock synchronization
- Manually reset via admin endpoint (if implemented)

### Issue: Secondary provider has higher success rate

**Check**:

- Compare data quality between providers
- Check if primary is experiencing degraded performance
- Review recent provider status pages

**Resolution**:

- Temporarily swap provider priorities if SportsDataIO has ongoing issues
- Add data quality checks to prefer higher-quality responses

## Test Checklist

Before marking provider failover as production-ready:

- [ ] Unit tests passing (22/22)
- [ ] Primary provider serving >95% of requests
- [ ] Successful failover to secondary on primary failure
- [ ] Successful failover to tertiary on dual failure
- [ ] Circuit breaker trips after threshold
- [ ] Circuit breaker resets after cooldown
- [ ] Primary resumes after recovery
- [ ] Analytics tracking all events correctly
- [ ] Monitoring dashboard displays live metrics
- [ ] Alerting triggers on anomalies
- [ ] Documentation reviewed and accurate

## Maintenance

### Weekly Tasks:

- Review provider health metrics
- Check for any degraded performance trends
- Verify alert thresholds are appropriate

### Monthly Tasks:

- Analyze failover patterns
- Update provider priorities if needed
- Review and optimize cooldown periods

### Quarterly Tasks:

- Load test all providers
- Verify failover under high traffic
- Update provider contact information

## References

- Ingest Worker: `workers/ingest/index.ts`
- Unit Tests: `tests/integration/provider-failover.test.ts`
- Monitoring Script: `scripts/monitor-provider-health.ts`
- Analytics Engine: [Cloudflare Dashboard](https://dash.cloudflare.com/analytics-engine)
- SportsDataIO Docs: https://sportsdata.io/developers/api-documentation
- NCAA API Docs: https://ncaa.org/sports/api
- ESPN API Docs: http://www.espn.com/apis/devcenter/docs

---

**Last Updated**: 2025-10-13
**Owner**: Blaze Sports Intel Engineering
**Contact**: austin@blazesportsintel.com
