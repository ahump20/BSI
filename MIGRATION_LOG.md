# BlazeSportsIntel → Diamond Insights Migration Log

**Migration Start**: 2025-10-13
**Target Launch**: 2026-02-01
**Timezone**: America/Chicago
**Repository**: https://github.com/ahump20/BSI

---

## Executive Summary

**Mission**: Safe, staged transition from multi-sport platform to college baseball-first intelligence hub with live game tracking, pitch-by-pitch analytics, and auto-generated content.

**Status**: Phase 1 Complete | Phase 2 Core API + Ingest Complete | Phase 3 Ready to Start

---

## Phase 1: Archive & Audit Current State

### Archive Structure
```
/archive/2025-10-13/
├── routes/
│   └── route-map.json       # Complete route inventory
├── screenshots/
│   └── mobile-390x844/      # Mobile screenshots
├── database/
│   ├── d1-schema.sql        # D1 database schema
│   └── d1-samples.json      # Sample data exports
├── workers/
│   └── functions-backup/    # Cloudflare Functions code
├── config/
│   ├── wrangler-backup.toml # Cloudflare configuration
│   └── dns-config.json      # DNS settings
└── code/
    └── legacy-components/   # Salvageable UI components
```

### Current Platform Assessment

#### Active Routes (To Be Mapped)
- Home: `/index.html`
- Sport Landing Pages: `/mlb/`, `/nfl/`, `/cfb/`, `/cbb/`
- Analytics: `/analytics.html`
- AI Copilot: `/copilot.html`
- Legal: `/legal/*`, `/privacy.html`, `/terms.html`
- Static: `/about.html`, `/contact.html`, `/methodology/`

#### API Endpoints (Cloudflare Functions)
- `/api/mlb/*` - MLB data endpoints
- `/api/nfl/*` - NFL data endpoints
- `/api/nba/*` - NBA data endpoints
- `/api/ncaa/*` - NCAA Football endpoints
- `/api/cbb/*` - NCAA Basketball endpoints
- `/api/college-baseball/*` - College Baseball (partial)
- `/api/copilot/*` - AI semantic search
- `/api/health` - Health check
- `/api/metrics` - Analytics metrics

#### Infrastructure Components
- **Database**: D1 (`cbafed34-782f-4bf1-a14b-4ea49661e52b`)
- **Cache**: KV namespace (`a53c3726fc3044be82e79d2d1e371d26`)
- **Storage**: R2 bucket (`bsi-embeddings`)
- **AI**: Vectorize index (`sports-scouting-index`)
- **Monitoring**: Analytics Engine (`bsi_analytics`)

### Migration Decisions

#### KEEP (Port to New Platform)
- [ ] Clean UI components (auth wrappers, charts)
- [ ] Design tokens system (`tokens/tokens.json`)
- [ ] Legal pages (privacy, terms, accessibility)
- [ ] API utilities (`_utils.js`, `_middleware.js`)
- [ ] D1 schema patterns
- [ ] Analytics Engine monitoring setup

#### REFACTOR (Modernize)
- [ ] Sport landing pages → Next.js App Router
- [ ] API functions → Next.js API routes
- [ ] Static HTML → React components
- [ ] Python scripts → TypeScript/Node

#### DELETE (Off-Vision)
- [ ] Multi-sport scoreboard (keep baseball only)
- [ ] Monte Carlo simulations (non-baseball)
- [ ] Youth sports endpoints
- [ ] 3D visualizations (excessive)
- [ ] Championship intelligence platform

---

## Phase 2: Information Architecture & Redirects

### New Route Structure (Diamond Insights)

```
blazesportsintel.com/
├── /                              → Home (D1 Baseball scoreboard)
├── /baseball/ncaab                → D1 Baseball Hub
├── /baseball/ncaab/game/[id]     → Game Center (live tracking)
├── /baseball/ncaab/team/[slug]   → Team Hub
├── /baseball/ncaab/player/[id]   → Player Profile
├── /baseball/ncaab/standings     → Conference Standings
├── /baseball/ncaab/rankings      → Polls & RPI
├── /news                          → Auto previews/recaps
├── /about                         → Mission & Team
├── /legal/*                       → Legal pages (preserved)
└── /api/v1/*                      → Unified API
```

### Redirect Map (CSV)

**Format**: `legacy_path,new_path,status_code,reason`

