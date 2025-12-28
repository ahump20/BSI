# CFB Coded Content Integration

This document describes the integration of SportsDataIO Coded Content for CFB game previews and recaps.

## Overview

The integration provides:
- AI-powered game previews before matchups
- Analytical post-game recaps after finals
- SEO-optimized article pages with JSON-LD schema
- Real-time ingestion via Cloudflare Workers
- Fast delivery via KV caching

## Architecture

```
┌─────────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  SportsDataIO API   │ ───▶ │  Ingest Worker   │ ───▶ │   D1 Database   │
│  (Coded Content)    │      │  (scheduled)     │      │  (articles)     │
└─────────────────────┘      └──────────────────┘      └─────────────────┘
                                     │
                                     ▼
                             ┌──────────────────┐
                             │   KV Cache       │
                             │  (article lists) │
                             └──────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Pages                                  │
├─────────────────┬─────────────────┬─────────────────┬──────────────────┤
│  /cfb (page)    │  /cfb/previews  │  /cfb/recaps    │ /cfb/articles/*  │
│  Sections for   │  All previews   │  All recaps     │ Article detail   │
│  previews &     │  list page      │  list page      │ with SEO         │
│  recaps         │                 │                 │                  │
└─────────────────┴─────────────────┴─────────────────┴──────────────────┘
```

## Setup

### 1. Environment Variables (Cloudflare Dashboard or wrangler.toml)

Add these secrets to your Cloudflare Pages/Workers:

```bash
# API Key for SportsDataIO Coded Content
wrangler secret put CODED_CONTENT_API_KEY

# Base URL (provided by SportsDataIO during onboarding)
wrangler secret put CODED_CONTENT_BASE_URL
# Example: https://api.sportsdata.io/v3/coded-content

# Authentication mode
# Set to "header" if API key goes in Ocp-Apim-Subscription-Key header
# Set to "query" if API key goes in query parameter
CODED_CONTENT_AUTH_MODE=header

# Header name for auth (if using header mode)
CODED_CONTENT_AUTH_HEADER=Ocp-Apim-Subscription-Key

# Query param name for auth (if using query mode)
CODED_CONTENT_AUTH_QUERY_PARAM=key

# League identifier for CFB (from SportsDataIO)
CODED_CONTENT_LEAGUE_CFB=ncaaf

# Content type identifiers (from SportsDataIO)
CODED_CONTENT_TYPE_PREVIEW=preview
CODED_CONTENT_TYPE_RECAP=recap

# Optional: Enable BSI voice rewrite
ENABLE_BSI_REWRITE=false
```

### 2. D1 Database Migration

Run the migration to create the `coded_content_articles` table:

```bash
# Local development
wrangler d1 execute bsi-historical-db --local --file=migrations/003_coded_content_articles.sql

# Production
wrangler d1 execute bsi-historical-db --remote --file=migrations/003_coded_content_articles.sql
```

### 3. Wrangler Bindings

Ensure your `wrangler.toml` includes:

```toml
[[d1_databases]]
binding = "DB"
database_name = "bsi-historical-db"
database_id = "YOUR_DATABASE_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"

# Optional: Workers AI for BSI voice rewrite
[ai]
binding = "AI"
```

### 4. Scheduled Ingestion

The ingestion worker runs on a schedule. Add to your worker's triggers:

```toml
[[triggers.crons]]
# Every 10 minutes (baseline)
crons = ["*/10 * * * *"]
```

For peak Saturday windows, consider adding:

```toml
[[triggers.crons]]
# Every 5 minutes on Saturdays 11am-11pm CT (football primetime)
crons = ["*/5 16-04 * * 6"]  # UTC times
```

## API Endpoints

### GET /api/cfb/previews

Returns upcoming game previews.

