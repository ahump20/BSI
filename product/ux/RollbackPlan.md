# Diamond Insights Rollback Plan

**Version**: 1.0.0
**Date**: 2025-10-13
**Owner**: Austin Humphrey
**Status**: Pre-Launch

---

## Overview

This document outlines the complete rollback procedure for the Diamond Insights platform migration. All personnel involved in deployment must be familiar with these procedures.

**Principle**: _Any production deployment must be reversible within 5 minutes with zero data loss._

---

## Rollback Triggers

Execute rollback immediately if any of the following conditions occur:

### Critical (Automatic Rollback)

- **Error rate > 5%** for 3 consecutive minutes
- **API failure rate > 10%** for 2 consecutive minutes
- **LCP > 5s** on mobile for 5 minutes
- **Database connection failures** affecting >50% of requests
- **Security incident detected** (unauthorized access, data breach)

### Warning (Manual Decision)

- **Error rate 1-5%** sustained for 10 minutes
- **API p99 > 500ms** for 10 minutes
- **User reports** of critical functionality broken (payment, auth)
- **Data integrity issues** (incorrect scores, missing games)

### Observation (Monitor Closely)

- **Bounce rate > 60%** (baseline: 40%)
- **Session duration < 1.5min** (baseline: 3min)
- **Mobile traffic < 50%** (expected: 70%+)
- **Stripe webhook failures** (isolated incidents)

---

## Rollback Architecture

### Deployment Layers

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Cloudflare DNS (instant)                  │
│   ├─ A/CNAME records point to origin               │
│   └─ TTL: 300s (5min propagation worst-case)       │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ Layer 2: Vercel Deployment (instant)               │
│   ├─ Next.js app deployment                        │
│   ├─ Atomic deployments with unique URLs           │
│   └─ Previous deployment still live (immutable)    │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ Layer 3: Cloudflare Workers (instant)              │
│   ├─ Ingest worker for game data                   │
│   ├─ Versioned deployments                         │
│   └─ Rollback via wrangler CLI                     │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ Layer 4: Database (requires migration)             │
│   ├─ PostgreSQL schema changes                     │
│   ├─ Backup snapshots before migration             │
│   └─ Rollback scripts pre-written and tested       │
└─────────────────────────────────────────────────────┘
```

---

## Rollback Procedures

### Procedure 1: Vercel Frontend Rollback (< 1 min)

**When to use**: UI bugs, performance regressions, client-side errors

**Steps**:

1. **Identify previous deployment**:

   ```bash
   vercel ls --prod
   # Output shows previous production deployment URL
   ```

2. **Promote previous deployment**:

   ```bash
   vercel promote <previous-deployment-url> --prod
   ```

3. **Verify rollback**:

   ```bash
   curl -I https://blazesportsintel.com
   # Check x-vercel-id header matches previous deployment
   ```

4. **Monitor**:
   - Check error rates drop within 2min
   - Verify LCP returns to baseline
   - Confirm user sessions stabilize

**Automated Rollback** (if enabled):

```bash
# Triggered by monitoring alert
vercel promote <previous-deployment-url> --prod --yes
```

**Verification Checklist**:

- [ ] Home page loads successfully
- [ ] Game Center functional (if live games active)
- [ ] Team Hub navigable
- [ ] API responses healthy

---

### Procedure 2: Cloudflare Workers Rollback (< 2 min)

**When to use**: Ingest worker failures, data transformation errors

**Steps**:

1. **List deployments**:

   ```bash
   wrangler deployments list --name bsi-ingest-worker
   ```

2. **Rollback to previous version**:

   ```bash
   wrangler rollback --name bsi-ingest-worker --message "Rollback due to [reason]"
   ```

3. **Verify worker health**:

   ```bash
   curl https://api.blazesportsintel.com/api/v1/health
   ```

4. **Check KV cache**:
   ```bash
   wrangler kv:key list --namespace-id=<KV_ID> --remote | head -5
   ```

**Post-Rollback**:

- Monitor ingest lag (should be < 60s)
- Verify game scores updating
- Check feed precision badges accurate

**Verification Checklist**:

- [ ] Ingest worker processing events
- [ ] KV cache populating correctly
- [ ] API returning live game data
- [ ] No stale data warnings

---

### Procedure 3: Database Schema Rollback (< 5 min)

**When to use**: Schema migration failures, data integrity issues

**⚠️ CRITICAL**: Database rollbacks require downtime. Coordinate with team.

**Pre-Migration Requirements**:

- Full database backup created
- Rollback SQL script tested in staging
- Maintenance mode page prepared

**Steps**:

1. **Enable maintenance mode**:

   ```bash
   # Set maintenance mode flag in KV
   wrangler kv:key put --namespace-id=<KV_ID> "maintenance_mode" "true" --remote
   ```

2. **Stop ingest worker**:

   ```bash
   wrangler deployments pause --name bsi-ingest-worker
   ```

3. **Execute rollback migration**:

   ```bash
   # Connect to database
   psql $DATABASE_URL

   # Run rollback script
   \i migrations/rollback/YYYYMMDD_rollback_schema.sql

   # Verify tables restored
   \dt
   \d teams
   ```

4. **Restore data from backup** (if needed):

   ```bash
   pg_restore -d $DATABASE_URL --clean --if-exists backups/pre_migration_YYYYMMDD.dump
   ```

5. **Re-enable ingest worker**:

   ```bash
   wrangler deployments resume --name bsi-ingest-worker
   ```

6. **Disable maintenance mode**:

   ```bash
   wrangler kv:key put --namespace-id=<KV_ID> "maintenance_mode" "false" --remote
   ```

7. **Verify data integrity**:
   ```sql
   SELECT COUNT(*) FROM games WHERE status = 'LIVE';
   SELECT COUNT(*) FROM teams;
   SELECT COUNT(*) FROM players;
   ```

**Verification Checklist**:

- [ ] All tables present and populated
- [ ] Foreign key constraints intact
- [ ] Indexes functional
- [ ] Query performance normal
- [ ] API returning correct data

---

### Procedure 4: DNS Rollback (Last Resort)

**When to use**: Complete platform failure, requires immediate traffic rerouting

**⚠️ EXTREME MEASURE**: Only use if all other rollbacks fail.

**Steps**:

1. **Access Cloudflare Dashboard**:
   - Log in: https://dash.cloudflare.com
   - Navigate to: blazesportsintel.com → DNS

2. **Update A/CNAME records**:

   ```
   Before:
   A     @     76.76.21.21 (Vercel)

   After:
   A     @     [backup-server-ip]
   ```

3. **Wait for propagation** (5min max with 300s TTL)

4. **Verify with DNS check**:
   ```bash
   dig blazesportsintel.com +short
   # Should return backup server IP
   ```

**Backup Server Requirements**:

- Static HTML "maintenance" page
- Basic /api/v1/health endpoint
- Contact information for users

---

## Communication Protocol

### Internal Notifications

**Slack Channel**: `#blaze-production-alerts`

