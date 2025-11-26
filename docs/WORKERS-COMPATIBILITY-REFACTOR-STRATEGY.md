# Cloudflare Workers Compatibility Refactor Strategy
## Permanent Fix for process.env Issues

**Date**: November 20, 2025
**Status**: Planning
**Goal**: Eliminate need for surgical deployments by making all lib/ files Workers-compatible

---

## 🎯 Objective

Refactor existing lib/ files to use Cloudflare Workers `env` bindings instead of Node.js `process.env`, enabling clean deployments without temporary workarounds.

---

## 📊 Audit Results

### Files Using `process` API (13 total)

**Critical (Blocks Deployment)**:
1. `lib/config/env-validator.ts` - Uses `process.env`, `process.exit()`
2. `lib/utils/logger.ts` - Uses `process.env.LOG_LEVEL`, `NODE_ENV`, etc.
3. `lib/api/sports-data-client.ts` - Uses `process.env.SPORTSDATAIO_API_KEY`

**Medium Priority**:
4. `lib/security/secrets.ts` - Fallback to `process.env` (already mostly compatible!)
5. `lib/adapters/sportsdataio.ts` - Uses `process.env.SPORTSDATAIO_API_KEY`
6. `lib/adapters/whoop-v2-adapter.ts` - Uses `process.env`

**Low Priority (Not Used in Production Functions)**:
7. `lib/mermaid-charts.js` - Development tool
8. `lib/stackoverflow-integration.js` - Development tool
9. `lib/college-baseball/push-notifications.ts` - Future feature
10. `lib/neon-database.js` - Database (not used yet)
11. `lib/db/prisma.ts` - Database (not used yet)
12. `lib/api/real-sports-data-integration.ts` - Superseded by Phase 3
13. `lib/skills/sports-data-qc/examples/example_usage.ts` - Example only

---

## 🔧 Refactor Strategy

### Principle: Dual Compatibility

Create code that works in **both** Node.js (local development) **and** Cloudflare Workers (production).

**Pattern**:
```typescript
// ❌ Old: Node.js only
const apiKey = process.env.SPORTSDATAIO_API_KEY;

// ✅ New: Dual-compatible
function getApiKey(env?: Env): string {
  // Workers: Use env binding
  if (env?.SPORTSDATAIO_API_KEY) {
    return env.SPORTSDATAIO_API_KEY;
  }

  // Node.js fallback: Use process.env
  if (typeof process !== 'undefined' && process.env?.SPORTSDATAIO_API_KEY) {
    return process.env.SPORTSDATAIO_API_KEY;
  }

  throw new Error('SPORTSDATAIO_API_KEY not found in env or process.env');
}
```

---

## 📝 File-by-File Refactor Plan

### 1. lib/config/env-validator.ts

**Current Issues**:
- `process.env` access (lines 45, 78, 106)
- `process.exit(1)` calls (lines 134, 149)
- `process.env.NODE_ENV` check (line 140)

**Refactor Approach**: Make validation optional in Workers

```typescript
// NEW: Workers-compatible validator
export function validateEnv(env?: Env): { valid: boolean; errors?: string[] } {
  const envSource = env || (typeof process !== 'undefined' ? process.env : {});

  try {
    EnvSchema.parse(envSource);
    return { valid: true };
  } catch (error) {
    // ... existing error handling ...
  }
}

// NEW: Export validation WITHOUT process.exit()
export function getEnv(env?: Env): Env {
  const result = validateEnv(env);

  if (!result.valid) {
    const errors = result.errors?.join('\n') || 'Unknown error';
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return (env || process.env) as unknown as Env;
}

// KEEP: Node.js startup validator (for local dev)
export function validateEnvironmentOnStartup(): void {
  if (typeof process === 'undefined') {
    console.warn('⚠️  Running in Workers - skipping startup validation');
    return;
  }

  console.log('🔍 Validating environment configuration...');
  const result = validateEnv();

  if (!result.valid) {
    console.error('❌ Environment validation failed:');
    result.errors?.forEach((error) => console.error(`  - ${error}`));
    process.exit(1); // Only exit in Node.js
  }

  console.log('✅ Environment validation passed');
}
```

