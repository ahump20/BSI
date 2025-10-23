# Validation Error Monitoring & Dashboards

This document describes monitoring, metrics, and alerting for the validation system.

## Overview

The validation system emits metrics and logs that can be monitored to ensure API health and catch issues early.

## Key Metrics to Monitor

### 1. Validation Error Rate

**Metric Name**: `validation_errors_total`
**Type**: Counter
**Labels**:
- `endpoint` - API endpoint path
- `error_type` - Type of validation error (body, query, params, headers)
- `field` - Field that failed validation

**Query (Prometheus)**:
```promql
rate(validation_errors_total[5m])
```

**Alert Threshold**: > 10 errors/second for 5 minutes

### 2. Rate Limit Exceeded

**Metric Name**: `rate_limit_exceeded_total`
**Type**: Counter
**Labels**:
- `endpoint` - API endpoint
- `ip` - Client IP (hashed for privacy)

**Query (Prometheus)**:
```promql
sum(rate(rate_limit_exceeded_total[5m])) by (endpoint)
```

**Alert Threshold**: > 50/minute indicates potential abuse

### 3. Environment Validation Failures

**Metric Name**: `env_validation_failures_total`
**Type**: Counter
**Labels**:
- `variable` - Environment variable name
- `severity` - critical, warning, info

**Query (Prometheus)**:
```promql
sum(env_validation_failures_total{severity="critical"})
```

**Alert Threshold**: > 0 (should never happen in production)

### 4. Request Validation Latency

**Metric Name**: `validation_duration_seconds`
**Type**: Histogram
**Labels**:
- `endpoint` - API endpoint

**Query (Prometheus)**:
```promql
histogram_quantile(0.99, validation_duration_seconds_bucket)
```

**Alert Threshold**: p99 > 50ms indicates schema complexity issues

## Dashboard Configuration

### Grafana Dashboard JSON

Create a dashboard with the following panels:

#### Panel 1: Validation Error Rate (Last 24h)
```json
{
  "title": "Validation Errors Rate",
  "type": "graph",
  "targets": [
    {
      "expr": "rate(validation_errors_total[5m])",
      "legendFormat": "{{endpoint}} - {{error_type}}"
    }
  ],
  "yaxes": [{
    "label": "errors/sec",
    "format": "short"
  }]
}
```

#### Panel 2: Top Failing Endpoints
```json
{
  "title": "Top 10 Endpoints with Validation Errors",
  "type": "table",
  "targets": [
    {
      "expr": "topk(10, sum(rate(validation_errors_total[1h])) by (endpoint))",
      "format": "table"
    }
  ]
}
```

#### Panel 3: Rate Limit Status
```json
{
  "title": "Rate Limited Requests",
  "type": "stat",
  "targets": [
    {
      "expr": "sum(rate(rate_limit_exceeded_total[5m]))"
    }
  ],
  "thresholds": {
    "steps": [
      { "value": 0, "color": "green" },
      { "value": 10, "color": "yellow" },
      { "value": 50, "color": "red" }
    ]
  }
}
```

#### Panel 4: Most Common Validation Errors
```json
{
  "title": "Common Validation Errors by Field",
  "type": "piechart",
  "targets": [
    {
      "expr": "topk(10, sum(validation_errors_total) by (field))"
    }
  ]
}
```

#### Panel 5: Validation Performance
```json
{
  "title": "Validation Latency (p50, p95, p99)",
  "type": "graph",
  "targets": [
    {
      "expr": "histogram_quantile(0.50, validation_duration_seconds_bucket)",
      "legendFormat": "p50"
    },
    {
      "expr": "histogram_quantile(0.95, validation_duration_seconds_bucket)",
      "legendFormat": "p95"
    },
    {
      "expr": "histogram_quantile(0.99, validation_duration_seconds_bucket)",
      "legendFormat": "p99"
    }
  ]
}
```

### Datadog Dashboard

**Dashboard Name**: BSI Validation Monitoring

**Widgets**:

1. **Timeseries: Validation Error Rate**
   ```
   sum:validation.errors.rate{*} by {endpoint}
   ```

2. **Query Value: Total Errors (24h)**
   ```
   sum:validation.errors.count{*}.as_count()
   ```

3. **Top List: Endpoints by Error Count**
   ```
   top(sum:validation.errors.count{*} by {endpoint}.as_count(), 10, 'sum', 'desc')
   ```

4. **Heatmap: Error Distribution by Hour**
   ```
   sum:validation.errors.count{*}.rollup(sum, 3600)
   ```

## Alert Rules

### Prometheus AlertManager

