# BSI Risk Assessment

**Last Updated:** 2026-01-16
**Scope:** Security, Reliability, Cost, Technical Debt

---

## Risk Summary Matrix

| # | Risk | Severity | Likelihood | Impact | Category |
|---|------|----------|------------|--------|----------|
| 1 | Single-source dependency on Highlightly API | HIGH | MEDIUM | HIGH | Reliability |
| 2 | Untracked files in git (200+ files) | HIGH | HIGH | MEDIUM | Tech Debt |
| 3 | No rate limiting on public API endpoints | MEDIUM | HIGH | MEDIUM | Security |
| 4 | Secrets in environment variables without rotation | MEDIUM | MEDIUM | HIGH | Security |
| 5 | Legacy HTML files with stale links | MEDIUM | HIGH | LOW | Tech Debt |
| 6 | KV cache invalidation strategy unclear | MEDIUM | MEDIUM | MEDIUM | Reliability |
| 7 | No comprehensive error tracking/alerting | MEDIUM | HIGH | MEDIUM | Reliability |
| 8 | Stripe webhook signature validation | MEDIUM | LOW | HIGH | Security |
| 9 | D1 database migration complexity | LOW | MEDIUM | MEDIUM | Tech Debt |
| 10 | Three.js/heavy deps in critical path | LOW | MEDIUM | LOW | Performance |

---

## Detailed Risk Analysis

### 1. Single-Source Dependency on Highlightly API

**Severity:** HIGH | **Category:** Reliability

**Description:**
College baseball and college football data flow through Highlightly Pro as the primary (and often only) source. The `highlightly-adapter.ts` (lib/adapters/highlightly-adapter.ts:188-265) implements retry logic, but no fallback adapter exists for college sports.

**Evidence:**
```typescript
// lib/adapters/highlightly-adapter.ts:271-300
async getCollegeBaseballScores(date?: string): Promise<HighlightlyResponse<HighlightlyGame>> {
  // No fallback if Highlightly fails
```

**Current Mitigations:**
- Retry with exponential backoff (3 attempts)
- Rate limit handling (429 responses)
- 10-second timeout

**Recommended Actions:**
1. Add NCAA API as fallback for college baseball standings
2. Implement D1Baseball scraper as secondary source
3. Cache last-known-good data in R2 for extended outages
4. Add Highlightly uptime monitoring to alerting

**Impact:** Complete loss of college baseball/football scores during Highlightly outages.

---

### 2. Untracked Files in Git (200+ files)

**Severity:** HIGH | **Category:** Tech Debt

**Description:**
Git status shows 200+ untracked files including entire directories (`app/`, `components/`, `lib/`, `workers/`, `functions/`). This indicates either:
- A recent restructuring that wasn't committed
- .gitignore misconfiguration
- Development work that bypassed version control

**Evidence:**
```
?? app/
?? components/
?? functions/
?? lib/
?? workers/
?? bsi-production/
```

**Risk:**
- Code loss on disk failure
- No audit trail for changes
- Deployment from uncommitted state
- Team collaboration impossible

**Recommended Actions:**
1. **Immediate:** Run `git status -uall` and categorize untracked files
2. Update `.gitignore` to exclude only build artifacts
3. Commit core code directories (`app/`, `lib/`, `functions/`, etc.)
4. Archive or delete legacy files (`bsi-production/` if obsolete)
5. Add pre-commit hook to prevent untracked file accumulation

---

### 3. No Rate Limiting on Public API Endpoints

**Severity:** MEDIUM | **Category:** Security

**Description:**
While `functions/api/college-baseball/rankings.js:30` implements rate limiting, inspection suggests not all endpoints have consistent protection. Rate limiting is implemented per-endpoint rather than at the middleware level.

**Evidence:**
```javascript
// functions/api/college-baseball/rankings.js:30
const limit = await rateLimit(env, request, 100, 60000);
```

But middleware file (`functions/api/_middleware.js`) doesn't enforce global rate limits.

**Risk:**
- API abuse / scraping
- Cost escalation (Cloudflare requests + external API calls)
- DoS vulnerability

**Recommended Actions:**
1. Implement rate limiting in `functions/_middleware.js` globally
2. Add per-IP tracking in KV with sliding window
3. Consider Cloudflare Rate Limiting rules at edge
4. Add authentication for high-volume endpoints

---

### 4. Secrets in Environment Variables Without Rotation

**Severity:** MEDIUM | **Category:** Security