**Impact**: Low - Only affects startup scripts

---

### 2. lib/security/secrets.ts

**Current Issues**:
- Line 113: `process.env[name]` fallback
- Line 282: `process.env.NODE_ENV` default

**Refactor Approach**: Already 90% compatible! Just need small tweaks

```typescript
// MODIFY: Line 112-114
// OLD:
if (!value) {
  value = process.env[name] || null;
}

// NEW:
if (!value && typeof process !== 'undefined') {
  value = process.env[name] || null;
}

// MODIFY: Line 282
// OLD:
const environment = env || (process.env.NODE_ENV as Environment) || 'development';

// NEW:
const environment = env || (typeof process !== 'undefined' ? process.env.NODE_ENV as Environment : null) || 'development';
```

**Impact**: Minimal - Code already accepts `cfEnv` parameter

---

### 3. lib/utils/logger.ts

**Current Issues**:
- Lines 77-84: DEFAULT_CONFIG uses `process.env.*`
- Line 349: `process.env.DD_API_KEY`

**Refactor Approach**: Accept config from env bindings

```typescript
// NEW: Factory function that accepts env
export function createLogger(env?: Env, config?: Partial<LoggerConfig>): Logger {
  const defaultConfig: LoggerConfig = {
    level: env?.LOG_LEVEL as LogLevel || LogLevel.INFO,
    service: env?.SERVICE_NAME || 'bsi-api',
    version: env?.APP_VERSION || '1.0.0',
    environment: env?.NODE_ENV || 'production',
    prettyPrint: false, // Always false in Workers
    redact: ['password', 'token', 'secret', 'apiKey', 'authorization'],
    sendToSentry: env?.SENTRY_DSN ? true : false,
    sendToDatadog: env?.DD_API_KEY ? true : false,
  };

  return new Logger({ ...defaultConfig, ...config });
}

// KEEP: Global logger for Node.js
const DEFAULT_CONFIG: LoggerConfig = typeof process !== 'undefined' ? {
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  service: process.env.SERVICE_NAME || 'bsi-api',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  prettyPrint: process.env.NODE_ENV === 'development',
  redact: ['password', 'token', 'secret', 'apiKey', 'authorization'],
  sendToSentry: process.env.SENTRY_DSN ? true : false,
  sendToDatadog: process.env.DD_API_KEY ? true : false,
} : {
  level: LogLevel.INFO,
  service: 'bsi-api',
  environment: 'production',
  prettyPrint: false,
  redact: ['password', 'token', 'secret', 'apiKey', 'authorization'],
};

export const logger = new Logger(DEFAULT_CONFIG);

// MODIFY: sendToDatadog method (line 348-371)
private async sendToDatadog(entry: LogEntry, env?: Env): Promise<void> {
  const apiKey = env?.DD_API_KEY || (typeof process !== 'undefined' ? process.env.DD_API_KEY : null);
  if (!apiKey) return;

  // ... rest of method unchanged ...
}
```

**Impact**: Medium - Requires passing `env` to logger in Functions

---

### 4. lib/api/sports-data-client.ts

**Current Issues**:
- Line 86: `process.env.SPORTSDATAIO_API_KEY`
- Line 124: `process.env.COLLEGEFOOTBALLDATA_API_KEY`

**Refactor Approach**: Accept API keys as constructor parameters

