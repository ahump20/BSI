# Analytics Events Taxonomy

## Overview

This document defines the event taxonomy for Blaze Sports Intel. Events are sent to Datadog RUM and Analytics Engine for monitoring user behavior, performance, and quality.

## Event Categories

### 1. Page Views

**Event**: `route_render`

**Properties**:
- `route` (string): The page route (e.g., `/`, `/features`, `/copilot`)
- `sport` (string, optional): Sport context (`baseball`, `football`, `basketball`, `multi`)
- `timestamp` (ISO 8601): Event timestamp

**Example**:
```typescript
recordRuntimeEvent('route_render', {
  route: '/copilot',
  sport: 'multi'
});
```

---

### 2. User Interactions

#### 2.1 CTA Clicks

**Event**: `cta_click`

**Properties**:
- `cta_name` (string): CTA identifier (e.g., `view_analytics`, `launch_copilot`, `start_trial`)
- `cta_location` (string): Location on page (`hero`, `pricing_card`, `footer`)
- `route` (string): Current page route
- `destination` (string): Target URL

**Example**:
```typescript
recordRuntimeEvent('cta_click', {
  cta_name: 'view_analytics',
  cta_location: 'hero',
  route: '/',
  destination: '/features'
});
```

#### 2.2 Copilot Queries

**Event**: `copilot_query`

**Properties**:
- `query_hash` (string): SHA-256 hash of query (for privacy)
- `provider` (string): AI provider used (`auto`, `gemini`, `gpt5`, `claude`)
- `response_latency_ms` (number): Response time in milliseconds
- `source_count` (number): Number of sources cited
- `query_length` (number): Character count of query

**Example**:
```typescript
recordRuntimeEvent('copilot_query', {
  query_hash: 'a1b2c3d4e5f6...',
  provider: 'gemini',
  response_latency_ms: 823,
  source_count: 3,
  query_length: 45
});
```

#### 2.3 Search

**Event**: `search`

**Properties**:
- `search_term_hash` (string): SHA-256 hash of search term
- `search_location` (string): Where search initiated (`header`, `copilot`, `dashboard`)
- `results_count` (number): Number of results returned

**Example**:
```typescript
recordRuntimeEvent('search', {
  search_term_hash: 'x7y8z9a0b1c2...',
  search_location: 'header',
  results_count: 12
});
```

---

### 3. Errors & Quality

#### 3.1 Client Errors

**Event**: `error`

**Properties**:
- `error_type` (string): Error category (`api_error`, `render_error`, `validation_error`)
- `error_message` (string): Error message (sanitized, no PII)
- `route` (string): Page where error occurred
- `component` (string, optional): Component name
- `stack_trace` (string, optional): First 500 chars of stack trace

**Example**:
```typescript
recordRuntimeEvent('error', {
  error_type: 'api_error',
  error_message: 'Failed to fetch CFP rankings',
  route: '/CFP',
  component: 'Top25Board'
});
```

#### 3.2 Data Source Errors

**Event**: `data_source_error`

**Properties**:
- `source` (string): Data source identifier (e.g., `cfp_worker`, `statcast_api`, `d1_historical`)
- `error_code` (string): HTTP status or error code
- `latency_ms` (number): Time to failure
- `fallback_used` (boolean): Whether fallback source was used

**Example**:
```typescript
recordRuntimeEvent('data_source_error', {
  source: 'statcast_api',
  error_code: '503',
  latency_ms: 5000,
  fallback_used: true
});
```

---

### 4. Performance Metrics

#### 4.1 Core Web Vitals

**Event**: `web_vital`

**Properties**:
- `metric` (string): Metric name (`LCP`, `FID`, `CLS`, `FCP`, `TTFB`, `INP`)
- `value` (number): Metric value
- `rating` (string): Performance rating (`good`, `needs-improvement`, `poor`)
- `route` (string): Page route
- `device_type` (string): Device category (`mobile`, `tablet`, `desktop`)

**Example**:
```typescript
recordRuntimeEvent('web_vital', {
  metric: 'LCP',
  value: 2234,
  rating: 'good',
  route: '/features',
  device_type: 'mobile'
});
```

#### 4.2 Data Source Latency

**Event**: `data_source_latency`

**Properties**:
- `source` (string): Data source identifier
- `latency_ms` (number): Response time in milliseconds
- `cached` (boolean): Whether served from cache
- `cache_age_seconds` (number, optional): Age of cached data

**Example**:
```typescript
recordRuntimeEvent('data_source_latency', {
  source: 'baseball_rankings_worker',
  latency_ms: 87,
  cached: true,
  cache_age_seconds: 120
});
```

---

### 5. User Authentication & Account

#### 5.1 Sign Up

**Event**: `signup_start` / `signup_complete`

