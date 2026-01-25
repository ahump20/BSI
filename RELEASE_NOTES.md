# BSI Public Features Release

## Release Summary

This release adds public-facing pages and API endpoints for BlazeSportsIntel.com, making games, developer tools, and AI coaching features discoverable and accessible.

## New Features

### Games Hub (`/games`)
- **Games Portal**: Hub page listing all BSI Arcade games with cards and descriptions
- **Blaze Blitz Football** (`/games/blaze-blitz-football`): Product page with notify form
- **Blaze Hot Dog** (`/games/blaze-hot-dog`): Product page with notify form
- **Sandlot Sluggers** (`/games/sandlot-sluggers`): Product page with notify form

### Blaze Vision (`/blaze-vision`)
- Public landing page explaining Neural Presence Coach capabilities
- Working access request form submitting to `/api/vision/access-request`
- Links to demo at `/vision-AI-Intelligence`
- Privacy-first messaging (all processing local)

### Developer Portal (`/developers`)
- Landing page with API overview
- Full Swagger UI documentation at `/developers/docs`
- OpenAPI 3.0 spec at `/openapi.json`
- Rate limits and authentication info

### Status Page (`/status`)
- Real-time system status dashboard
- Fetches from `/api/healthz` and auto-refreshes every 30s
- Service cards for D1 Database and KV Cache
- Incident history section

### API Endpoints

#### `GET /api/healthz`
Aggregated health check returning overall system status.

```bash
curl -i https://blazesportsintel.com/api/healthz
```

Response:
```json
{
  "ok": true,
  "status": "healthy",
  "version": "1.0.0",
  "colo": "DFW",
  "region": "WNAM",
  "timestamp": "2025-01-24T12:00:00.000Z",
  "services": {
    "d1": { "status": "healthy", "latency": 12 },
    "kv": { "status": "healthy", "latency": 8 }
  }
}
```

#### `POST /api/vision/access-request`
Submit access request for Blaze Vision or game notifications.

```bash
curl -X POST https://blazesportsintel.com/api/vision/access-request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "organization": "University Athletics",
    "sportFocus": "baseball",
    "interest": "blaze-vision"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Request received. We will review and contact you soon.",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Navigation Updates
- **Main Nav**: Games link added
- **Footer**: Games, Blaze Vision, Developers, Status links in Platform section

## Sitemap Updates
New URLs added:
- `/games`
- `/games/blaze-blitz-football`
- `/games/blaze-hot-dog`
- `/games/sandlot-sluggers`
- `/blaze-vision`
- `/developers`
- `/developers/docs`
- `/status`

## Infrastructure Changes

### `_routes.json`
Restricted Functions execution to `/api/*` only:
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

### `_headers`
Added security and caching headers:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- Cache-Control for API and docs

## KV Storage
Access requests stored in `BSI_CACHE` with key pattern:
- `vision:req:{uuid}` - Individual request data (TTL: 365 days)
- `ratelimit:vision:{ip}` - Rate limit counter (TTL: 1 hour)

## Verification URLs

| Page | URL |
|------|-----|
| Games Hub | https://blazesportsintel.com/games |
| Blaze Blitz Football | https://blazesportsintel.com/games/blaze-blitz-football |
| Blaze Hot Dog | https://blazesportsintel.com/games/blaze-hot-dog |
| Sandlot Sluggers | https://blazesportsintel.com/games/sandlot-sluggers |
| Blaze Vision | https://blazesportsintel.com/blaze-vision |
| Developers | https://blazesportsintel.com/developers |
| API Docs | https://blazesportsintel.com/developers/docs |
| OpenAPI Spec | https://blazesportsintel.com/openapi.json |
| Status | https://blazesportsintel.com/status |
| Health API | https://blazesportsintel.com/api/healthz |

## Build Verification

```bash
# Build completed successfully
npm run build

# Output verified:
# - 253 static pages generated
# - All new pages in /out
# - Functions copied to /out/functions
# - Static files (_routes.json, _headers, sitemap.xml, openapi.json) in /out

# TypeScript
npx tsc --noEmit  # No errors

# Tests
npm test  # 266 passed (API tests require local server)
```

## No Breaking Changes
- All existing routes preserved
- No modifications to existing pages
- No changes to existing API endpoints
- Navigation additions only (no removals)
