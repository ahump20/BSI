# BSI Production Audit - Issues Reference

This document provides quick lookup of all identified issues with exact file locations and line numbers.

---

## CRITICAL SECURITY ISSUES

### ⛔ Issue S-001: Hardcoded Credentials in Docker Compose

**Severity**: CRITICAL  
**Category**: Secrets Management  
**Status**: Active

**Files Affected**:
- `/home/user/BSI/docker-compose.yml`

**Specific Locations**:
```
Line 10:   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-blaze2024!}
Line 42:   MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-blaze2024secure!}
Line 62:   DATABASE_URL: postgresql://blaze:blaze2024!@postgres:5432/blaze_biomech
Line 66:   S3_SECRET_KEY: blaze2024secure!
Line 88:   DATABASE_URL: postgresql://blaze:blaze2024!@postgres:5432/blaze_biomech
Line 142:  GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-blaze2024!}
```

**Issue**: Hardcoded default passwords visible in version control

**Risk**: 
- OWASP CWE-798: Use of Hard-coded Credentials
- Unauthorized database access
- Storage account compromise
- Anyone with repo access has credentials

**Fix Time**: 2 hours

**Required Fix**:
Remove all hardcoded values, use environment variables only:
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?error "POSTGRES_PASSWORD must be set"}
MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:?error "MINIO_ROOT_PASSWORD must be set"}
GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:?error "GRAFANA_PASSWORD must be set"}
```

---

### ⛔ Issue S-002: No API Authentication

**Severity**: CRITICAL  
**Category**: Authentication  
**Status**: Not Implemented

**Files Affected**:
- `/functions/api-gateway.js` (lines 14-60 show config but no auth)
- `/lib/api/mlb.ts` (lines 77-120 - API calls without auth header)
- `/lib/api/nfl.ts` - API calls without auth
- Missing: Authentication middleware

**Issue**: Zero authentication on API endpoints

**Risk**:
- OWASP A7:2017 - Broken Authentication
- Unauthorized API access
- Data theft
- Resource abuse

**Missing Implementation**:
- JWT token validation
- API key validation
- OAuth implementation
- RBAC (role-based access control)

**Fix Time**: 4 hours

**Required Fix**:
```javascript
// /functions/api-gateway.js - Add authentication middleware
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const token = authHeader.slice(7);
  return verifyJWT(token, env.JWT_PUBLIC_KEY);
}
```

---

### ⛔ Issue S-003: No Database Access Control

**Severity**: CRITICAL  
**Category**: Data Protection  
**Status**: Not Implemented

**Files Affected**:
- `/lib/db/prisma.ts` (lines 27-31 - logging configuration)
- `/lib/reconstruction/live-monitor.ts` (lines 180-220 - unvalidated inserts)

**Issues**:
1. **Line 30** - Logging enabled in production:
   ```typescript
   log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
   // Only logs errors, cannot debug performance issues
   ```

2. **Lines 180-220** - Unvalidated data insertion:
   ```typescript
   await this.env.DB.prepare(`INSERT INTO live_games...`).bind(
     liveGameId,
     event.gamePk,  // Direct from API, not validated
     teamIds,
     startTime,
   ).run();
   ```

**Risk**:
- No row-level security
- No audit logging
- Unencrypted at rest
- No access control per user/role

**Missing**:
- RLS (Row-Level Security) policies
- Audit logging for all data access
- Encryption at rest
- Connection-level encryption

**Fix Time**: 6 hours

---

### ⛔ Issue S-004: No CSRF Protection

**Severity**: CRITICAL  
**Category**: Web Security  
**Status**: Not Implemented

**Files Affected**:
- Missing from all API endpoints
- No middleware found

**Risk**:
- OWASP A5:2017 - Broken Access Control
- Cross-site request forgery attacks
- Unauthorized state changes

**Required**:
- CSRF token generation
- Token validation on POST/PUT/DELETE
- SameSite cookie configuration

**Fix Time**: 3 hours

---

### ⛔ Issue S-005: Missing Secrets Management

**Severity**: CRITICAL  
**Category**: Infrastructure  
**Status**: Not Implemented

**Files Affected**:
- `.env.example` (shows all secrets in plaintext)
- No secrets manager integration

**Issue**: Secrets stored in environment files and version control

**Missing**:
- Cloudflare Secrets integration
- AWS Secrets Manager / HashiCorp Vault
- Secret rotation automation
- Audit logging for secret access

**Fix Time**: 4 hours

---

### ⛔ Issue S-006: Incomplete Cloudflare Binding Configuration

**Severity**: CRITICAL (BLOCKING DEPLOYMENT)  
**Category**: Deployment  
**Status**: Awaiting Manual Configuration

**File**: `/home/user/BSI/DEPLOYMENT-STATUS.md`

**Issue** (from lines 29-34):
```
## ❌ What's Blocking Production