**Properties**:
- `tier` (string, optional): Selected tier (`scout`, `coach`, `organization`)
- `referral_source` (string, optional): Referral source (`organic`, `cta_home`, `cta_features`)

**Example**:
```typescript
recordRuntimeEvent('signup_complete', {
  tier: 'coach',
  referral_source: 'cta_features'
});
```

#### 5.2 Subscription Changes

**Event**: `subscription_upgrade` / `subscription_downgrade` / `subscription_cancel`

**Properties**:
- `from_tier` (string): Previous tier
- `to_tier` (string): New tier
- `reason` (string, optional): Reason for change

**Example**:
```typescript
recordRuntimeEvent('subscription_upgrade', {
  from_tier: 'scout',
  to_tier: 'coach'
});
```

---

### 6. Feature Usage

#### 6.1 Dashboard Views

**Event**: `dashboard_view`

**Properties**:
- `dashboard_name` (string): Dashboard identifier (e.g., `cfp_control_center`, `mlb_statcast`, `lei_clutch`)
- `sport` (string): Sport category
- `filters_applied` (number): Count of active filters

**Example**:
```typescript
recordRuntimeEvent('dashboard_view', {
  dashboard_name: 'cfp_control_center',
  sport: 'football',
  filters_applied: 2
});
```

#### 6.2 Historical Query

**Event**: `historical_query`

**Properties**:
- `sport` (string): Sport queried
- `season` (string): Season/year
- `results_found` (boolean): Whether data was available
- `query_type` (string): Type of query (`game`, `player`, `team`, `comparison`)

**Example**:
```typescript
recordRuntimeEvent('historical_query', {
  sport: 'baseball',
  season: '2023',
  results_found: true,
  query_type: 'game'
});
```

#### 6.3 Report Export

**Event**: `report_export`

**Properties**:
- `format` (string): Export format (`pdf`, `csv`, `json`)
- `report_type` (string): Report type (e.g., `scouting_packet`, `standings`, `player_profile`)
- `size_kb` (number): File size in KB

**Example**:
```typescript
recordRuntimeEvent('report_export', {
  format: 'pdf',
  report_type: 'scouting_packet',
  size_kb: 2048
});
```

---

### 7. Contact & Support

**Event**: `contact_form_submit`

**Properties**:
- `subject` (string): Form subject category
- `tier` (string, optional): Tier of interest

**Example**:
```typescript
recordRuntimeEvent('contact_form_submit', {
  subject: 'api',
  tier: 'organization'
});
```

---

## Data Privacy

- **No PII**: Never log email addresses, names, IP addresses, or other personally identifiable information
- **Hash Sensitive Data**: Search queries and copilot queries are SHA-256 hashed before logging
- **Aggregate Only**: All analytics are aggregated and anonymized for reporting
- **GDPR Compliant**: Users can request deletion via `/data-request`

## Implementation

Events are recorded using the `recordRuntimeEvent` utility:

```typescript
import { recordRuntimeEvent } from '../lib/observability/datadog-runtime';

recordRuntimeEvent('event_name', {
  property1: 'value1',
  property2: 123
});
```

## Monitoring & Alerts

### Performance Alerts

- **LCP > 2.5s** (mobile): Alert if p95 exceeds threshold for 5+ minutes
- **INP > 200ms**: Alert if p95 exceeds threshold
- **API Latency > 1s**: Alert if any data source p95 latency > 1000ms
- **Error Rate > 1%**: Alert if error rate exceeds 1% over 5-minute window

### Business Alerts

- **Signup Drop**: Alert if daily signups drop >50% compared to 7-day average
- **Copilot Errors**: Alert if copilot error rate > 5%
- **Data Source Downtime**: Alert if any critical data source is down for >2 minutes

## Retention

- **Raw Events**: 30 days in Datadog
- **Aggregated Metrics**: 13 months
- **Critical Events** (errors, security): 12 months

---

## Example Dashboard Queries

### Daily Active Users by Sport
```sql
SELECT count(DISTINCT user_id)
FROM route_render
WHERE sport IN ('baseball', 'football', 'basketball')
GROUP BY sport, date_trunc('day', timestamp)
```

### Copilot Performance by Provider
```sql
SELECT provider,
       avg(response_latency_ms) as avg_latency,
       percentile(response_latency_ms, 0.95) as p95_latency,
       count(*) as query_count
FROM copilot_query
WHERE timestamp > now() - INTERVAL '7 days'
GROUP BY provider
```

### Core Web Vitals Compliance
```sql
SELECT route,
       device_type,
       avg(CASE WHEN metric = 'LCP' THEN value END) as avg_lcp,
       avg(CASE WHEN metric = 'INP' THEN value END) as avg_inp,
       avg(CASE WHEN metric = 'CLS' THEN value END) as avg_cls
FROM web_vital
WHERE timestamp > now() - INTERVAL '24 hours'
GROUP BY route, device_type
```
