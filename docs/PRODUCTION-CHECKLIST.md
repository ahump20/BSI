# Production Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No critical/high security vulnerabilities (`npm audit`)
- [ ] Code reviewed and approved
- [ ] Validation tests passing (`npm test tests/validation/`)
- [ ] Performance tests passing
- [ ] No console.log in production code
- [ ] Error handling implemented for all endpoints
- [ ] TypeScript compilation successful (if applicable)

### Environment Configuration
- [ ] All required environment variables set
- [ ] Environment validation passes (`node scripts/check-env.js`)
- [ ] Secrets rotated (JWT_SECRET, SESSION_SECRET, API keys)
- [ ] Database connection strings verified
- [ ] Redis connection configured
- [ ] CORS origins configured correctly
- [ ] Rate limiting thresholds set
- [ ] Monitoring credentials configured (Sentry, Datadog)

### Database
- [ ] Database migrations applied
- [ ] Database indexes created
- [ ] Database backup completed
- [ ] Rollback plan documented
- [ ] Connection pooling configured
- [ ] Query performance tested

### Security
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] Helmet.js security headers configured
- [ ] Authentication/authorization tested
- [ ] API keys secured (not in code)
- [ ] .env files not committed to git

### Monitoring & Alerting
- [ ] Sentry error tracking configured
- [ ] Datadog/Grafana dashboards created
- [ ] Validation error alerts configured
- [ ] Rate limit alerts configured
- [ ] Performance monitoring enabled
- [ ] Health check endpoint tested
- [ ] Log aggregation working
- [ ] PagerDuty integration tested

### Documentation
- [ ] API documentation generated (`node scripts/generate-openapi.js`)
- [ ] README updated with deployment instructions
- [ ] Environment variables documented
- [ ] Incident runbook reviewed
- [ ] Architecture diagrams updated
- [ ] Changelog updated

### Infrastructure
- [ ] Load balancer configured
- [ ] CDN (Cloudflare) cache rules set
- [ ] DNS records verified
- [ ] Backup systems tested
- [ ] Auto-scaling configured
- [ ] Health checks configured
- [ ] Log rotation enabled

## Deployment

### Pre-Flight Checks
- [ ] Notify team in #deployments channel
- [ ] Create deployment ticket
- [ ] Tag release in git: `git tag v2.0.0`
- [ ] Verify current production health
- [ ] Check for ongoing incidents
- [ ] Schedule deployment during low-traffic window

### Deployment Steps

#### 1. Backup Current State
```bash
# Backup database
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup environment
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)

# Tag current production commit
git tag production-backup-$(date +%Y%m%d-%H%M%S)
```

#### 2. Pull Latest Code
```bash
cd /home/user/BSI
git fetch --all
git checkout main
git pull origin main

# Or deploy specific tag
git checkout v2.0.0
```

#### 3. Install Dependencies
```bash
npm ci --production
```

#### 4. Run Database Migrations
```bash
npm run migrate
```

#### 5. Validate Environment
```bash
node scripts/check-env.js
```

#### 6. Build Application
```bash
npm run build
```

#### 7. Run Smoke Tests
```bash
npm run test:smoke
```

#### 8. Deploy (Zero-Downtime)
```bash
# Using PM2
pm2 reload bsi-api --update-env

# Or using systemd
sudo systemctl reload bsi-api
```

### Post-Deployment Validation

#### Immediate (Within 5 Minutes)
- [ ] Health check responding: `curl https://api.blazesportsintel.com/health`
- [ ] API endpoints responding
- [ ] Error rate normal (< 1%)
- [ ] Response times normal (p99 < 2s)
- [ ] No critical errors in logs
- [ ] Validation working correctly
- [ ] Rate limiting working

#### Short-term (Within 30 Minutes)
- [ ] Monitor error rates
- [ ] Check database connection pool
- [ ] Verify cache hit rates (> 70%)
- [ ] Review Sentry for new errors
- [ ] Check memory usage
- [ ] Verify all background jobs running
- [ ] Test critical user flows

#### Long-term (Within 24 Hours)
- [ ] Monitor performance metrics
- [ ] Review validation error patterns
- [ ] Check for memory leaks
- [ ] Verify scheduled tasks ran
- [ ] Review user feedback
- [ ] Check for unusual traffic patterns

### Rollback Plan

If issues detected:

```bash
# 1. Rollback code
git checkout production-backup-[TIMESTAMP]
pm2 reload bsi-api

# 2. Rollback database (if needed)
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB < backup-[TIMESTAMP].sql

# 3. Restore environment (if changed)
cp .env.backup-[TIMESTAMP] .env
pm2 reload bsi-api

# 4. Verify rollback successful
curl https://api.blazesportsintel.com/health

# 5. Notify team
# Post in #deployments: "Deployment rolled back due to [REASON]"
```

## Post-Deployment

### Communication
- [ ] Post deployment success in #deployments
- [ ] Update status page if applicable
- [ ] Notify stakeholders
- [ ] Close deployment ticket
- [ ] Document any issues encountered

