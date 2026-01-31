# Hybrid Workers + Pages Architecture

## Overview

blazesportsintel.com uses a **hybrid Cloudflare Workers + Pages** deployment:

```
                    ┌─────────────────────────────┐
  Internet ───────▶ │  Workers (apex router)       │
                    │  blazesportsintel.com/*       │
                    └──────┬──────────┬────────────┘
                           │          │
                   /api/*  │          │  /*  (everything else)
                   /ws     │          │
                           ▼          ▼
                    ┌──────────┐  ┌──────────────────┐
                    │ Workers  │  │ Pages (static)    │
                    │ handlers │  │ blazesportsintel  │
                    │ (inline) │  │ .pages.dev        │
                    └──────────┘  └──────────────────┘
```

## Components

### 1. Workers (`workers/`)

The apex Worker (`workers/index.ts`) is the entry-point for all requests to `blazesportsintel.com`. It:

- Handles **API routes** (`/api/*`, `/health`, `/kpi`, etc.) directly
- Manages **WebSocket** connections (`/ws`) for real-time data
- Applies **CORS**, caching headers, and authentication logic
- **Proxies** all other requests to the Pages static deployment

Configuration: `workers/wrangler.toml`

### 2. Pages (static Next.js export)

The Next.js app (`app/`) builds to a static export (`out/`) and deploys to Cloudflare Pages. Pages handles:

- All **HTML pages** (SSG)
- **Static assets** (`/_next/static/`, images, fonts, CSS)
- **Pages Functions** (`functions/`) as a fallback API layer for preview deployments

Configuration: `public/_routes.json`, `public/_redirects`

### 3. Pages Functions (`functions/`)

Lightweight serverless functions that run on Pages. These provide the same API endpoints as the Worker, ensuring preview deployments (without the Worker) still function:

- `functions/api/health.ts` — Health check
- `functions/api/lead.ts` — Lead capture
- `functions/api/newsletter.ts` — Newsletter subscriptions
- `functions/api/_middleware.ts` — Logging and error handling

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server (Pages only) |
| `npm run dev:worker` | Worker dev server on :8787 |
| `npm run dev:hybrid` | Both dev servers in parallel |
| `npm run deploy` | Deploy Pages to main |
| `npm run deploy:worker` | Deploy Worker (staging) |
| `npm run deploy:worker:production` | Deploy Worker (production routes) |
| `npm run deploy:hybrid` | Deploy Pages + Worker together |

## When to use what

| Use case | Where it runs |
|---|---|
| Static pages, SSG content | Pages |
| API endpoints, data fetching | Worker |
| WebSocket / real-time | Worker |
| Authentication, session logic | Worker |
| Preview deploys (PR branches) | Pages + Pages Functions |
| Production | Worker (apex) → proxies to Pages |
