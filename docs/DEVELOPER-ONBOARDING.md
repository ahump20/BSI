# BSI Developer Onboarding Guide

**Last Updated:** January 2025

Welcome to Blaze Sports Intel. This guide gets you from zero to productive.

---

## Quick Start (5 Minutes)

```bash
# 1. Clone and install
git clone https://github.com/ahump20/BSI.git
cd BSI
npm install

# 2. Environment setup
cp .env.example .env.local
# Add your API keys to .env.local

# 3. Run locally
npm run dev

# 4. Run tests
npm run test
```

---

## Essential Reading

| Document                  | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| [CLAUDE.md](../CLAUDE.md) | **Project rules and conventions—read first** |
| [README.md](../README.md) | Project overview and structure               |
| [docs/API.md](./API.md)   | Complete API documentation                   |

---

## Architecture Overview

BSI runs entirely on Cloudflare:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────┤
│  Pages (Frontend)  │  Workers (API)  │  D1/KV/R2 (Storage) │
└─────────────────────────────────────────────────────────────┘
```

### Cloudflare Resources

| Type    | Naming Convention         | Example              |
| ------- | ------------------------- | -------------------- |
| Workers | `bsi-{domain}-{function}` | `bsi-prediction-api` |
| KV      | `BSI_{DOMAIN}_{PURPOSE}`  | `BSI_SPORTS_CACHE`   |
| D1      | `bsi-{domain}-db`         | `bsi-prediction-db`  |
| R2      | `bsi-{domain}-{asset}`    | `bsi-media-videos`   |

### Key Workers

| Worker                | Purpose          | Routes                          |
| --------------------- | ---------------- | ------------------------------- |
| `blaze-sports-api`    | Primary REST API | `/api/*`                        |
| `bsi-prediction-api`  | Game predictions | `api.blazesportsintel.com/v1/*` |
| `espn-data-cache`     | ESPN data layer  | Internal                        |
| `bsi-baseball-ingest` | Data ingestion   | Scheduled                       |

---

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, then run tests
npm run test

# Run type checking
npm run typecheck

# Lint
npm run lint
```

### 2. Local Worker Testing

```bash
# Run a worker locally
cd workers/prediction
npx wrangler dev

# Test against local worker
curl http://localhost:8787/v1/health
```

### 3. Deployment

```bash
# Deploy to Cloudflare (automatic on push to main)
# Manual deploy if needed:
npx wrangler deploy --config workers/prediction/wrangler.toml
```

---

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` and type guards)
- Export interfaces for all public APIs

### Styling

- Use design tokens from `src/styles/tokens/`
- Never hardcode colors, spacing, or typography
- Mobile-first (`min-width` breakpoints)

### Testing

- All API endpoints must have tests
- Run `npm run test` before committing
- Tests live in `tests/` directory

---

## Key Documentation

### Operations & Infrastructure

| Document                                                   | Description                           |
| ---------------------------------------------------------- | ------------------------------------- |
| [OBSERVABILITY-CHECKLIST.md](./OBSERVABILITY-CHECKLIST.md) | Monitoring and alerting setup         |
| [SECURITY-AUDIT-2025-01.md](./SECURITY-AUDIT-2025-01.md)   | Security findings and recommendations |
| [BINDING-CONFIGURATION.md](./BINDING-CONFIGURATION.md)     | Cloudflare bindings reference         |

### API & Integration

| Document                                                         | Description                |
| ---------------------------------------------------------------- | -------------------------- |
| [API.md](./API.md)                                               | Complete API reference     |
| [COLLEGE-BASEBALL-API.md](./COLLEGE-BASEBALL-API.md)             | College baseball endpoints |
| [CONTEXT7_INTEGRATION_GUIDE.md](./CONTEXT7_INTEGRATION_GUIDE.md) | Library documentation MCP  |

### Business & Product

| Document                                           | Description                    |
| -------------------------------------------------- | ------------------------------ |
| [BSI-FINANCIAL-MODEL.md](./BSI-FINANCIAL-MODEL.md) | Subscription tiers and pricing |
| [BRAND_STORY.md](./BRAND_STORY.md)                 | Brand voice and messaging      |

---

## Testing Guide

### Unit Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/api/prediction-api.test.ts

# Run with coverage
npm run test:coverage
```

### Performance Tests

```bash
# API response time tests
npm run test -- tests/performance/api-response-times.test.ts
```

### Integration Tests

```bash
# API failure fallback tests
npm run test -- tests/integration/api-failure-fallback.test.ts
```

---

## Environment Variables

### Required for Development

```env
# SportsDataIO (live sports data)
SPORTSDATAIO_API_KEY=your_key_here

# Cloudflare (deployment)
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### Required for Production

```env
# Database
BSI_D1_ID=your_d1_database_id
BSI_KV_ID=your_kv_namespace_id

# Analytics
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ENGINE_TOKEN=your_token

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Common Tasks

### Add a New API Endpoint

1. Create handler in `functions/api/`
2. Add tests in `tests/api/`
3. Document in `docs/API.md`
4. Deploy via GitHub push

### Add a New Worker

1. Create `workers/{name}/wrangler.toml`
2. Create source in `workers/{name}/index.ts`
3. Add bindings (KV, D1, etc.)
4. Deploy: `npx wrangler deploy --config workers/{name}/wrangler.toml`

### Update D1 Schema

1. Create migration in `migrations/`
2. Apply locally: `npx wrangler d1 execute bsi-prediction-db --local --file=migrations/xxx.sql`
3. Apply to production: `npx wrangler d1 execute bsi-prediction-db --file=migrations/xxx.sql`

---

## Troubleshooting

### "Worker not found" Error

```bash
# List deployed workers
npx wrangler workers list

# Check worker logs
npx wrangler tail bsi-prediction-api
```

### D1 Query Issues

```bash
# Connect to D1 directly
npx wrangler d1 execute bsi-prediction-db --command "SELECT * FROM team_psychological_state LIMIT 5"
```

### Rate Limiting Issues

- Check `functions/api/_utils.js` for rate limit config
- Default: 100 requests/minute per IP
- View limits in KV: `ratelimit:{ip}:{window}`

---

## Getting Help

- **Code questions:** Check [CLAUDE.md](../CLAUDE.md) first
- **API docs:** [docs/API.md](./API.md)
- **Infrastructure:** [docs/OBSERVABILITY-CHECKLIST.md](./OBSERVABILITY-CHECKLIST.md)
- **Security:** [docs/SECURITY-AUDIT-2025-01.md](./SECURITY-AUDIT-2025-01.md)

---

_Born to blaze the path less beaten._
