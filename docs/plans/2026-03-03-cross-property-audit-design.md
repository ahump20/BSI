# Cross-Property Audit & Deploy — Design

**Date:** 2026-03-03
**Goal:** Full health check and production deploy across all four BSI properties
**Trigger:** General health sweep — verify everything works, fix what doesn't, deploy it all
**Execution:** Site-perfection-engine agent, sequential property sweep

---

## Properties

| # | Domain | Stack | Deploy Target |
|---|--------|-------|---------------|
| 1 | blazesportsintel.com | Next.js 16 static export + Cloudflare Pages + Workers | `deploy:production` + `deploy:worker` |
| 2 | labs.blazesportsintel.com | Cloudflare Pages | `wrangler pages deploy` → `trackman-audit-lab` |
| 3 | austinhumphrey.com | Vite + React 18 + Cloudflare Pages | `wrangler pages deploy dist` → `austin-humphrey-professional-resume-portfolio` |
| 4 | dna.austinhumphrey.com | Cloudflare Pages | TBD (verify current deploy method) |

## Approach

**Sequential property sweep** — audit, fix, verify, deploy each property before moving to the next. Order follows dependency chain: BSI main first (biggest, backend shared with Labs), Labs second, portfolio third (independent, uses `feature/resurrection` branch), DNA last (smallest).

Quick production smoke of all four domains before deep dive to flag catastrophic issues.

## Phase 0: Production Smoke (~5 min)

Hit all four live domains. Homepage + 2-3 deep routes each. Establish baseline: what visitors see right now. If anything is down, fix it immediately before starting the deep audit.

## Phase 1: BSI Main (blazesportsintel.com)

**Audit:**
- Build project, check for build/type errors
- Crawl completion checklist routes: `/`, `/scores`, `/standings`, `/rankings`, `/teams/[team]`, `/players/[player]`, `/about`, `/contact`
- Verify live data flow: scores updating, standings populating, sabermetrics returning
- Workers health: main Hono worker, savant-compute, live-scores, intelligence-stream
- Mobile viewport on key pages
- Brand standards: burnt orange, Oswald/Cormorant Garamond, dark backgrounds

**Fix:** Batch in groups of 5 by 7-tier priority (build-breaking → routing → data → features → layout → performance → polish).

**Deploy:** `npm run deploy:production` + `npm run deploy:worker`. Post-deploy smoke test.

## Phase 2: BSI Labs (labs.blazesportsintel.com)

**Audit:**
- Build Labs project
- Landing page and tool routes render
- Health endpoint valid
- Visualizations loading real data
- Worker bindings connected

**Deploy:** `wrangler pages deploy` to `trackman-audit-lab`. Post-deploy smoke.

## Phase 3: Portfolio (austinhumphrey.com)

**Audit (on `feature/resurrection` branch):**
- Build on resurrection branch
- All sections: Hero, About, Experience, Education, BSI Showcase, AI Features, Podcast, Philosophy, Contact
- Canvas particle hero + reduced-motion
- Chat widget functional
- Mobile responsive
- Cross-property links
- Brand: dark palette, fonts, film grain

**Deploy:** Build + `wrangler pages deploy dist --project-name austin-humphrey-professional-resume-portfolio`. Post-deploy smoke.

## Phase 4: DNA (dna.austinhumphrey.com)

**Audit:**
- Page renders, no crashes
- Real content (no placeholders)
- Navigation works
- Cross-property links

**Deploy:** Appropriate Pages deploy. Post-deploy smoke.

## Phase 5: Final Verification

- Full post-deploy smoke test from completion checklist against all four production domains
- Cross-property link verification
- Plain English summary of everything that changed

## Execution Model

- Site-perfection-engine agent runs autonomously
- Fixes batched in groups of 5
- No stopping to ask — blockers logged and skipped
- All deploys go to production
- Report at the end: what changed, what visitors see now