**Rollback Announcement Template**:

```
🚨 PRODUCTION ROLLBACK INITIATED 🚨

Reason: [Brief description]
Trigger: [Error rate / User reports / etc.]
Initiated by: [Name]
Time: [YYYY-MM-DD HH:MM CDT]

Rollback Procedure: [Vercel / Workers / Database / DNS]
Expected Downtime: [0min / 2min / 5min]

Status: [In Progress / Complete / Failed]

Next Steps:
1. [Action item 1]
2. [Action item 2]

Post-mortem scheduled: [Date/Time]
```

### External Communications

**Status Page**: https://status.blazesportsintel.com (TBD: use Statuspage.io or similar)

**Twitter**: @BlazeSportsIntel (if downtime > 5min)

**Email** (for Pro subscribers):

```
Subject: Diamond Insights - Brief Service Interruption

Hi [Name],

We experienced a brief technical issue today at [TIME] CDT. Our team has
resolved the problem and all systems are now fully operational.

We apologize for any inconvenience. As a thank you for your patience, we've
added [X days] to your Pro subscription.

If you have any questions, please contact support@blazesportsintel.com.

- Team Blaze
```

---

## Post-Rollback Actions

### Immediate (Within 1 hour)

1. **Verify all systems operational**:
   - Run full smoke test suite
   - Check error rates normalized
   - Confirm user sessions stable

2. **Document incident**:
   - What triggered rollback
   - Which procedure was used
   - How long rollback took
   - Any data loss or corruption

3. **Notify stakeholders**:
   - Team: Slack
   - Users: Status page (if applicable)
   - Investors: Email (if major)

### Short-term (Within 24 hours)

1. **Root cause analysis**:
   - Review logs (Vercel, Workers, database)
   - Identify code/config that caused issue
   - Determine why it passed QA gates

2. **Fix and test**:
   - Apply fix in development
   - Run full test suite
   - Deploy to staging for validation

3. **Update runbooks**:
   - Add new error patterns to monitoring
   - Refine rollback procedures if needed
   - Update QA checklist

### Long-term (Within 7 days)

1. **Post-mortem document**:
   - Timeline of events
   - Root cause (technical + process)
   - Impact assessment (users affected, revenue lost)
   - Action items to prevent recurrence

2. **Implement preventive measures**:
   - Add new automated tests
   - Strengthen QA gates
   - Improve monitoring/alerting

