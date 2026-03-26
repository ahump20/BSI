# BSI Infrastructure Patterns

## Architecture

```
[The Show API] → [bsi-show-dd-sync Worker (cron)] → [D1 tables]
                                                         ↓
[BSI Frontend (Next.js static)] ← [bsi-api Worker] ← [D1 reads + KV cache]
```

All DD data flows through D1. The frontend never hits The Show API directly.

## File Locations (BSI Repo)

| Purpose | Path |
|---------|------|
| API handler | `workers/handlers/mlb-the-show.ts` |
| Data source (fetch from Show API) | `workers/shared/mlb-the-show-source.ts` |
| Data store (D1 queries + KV cache) | `workers/shared/mlb-the-show-store.ts` |
| Sync worker (cron) | `workers/bsi-show-dd-sync/index.ts` |
| D1 migration | `workers/migrations/056_show_dd.sql` |
| Frontend types | `lib/mlb-the-show/types.ts` |
| Frontend API client | `lib/mlb-the-show/client.ts` |
| Pages | `app/mlb/the-show-26/*` |
| Components | `components/mlb-the-show/*Client.tsx` |

## Naming Conventions

- Workers: `bsi-show-dd-{function}` (e.g., `bsi-show-dd-sync`)
- KV namespaces: `BSI_SHOW_DD_{PURPOSE}` (e.g., `BSI_SHOW_DD_CACHE`)
- D1 tables: `show_dd_{entity}` (e.g., `show_dd_cards`, `show_dd_listings`)
- API routes: `/api/mlb/the-show-26/{resource}`

## Anti-Sprawl Rules

1. **One handler file.** All DD API routes go through `workers/handlers/mlb-the-show.ts`. Do not create a second handler.
2. **Search before create.** Before adding a function, check if it exists in source/store/handler.
3. **Replace, don't add.** If improving a function, replace it in-place. Delete the old version in the same commit.
4. **No external projects.** DD lives inside the BSI monorepo under `app/mlb/the-show-26/*`. No separate repos, no separate Next.js apps.
5. **D1 only.** No Postgres, no Supabase, no external databases.
6. **Static export constraints.** All pages must work as static exports. Dynamic data comes from API routes, not server components.

## Compatibility Mode Pattern

```typescript
// In mlb-the-show-source.ts
const BASE_URL = env.SHOW_API_BASE ?? 'https://mlb25.theshow.com';
const COMPAT_MODE = !env.SHOW_26_VERIFIED;

// Every response includes:
{
  _meta: {
    source: COMPAT_MODE ? 'mlb25.theshow.com (compatibility mode)' : 'mlb26.theshow.com',
    synced_at: timestamp,
    compat_mode: COMPAT_MODE
  }
}
```

## Testing

Before and after changes, run:
```bash
npx vitest run tests/workers/mlb-the-show.test.ts tests/workers/mlb-the-show-enhancements.test.ts tests/workers/api-routes.test.ts
npm run typecheck
npm run typecheck:workers
npm run build
```
