# Cross-Stack Tracing

## Why Bugs Hide at Boundaries

Most non-trivial bugs live at the seam between two layers. The frontend sends a shape the API doesn't expect. The API returns a shape the frontend doesn't handle. The cache serves stale data the service assumes is fresh. Each layer works in isolation — the system fails at the handoff.

## The Boundary Checklist

At every layer crossing, verify:

1. **Shape agreement** — Does the output of layer N match the expected input of layer N+1?
2. **Null handling** — What happens when the upstream layer returns nothing?
3. **Error propagation** — Does an error in the data layer surface correctly to the user?
4. **Timing assumptions** — Does layer N+1 assume layer N responds within a window?
5. **Type fidelity** — Are types preserved across serialization boundaries (JSON, URL params)?

## Common Boundary Bugs

### Frontend ↔ API

| Bug | Cause | Fix |
|-----|-------|-----|
| `undefined` displayed in UI | API returns `null`, frontend expects string | Default at the response boundary: `data.name ?? 'Unknown'` |
| Stale data after mutation | Frontend cache not invalidated | Invalidate or refetch after mutation completes |
| Form submission fails silently | API returns 400, frontend doesn't check status | Always check `response.ok` before parsing body |
| Date displayed wrong | API sends UTC, frontend renders without timezone | Explicit timezone conversion at the display boundary |

### API ↔ Data Layer

| Bug | Cause | Fix |
|-----|-------|-----|
| Query returns empty | Parameter type mismatch (string vs number) | Validate and coerce types before query |
| Duplicate entries | Missing unique constraint + no upsert | Add DB constraint, use INSERT OR REPLACE |
| Slow endpoint | N+1 query pattern | Batch queries, JOIN, or preload |
| Partial write | Multi-step operation with no transaction | Wrap in transaction with rollback |

### Worker ↔ Worker (Service Mesh)

| Bug | Cause | Fix |
|-----|-------|-----|
| Timeout in downstream worker | Upstream doesn't set fetch timeout | Set `signal: AbortSignal.timeout(5000)` |
| Circular dependency | Worker A calls B calls A | Restructure: introduce shared data store or event-based decoupling |
| Stale response from cache worker | TTL too long for data freshness requirement | Match TTL to SLA; add `stale-while-revalidate` pattern |

## Tracing Methodology

When you suspect a cross-boundary bug:

1. **Pin the symptom layer.** Where does the user see the problem? Frontend? API response? Data?
2. **Trace backwards one boundary.** Check the immediate upstream layer's output.
3. **Compare contract vs reality.** Print/log the actual data at the boundary. Does it match the TypeScript interface?
4. **Binary search across the stack.** If you can't pinpoint the boundary, add logging at every crossing and find where expected diverges from actual.

## Shared Type Strategy

The strongest prevention: shared types across boundaries.

```typescript
// types/api.ts — shared between frontend and API
export interface GameResponse {
  data: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    score: { home: number; away: number } | null;
    status: 'scheduled' | 'live' | 'final';
  };
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
  };
}
```

When the type changes, both sides must update. The TypeScript compiler catches mismatches at build time — but only if both sides import from the same source.
