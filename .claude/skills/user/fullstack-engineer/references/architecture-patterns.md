# Architecture Patterns

## Decision Frameworks

### Where Does This Code Live?

```
Is it a route handler?           → src/routes/
Is it business logic?            → src/services/
Is it a pure transformation?     → src/utils/
Is it a type definition?         → src/types/
Is it configuration?             → src/config/
Is it a reusable UI component?   → src/components/
Is it a page/view?               → src/pages/ or src/app/
```

If you're unsure, it probably belongs in `services/`. Business logic is the default home for anything that isn't purely a route handler or a pure function.

### When to Split a Module

Split when:
- A file exceeds 300 lines of logic (not counting imports/types)
- A function serves two unrelated callers
- You need to test a piece in isolation and can't without importing the whole module

Don't split when:
- The code is only used in one place
- Splitting creates a file with one exported function
- The "abstraction" is just indirection with no reuse

### Data Flow Contracts

Every boundary between layers needs an explicit contract:

```
Frontend ←→ API:      TypeScript interface matching the JSON response shape
API ←→ Service:       Function signatures with explicit input/output types
Service ←→ Data:      Query parameters and result types
Worker ←→ Worker:     Shared type package or documented JSON schema
```

When a contract changes, update BOTH sides in the same commit. Never ship a backend change that breaks a frontend contract without a migration path.

## Cloudflare-Specific Patterns

### Worker Composition

```
Edge Worker (routing + auth + cache)
    ↓
Domain Worker (business logic)
    ↓
Data Layer (D1 + KV + R2)
```

Keep edge Workers thin. They handle: CORS, auth verification, cache checks, request routing. Domain Workers handle: validation, transformation, business rules, data orchestration.

### Cache Strategy Decision Tree

```
Is the data user-specific?
  YES → No shared cache. Per-user KV if needed.
  NO → Continue.

Does staleness matter?
  NO  → Cache aggressively. KV with long TTL.
  YES → Continue.

How fresh must it be?
  < 1 min  → Write-through cache or skip cache
  1-15 min → Cache-aside with short TTL
  > 15 min → Cache-aside with standard TTL + background refresh
```

### D1 Query Patterns

```sql
-- Always paginate
SELECT * FROM games WHERE date = ? ORDER BY start_time LIMIT ? OFFSET ?

-- Index columns used in WHERE and ORDER BY
CREATE INDEX idx_games_date ON games(date);

-- Use prepared statements, never string interpolation
const stmt = env.DB.prepare('SELECT * FROM players WHERE team_id = ?').bind(teamId);
```

## Common Architecture Mistakes

| Mistake | Fix |
|---------|-----|
| God Worker that handles everything | Split by domain: scores, analytics, content |
| KV as primary database | KV is a cache. D1 is the source of truth. |
| Shared mutable state between requests | Workers are stateless per request. Use KV/D1 for persistence. |
| No error boundaries in frontend | Wrap route-level components in error boundaries |
| Fetching data in components instead of loaders | Colocate data requirements with routes, not render logic |