3. **Team retrospective**:
   - What went well
   - What could be improved
   - Lessons learned

---

## Testing Rollback Procedures

**Frequency**: Quarterly

**Process**:

1. **Staging environment**:
   - Deploy intentionally broken version
   - Trigger alerts
   - Execute rollback procedures
   - Verify systems restored

2. **Document results**:
   - Time to detect issue
   - Time to execute rollback
   - Any unexpected complications

3. **Update procedures** based on findings

---

## Rollback Scenarios & Examples

### Scenario 1: UI Performance Regression

**Symptoms**:

- LCP > 4s on mobile
- User reports slow loading

**Diagnosis**:

- Lighthouse audit shows large bundle size
- Webpack analysis reveals unoptimized images

**Rollback**:

- Execute Procedure 1 (Vercel Frontend)
- Time: < 1min
- Downtime: 0min (atomic deployment swap)

**Fix**:

- Optimize images (next/image)
- Code-split heavy components
- Redeploy after QA

---

### Scenario 2: Ingest Worker Data Corruption

**Symptoms**:

- API returning incorrect scores
- Feed precision badges showing "EVENT" instead of "PITCH"

**Diagnosis**:

- Worker code bug in event parsing
- KV cache populated with bad data

**Rollback**:

1. Execute Procedure 2 (Workers)
2. Flush KV cache:
   ```bash
   wrangler kv:key list --namespace-id=<KV_ID> --remote | xargs -I{} wrangler kv:key delete --namespace-id=<KV_ID> {} --remote
   ```
3. Re-ingest last hour of data

**Fix**:

- Fix parser logic
- Add validation step
- Increase test coverage

---

### Scenario 3: Database Migration Failure

**Symptoms**:

- API returning 500 errors
- Database connection timeouts

**Diagnosis**:

- Migration script syntax error
- Foreign key constraint violated

**Rollback**:

1. Enable maintenance mode
2. Execute Procedure 3 (Database)
3. Restore from backup
4. Re-enable services

**Downtime**: 5min

**Fix**:

- Test migration script in staging (multiple times)
- Add pre-flight checks
- Review schema changes with team

---

## Contacts & Escalation

### Primary On-Call

- **Austin Humphrey**
- Phone: (210) 273-5538
- Email: austin@blazesportsintel.com
- Slack: @ahump20

### Backup On-Call

- TBD

### Vendor Support

- **Vercel**: support@vercel.com (Enterprise support if needed)
- **Cloudflare**: https://dash.cloudflare.com/support
- **Supabase**: support@supabase.com
- **Stripe**: https://support.stripe.com

### Escalation Path

1. Primary On-Call (Austin)
2. Backup On-Call (TBD)
3. Vendor Support (if infrastructure issue)

---

## Monitoring & Alerts

### Metrics to Track

**Real-time (Grafana)**:

- Request error rate (target: < 0.5%)
- API p99 latency (target: < 200ms)
- Ingest lag (target: < 60s)
- Database connection pool (target: < 80% utilization)

**User Experience (RUM)**:

- LCP (target: < 2.5s)
- CLS (target: < 0.1)
- FID (target: < 100ms)

**Business (Mixpanel)**:

- Active users (baseline: TBD)
- Conversion rate (baseline: TBD)
- Session duration (baseline: 3min)

### Alert Thresholds

| Metric               | Warning    | Critical    | Action            |
| -------------------- | ---------- | ----------- | ----------------- |
| Error rate           | 1%         | 5%          | Rollback          |
| API p99 latency      | 300ms      | 500ms       | Investigate       |
| Ingest lag           | 120s       | 300s        | Restart worker    |
| LCP (mobile)         | 3s         | 5s          | Rollback frontend |
| Database CPU         | 70%        | 90%         | Scale up          |
| Stripe webhook fails | 5 in 10min | 20 in 10min | Check integration |

---

## Appendix: Backup Checklist

### Pre-Deployment Backup

**Execute before every production deployment**:

```bash
# 1. Database backup
pg_dump $DATABASE_URL > backups/pre_deploy_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup integrity
pg_restore --list backups/pre_deploy_*.sql | head

# 3. Note current deployment versions
echo "Vercel: $(vercel ls --prod | head -1)" >> backups/deployment_versions.txt
echo "Workers: $(wrangler deployments list --name bsi-ingest-worker | head -1)" >> backups/deployment_versions.txt

# 4. Export environment variables
vercel env pull .env.production.backup

# 5. Archive current Next.js build
tar -czf backups/build_$(date +%Y%m%d_%H%M%S).tar.gz .next/
```

**Backup Retention**:

- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-13
**Next Review**: Pre-launch (Week 18)
