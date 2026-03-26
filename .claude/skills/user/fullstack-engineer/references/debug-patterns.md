# Debug Patterns

## By Language

### JavaScript / TypeScript

| Bug Class | Detection | Fix Pattern |
|-----------|-----------|-------------|
| Stale closure | Variable has old value inside callback/effect | Move variable into closure scope, or add to dependency array |
| Missing await | Promise resolves to `[object Promise]` or undefined | Add `await`, check all async call sites |
| Type coercion | `"5" + 3 === "53"` | Use strict equality, explicit parsing |
| `this` binding | Method loses context when passed as callback | Arrow function, `.bind()`, or restructure |
| Circular import | Undefined at import time, works later | Restructure module boundaries, lazy import |
| Event listener leak | Memory grows, handlers fire multiple times | Clean up in useEffect return / removeEventListener |

### Python

| Bug Class | Detection | Fix Pattern |
|-----------|-----------|-------------|
| Mutable default arg | List/dict accumulates across calls | Use `None` default, create inside function |
| Late binding closure | Loop variable captured by reference | Use default argument `lambda x=x: ...` |
| Import side effects | Module import triggers unexpected behavior | Move side effects into functions |
| GIL contention | Multi-threaded code slower than single | Use multiprocessing for CPU, asyncio for IO |

## By Domain

### API / HTTP

| Symptom | Investigation Steps |
|---------|-------------------|
| 4xx from frontend | Check: request shape, auth header, content-type, CORS |
| 5xx intermittent | Check: timeout settings, connection pool, external dependency health |
| Slow response | Check: N+1 queries, missing index, large payload, no pagination |
| CORS failure | Check: preflight OPTIONS handler, allowed origins, credentials mode |

### Database (D1 / SQL)

| Symptom | Investigation Steps |
|---------|-------------------|
| Query returns empty | Check: WHERE clause values, data exists, case sensitivity |
| Query slow | Check: EXPLAIN output, missing indexes, full table scan |
| Write fails silently | Check: constraint violations, transaction commits, error handling |
| Stale reads | Check: cache TTL, read-after-write consistency, replication lag |

### Frontend / React

| Symptom | Investigation Steps |
|---------|-------------------|
| Component not re-rendering | Check: state mutation vs new reference, dependency arrays, memoization |
| Infinite re-render loop | Check: useEffect dependencies, state updates in render, object creation in deps |
| Hydration mismatch | Check: server vs client differences (dates, random, window access) |
| Memory leak warning | Check: useEffect cleanup, subscription unsubscribe, event listener removal |
| Layout shift on load | Check: image dimensions, font loading, dynamic content injection |

### Infrastructure / Cloudflare

| Symptom | Investigation Steps |
|---------|-------------------|
| Worker timeout | Check: external fetch duration, D1 query time, KV get latency |
| KV returns null | Check: key spelling, namespace binding, TTL expiry, eventual consistency |
| D1 error | Check: SQL syntax, binding count matches placeholders, schema migration ran |
| R2 access denied | Check: bucket binding, public access config, CORS on bucket |
| Deployment fails | Check: wrangler.toml bindings, compatibility date, size limit |

## Cross-Stack Tracing Template

When a bug crosses boundaries, trace the full path:

```
1. USER ACTION
   What did the user do? Click, submit, navigate?

2. FRONTEND STATE
   What state changed? What request was constructed?
   → Log: request URL, method, headers, body

3. NETWORK
   Did the request reach the server? What response came back?
   → Log: response status, headers, body, timing

4. ROUTE HANDLER
   Did the right handler fire? Were params parsed correctly?
   → Log: parsed params, middleware output

5. SERVICE LOGIC
   Did the business logic execute correctly?
   → Log: input to service, output from service, any errors caught

6. DATA LAYER
   Did the query execute? Did it return expected results?
   → Log: SQL/KV query, response, timing

7. RESPONSE CONSTRUCTION
   Was the response shaped correctly for the frontend?
   → Log: response body shape vs frontend's expected type

8. FRONTEND RENDER
   Did the component receive and display the data correctly?
   → Log: props received, state after update, DOM output
```

At each boundary, check: Does the output of layer N match the expected input of layer N+1?
