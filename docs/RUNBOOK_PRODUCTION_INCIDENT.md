## Production Incident Response Runbook

**Last Updated**: 2025-11-02
**Owner**: DevOps Team
**Severity Levels**: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

---

## 🚨 Incident Response Overview

### Quick Response Checklist

- [ ] Acknowledge incident (within 5 minutes for P0/P1)
- [ ] Assess severity and impact
- [ ] Notify stakeholders
- [ ] Create incident channel/document
- [ ] Begin investigation and mitigation
- [ ] Document actions taken
- [ ] Implement fix
- [ ] Verify resolution
- [ ] Conduct post-mortem

---

## Severity Definitions

### P0 - Critical (Production Down)

- **Response Time**: Immediate (< 5 minutes)
- **Resolution Time**: < 1 hour
- **Examples**: Complete site outage, data loss, security breach
- **Escalation**: Page on-call engineer + Engineering Manager

### P1 - High (Major Degradation)

- **Response Time**: < 15 minutes
- **Resolution Time**: < 4 hours
- **Examples**: API errors affecting >10% users, slow response times
- **Escalation**: On-call engineer

### P2 - Medium (Partial Degradation)

- **Response Time**: < 1 hour
- **Resolution Time**: < 24 hours
- **Examples**: Non-critical feature broken, minor performance issues

### P3 - Low (Minor Issue)

- **Response Time**: < 4 hours
- **Resolution Time**: < 1 week
- **Examples**: Cosmetic bugs, minor UI issues

---

## Common Incident Types & Responses

### 1. Complete Site Outage (HTTP 5xx errors)

#### Symptoms

- All pages returning 500/502/503/522 errors
- Health check endpoints failing
- No traffic reaching application

#### Investigation Steps

1. **Check Cloudflare Status**

   ```bash
   curl -I https://blazesportsintel.com
   # Check for Cloudflare error codes
   ```

2. **Check Cloudflare Dashboard**
   - Navigate to blazesportsintel.com in Cloudflare dashboard
   - Check Analytics → Traffic
   - Check for error spikes

3. **Check Functions Status**

   ```bash
   # View recent deployments
   wrangler pages deployment list --project-name=college-baseball-tracker

   # View logs
   wrangler pages deployment tail
   ```

4. **Check D1 Database**
   ```bash
   # Test database connection
   wrangler d1 execute blazesports-historical --command="SELECT 1"
   ```

#### Mitigation

**Option 1: Rollback to Previous Deployment**

```bash
# List recent deployments
wrangler pages deployment list --project-name=college-baseball-tracker

# Rollback to previous version
wrangler pages deployment rollback <deployment-id>
```

**Option 2: Deploy Known Good Version**

```bash
git checkout <last-known-good-commit>
pnpm build
wrangler pages deploy dist --project-name=college-baseball-tracker
```

**Option 3: Enable Maintenance Mode**

- Create static maintenance page
- Serve from Cloudflare Pages

#### Post-Resolution

- [ ] Verify all endpoints are responding
- [ ] Check error rates in Sentry
- [ ] Review logs for root cause
- [ ] Schedule post-mortem

---

### 2. Database Connection Failures

#### Symptoms

- "Connection refused" errors
- Timeout errors from database
- Increased API latency

#### Investigation Steps

1. **Check Database Connectivity**

   ```bash
   # From application server
   PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1"
   ```

2. **Check Connection Pool**

   ```bash
   # View active connections
   PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT count(*) FROM pg_stat_activity;"
   ```

3. **Check Database Logs**
   ```bash
   # View PostgreSQL logs
   docker logs bsi_postgres_1 --tail=100
   ```

#### Mitigation

1. **Restart Database Connection Pool**

   ```bash
   # Restart application workers
   wrangler pages deployment restart
   ```

2. **Increase Connection Limits**

   ```sql
   ALTER SYSTEM SET max_connections = 200;
   SELECT pg_reload_conf();
   ```

