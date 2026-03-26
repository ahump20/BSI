---
name: cloudflare-workers-bsi
description: BSI-specific Worker patterns that augment the cloudflare plugin workers.mdc rule
type: plugin-settings
plugin: cloudflare-skills
enabled: true
---

# BSI Worker Patterns

Augments the cloudflare plugin's `workers.mdc` rule with BSI-specific conventions.

## Hono Router (not bare fetch)

BSI uses Hono as the router framework. Never write a bare `export default { fetch() {} }` handler for the main worker. All new API routes go through Hono's routing system in `workers/handlers/`.

```
workers/
  index.ts              # Hono app entry, registers all handler routes
  handlers/             # One file per sport/domain (cfb.ts, mlb.ts, news.ts, etc.)
  shared/               # Types, helpers, constants, cors, rate-limit, auth
```

New handler pattern:
```typescript
// workers/handlers/{domain}.ts
import { Hono } from 'hono';
const app = new Hono();
app.get('/api/{sport}/endpoint', async (c) => { ... });
export default app;
```

Then register in `workers/index.ts`.

## TypeScript Configuration

- `workers/` is **excluded** from root `tsconfig.json`
- Each satellite worker has its own `tsconfig.json`
- Main worker types live in `workers/shared/types.ts`
- Run `npm run typecheck:workers` to check all satellite workers

## Config Format

BSI uses `wrangler.toml` — NOT `wrangler.jsonc`. The plugin's generic examples use jsonc; translate to TOML for BSI.

## Anti-Patterns (BSI-specific)

- **No `console.log` in workers** — use structured logging via `bsi-error-tracker` tail consumer
- **No hardcoded API keys** — always use environment secrets bound in `wrangler.toml`
- **Always use KV/D1 bindings** — never make REST calls to Cloudflare APIs from within workers
- **No `Math.random()` in data paths** — pre-commit hook blocks this
- **No mock/sample data** — BSI has 40+ live API routes; wire to real endpoints always

## Binding Access

Access bindings through the Hono context:
```typescript
const kv = c.env.BSI_PROD_CACHE;    // KV namespace
const db = c.env.DB;                 // D1 database
const bucket = c.env.ASSETS;         // R2 bucket
```

Never destructure `env` at module scope — bindings are only available per-request.

## Cron / Scheduled Handlers

Main worker cron fires every minute via `handleScheduled` in `workers/index.ts`. Satellite crons are configured per-worker in their own `wrangler.toml` `[triggers]` block.

When adding a new cron: check for overlap with existing scheduled handlers (especially `bsi-savant-compute` 6h and `bsi-cbb-analytics` daily — both write to the same advanced metrics tables).

## Error Handling

- Use `try/catch` with structured error objects, not string throws
- Return proper HTTP status codes — never swallow errors into 200 responses
- The `bsi-error-tracker` tail consumer captures all unhandled exceptions across workers
- For user-facing errors, return JSON with `{ error: string, code: number }`

## Deploy Checklist (satellite workers)

1. `wrangler deploy --dry-run --config workers/{name}/wrangler.toml` — verify it compiles
2. Check bindings match what's in the toml (KV, D1, R2, secrets)
3. `wrangler deploy --config workers/{name}/wrangler.toml` — ship it
4. Verify the affected endpoint returns real data (curl)