```typescript
// MODIFY: SportsDataClient class
export class SportsDataClient {
  private config: SportsDataConfig;

  constructor(config?: Partial<SportsDataConfig>, env?: Env) {
    const apiKeys = {
      sportsDataIO: env?.SPORTSDATAIO_API_KEY ||
                    (typeof process !== 'undefined' ? process.env.SPORTSDATAIO_API_KEY : null) ||
                    '',
      collegeFB: env?.COLLEGEFOOTBALLDATA_API_KEY ||
                 (typeof process !== 'undefined' ? process.env.COLLEGEFOOTBALLDATA_API_KEY : null) ||
                 '',
    };

    this.config = {
      baseUrls: {
        sportsDataIO: 'https://api.sportsdata.io/v3',
        collegeFB: 'https://api.collegefootballdata.com',
        mlbStatsAPI: 'https://statsapi.mlb.com/api/v1',
      },
      apiKeys,
      timeout: config?.timeout || 10000,
      retries: config?.retries || 3,
      cache: config?.cache !== false,
    };
  }

  // ... rest of class ...
}

// NEW: Factory function for Workers
export function createSportsDataClient(env: Env, config?: Partial<SportsDataConfig>): SportsDataClient {
  return new SportsDataClient(config, env);
}

// KEEP: Global instance for Node.js
export const sportsDataClient = typeof process !== 'undefined' && process.env?.SPORTSDATAIO_API_KEY
  ? new SportsDataClient()
  : null; // Will be null in Workers - must use createSportsDataClient(env)
```

**Impact**: High - Requires updating all Functions that import `sportsDataClient`

---

### 5. lib/adapters/sportsdataio.ts

**Current Issues**:
- Lines 596-597: Global instance using `process.env.SPORTSDATAIO_API_KEY`

**Refactor Approach**: Already has conditional - just document usage

```typescript
// MODIFY: Line 593-598
/**
 * SportsDataIO Global Instance
 * Server-side only - uses process.env in Node.js
 *
 * FOR CLOUDFLARE WORKERS: Use createSportsDataIOAdapter(env) instead
 *
 * @example
 * // Node.js
 * import { sportsDataIO } from './sportsdataio';
 * const teams = await sportsDataIO.getMLBTeams();
 *
 * // Workers
 * import { createSportsDataIOAdapter } from './sportsdataio';
 * export async function onRequest({ request, env }) {
 *   const adapter = createSportsDataIOAdapter(env);
 *   const teams = await adapter.getMLBTeams();
 * }
 */
export const sportsDataIO = typeof process !== 'undefined' && process.env?.SPORTSDATAIO_API_KEY
  ? new SportsDataIOAdapter(process.env.SPORTSDATAIO_API_KEY)
  : null; // null in Workers - use createSportsDataIOAdapter(env)

// ADD: Factory function for Workers
export function createSportsDataIOAdapter(env: Env): SportsDataIOAdapter {
  if (!env.SPORTSDATAIO_API_KEY) {
    throw new Error('SPORTSDATAIO_API_KEY not found in env bindings');
  }
  return new SportsDataIOAdapter(env.SPORTSDATAIO_API_KEY);
}
```

**Impact**: Medium - Functions should use factory function

---

## 🔄 Migration Path

### Phase 1: Add Dual-Compatible Code (No Breaking Changes)

1. ✅ Add `env?: Env` parameter to existing functions
2. ✅ Add factory functions (e.g., `createLogger(env)`, `createSportsDataClient(env)`)
3. ✅ Keep existing global instances for Node.js compatibility
4. ✅ Update TypeScript types to accept `Env`

**Result**: Code works in both Node.js and Workers, but Functions still need updates

---

### Phase 2: Update Functions to Use Env Bindings

Update all Cloudflare Pages Functions to pass `env`:

```typescript
// OLD: functions/api/some-endpoint.js
import { sportsDataClient } from '../../lib/api/sports-data-client';

export async function onRequest({ request }) {
  const data = await sportsDataClient.getTeams(); // Uses process.env
  return new Response(JSON.stringify(data));
}

// NEW: functions/api/some-endpoint.js
import { createSportsDataClient } from '../../lib/api/sports-data-client';

export async function onRequest({ request, env }) {
  const client = createSportsDataClient(env);
  const data = await client.getTeams(); // Uses env bindings
  return new Response(JSON.stringify(data));
}
```

**Affected Functions** (estimate: 15-20 files):
- `functions/api/mlb/*.js` (8 files)
- `functions/api/nfl/*.js` (6 files)
- `functions/api/nba/*.js` (6 files)
- `functions/api/sports-data-real*.js` (3 files)

---

### Phase 3: Test & Deploy