**Error**: Production Functions timeout (HTTP 522)
**Root Cause**: Bindings not configured in Cloudflare dashboard
**Solution**: Manual configuration required (cannot be automated via CLI)
```

**Current State**:
- Functions deployed but timeout
- KV namespace not bound: `a53c3726fc3044be82e79d2d1e371d26`
- D1 database not bound: `612f6f42-226d-4345-bb1c-f0367292f55e`
- Analytics Engine not bound

**Required Action** (lines 35-60):
1. Open Cloudflare dashboard
2. Navigate to college-baseball-tracker Pages
3. Settings → Functions → Bindings
4. Add KV namespace "CACHE"
5. Add D1 database "blazesports-historical"
6. Add Analytics Engine binding

**Fix Time**: 15 minutes manual configuration

---

## HIGH-PRIORITY ISSUES

### 🟠 Issue H-001: No Production Logging

**Severity**: HIGH  
**Category**: Observability  
**Status**: Incomplete

**Files Affected**:
- `/lib/api/mlb.ts` (line 89): `console.log('[Cache HIT]...')`
- `/lib/api/nfl.ts`: Similar console logging
- `/lib/utils/errors.ts` (line 196): `// TODO: Send to monitoring service`
- `/lib/db/prisma.ts` (line 30): Database logging disabled in production

**Issue**: Only console.log/console.error, no structured logging

**Missing**:
- JSON-formatted logs
- Log levels (debug/info/warn/error/fatal)
- Correlation IDs for request tracing
- Log aggregation
- Structured context capture

**Examples**:
- Current: `console.log('[Cache HIT] MLB team ${teamId}')`
- Required: Structured logging with timestamp, level, context

**Fix Time**: 6 hours

**Solution**:
Implement pino logger:
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' },
  },
});