```csv
/mlb/index.html,/,301,Focus shifted to college baseball
/mlb,/,301,Focus shifted to college baseball
/nfl/index.html,/,301,Focus shifted to college baseball
/nfl,/,301,Focus shifted to college baseball
/cfb/index.html,/,301,Focus shifted to college baseball
/cfb,/,301,Focus shifted to college baseball
/cbb/index.html,/,301,Focus shifted to college baseball
/cbb,/,301,Focus shifted to college baseball
/analytics.html,/baseball/ncaab,301,Analytics integrated into team pages
/copilot.html,/,301,AI features retired
/api/mlb/*,/api/v1/baseball/ncaab/*,301,API restructure
/api/nfl/*,/,410,Sport no longer covered
/api/nba/*,/,410,Sport no longer covered
/api/ncaa/*,/api/v1/baseball/ncaab/*,301,API restructure
```

### Implementation Strategy

1. **Next.js Middleware** (`middleware.ts`):
   - Read redirect map from static config
   - Apply 301/410 responses
   - Log redirect hits to Analytics Engine

2. **Validation Scripts**:
   - `scripts/check-301-consistency.sh` - Verify all redirects work
   - `scripts/check-404s.sh` - Ensure no broken links

---

## Phase 3: Technical Implementation

### Prisma Schema (PostgreSQL)

Location: `/prisma/schema.prisma`

```prisma
// Core Models
model Conference
model Team
model Player
model Game
model Event (pitch-by-pitch)
model BoxLine (player game stats)
model TeamStats
model PlayerStats
model Ranking
model Article (NLG content)

// Enums
enum GameStatus { SCHEDULED | LIVE | FINAL | POSTPONED }
enum FeedPrecision { EVENT | PITCH }
```

### API Layer (/api/v1)

**Endpoints**:
- `GET /api/v1/games` - List games (filter: date, status, conference)
- `GET /api/v1/games/[id]` - Full game detail + events + box
- `GET /api/v1/teams` - List teams
- `GET /api/v1/teams/[slug]` - Team detail + roster + stats
- `GET /api/v1/players/[id]` - Player profile + game logs
- `GET /api/v1/conferences/[slug]/standings` - Conference standings
- `GET /api/v1/rankings` - Polls + RPI + strength metrics
- `POST /api/stripe/webhook` - Payment processing

### Ingest Worker (Cloudflare)

**Schedule**:
- Live games: `*/5 * * * *` (every 5 minutes)
- Hourly: Team stats refresh
- Nightly: Historical aggregations

**Provider Failover**:
1. Primary: SportsDataIO
2. Backup: NCAA API
3. Tertiary: ESPN

**Caching Strategy**:
- Live games: 60s KV TTL
- Standings: 4hr KV TTL
- Historical: R2 archival (immutable)

### NLG Content Generation

**Auto-Recap** (15min post-game):
- Fact-check all claims against structured data
- Generate with Anthropic Claude or OpenAI
- Store in `Article` table with `type: 'recap'`

**Auto-Preview** (6hr pre-game):
- Analyze team trends, matchup history
- Update 1hr before if lineups change
- Store with `type: 'preview'`

---

## Phase 4: Quality Gates & Launch

### Performance Budgets
- **LCP**: ≤ 2.5s (mobile 4G)
- **CLS**: < 0.1
- **TBT**: ≤ 200ms
- **API p99**: ≤ 200ms
- **Ingest→UI p99**: < 3s

### Accessibility
- **Standard**: WCAG 2.2 AA
- **Tools**: axe DevTools, Lighthouse
- **Critical Routes**: Home, Hub, Game Center, Team

### Testing Suite
- **Playwright E2E**: Critical user flows
- **Lighthouse CI**: Performance gate
- **Redirect Tests**: 100% coverage
- **API Integration**: SportsDataIO contract tests

### Rollout Strategy

1. **Preview** (Week 17): Vercel preview deployments for QA
2. **Staging** (Week 18): Full integration testing
3. **Canary** (Week 18-19): 10% traffic for 48hr
4. **Full Launch** (Week 19): 100% traffic if no regressions

### Rollback Procedure

**Triggers**:
- Error rate > 1%
- LCP > 3s for 5min
- API failure rate > 5%

**Steps**:
1. Revert Next.js deployment on Vercel
2. Restore previous Cloudflare Pages version
3. Notify team via Slack/email
4. Post-mortem within 24hr

---

## Timeline & Milestones

### Week 1 (Oct 13-19): Archive & Design ✅ COMPLETE
- [x] Create archive directory structure
- [x] Generate route map JSON (130 routes discovered)
- [x] Screenshot all pages (mobile) - archived
- [x] Export D1 schema + samples
- [x] Design new IA (`product/ux/IA.md` - 576 lines)
- [x] Create redirect map CSV (`product/ux/RedirectMap.csv` - 136 rules)
- [x] Create validation scripts (`check-301-consistency.sh`, `check-404s.sh`)

