# BSI Security Audit Report

**Date:** January 2025
**Auditor:** Claude Code (Staff Engineer Terminal)
**Scope:** API security, secrets management, CORS, CSP, rate limiting, input validation

---

## Executive Summary

The BSI platform has a **solid security foundation** with well-implemented rate limiting, input validation, and secrets management. However, there are some inconsistencies between endpoints and a few gaps that should be addressed before scaling to production traffic.

**Overall Security Rating:** 🟡 **Good** (with recommended improvements)

---

## Findings

### 1. CORS Configuration

**Status:** ⚠️ Inconsistent

| Location                      | Configuration                       | Risk              |
| ----------------------------- | ----------------------------------- | ----------------- |
| `functions/api/_utils.js`     | `https://blazesportsintel.com` only | ✅ Secure         |
| `workers/prediction/index.ts` | `*` (all origins)                   | ⚠️ Too permissive |

**Recommendation:** Update the prediction worker to use restrictive CORS:

```typescript
// workers/prediction/index.ts line 59-64
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

**Exception:** If the prediction API needs to be publicly accessible (third-party integrations), document this explicitly and add API key validation for all requests.

---

### 2. Security Headers

**Status:** ✅ Well Implemented (in `_utils.js`)

```javascript
'X-Content-Type-Options': 'nosniff',
'X-Frame-Options': 'DENY',
'X-XSS-Protection': '1; mode=block',
'Referrer-Policy': 'strict-origin-when-cross-origin',
'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
```

**Gap:** These headers are NOT applied to the prediction worker. Copy the security header pattern to `workers/prediction/index.ts`.

---

### 3. Rate Limiting

**Status:** ✅ Implemented, ⚠️ Inconsistently Applied

**Implementation Details:**

- **Location:** `functions/api/_utils.js`
- **Algorithm:** Time-windowed counter via KV storage
- **Default:** 100 requests/minute per IP
- **Endpoint-specific:** Win probability uses 100/min

**Coverage Audit:**

| Endpoint                              | Rate Limited | Limit   |
| ------------------------------------- | ------------ | ------- |
| `/api/v1/predictions/win-probability` | ✅ Yes       | 100/min |
| `/api/v1/predict/game/:id`            | ❌ No        | -       |
| `/api/v1/predict/batch`               | ❌ No        | -       |
| `/api/v1/calibration/:sport`          | ❌ No        | -       |
| `/api/v1/explain/:id`                 | ❌ No        | -       |
| `/api/v1/webhook/game-complete`       | ❌ No        | -       |

**Recommendation:** Add rate limiting to the prediction worker:

```typescript
// Add to workers/prediction/index.ts
const checkRateLimit = async (env: CloudflareEnv, ip: string): Promise<boolean> => {
  const key = `ratelimit:pred:${ip}:${Math.floor(Date.now() / 60000)}`;
  const count = parseInt((await env.CACHE?.get(key)) ?? '0');
  if (count >= 100) return false;
  await env.CACHE?.put(key, String(count + 1), { expirationTtl: 120 });
  return true;
};
```

---

### 4. Input Validation

**Status:** ✅ Excellent

**Location:** `lib/validation/input-validator.ts`

**Features:**

- Zod-based schema validation
- XSS prevention via `sanitizeString()`
- SQL injection prevention via `sanitizeSqlInput()`
- Strong password requirements (uppercase, lowercase, number, special char)
- File upload validation (MIME type + extension matching)

**Schemas Available:**

- User registration/login
- API key creation
- Sports data queries (team, game, player, season)
- Pagination and sorting
- File uploads
- Webhooks

**Validation Middleware:** `withValidation()` wrapper available for endpoints.

---

### 5. Secrets Management

**Status:** ✅ Well Designed

**Location:** `lib/security/secrets.ts`, `lib/config/env-validator.ts`

**Features:**

- Zod schema validation for all secrets
- Multi-source loading (env vars, KV, Cloudflare secrets)
- Audit logging for all secret access
- 5-minute cache with TTL
- Weak password detection that blocks production deployment

**Hardcoded Secrets Check:** ✅ None found in codebase

---

### 6. Content Security Policy (CSP)

**Status:** ❌ Not Implemented

CSP headers are mentioned in documentation (`docs/LEGAL-COMPLIANCE-IMPLEMENTATION.md`) but not present in the middleware.

**Recommendation:** Add CSP headers to `_utils.js`:

```javascript
'Content-Security-Policy': [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https://api.blazesportsintel.com https://blazesportsintel.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ')
```

---

### 7. SQL Injection Prevention

**Status:** ✅ Properly Handled

**Methods:**

1. Parameterized queries throughout (D1 `.bind()` method)
2. `sanitizeSqlInput()` utility function available
3. Zod schemas prevent type-based injection

**Example from prediction worker:**

```typescript
const query = `
  SELECT * FROM team_psychological_state
  WHERE team_id = ? AND sport = ?
`;
const result = await env.DB.prepare(query).bind(teamId, sport).first();
```

---

### 8. Authentication & Authorization

**Status:** ⚠️ Basic Implementation

**Current:**

- Tier extraction from Authorization header (basic string matching)
- No JWT validation
- No API key verification

**Concerns:**

```typescript
// workers/prediction/index.ts line 562-572
function extractTier(request: Request): SubscriptionTier {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return 'free';
  if (authHeader.includes('enterprise')) return 'enterprise';
  if (authHeader.includes('pro')) return 'pro';
  return 'free';
}
```

**This is easily spoofable.** Anyone can send `Authorization: Bearer enterprise-fake` to get enterprise tier access.

**Recommendation:** Implement proper JWT or API key validation before production launch.

---

## Priority Action Items

### High Priority (Before Production)

1. **Fix tier extraction** - Implement JWT validation or API key lookup
2. **Add rate limiting to prediction worker** - Currently no limits
3. **Add security headers to prediction worker** - Missing X-Frame-Options, etc.

### Medium Priority (Within 30 Days)

4. **Implement CSP headers** - Add Content-Security-Policy
5. **Standardize CORS** - Decide if prediction API is public and document

### Low Priority (Ongoing)

6. **Security audit logging** - Already implemented, ensure it's monitored
7. **Dependency scanning** - Run `npm audit` in CI/CD

---

## Verified Security Controls

| Control            | Status | Implementation             |
| ------------------ | ------ | -------------------------- |
| HTTPS Enforcement  | ✅     | Cloudflare automatic       |
| Input Validation   | ✅     | Zod schemas                |
| SQL Injection      | ✅     | Parameterized queries      |
| XSS Prevention     | ✅     | sanitizeString() + headers |
| CSRF               | ⚠️     | Partial (CORS only)        |
| Rate Limiting      | ⚠️     | Some endpoints             |
| Secrets Management | ✅     | Encrypted env vars         |
| Error Handling     | ✅     | No stack traces exposed    |
| Audit Logging      | ✅     | Secrets access logged      |

---

## Test Commands

```bash
# Run security-related tests
npm run test -- tests/integration/api-failure-fallback.test.ts

# Check for hardcoded secrets
grep -rn "sk_live\|sk_test\|api_key\|password.*=.*['\"]" src/ lib/ functions/ workers/

# Run npm audit
npm audit --audit-level=moderate
```

---

## Conclusion

BSI has invested in security infrastructure—the input validation and secrets management are particularly well done. The main gaps are:

1. **Authentication tier spoofing** - Critical before monetization
2. **Inconsistent rate limiting** - Prediction worker unprotected
3. **Missing CSP headers** - Should be added for defense-in-depth

These are addressable issues. The foundation is solid.

---

_Born to blaze the path less beaten—securely._