logger.info({ sport: 'baseball', teamId: 138 }, 'Fetching team');
```

---

### 🟠 Issue H-002: Critically Low Test Coverage (10%)

**Severity**: HIGH  
**Category**: Quality  
**Status**: Critical Gap

**Files Affected**:
- Only 9 test files total
- `/tests/` (7 files)
- `/apps/web/tests/` (1 file)
- `/context7-enhanced/__tests__/` (1 file)

**Coverage Gap**:
- Total TypeScript code: ~26,312 lines
- Only ~10% coverage
- Estimated 2,600+ lines untested

**Untested Critical Files**:
- `/lib/reconstruction/live-monitor.ts` (1,270 lines) - 0% tested
- `/lib/reconstruction/GameMonitorDO.ts` - 0% tested
- `/lib/utils/cache.ts` - 0% tested
- `/lib/nlg/*.ts` - 0% tested
- `/functions/scheduled/*.js` (all cron jobs) - 0% tested
- All `/api/v1/*.ts` endpoints - 0% tested
- `/lib/db/prisma.ts` - 0% tested

**Risk**: High defect discovery in production

**Fix Time**: 40+ hours

**Target**: 80% coverage (vitest.config.ts line 74)

---

### 🟠 Issue H-003: Database Backup Missing

**Severity**: HIGH  
**Category**: Disaster Recovery  
**Status**: Not Implemented

**Files Affected**:
- `docker-compose.prod.yml` (no backup configuration)
- Missing backup scripts

**Issue**:
- Volume mounts present but no backup automation
- No restore testing
- No RTO/RPO definition
- No off-site storage

**Missing**:
- Automated daily backups
- Off-site storage (Cloudflare R2)
- Point-in-time recovery
- Restore testing schedule
- Data retention policy

**Fix Time**: 4 hours

---

### 🟠 Issue H-004: No Deployment Automation

**Severity**: HIGH  
**Category**: Deployment  
**Status**: Not Implemented

**Files Affected**:
- `/.github/workflows/deploy.yml` (lines 1-44) - Basic deployment only

**Missing**:
- Blue-green deployment
- Canary deployment
- Automated rollback
- Smoke tests post-deployment
- Health check validation
- Deployment notifications

**Current State** (from deploy.yml):
```yaml
# Only basic deployment, no advanced strategies
- run: pnpm i --frozen-lockfile
- run: pnpm -w build
- name: Deploy Pages
  uses: cloudflare/pages-action@v1
```

**Fix Time**: 20 hours

---

### 🟠 Issue H-005: Monitoring & Alerts Not Configured

**Severity**: HIGH  
**Category**: Observability  
**Status**: Partial (40%)

**Files Affected**:
- `/observability/README.md` (shows config but incomplete)
- `.github/workflows/deploy.yml` (Sentry only, no full integration)

**Missing**:
- SLO/SLI definitions
- Alert thresholds
- Alert routing / escalation
- Incident response automation
- PagerDuty/Slack integration
- Metric dashboards

**Partially Implemented**:
- Sentry (error tracking)
- Datadog RUM (client monitoring)
- Prometheus (not fully configured)
- Grafana (available but not set up)

**Fix Time**: 8 hours

---

### 🟠 Issue H-006: Incomplete Input Validation

**Severity**: HIGH  
**Category**: Security  
**Status**: Partial (40%)

**Files Affected**:
- `/lib/validation/schemas/baseball.schema.ts` (exists for some endpoints)
- Missing validation in:
  - `/lib/reconstruction/live-monitor.ts` (lines 180-220)
  - `/functions/scheduled/*.js`
  - File upload endpoints
  - Webhook endpoints

**Example** (line 180 of live-monitor.ts):
```typescript
// Unvalidated data insertion
await this.env.DB.prepare(`INSERT INTO live_games...`).bind(
  liveGameId,
  event.gamePk,  // Direct from API, not validated
).run();
```

**Missing**:
- Validation on CloudFlare functions
- File upload size validation
- Webhook payload validation
- Query parameter validation

**Fix Time**: 8 hours

---

## MEDIUM-PRIORITY ISSUES

### 🟡 Issue M-001: Limited Rate Limiting

**Severity**: MEDIUM  
**Category**: Security  
**Status**: 30% (gateway only)

**Files Affected**:
- `/functions/api-gateway.js` (lines 37-59) - Only implements basic rate limiting

**Current Rate Limiting**:
```javascript
RATE_LIMIT: {
  requests: 100,
  window: 3600000, // 1 hour
}
```

**Missing Rate Limiting**:
- Database query limits
- Live game monitoring endpoints
- Sports data ingestion endpoints
- ML model API endpoints
- File upload limits
- User-based rate limits

---

### 🟡 Issue M-002: No Operations Documentation

**Severity**: MEDIUM  
**Category**: Documentation  
**Status**: 0%

**Missing**:
- Incident response runbooks
- Troubleshooting guides
- Common issues and solutions
- Deployment procedures
- Rollback procedures
- Data recovery procedures

---

### 🟡 Issue M-003: Incomplete API Documentation

**Severity**: MEDIUM  
**Category**: Documentation  
**Status**: 60%

**Files Affected**:
- `/API_ENDPOINTS_INVENTORY.md`
- `/API_SUMMARY.txt`
- `/README.md` (line 71-246 - examples only)

**Missing**:
- OpenAPI/Swagger specification
- Interactive API documentation
- Schema versioning
- Endpoint deprecation paths
- Rate limit documentation

---

### 🟡 Issue M-004: Environment Isolation Missing

**Severity**: MEDIUM  
**Category**: DevOps  
**Status**: 0%

**Missing**:
- Separate dev/staging/prod configurations
- Environment-specific feature flags
- Log level per environment
- Data anonymization for staging
- Environment parity validation

---

### 🟡 Issue M-005: No Staging Environment

**Severity**: MEDIUM  
**Category**: DevOps  
**Status**: 0%

**Required**:
- Staging with production parity
- Pre-production validation
- Performance testing
- Backup/restore testing

---

### 🟡 Issue M-006: Missing Infrastructure as Code

**Severity**: MEDIUM  
**Category**: DevOps  
**Status**: 0%

**Missing**:
- Terraform for Cloudflare resources
- Infrastructure documentation
- Repeatable deployment
- Disaster recovery automation

---

## CONFIGURATION ISSUES

### Issue C-001: Environment Variable Validation Missing

**Severity**: HIGH  
**Category**: Configuration  

**Files Affected**:
- `/lib/adapters/whoop-v2-adapter.ts`:
  ```typescript
  clientSecret: process.env.WHOOP_CLIENT_SECRET || ''  // Silent failure
  ```
- `/lib/api/sports-data-client.ts` (similar pattern)

**Issue**: No schema validation for required environment variables

**Required**:
```typescript
const envSchema = z.object({
  WHOOP_CLIENT_ID: z.string().min(1),
  WHOOP_CLIENT_SECRET: z.string().min(1),
});
const env = envSchema.parse(process.env);
```

---

## LOGGING ISSUES

### Issue L-001: TODO Comments Indicating Incomplete Features

**Severity**: MEDIUM  
**Category**: Implementation Status

**Files Affected**:
- `/lib/utils/errors.ts` (line 196):
  ```typescript
  // TODO: Send to monitoring service (e.g., Sentry, LogRocket)
  ```

- `/lib/adapters/whoop-v2-adapter.ts`:
  ```typescript
  timezone_offset: 0, // TODO: Extract from user profile
  ```

- `/lib/api/v1/conferences.ts`:
  ```typescript
  streak: undefined, // TODO: Calculate from recent games
  ```

---

## TESTING ISSUES

### Issue T-001: Test Configuration Issues

**Severity**: MEDIUM  
**Category**: Testing

**File**: `/vitest.config.ts`

**Issues**:
- Line 37: `environment: 'jsdom'` globally (should be 'node' for backend)
- Line 48: `testTimeout: 10000` (too short for API tests)
- Missing: API-specific timeout configuration

**Fix**:
```typescript
test.describe('API endpoints', () => {
  test.setTimeout(30000);  // 30 seconds for API tests
});
```

---

## PERFORMANCE ISSUES

### Issue P-001: No Query Optimization Verification

**Severity**: MEDIUM  
**Category**: Performance

**Missing**:
- EXPLAIN plan analysis
- Slow query logging
- N+1 query detection
- Database index coverage

---

### Issue P-002: No Load Testing

**Severity**: MEDIUM  
**Category**: Performance

**Missing**:
- Load test results
- Concurrent user capacity
- Response time baselines
- Bottleneck identification

---

## ARCHITECTURE ISSUES

### Issue A-001: Repository Structure Cluttered

**Severity**: LOW  
**Category**: Maintainability

**File**: Root directory

**Issue**: 90+ markdown files in root directory

**Current**: Hundreds of doc files mixed with code  
**Required**: Clean docs/ directory structure

---

### Issue A-002: No API Versioning Strategy

**Severity**: LOW  
**Category**: API Design

**Current**: Using `/api/v1/` but inconsistent

**Missing**:
- Clear versioning strategy
- Deprecation path
- Version compatibility matrix

---

## SUMMARY STATISTICS

| Severity | Count | Total Hours |
|----------|-------|------------|
| 🔴 Critical | 6 | 20-30 |
| 🟠 High | 6 | 60-80 |
| 🟡 Medium | 6 | 40-60 |
| **Total** | **18** | **130-180** |

---

**Last Updated**: November 2, 2025  
**Next Review**: After critical issues resolved