3. **Kill Idle Connections**
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < current_timestamp - INTERVAL '5 minutes';
   ```

---

### 3. High Response Times / Performance Degradation

#### Symptoms

- API response times > 2 seconds
- Slow page loads
- Increased time to first byte (TTFB)

#### Investigation Steps

1. **Check Cloudflare Analytics**
   - Navigate to Analytics → Performance
   - Check cache hit rate
   - Check bandwidth usage

2. **Check Application Logs**

   ```bash
   wrangler pages deployment tail --project-name=college-baseball-tracker
   ```

3. **Check Database Slow Queries**

   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

4. **Check External API Status**
   - MLB Stats API: https://statsapi.mlb.com/api/v1/system/status
   - Sports Data IO: Check status page

#### Mitigation

1. **Increase Cache TTL**

   ```typescript
   // Temporarily increase cache duration
   const CACHE_TTL = 3600; // 1 hour instead of 5 minutes
   ```

2. **Enable Aggressive Caching**

   ```javascript
   // In Cloudflare page rules
   Cache Level: Cache Everything
   Edge Cache TTL: 1 hour
   ```

3. **Add Database Indexes**

   ```sql
   CREATE INDEX CONCURRENTLY idx_games_date ON games(game_date);
   ```

4. **Scale Database**
   - Consider read replicas for heavy SELECT queries
   - Enable connection pooling (PgBouncer)

---

### 4. Rate Limiting Issues

#### Symptoms

- 429 Too Many Requests errors
- Users reporting "blocked" messages
- Spike in rate limit errors

#### Investigation Steps

1. **Check Rate Limit Logs**

   ```bash
   # View rate limit hits
   wrangler kv:key list --namespace-id=<RATE_LIMIT_KV_ID> --prefix=rl:
   ```

2. **Identify Source of Traffic**
   ```bash
   # Check Cloudflare Analytics for top IPs
   # Navigate to Security → Events
   ```

#### Mitigation

1. **Temporarily Increase Limits**

   ```typescript
   // In lib/security/rate-limiter.ts
   ENDPOINT_RATE_LIMITS['/api/v1/live'] = {
     requests: 600, // Doubled
     window: 60000,
   };
   ```

2. **Whitelist Legitimate IPs**

   ```typescript
   const WHITELISTED_IPS = ['1.2.3.4', '5.6.7.8'];
   ```

3. **Block Malicious IPs**
   - Cloudflare Dashboard → Security → WAF
   - Create IP Access Rule → Block

---

### 5. Memory Leaks / High Resource Usage

#### Symptoms

- Workers crashing
- Out of memory errors
- Increasing memory usage over time

#### Investigation Steps

1. **Check Worker Memory Usage**

   ```bash
   # Cloudflare doesn't expose direct memory metrics
   # Monitor via error rates and restart frequency
   ```

2. **Check for Memory Leaks**
   - Review code for global variables
   - Check for unclosed connections
   - Review event listeners

#### Mitigation

1. **Restart Workers**

   ```bash
   wrangler pages deployment restart
   ```

2. **Implement Memory Limits**

   ```typescript
   // Force garbage collection (Node.js)
   if (global.gc) {
     global.gc();
   }
   ```

3. **Review and Fix Code**
   - Remove global state
   - Close database connections
   - Clear timers/intervals

---

### 6. Authentication Failures

#### Symptoms

- Users unable to log in
- "Invalid token" errors
- Session timeouts

#### Investigation Steps

1. **Check JWT Secret**

   ```bash
   # Verify JWT_SECRET is set correctly
   echo $JWT_SECRET
   ```

2. **Check Token Expiration**
   ```typescript
   // Decode token to check expiration
   const decoded = JSON.parse(atob(token.split('.')[1]));
   console.log('Expires:', new Date(decoded.exp * 1000));
   ```

#### Mitigation

1. **Rotate JWT Secret**

   ```bash
   # Generate new secret
   openssl rand -base64 32

   # Update in Cloudflare Secrets
   wrangler secret put JWT_SECRET
   ```

2. **Invalidate All Sessions**
   ```sql
   DELETE FROM user_sessions WHERE expires_at < NOW() + INTERVAL '24 hours';
   ```

---

## Emergency Contacts

### On-Call Rotation

- **Primary**: Check PagerDuty schedule
- **Secondary**: Check PagerDuty schedule
- **Escalation**: Engineering Manager

### External Contacts

- **Cloudflare Support**: enterprise@cloudflare.com
- **Database Hosting**: [Support contact]
- **Sentry**: support@sentry.io

---

## Useful Commands

### Cloudflare Wrangler

```bash
# View recent logs
wrangler pages deployment tail --project-name=college-baseball-tracker

# List deployments
wrangler pages deployment list --project-name=college-baseball-tracker

# Rollback deployment
wrangler pages deployment rollback <deployment-id>

# View KV keys
wrangler kv:key list --namespace-id=<KV_ID>

# Get KV value
wrangler kv:key get "key-name" --namespace-id=<KV_ID>

# Execute D1 query
wrangler d1 execute blazesports-historical --command="SELECT COUNT(*) FROM teams"

# View secrets
wrangler secret list
```

### Database Management

```bash
# Connect to database
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB

# View active connections
SELECT * FROM pg_stat_activity;

# Kill connection
SELECT pg_terminate_backend(pid);

# View slow queries
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# Backup database
./scripts/backup-database.sh

# Restore database
./scripts/backup-database.sh --restore backup-file.sql.gz.enc
```

### Log Analysis

```bash
# Search Sentry for errors
# Navigate to: sentry.io → BSI → Issues

# Search Datadog logs
# Navigate to: datadoghq.com → Logs

# View Cloudflare analytics
# Navigate to: dash.cloudflare.com → Analytics
```

---

## Post-Incident Review

After resolving the incident, conduct a post-mortem meeting within 48 hours.

### Post-Mortem Template

1. **Incident Summary**
   - What happened?
   - When did it happen?
   - How long was the impact?

2. **Timeline of Events**
   - Detection time
   - Response time
   - Mitigation actions
   - Resolution time

3. **Root Cause Analysis**
   - What was the root cause?
   - Why wasn't it caught earlier?
   - What contributed to the incident?

4. **Action Items**
   - Immediate fixes
   - Long-term improvements
   - Monitoring enhancements
   - Documentation updates

5. **Lessons Learned**
   - What went well?
   - What could be improved?
   - What should we do differently?

---

## Additional Resources

- [Cloudflare Status Page](https://www.cloudflarestatus.com/)
- [Sentry Dashboard](https://sentry.io/organizations/bsi/)
- [Datadog Dashboard](https://app.datadoghq.com/)
- [Production Architecture Diagram](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT-GUIDE.md)