```yaml
# /monitoring/alerts/validation-alerts.yml

groups:
  - name: validation_alerts
    interval: 30s
    rules:
      - alert: HighValidationErrorRate
        expr: rate(validation_errors_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
          component: validation
        annotations:
          summary: "High validation error rate on {{ $labels.endpoint }}"
          description: "Endpoint {{ $labels.endpoint }} has {{ $value }} validation errors/sec"

      - alert: CriticalValidationErrors
        expr: rate(validation_errors_total[5m]) > 50
        for: 2m
        labels:
          severity: critical
          component: validation
        annotations:
          summary: "CRITICAL: Very high validation errors on {{ $labels.endpoint }}"
          description: "Endpoint {{ $labels.endpoint }} has {{ $value }} validation errors/sec. Possible attack or integration issue."

      - alert: EnvironmentValidationFailure
        expr: env_validation_failures_total{severity="critical"} > 0
        for: 1m
        labels:
          severity: critical
          component: environment
        annotations:
          summary: "CRITICAL: Environment validation failure"
          description: "Critical environment variable {{ $labels.variable }} failed validation"

      - alert: RateLimitAbuse
        expr: sum(rate(rate_limit_exceeded_total[5m])) by (endpoint) > 50
        for: 5m
        labels:
          severity: warning
          component: rate_limiting
        annotations:
          summary: "High rate limit rejections on {{ $labels.endpoint }}"
          description: "{{ $value }} requests/sec are being rate limited on {{ $labels.endpoint }}"

      - alert: SlowValidation
        expr: histogram_quantile(0.99, validation_duration_seconds_bucket) > 0.050
        for: 10m
        labels:
          severity: warning
          component: validation
        annotations:
          summary: "Slow validation performance on {{ $labels.endpoint }}"
          description: "p99 validation latency is {{ $value }}s (threshold: 50ms)"
```

### Datadog Monitors

#### Monitor 1: Validation Error Spike
```
Name: [BSI] High Validation Error Rate
Query: change(sum(last_5m):sum:validation.errors.count{*}.as_rate(), last_5m) > 100
Message: |
  Validation errors spiked by {{value}} in the last 5 minutes

  Endpoint: {{endpoint.name}}
  Error Type: {{error_type.name}}

  @slack-alerts @pagerduty-critical
```

#### Monitor 2: Environment Validation
```
Name: [BSI] Environment Validation Failure
Query: max(last_1m):sum:env.validation.failures{severity:critical} > 0
Message: |
  CRITICAL: Environment validation failed on startup

  Variable: {{variable.name}}

  @pagerduty-critical @slack-critical
```

#### Monitor 3: Rate Limit Abuse
```
Name: [BSI] Potential API Abuse (Rate Limiting)
Query: sum(last_10m):sum:rate.limit.exceeded.count{*} by {ip} > 1000
Message: |
  IP {{ip.name}} has been rate limited {{value}} times in 10 minutes

  Possible API abuse. Review and potentially block.

  @slack-alerts @security-team
```

## Log Queries

### Splunk

```spl
# High validation error endpoints (last hour)
index=bsi source=api level=warn "Validation*"
| stats count by endpoint, error_field
| sort -count
| head 20

# Failed requests by user/IP
index=bsi "Validation Error" status=400
| stats count by src_ip, endpoint
| where count > 50
| sort -count

# Environment validation issues
index=bsi source=startup "environment validation"
| table timestamp, variable, message, severity
```

### Elasticsearch/Kibana

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "log_level": "warn" } },
        { "match": { "component": "validation" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "aggs": {
    "by_endpoint": {
      "terms": {
        "field": "endpoint.keyword",
        "size": 20
      }
    }
  }
}
```

## CloudWatch (AWS)

### Log Insights Queries

```
# Validation errors by endpoint
fields @timestamp, endpoint, error_type, field
| filter @message like /Validation.*failed/
| stats count() by endpoint
| sort count desc
| limit 20

# Rate limit violations
fields @timestamp, ip, endpoint
| filter @message like /Rate.*[Ll]imit/
| stats count() by ip, endpoint
| sort count desc
```

### CloudWatch Alarms

```yaml
ValidationErrorAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: BSI-HighValidationErrors
    MetricName: ValidationErrors
    Namespace: BSI/API
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 500
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref SNSAlertTopic
```

## Sentry Integration

Configure Sentry to capture validation errors:

```javascript
// api/middleware/validation.js

import * as Sentry from '@sentry/node';

if (error instanceof ZodError) {
    // Track in Sentry
    Sentry.captureMessage('Validation Error', {
        level: 'warning',
        tags: {
            endpoint: req.path,
            method: req.method,
            error_type: source
        },
        extra: {
            errors: formattedError.details,
            request_body: req.body,
            query_params: req.query
        }
    });
}
```

## Action Items

### When Alerts Fire

1. **High Validation Error Rate**
   - Check recent deployments
   - Review client integration changes
   - Verify schema changes weren't breaking
   - Check for coordinated attack patterns

2. **Environment Validation Failure**
   - CRITICAL: Application likely won't start
   - Verify all required env vars are set
   - Check for typos in variable names
   - Review recent config changes

3. **Rate Limit Abuse**
   - Identify IP addresses
   - Check if legitimate traffic spike or abuse
   - Consider temporary IP blocking
   - Review rate limit thresholds

4. **Slow Validation**
   - Profile validation schemas
   - Check for complex regex patterns
   - Review custom validators
   - Consider caching validated results

## Weekly Review Checklist

- [ ] Review top 10 validation errors
- [ ] Check for patterns in failed validations
- [ ] Review rate limit violations
- [ ] Verify monitoring is working correctly
- [ ] Update alert thresholds if needed
- [ ] Review and close Sentry issues
- [ ] Document any schema improvements needed

## Contact

- **On-Call Engineer**: See PagerDuty schedule
- **Slack Channel**: #bsi-alerts
- **Runbook**: See [Incident Response Runbook](./incident-response-runbook.md)
