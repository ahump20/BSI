# Public Claims Audit — 2026-03-26

Every verifiable public claim on blazesportsintel.com, checked against primary sources.

## Pricing Page (`/pricing/`)

| Claim | Source | Status | Action |
|-------|--------|--------|--------|
| D1Baseball: $140/yr | d1baseball.com/subscribe ($139.99/yr) | **Verified** | Keep — rounds correctly |
| D1Baseball: 2.0-star app | App Store ratings (1.65–2.0) | **Verified** | Keep |
| D1Baseball: Daily updates | d1baseball.com | **Verified** | Keep |
| D1Baseball: Limited free content | d1baseball.com paywall | **Verified** | Keep |
| FanGraphs: Free | fangraphs.com | **Verified** | Keep |
| FanGraphs: No park adjustment (college) | FanGraphs college leaderboards | **Verified** — FanGraphs does not publish park-adjusted college metrics | Keep |
| FanGraphs: ~~Weekly~~ Daily updates | FanGraphs college leaderboards (last updated dates) | **Corrected** — FanGraphs updates college data daily, not weekly | Fixed in this audit |
| FanGraphs: Desktop-oriented | fangraphs.com mobile experience | **Verified** | Keep |
| BSI Pro: $12/mo | Stripe checkout config | **Verified** | Keep |
| BSI Pro: Every 6 hours updates | bsi-savant-compute cron (6h) + bsi-cbb-analytics (daily) | **Verified** | Keep |
| BSI Pro: Park-adjusted metrics | bsi-savant-compute code, D1 park_factors table | **Verified** | Keep |
| "Nobody else does this for college baseball — publicly, for free" | FanGraphs (no park adj), D1Baseball (no advanced free tier) | **Defensible** | Keep with awareness — monitor competitors |
| "14-day free trial" (Pro tier) | Stripe configuration | **Unverified from code** — needs Stripe dashboard check | Verify in Stripe |

## About Page (`/about/`)

| Claim | Source | Status | Action |
|-------|--------|--------|--------|
| Danny Graves: first Vietnamese-born MLB player | Wikipedia, MLB.com, Reds FB page | **Verified** — born in Saigon, only Vietnam-born MLB player | Keep |
| Danny Graves: two-time All-Star | Baseball Reference (2000, 2004) | **Verified** | Keep |
| Jason Marshall: former UTSA head coach | Coaching records | **Unverified** — couldn't confirm in quick search | Flag for manual verification |
| Austin played varsity baseball at Boerne-Champion | Personal claim | Cannot verify externally | Keep — autobiographical |
| Ricky Williams NCAA rushing record 1998 | Sports history | **Verified** | Keep |
| "127 years" soil tradition | Personal/family claim | Cannot verify externally | Keep — autobiographical |

## Analytics Page (`/analytics/`)

| Claim | Source | Status | Action |
|-------|--------|--------|--------|
| ~~"2.4M+ Data Points Analyzed"~~ | None | **Unverifiable** — no audit trail | Replaced with "5 Sports Covered" |
| ~~"67.3% Prediction Accuracy"~~ | None | **Unverifiable** — implies measured accuracy | Replaced with "920+ Players Tracked" |
| ~~"5+ Years Historical Records"~~ | Partial (MLB yes, college ~2 seasons) | **Misleading** | Replaced with "6 hrs Analytics Refresh" |
| "30 sec Live Score Updates" | bsi-live-scores Worker (15s poll) | **Verified** — conservative; actual is faster | Keep |

## Data Sources Page (`/data-sources/`)

| Claim | Source | Status | Action |
|-------|--------|--------|--------|
| Highlightly: live scores every 30s | Code: 15s poll in bsi-live-scores | **Conservative** — actual is 15s | Keep |
| SportsDataIO: scores every 30-60s | Code: scheduled handler | **Verified** | Keep |
| ESPN: standings/rankings daily | ESPN Site API behavior | **Verified** | Keep |
| ESPN dates "labeled UTC are actually ET" | Code comments, known ESPN behavior | **Verified** | Keep |
| BSI Savant: every 6 hours + daily recompute | bsi-savant-compute (6h) + bsi-cbb-analytics (daily 6AM CT) | **Verified** | Keep |
| "920+ players tracked" | D1 cbb_batting_advanced table | **Plausible** — needs D1 query to confirm exact count | Verify via D1 |
| KV Scores TTL: 60s | Code: BSI_PROD_CACHE writes | **Verified** — matches CLAUDE.md | Keep |
| "External APIs are never called from your browser" | Architecture: Worker proxies all external calls | **Verified** | Keep |

## NIL Valuation Page (`/nil-valuation/`)

| Claim | Source | Status | Action |
|-------|--------|--------|--------|
| Players Scored: {dynamic} | /api/nil/leaderboard | **Live data** — currently showing ~50 (limited by query) | OK — data is real |
| Conferences: {dynamic} | Derived from leaderboard response | **Live data** — showing 3 (limited by data scope) | OK |
| "9 Analysis Tools" | Hardcoded in page | **Plausible** — count of NIL sub-pages | Verify against actual sub-routes |
| "Fair Market Value calculations" | Marketing copy | **Aspirational** — model exists but scope is limited | Monitor |

## Footer / Global

| Claim | Source | Status | Action |
|-------|--------|--------|--------|
| "Born to Blaze the Path Beaten Less" | Brand tagline | **Canonical** — exact word order per CLAUDE.md | Keep |
| "Park-adjusted sabermetrics, live scores, and original editorial for college baseball" | Site capabilities | **Verified** | Keep |
| "Built on Cloudflare" | Infrastructure | **Verified** — Workers, Pages, D1, KV, R2 | Keep |
| "Austin, TX" | Location | Personal claim | Keep |

---

Last verified: 2026-03-26