**Query Parameters:**
- `limit` (optional): Number of results (default: 12, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "articles": [
    {
      "slug": "texas-vs-oklahoma-preview-abc123",
      "title": "Texas vs Oklahoma: Red River Rivalry Preview",
      "excerpt": "The trenches will decide this one...",
      "contentType": "preview",
      "publishedAt": "2025-10-10T12:00:00Z",
      "gameId": "401234567"
    }
  ],
  "total": 25,
  "limit": 12,
  "offset": 0
}
```

### GET /api/cfb/recaps

Returns recent game recaps.

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** Same structure as previews.

### GET /api/cfb/articles/:slug

Returns a single article by slug.

**Response:**
```json
{
  "article": {
    "slug": "texas-vs-oklahoma-preview-abc123",
    "title": "Texas vs Oklahoma: Red River Rivalry Preview",
    "excerpt": "The trenches will decide this one...",
    "bodyHtml": "<p>Full article HTML content...</p>",
    "contentType": "preview",
    "publishedAt": "2025-10-10T12:00:00Z",
    "updatedAt": "2025-10-10T14:30:00Z",
    "gameId": "401234567",
    "metadata": {
      "seoTitle": "Texas vs Oklahoma Preview | Red River Rivalry",
      "metaDescription": "In-depth preview of the Texas-Oklahoma matchup...",
      "homeTeam": "Texas",
      "awayTeam": "Oklahoma",
      "gameDate": "October 12, 2025",
      "venue": "Cotton Bowl"
    }
  }
}
```

## Frontend Pages

### /cfb

Main CFB page with sections for:
- "This Week's Games" (previews)
- "Recent Recaps" (recaps)
- Live scores (ESPN fallback)

### /cfb/previews

List page for all game previews with pagination.

### /cfb/recaps

List page for all game recaps with pagination.

### /cfb/articles/:slug

Full article detail page with:
- SEO-optimized `<title>` and meta description
- Canonical URL
- JSON-LD Article schema
- OpenGraph and Twitter cards

## Validation

### Check Icons

```bash
npm run verify:icons
```

All required icons should exist in `public/icons/`:
- blaze-logo.svg
- baseball.svg
- football.svg
- basketball.svg
- robot.svg
- chart-line.svg
- database.svg
- info-circle.svg
- arrow-right.svg
- longhorns.svg

### Test API Endpoints

```bash
# Previews
curl https://blazesportsintel.com/api/cfb/previews

# Recaps
curl https://blazesportsintel.com/api/cfb/recaps

# Single article (use a real slug)
curl https://blazesportsintel.com/api/cfb/articles/your-article-slug
```

### Verify Ingestion

Check the worker logs in Cloudflare Dashboard for ingestion results:

```
[CodedContent] Starting CFB content ingestion...
[CodedContent] Fetched 12 previews
[CodedContent] Fetched 8 recaps
[CodedContent] Summary: fetched=20, inserted=5, updated=15, errors=0
```

### Validate No jsDelivr Postprocessing Calls

In browser dev tools, check Network tab during page load:
- No requests to `cdn.jsdelivr.net/npm/postprocessing`
- Particles should render (or gracefully degrade if WebGL unavailable)

## BSI Voice Requirements

All content should follow BSI voice guidelines:
- Direct, data-first, no fluff
- No "clash of titans" or empty hype
- Short paragraphs
- Call out hinge points: trenches, QB pressure, third down, red zone, turnovers, explosives
- Frame predictions as "projections", not gambling advice
- Confident, sharp, never corny

If provider content is generic, enable `ENABLE_BSI_REWRITE=true` to run a server-side rewrite using Workers AI.

## Troubleshooting

### Articles not appearing

1. Check ingestion worker logs in Cloudflare Dashboard
2. Verify API key is correctly set
3. Confirm D1 migration has been run
4. Check KV cache keys: `cfb:previews:current`, `cfb:recaps:latest`

### 404 on article pages

1. Verify the slug exists in the database
2. Check the `/api/cfb/articles/:slug` endpoint directly
3. Confirm the article's `league` is `'cfb'`

### Icons returning 404

1. Run `npm run verify:icons` to check missing files
2. Verify `public/icons/` folder is deployed
3. Check case sensitivity of filenames

### Particles not rendering

1. Check browser console for WebGL errors
2. Verify `public/lib/graphics/` files are deployed
3. The fallback CSS should display even if WebGL fails

## File Reference

| File | Purpose |
|------|---------|
| `migrations/003_coded_content_articles.sql` | D1 schema |
| `src/types/coded-content.types.ts` | TypeScript types |
| `workers/ingest/coded-content-ingestion.ts` | Ingestion logic |
| `functions/api/cfb/previews.ts` | Previews API |
| `functions/api/cfb/recaps.ts` | Recaps API |
| `functions/api/cfb/articles/[slug].ts` | Article API |
| `components/cfb/CFBArticleCard.tsx` | Card component |
| `components/cfb/CFBArticlesList.tsx` | List component |
| `app/cfb/CFBPageClient.tsx` | Main CFB page |
| `app/cfb/previews/` | Previews list page |
| `app/cfb/recaps/` | Recaps list page |
| `app/cfb/articles/[slug]/` | Article detail page |
| `public/icons/` | Icon assets |
| `public/lib/graphics/` | Postprocessing wrappers |
| `scripts/verify-icons.mjs` | Icon verification |