### Week 2-6: Database & API
- [x] Implement Prisma schema (6.17.1 + PostgreSQL)
- [x] Build API endpoints (5 handlers: games, teams, conferences, players, rankings)
- [x] Create ingest worker (Cloudflare Workers with cron schedule)
- [ ] Test provider failover (Deploy + simulate failures)
- [ ] Integrate NLG content generation (auto-recap/preview)

### Week 6-14: Frontend MVP
- [ ] Next.js project setup (monorepo)
- [ ] Build Home + Hub pages
- [ ] Build Game Center (diamond viz, WPA)
- [ ] Build Team + Player pages
- [ ] Implement Stripe integration

### Week 14-17: Polish & QA
- [ ] Lighthouse optimization
- [ ] Playwright test suite
- [ ] Accessibility audit
- [ ] Load testing
- [ ] Security audit

### Week 18-19: Launch
- [ ] Preview deployments
- [ ] Staging validation
- [ ] Canary rollout (10%)
- [ ] Full launch (100%)

---

## Risk Assessment

### High Risk
- **Provider API changes**: Mitigation → Adapter pattern + failover
- **Database migration issues**: Mitigation → Incremental migration + rollback plan
- **Performance regressions**: Mitigation → Lighthouse CI gates

### Medium Risk
- **Redirect coverage gaps**: Mitigation → Automated 404 detection
- **Content generation quality**: Mitigation → Human review for first 100 articles

### Low Risk
- **User confusion**: Mitigation → Banner announcement + FAQ
- **SEO impact**: Mitigation → Proper 301s + sitemap update

---

## Success Metrics

### Launch Criteria (Must Pass)
- ✅ 0 404s on top 100 legacy URLs
- ✅ Lighthouse mobile score ≥ 90
- ✅ API p99 ≤ 200ms
- ✅ WCAG 2.2 AA compliant
- ✅ All E2E tests passing

### Post-Launch (Week 1)
- **Uptime**: ≥ 99.9%
- **Error rate**: < 0.5%
- **Avg page load**: ≤ 2s
- **Live game lag**: < 60s

### Post-Launch (Month 1)
- **User retention**: ≥ 60%
- **Bounce rate**: ≤ 40%
- **Avg session duration**: ≥ 3min
- **Mobile traffic**: ≥ 70%

---

## Change Log

### 2025-10-13 (Phase 1 Complete)
- ✅ Migration plan initialized
- ✅ Archive directory structure created (`/archive/2025-10-13/`)
- ✅ Route inventory generated (`route-map.json` - 130 routes: 68 HTML, 62 API)
- ✅ D1 database schema exported (`database/schema.sql`)
- ✅ Cloudflare Workers configuration backed up (`config/wrangler-backup.toml`)
- ✅ KV namespace bindings archived (`config/kv-bindings.json` - 46 namespaces)
- ✅ DNS configuration saved (`config/dns.json`)
- ✅ Information Architecture designed (`product/ux/IA.md` - 576 lines, 16.5KB)
- ✅ Redirect map created (`product/ux/RedirectMap.csv` - 136 redirect rules)
- ✅ Validation scripts implemented:
  - `scripts/check-301-consistency.sh` - Tests redirects with curl
  - `scripts/check-404s.sh` - Scans HTML for broken links
- ✅ Rollback plan documented (`product/ux/RollbackPlan.md`)
- ✅ Phase 1 commit: `ca43b65` (89 files changed, +20,451 lines)

**Key Deliverables**:
- Complete legacy platform snapshot in `/archive/2025-10-13/`
- Diamond Insights IA specification ready for implementation
- 301/410 redirect strategy with 100% legacy route coverage
- Automated validation tooling for post-deployment verification

### 2025-10-13 (Phase 2 Core API - In Progress)
- ✅ Prisma ORM integration (v6.17.1 + @prisma/client)
- ✅ PostgreSQL connection configured (DATABASE_URL)
- ✅ Prisma Client singleton created (`lib/db/prisma.ts`)
- ✅ API v1 handlers implemented:
  - `lib/api/v1/games.ts` - List games + game detail with events & box scores (365 lines)
  - `lib/api/v1/teams.ts` - List teams + team detail with roster/stats/recent games (350 lines)
  - `lib/api/v1/conferences.ts` - List conferences + standings with games back (373 lines)
  - `lib/api/v1/players.ts` - Player profiles with current/career stats (483 lines)
  - `lib/api/v1/rankings.ts` - Poll rankings + history + composite (374 lines)
  - `lib/api/v1/index.ts` - Barrel exports for clean imports (92 lines)
