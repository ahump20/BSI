# /bsi-api — API endpoint development

When building or modifying API endpoints:

## Design checklist
1. What's the resource? (games, players, standings, etc.)
2. What HTTP method(s)?
3. What input parameters?
4. What response shape?
5. What caching strategy?

## Implementation steps
1. Define route in `app/api/` or Worker
2. Add input validation (Zod)
3. Implement business logic
4. Add error handling
5. Set cache headers
6. Add tests

## Standard response format
```typescript
{
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: {
    source: string;
    fetchedAt: string;  // ISO 8601, CDT
    cached: boolean;
  };
}
```

## HTTP status codes
| Code | When |
|------|------|
| 200 | Success |
| 400 | Bad request (validation failed) |
| 401 | Unauthorized |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Server error |

## Caching strategy
- Static data: `Cache-Control: public, max-age=3600`
- Live scores: `Cache-Control: public, max-age=30`
- User data: `Cache-Control: private, no-cache`

## Testing
```bash
# Run API tests
npm run test:api

# Test specific endpoint
npx vitest tests/api/{endpoint}.test.ts
```

## Output
- Endpoint path and methods
- Request/response examples
- Cache behavior
- Test coverage