**Description:**
Secrets documented in `wrangler.toml:75-91` are managed via `wrangler secret put` with no documented rotation policy:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`
- `SPORTSDATA_API_KEY`

**Evidence:**
```toml
# wrangler.toml:75-91
# Required secrets:
# - STRIPE_SECRET_KEY
# - JWT_SECRET
```

**Risk:**
- Long-lived secrets increase breach impact window
- No audit trail for secret access
- Manual rotation is error-prone

**Recommended Actions:**
1. Document secret rotation procedure
2. Implement 90-day rotation schedule for API keys
3. Use Cloudflare Access Service Tokens where applicable
4. Add secret access logging
5. Consider Cloudflare Workers Secrets for automatic rotation

---

### 5. Legacy HTML Files with Stale Links

**Severity:** MEDIUM | **Category:** Tech Debt

**Description:**
The `bsi-production/` directory contains static HTML files that predate the Next.js migration. These files are deployed alongside the modern app and may contain:
- Broken internal links
- Outdated data references
- Inconsistent styling

**Evidence:**
From `DEPLOYMENT_NOTES.md:123-124`:
> Legacy HTML Files: Many static HTML files in `public/` and `bsi-production/` contain links to non-existent routes.

**Risk:**
- User confusion from broken pages
- SEO penalties from 404s
- Maintenance overhead

**Recommended Actions:**
1. Audit `bsi-production/` for pages still receiving traffic
2. Set up redirects for legacy URLs to Next.js equivalents
3. Remove unused HTML files
4. Add CI check for broken links (`scripts/validate-routes.mjs`)

---

### 6. KV Cache Invalidation Strategy Unclear

**Severity:** MEDIUM | **Category:** Reliability

**Description:**
KV caching uses TTL-based expiration but lacks explicit invalidation strategy. Cache keys are documented:
```
cache:*, scores:*, odds:*, session:*
```

But no mechanism exists to invalidate on data updates (e.g., score changes mid-game).

**Evidence:**
```javascript
// functions/api/college-baseball/rankings.js:175-180
await env.CACHE.put(cacheKey, JSON.stringify(responseData), { expirationTtl: 900 });
```

**Risk:**
- Stale data served after live updates
- Cache inconsistency between edge locations

**Recommended Actions:**
1. Document cache TTLs by data type
2. Add cache-busting query param for live scores
3. Implement pub/sub pattern for real-time invalidation
4. Consider Cloudflare Durable Objects for coordinated cache

---

### 7. No Comprehensive Error Tracking/Alerting

**Severity:** MEDIUM | **Category:** Reliability

**Description:**
Sentry is listed in dependencies (`@sentry/node`) but integration is unclear. Console logging is used throughout workers:
```javascript
console.error('[highlightly] College baseball scores fetch failed:', error);
```

**Evidence:**
- `package.json:46` lists `@sentry/node`
- No `Sentry.init()` found in worker entry points
- No alerting configuration documented

**Risk:**
- Errors go unnoticed in production
- No correlation between errors
- No alert escalation for critical failures

**Recommended Actions:**
1. Configure Sentry DSN in worker environment
2. Add Sentry integration to all worker entry points
3. Set up Cloudflare Workers Logpush to external monitoring
4. Define alert thresholds (5xx rate, latency p99)
5. Add on-call rotation documentation

---

### 8. Stripe Webhook Signature Validation

**Severity:** MEDIUM | **Category:** Security

**Description:**
Stripe webhook handler exists at `functions/api/stripe/webhook.ts`. Webhook signature validation is critical to prevent:
- Spoofed payment events
- Fraudulent subscription activations

**Risk:**
Without proper validation, attackers could forge webhook payloads to grant unauthorized access.

**Recommended Actions:**
1. Verify `STRIPE_WEBHOOK_SECRET` is configured
2. Ensure `stripe.webhooks.constructEvent()` validates signature
3. Add IP allowlist for Stripe webhook IPs
4. Log all webhook events for audit
5. Test with Stripe CLI: `stripe listen --forward-to localhost:8788/api/stripe/webhook`

---

### 9. D1 Database Migration Complexity

**Severity:** LOW | **Category:** Tech Debt

**Description:**
Database migrations are managed via SQL files in `workers/college-data-sync/migrations/` and manual wrangler commands:
```bash
npm run db:migrate:production
```

No migration versioning system (like Prisma Migrate or Drizzle) is in place.

**Evidence:**
```bash
# package.json:39
"db:migrate:production": "wrangler d1 execute blazesports-historical --remote --file=schema/003_migration_drop_and_recreate.sql"
```

**Risk:**
- Migrations can't be rolled back
- No tracking of applied migrations
- "DROP and recreate" suggests destructive patterns

**Recommended Actions:**
1. Adopt migration versioning tool (Drizzle recommended for D1)
2. Track applied migrations in a `_migrations` table
3. Add migration dry-run capability
4. Never use DROP in production migrations

---

### 10. Three.js/Heavy Dependencies in Critical Path

**Severity:** LOW | **Category:** Performance

**Description:**
Heavy dependencies are in the main bundle:
- `three` (1.2MB)
- `@react-three/fiber`
- `@react-three/drei`
- `recharts`

**Evidence:**
```json
// package.json:48-64
"@react-three/drei": "^10.0.0",
"@react-three/fiber": "^9.0.0",
"three": "^0.170.0",
"recharts": "^3.5.1"
```

**Mitigations in Place:**
- Dynamic imports with `next/dynamic` (documented in DEVELOPMENT.md:126-134)
- `ssr: false` for heavy components

**Risk:**
- Initial bundle size impacts LCP
- Mobile performance degradation

**Recommended Actions:**
1. Audit bundle with `next/bundle-analyzer`
2. Ensure Three.js only loads on hero interaction
3. Consider lighter charting library (visx, victory)
4. Add performance budget to CI

---

## Risk Ownership

| Risk | Owner | Review Cadence |
|------|-------|----------------|
| 1-4 | Engineering Lead | Weekly |
| 5-6 | Frontend Lead | Bi-weekly |
| 7 | DevOps/SRE | Weekly |
| 8 | Security Review | Quarterly |
| 9-10 | Tech Debt Backlog | Sprint planning |

---

## Next Steps

1. **This Week:** Address Risk #2 (untracked files) - commit or archive
2. **This Sprint:** Implement global rate limiting (Risk #3)
3. **Next Sprint:** Add Highlightly fallback (Risk #1)
4. **Quarterly:** Security audit for Risks #4, #8

---

*Generated: 2026-01-16 | See ARCHITECTURE.md for system overview*