### Cleanup
- [ ] Remove old backups (keep last 7 days)
- [ ] Clear old logs
- [ ] Archive old deployment artifacts
- [ ] Update monitoring dashboards if needed

### Verification
- [ ] Run full test suite against production
- [ ] Verify monitoring alerts working
- [ ] Check backup systems
- [ ] Review performance metrics
- [ ] Validate all integrations

## Production Health Checks

### Daily Checks
- [ ] Review error rates and patterns
- [ ] Check response time metrics
- [ ] Verify backup completion
- [ ] Review validation errors
- [ ] Check disk space usage
- [ ] Review rate limit violations

### Weekly Checks
- [ ] Review and close Sentry issues
- [ ] Analyze performance trends
- [ ] Check database query performance
- [ ] Review cache hit rates
- [ ] Update dependencies
- [ ] Review security alerts
- [ ] Test disaster recovery procedures

### Monthly Checks
- [ ] Rotate API keys and secrets
- [ ] Review and update documentation
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Update SSL certificates if needed
- [ ] Review incident response procedures
- [ ] Performance optimization review

## Emergency Contacts

### On-Call Rotation
```
Week of [DATE]:
  Primary: [NAME] - Slack: @username - Phone: xxx-xxx-xxxx
  Backup: [NAME] - Slack: @username - Phone: xxx-xxx-xxxx
```

### Escalation Path
1. On-Call Engineer (PagerDuty)
2. Senior Engineer
3. Engineering Manager
4. VP Engineering
5. CTO

### Key Services
- **DNS**: Cloudflare
- **Hosting**: [Provider]
- **Database**: [Provider] / Self-hosted
- **Monitoring**: Datadog, Sentry, Grafana
- **CDN**: Cloudflare

## Common Issues & Solutions

### Issue: High Validation Error Rate
**Symptoms**: 400 errors spiking
**Solution**: Check recent schema changes, review logs for patterns
**Runbook**: `/docs/runbooks/incident-response.md#incident-1`

### Issue: Environment Validation Failure
**Symptoms**: Application won't start
**Solution**: Verify all required env vars set
**Runbook**: `/docs/runbooks/incident-response.md#incident-2`

### Issue: Database Connection Failures
**Symptoms**: 500 errors, "connection refused"
**Solution**: Check database service, verify credentials
**Runbook**: `/docs/runbooks/incident-response.md`

### Issue: High Memory Usage
**Symptoms**: Application slow, OOM errors
**Solution**: Restart service, investigate memory leaks
**Runbook**: `/docs/runbooks/incident-response.md`

### Issue: Rate Limit Exceeded
**Symptoms**: Many 429 responses
**Solution**: Identify source, whitelist or block IP
**Runbook**: `/docs/runbooks/incident-response.md#incident-3`

## Service Level Objectives (SLOs)

### Availability
- **Target**: 99.9% uptime
- **Maximum Downtime**: 43.8 minutes/month
- **Measurement**: Uptime Robot, CloudWatch

### Performance
- **Target**: 95% of requests < 500ms
- **Measurement**: Application performance monitoring

### Error Rate
- **Target**: < 0.5% error rate
- **Measurement**: Error tracking (Sentry)

### Data Durability
- **Target**: 99.999% (no data loss)
- **Measurement**: Backup verification

## Deployment Frequency

- **Patch/Hotfix**: As needed (within hours)
- **Minor Release**: Weekly (Tuesdays 2-4 PM PT)
- **Major Release**: Monthly (First Tuesday)
- **Security Update**: Immediate

## Feature Flags

Consider using feature flags for:
- New endpoints
- Schema changes
- Performance experiments
- Gradual rollouts

## Blue-Green Deployment (Future)

Plan for zero-downtime deployments:

```
1. Deploy to "green" environment
2. Run smoke tests on green
3. Switch load balancer to green
4. Monitor for issues
5. Keep blue as instant rollback
6. After 24h, decommission blue
```

## Canary Deployment (Future)

Gradual rollout strategy:
- 5% traffic → Monitor for 30 min
- 25% traffic → Monitor for 1 hour
- 50% traffic → Monitor for 2 hours
- 100% traffic → Full deployment

## Documentation Links

- [Validation Documentation](/docs/VALIDATION.md)
- [Performance Guide](/docs/PERFORMANCE.md)
- [Incident Response Runbook](/docs/runbooks/incident-response.md)
- [Monitoring Dashboard](https://grafana.blazesportsintel.com)
- [API Documentation](/docs/openapi.json)
- [Architecture Diagrams](/docs/architecture/)

## Approval

### Required Approvals
- [ ] Engineering Lead
- [ ] DevOps/SRE Team
- [ ] Security Review (for major changes)
- [ ] Product Owner (for user-facing changes)

### Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Deployer | _______ | _____ | _______ |
| Reviewer | _______ | _____ | _______ |
| Approver | _______ | _____ | _______ |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-10-23 | Initial production checklist | Claude |

---

**Next Review Date**: 2024-11-23
**Document Owner**: DevOps Team
**Last Updated**: 2024-10-23
