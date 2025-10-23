# BSI Incident Response Runbook

## Table of Contents

1. [Overview](#overview)
2. [Incident Severity Levels](#incident-severity-levels)
3. [On-Call Procedures](#on-call-procedures)
4. [Common Incidents](#common-incidents)
5. [Escalation Procedures](#escalation-procedures)
6. [Post-Incident Review](#post-incident-review)

---

## Overview

This runbook provides step-by-step procedures for responding to production incidents in the Blaze Sports Intel API.

**Incident Response Goals**:
1. Restore service as quickly as possible
2. Minimize impact to users
3. Preserve evidence for post-incident analysis
4. Communicate clearly with stakeholders

---

## Incident Severity Levels

### SEV-1 (Critical)
**Definition**: Complete service outage or data loss

**Examples**:
- API is completely down (all endpoints returning 5xx)
- Database connection failure
- Critical security breach
- Data corruption or loss

**Response Time**: Immediate (< 5 minutes)
**Notification**: Page on-call engineer + escalate to manager

---

### SEV-2 (High)
**Definition**: Major functionality degraded, significant user impact

**Examples**:
- Key endpoints returning errors (>10% error rate)
- Severe performance degradation (>5s response times)
- Authentication/authorization failures
- High rate of validation errors (>100/sec)

**Response Time**: < 15 minutes
**Notification**: Page on-call engineer

---

### SEV-3 (Medium)
**Definition**: Partial functionality affected, workaround available

**Examples**:
- Single endpoint degraded
- Moderate performance issues (2-5s response times)
- Non-critical feature failures
- Rate limiting too aggressive

**Response Time**: < 1 hour
**Notification**: Slack alert

---

### SEV-4 (Low)
**Definition**: Minor issues, no immediate user impact

**Examples**:
- Logging errors
- Non-critical monitoring alerts
- Documentation issues

**Response Time**: Next business day
**Notification**: Ticket

---

## On-Call Procedures

### When You Receive an Alert

#### Step 1: Acknowledge (< 2 minutes)
```bash
# Acknowledge in PagerDuty
# Post in #bsi-incidents Slack channel
Alert: [ALERT_NAME]
Status: INVESTIGATING
On-call: [YOUR_NAME]
```

#### Step 2: Assess Severity (< 5 minutes)

**Check these dashboards**:
1. Overall API health: https://grafana.blazesportsintel.com/d/api-overview
2. Error rates: https://grafana.blazesportsintel.com/d/errors
3. Validation metrics: https://grafana.blazesportsintel.com/d/validation

**Determine**:
- What percentage of requests are affected?
- Which endpoints are impacted?
- Are users reporting issues?
- Is data at risk?

#### Step 3: Initial Response (< 10 minutes)

**For SEV-1/SEV-2**: Execute immediate mitigation
**For SEV-3/SEV-4**: Proceed with investigation

---

## Common Incidents

### 🔴 INCIDENT 1: High Validation Error Rate

**Alert**: `HighValidationErrorRate` firing

**Symptoms**:
- 400 errors spiking on one or more endpoints
- Validation errors in logs
- Client reports of "invalid request" errors

#### Investigation Steps

1. **Check recent changes**
   ```bash
   # View recent deployments
   git log --oneline --since="2 hours ago"

   # Check if schema changed
   git diff HEAD~5 api/validation/schemas/
   ```

2. **Identify affected endpoint**
   ```bash
   # Grep logs for validation errors
   grep "Validation Error" /var/log/bsi/api.log | tail -100

   # Or use Splunk/Datadog to find most common endpoint
   ```

3. **Check error details**
   ```bash
   # Get specific error messages
   grep "Validation Error" /var/log/bsi/api.log | jq '.details'
   ```

#### Common Causes

| Cause | Solution |
|-------|----------|
| **Schema change broke compatibility** | Rollback deployment |
| **Client integration error** | Contact client, provide example |
| **Malformed requests (attack)** | Rate limit IP, block if necessary |
| **Bug in validation logic** | Hotfix validation schema |

#### Resolution Steps

**Option A: Rollback (if deployment caused)**
```bash
# 1. Rollback to previous version
cd /home/user/BSI
git checkout [PREVIOUS_COMMIT]
npm run build
pm2 restart bsi-api

# 2. Verify fix
curl -s https://api.blazesportsintel.com/health | jq
```

**Option B: Hotfix (if validation bug)**
```bash
# 1. Fix validation schema
vim api/validation/schemas/[SCHEMA_FILE]

# 2. Test locally
npm test tests/validation/

# 3. Deploy hotfix
git add -A
git commit -m "hotfix: fix validation schema"
git push
./scripts/deploy-hotfix.sh
```

**Option C: Block Bad Actor (if attack)**
```bash
# 1. Identify attacking IPs
grep "Validation Error" /var/log/bsi/api.log | \
  jq -r '.ip' | sort | uniq -c | sort -rn | head -10

# 2. Add rate limit rule or block
# (Implementation depends on your firewall/CDN)
```

#### Post-Resolution

- [ ] Update incident timeline in #bsi-incidents
- [ ] Verify error rate returned to baseline
- [ ] Create post-incident review ticket
- [ ] Notify stakeholders of resolution

---

### 🔴 INCIDENT 2: Environment Validation Failure

**Alert**: `EnvironmentValidationFailure` firing

**Symptoms**:
- Application fails to start
- "Environment validation failed" in startup logs
- Service unavailable (503)

#### Investigation Steps

1. **Check application logs**
   ```bash
   # View startup logs
   pm2 logs bsi-api --lines 100 | grep -i "environment"

   # Or check systemd logs
   journalctl -u bsi-api -n 100 | grep -i "environment"
   ```

2. **Identify missing variables**
   ```bash
   # Logs will show which variable failed
   # Example: "JWT_SECRET: Required"
   ```

3. **Check environment file**
   ```bash
   # Verify .env file exists
   ls -la /home/user/BSI/.env

   # Check if variable is set
   grep JWT_SECRET /home/user/BSI/.env
   ```

#### Common Causes

| Cause | Solution |
|-------|----------|
| **Missing .env file** | Restore from backup |
| **Env var typo in code** | Fix code and redeploy |
| **Secret rotation forgot to update** | Update .env with new secret |
| **Production validation stricter** | Ensure required vars are set |

#### Resolution Steps

**Immediate Fix**:
```bash
# 1. Set missing environment variable
echo "JWT_SECRET=$(openssl rand -hex 32)" >> /home/user/BSI/.env

# 2. Restart application
pm2 restart bsi-api

# 3. Verify startup
pm2 logs bsi-api --lines 50 | grep -i "environment validation"
# Should see: "✓ Environment validation passed"
```

**Verify All Required Variables**:
```bash
# Run validation checker
node /home/user/BSI/scripts/check-env.js
```

#### Post-Resolution

- [ ] Document which variable was missing
- [ ] Update secret management docs
- [ ] Add to deployment checklist
- [ ] Consider using secret manager (AWS Secrets Manager, etc.)

---

### 🟡 INCIDENT 3: High Rate Limit Rejections

**Alert**: `RateLimitAbuse` firing

**Symptoms**:
- Many 429 (Too Many Requests) responses
- Specific IP addresses hitting rate limits
- Legitimate users may be affected

#### Investigation Steps

1. **Identify top IPs being rate limited**
   ```bash
   # Check rate limit logs
   grep "Rate.*[Ll]imit" /var/log/bsi/api.log | \
     jq -r '.ip' | sort | uniq -c | sort -rn | head -20
   ```

2. **Check request patterns**
   ```bash
   # Are they hitting one endpoint or many?
   grep "Rate.*[Ll]imit" /var/log/bsi/api.log | \
     jq -r '.endpoint' | sort | uniq -c | sort -rn
   ```

3. **Determine if legitimate or malicious**
   - Check user-agent strings
   - Look for coordinated patterns
   - Verify with known client IPs

#### Common Scenarios

| Scenario | Action |
|----------|--------|
| **Legitimate high-traffic client** | Whitelist IP or increase limit |
| **Misconfigured integration (retry loop)** | Contact client |
| **DDoS/abuse attempt** | Block IP at firewall |
| **Rate limits too strict** | Adjust thresholds |

#### Resolution Steps

**Option A: Whitelist Legitimate Client**
```javascript
// functions/api/_middleware.js
const WHITELISTED_IPS = new Set([
  '203.0.113.45', // Partner API
  '198.51.100.88' // Mobile app servers
]);

// Skip rate limiting for whitelisted IPs
if (WHITELISTED_IPS.has(clientIP)) {
  return next();
}
```

**Option B: Block Malicious IP**
```bash
# Using iptables
sudo iptables -A INPUT -s 192.0.2.123 -j DROP

# Using Cloudflare (if using CF)
# Add IP to block list in Cloudflare dashboard
```

**Option C: Adjust Rate Limits**
```javascript
// functions/api/_validation.js
const RATE_LIMIT_CONFIG = {
    maxRequests: 200, // Increased from 100
    windowSeconds: 60,
    namespace: 'live_scores'
};
```

#### Post-Resolution

- [ ] Document IPs whitelisted/blocked
- [ ] Review rate limit policies
- [ ] Create monitoring for whitelisted IPs
- [ ] Update security docs

---

### 🟡 INCIDENT 4: Slow Validation Performance

**Alert**: `SlowValidation` firing

**Symptoms**:
- API response times increased
- p99 latency > 50ms for validation
- CPU usage elevated
- Timeouts on some requests

#### Investigation Steps

1. **Identify slow endpoints**
   ```bash
   # Check validation latency logs
   grep "validation.*duration" /var/log/bsi/api.log | \
     jq -r '{endpoint: .endpoint, duration: .duration}' | \
     sort -t: -k2 -rn | head -20
   ```

2. **Check for complex schemas**
   ```bash
   # Find schemas with complex regex or transformations
   grep -r "regex\|transform" api/validation/schemas/
   ```

3. **Profile validation execution**
   ```javascript
   // Add timing to middleware
   const start = performance.now();
   const result = schema.parse(data);
   const duration = performance.now() - start;
   if (duration > 10) {
     console.warn(`Slow validation: ${duration}ms`);
   }
   ```

#### Common Causes

| Cause | Solution |
|-------|----------|
| **Complex regex patterns** | Simplify or precompile regex |
| **Deep object nesting** | Flatten schema structure |
| **Expensive custom validators** | Optimize or cache results |
| **Large request bodies** | Add size limits |

#### Resolution Steps

**Optimize Schemas**:
```javascript
// Before (slow)
const schema = z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/);

// After (faster)
const schema = z.string().min(8).max(128);
// Move complex validation to business logic layer
```

**Add Caching for Repeated Validations**:
```javascript
const validationCache = new Map();

function validateWithCache(data, schema, cacheKey) {
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }

  const result = schema.safeParse(data);
  validationCache.set(cacheKey, result);

  // Clear cache after 60s
  setTimeout(() => validationCache.delete(cacheKey), 60000);

  return result;
}
```

#### Post-Resolution

- [ ] Document performance improvements
- [ ] Add validation latency tests
- [ ] Review other schemas for similar issues
- [ ] Update validation best practices

---

## Escalation Procedures

### When to Escalate

| Scenario | Escalate To |
|----------|-------------|
| Can't resolve in 30 min | Senior Engineer |
| SEV-1 lasting > 15 min | Engineering Manager |
| Security incident | Security Team + CTO |
| Data loss risk | Database Team + VP Eng |
| Can't access systems | DevOps/SRE Team |

### Escalation Contacts

```
Senior Engineer (On-Call): PagerDuty → "Senior Eng"
Engineering Manager: Slack @eng-manager
Security Team: security@blazesportsintel.com
DevOps Team: #devops-escalation
Executive: emergencies@blazesportsintel.com
```

### Escalation Message Template

```
ESCALATION NEEDED

Incident: [BRIEF DESCRIPTION]
Severity: SEV-X
Started: [TIME]
Impact: [NUMBER] users / [PERCENTAGE]% of traffic
Actions Taken:
  1. [ACTION]
  2. [ACTION]
Reason for Escalation: [WHY YOU NEED HELP]
Current Status: [CURRENT STATE]
```

---

## Post-Incident Review

### Within 48 Hours

Create a post-incident review document with:

1. **Incident Summary**
   - What happened?
   - When did it happen?
   - How long did it last?
   - What was the impact?

2. **Timeline**
   - First indication
   - Detection
   - Response started
   - Mitigation applied
   - Resolution confirmed

3. **Root Cause Analysis**
   - What was the root cause?
   - Why wasn't it caught earlier?
   - What conditions allowed it to happen?

4. **Action Items**
   - Prevent recurrence
   - Improve detection
   - Improve response
   - Update documentation

5. **What Went Well**
   - Fast detection?
   - Good communication?
   - Effective mitigation?

### Template

```markdown
# Post-Incident Review: [INCIDENT NAME]

Date: [DATE]
Severity: SEV-X
Duration: [DURATION]
Responders: [NAMES]

## Summary
[2-3 sentences describing the incident]

## Timeline
| Time | Event |
|------|-------|
| 14:23 | Alert fired |
| 14:25 | On-call acknowledged |
| 14:30 | Root cause identified |
| 14:45 | Fix deployed |
| 14:50 | Verified resolved |

## Impact
- Users affected: ~X,XXX
- Requests failed: X,XXX
- Revenue impact: $X
- Duration: XX minutes

## Root Cause
[Detailed explanation]

## Resolution
[What fixed it]

## Action Items
- [ ] [ACTION] - Owner: [NAME] - Due: [DATE]
- [ ] [ACTION] - Owner: [NAME] - Due: [DATE]

## Lessons Learned
[What we learned]

## What Went Well
[Positive aspects of response]
```

---

## Quick Reference

### Essential Commands

```bash
# Check API health
curl https://api.blazesportsintel.com/health | jq

# View recent errors
tail -f /var/log/bsi/api.log | jq 'select(.level=="error")'

# Check validation errors
grep "Validation Error" /var/log/bsi/api.log | jq

# Restart API
pm2 restart bsi-api

# View environment variables
pm2 env 0

# Quick rollback
git checkout [PREVIOUS_COMMIT] && pm2 restart bsi-api

# Check rate limits
grep "Rate Limit" /var/log/bsi/api.log | tail -50
```

### Important URLs

- **Grafana Dashboards**: https://grafana.blazesportsintel.com
- **Sentry Errors**: https://sentry.io/organizations/bsi/issues/
- **PagerDuty**: https://blazesportsintel.pagerduty.com
- **Status Page**: https://status.blazesportsintel.com
- **Documentation**: https://docs.blazesportsintel.com

### Communication Channels

- **Slack**: #bsi-incidents (during incident)
- **Status Updates**: Post to #bsi-announcements
- **User Communication**: Use status page
- **Executive Updates**: Email emergencies@blazesportsintel.com

---

## Document Version

**Version**: 1.0
**Last Updated**: 2024-10-23
**Next Review**: 2024-11-23
**Owner**: DevOps Team