1. Run TypeScript compilation: `npm run build:functions`
2. Check for `process` usage: `grep -r "process\." dist/`
3. Deploy without surgical isolation:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name college-baseball-tracker --branch main
   ```
4. Test all API endpoints
5. Monitor error rates in Cloudflare dashboard

---

## 📈 Estimated Timeline

| Phase | Tasks | Time | Risk |
|-------|-------|------|------|
| Phase 1 | Add dual-compatible code to 5 lib/ files | 2 hours | Low |
| Phase 2 | Update 15-20 Functions to use env bindings | 2 hours | Medium |
| Phase 3 | Test, deploy, monitor | 30 min | Low |
| **Total** | **Complete refactor** | **4.5 hours** | **Medium** |

---

## 🎓 Key Insights

`★ Insight ─────────────────────────────────────`

**1. Dual Compatibility Pattern**

The best approach for codebases that need to run in both Node.js (local development) and Cloudflare Workers (production):

```typescript
function getValue(env?: Env): string {
  // 1. Try Workers env bindings first
  if (env?.MY_VALUE) return env.MY_VALUE;

  // 2. Fallback to Node.js process.env
  if (typeof process !== 'undefined' && process.env?.MY_VALUE) {
    return process.env.MY_VALUE;
  }

  // 3. Throw error if not found
  throw new Error('MY_VALUE not configured');
}
```

This allows:
- ✅ Local development with `.env` files
- ✅ Production deployment to Workers
- ✅ Testing in both environments
- ✅ Gradual migration (no breaking changes)

**2. Factory Functions vs Global Instances**

**Global instances** (Node.js pattern):
```typescript
export const logger = new Logger(); // Created at module load
```

**Factory functions** (Workers pattern):
```typescript
export function createLogger(env: Env): Logger {
  return new Logger({ apiKey: env.API_KEY });
}
```

Workers prefer factory functions because:
- Env bindings aren't available at module load time
- Each request gets isolated context
- Prevents state leakage between requests

**3. TypeScript Type Safety**

Define an `Env` interface matching Cloudflare bindings:

```typescript
interface Env {
  // Secrets
  SPORTSDATAIO_API_KEY: string;
  COLLEGEFOOTBALLDATA_API_KEY: string;

  // Config
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  NODE_ENV?: 'development' | 'staging' | 'production';
  SERVICE_NAME?: string;

  // KV Namespaces
  KV: KVNamespace;

  // Durable Objects
  GAME_MONITOR?: DurableObjectNamespace;
}
```

This provides autocomplete and type checking in Functions.

`─────────────────────────────────────────────────`

---

## 🚦 Decision Points

### Should We Do This Refactor Now?

**Arguments FOR**:
- ✅ Eliminates surgical deployment workaround
- ✅ Makes future deployments clean and reproducible
- ✅ Improves code quality and Workers best practices
- ✅ Estimated time: 4.5 hours (manageable)

**Arguments AGAINST**:
- ⚠️ Phase 3 already deployed and working
- ⚠️ Surgical workaround is documented and repeatable
- ⚠️ Could wait until more Functions need deployment
- ⚠️ Risk of breaking existing functionality

**Recommendation**: **Proceed with refactor**

Rationale:
- Technical debt compounds over time
- Current workaround is fragile (easy to forget steps)
- Next feature (Phase 4 WebSockets) will hit same issue
- Better to fix once properly than repeat workaround

---

## 📚 Resources

- [Cloudflare Workers Runtime APIs](https://developers.cloudflare.com/workers/runtime-apis/)
- [Environment Variables in Workers](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Migrating from Node.js to Workers](https://developers.cloudflare.com/workers/examples/migrating-from-node/)
- [TypeScript Support in Workers](https://developers.cloudflare.com/workers/languages/typescript/)

---

**Status**: ⏳ **READY TO BEGIN**
**Estimated Completion**: ~4.5 hours
**Next Step**: Start Phase 1 (Add dual-compatible code)
**Approval**: Awaiting user confirmation

---

*Created: November 20, 2025 13:15 CT*
*Author: Claude Code (Sonnet 4.5)*
*Related: PHASE-3-DEPLOYMENT-BLOCKER.md, PHASE-3-DEPLOYMENT-SUCCESS.md*