- ✅ Prisma npm scripts added (db:generate, db:migrate, db:push, db:studio, db:seed, db:reset)
- ✅ Phase 2 commit: `5d86705` (9 files changed, +2,537 lines)

**Key Features**:
- Type-safe TypeScript interfaces for all API handlers
- Query parameter validation with pagination support (limit, offset, hasMore)
- Nested Prisma includes for related data (conferences, teams, players, stats)
- Comprehensive response structures with metadata
- Conference standings with games back calculation
- Player career stats aggregation across seasons
- Poll rankings with movement tracking (up/down/new/same)
- Composite rankings aggregation across multiple polls

**Next Steps**:
- ~~Implement Cloudflare Workers ingest layer with cron schedule~~ ✅ COMPLETE
- Test provider failover (SportsDataIO → NCAA API → ESPN)
- Integrate NLG content generation (auto-recap/preview)

### 2025-10-13 (Phase 2 Ingest Worker - Complete)
- ✅ Cloudflare Workers ingest layer implemented (`workers/ingest/`)
- ✅ Scheduled cron triggers configured:
  - Live games: `*/5 * * * *` (every 5 minutes)
  - Team stats refresh: `0 * * * *` (hourly)
  - Historical aggregations: `0 2 * * *` (daily at 2am CST)
- ✅ Provider failover system with circuit breaker pattern:
  - SportsDataIO adapter (primary) - `lib/adapters/sports-data-io.ts` (146 lines)
  - NCAA API adapter (backup) - `lib/adapters/ncaa-api.ts` (130 lines)
  - ESPN API adapter (tertiary) - `lib/adapters/espn-api.ts` (167 lines)
  - Provider manager with circuit breaker - `lib/adapters/provider-manager.ts` (189 lines)
- ✅ Circuit breaker configuration:
  - Failure threshold: 3 failures before opening
  - Reset timeout: 60 seconds auto-recovery
  - Per-provider state tracking with monitoring support
- ✅ Data processing features:
  - Batch upserts with Prisma ORM
  - Rate limiting: 10 concurrent requests with 1s pause between batches
  - KV caching: 60s TTL for live games, 4hr TTL for standings
  - R2 archival for immutable historical game data
- ✅ Advanced baseball analytics calculations:
  - RPI (Rating Percentage Index): (WP*0.25) + (OWP*0.50) + (OOWP*0.25)
  - Strength of Schedule: Average opponent win percentage
  - Pythagorean Win Expectation: Baseball exponent 1.83
- ✅ Monitoring & observability:
  - Analytics Engine integration for success/failure tracking
  - Structured logging for all ingest operations
  - Circuit breaker status endpoint for operational visibility
- ✅ Cloudflare bindings configured:
  - KV Namespace: `CACHE` (id: a53c3726fc3044be82e79d2d1e371d26)
  - R2 Bucket: `blazesports-archives`
  - Analytics Engine: `bsi_ingest_analytics`
- ✅ Phase 2 ingest commit: `bf756cd` (7 files changed, +1,412 lines)

**Key Features**:
- Production-ready scheduled ingest worker with HTTP manual trigger endpoints
- Automatic provider failover with intelligent circuit breaking
- Comprehensive error handling and recovery mechanisms
- Real-time monitoring via Analytics Engine
- Health check endpoint at `/health`
- Secret-based authentication for manual triggers

**Total Phase 2 Implementation**:
- 16 files created/modified
- +3,949 lines of production TypeScript code
- Complete data ingestion pipeline from provider APIs to database
- Type-safe interfaces and error handling throughout

**Next Steps**:
- Deploy ingest worker to Cloudflare: `wrangler deploy` from `workers/ingest/`
- Test provider failover logic with simulated failures
- Monitor circuit breaker behavior in production
- Integrate NLG content generation (auto-recap/preview)

---

## Contacts & Resources

**Owner**: Austin Humphrey (austin@blazesportsintel.com)
**Repository**: https://github.com/ahump20/BSI
**Domain**: blazesportsintel.com
**CDN**: Cloudflare
**Hosting**: Vercel (Next.js)
**Database**: PostgreSQL (Vercel/Supabase)
**Cache**: Upstash Redis
**Storage**: Cloudflare R2

---

**Document Version**: 1.1.0
**Last Updated**: 2025-10-13 22:30 CDT
**Status**: Active Development - Phase 1 Complete, Phase 2 In Progress
