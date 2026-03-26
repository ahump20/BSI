---
name: mlb-the-show-dd-tracker
description: |
  MLB The Show 26 Diamond Dynasty tracker for BSI. Card pricing, flip detection,
  captain-fit analysis, theme-team scoring, watchlist, and collection tracking.
  Use when: (1) Building DD marketplace/card/team builder features in BSI,
  (2) Analyzing prices, spreads, or flips, (3) Captain logic or theme-team work,
  (4) Debugging DD sync worker or D1/KV data.
  Triggers: "Diamond Dynasty", "DD marketplace", "The Show 26", "card prices",
  "team builder", "captain fit", "theme team", "collection tracker", "flip detection",
  "watchlist", "DD sync", "DD cards", "captain boost", "show API", "DD worker".
  Not for: real MLB stats (bsi-gameday-ops), 2K builds (nba-2k26-build-optimizer).
---

# MLB The Show 26 Diamond Dynasty Tracker

Track card prices, analyze captain fit, build optimal squads, and monitor collections across the DD marketplace — all sourced from verified public The Show endpoints and stored in BSI's Cloudflare D1 backend.

## Compatibility Mode

The current implementation runs against MLB 25 public endpoints (`mlb25.theshow.com`) because MLB 26 endpoints are not yet verified. All data is labeled with source and freshness metadata. Never present compat-mode data as official 26 data. See `references/api-sources.md` for endpoint details and the transition plan.

## Core Capabilities

### 1. Marketplace Price Tracking

Cards have live buy/sell prices synced from The Show API into D1 every 15 minutes via the `bsi-show-dd-sync` cron worker.

Key metrics per card: best buy price, best sell price, spread, velocity (completed orders per hour), daily price trend.

For flip detection logic, spread analysis tiers, and tax calculations: see `references/marketplace-mechanics.md`.

### 2. Card Detail & Captain Fit

Every card detail page should surface:
- Current price + 7-day trend
- Which captains this card contributes to (and how)
- Collection membership (which collections need this card)
- Source transparency: synced_at timestamp, compat_mode flag

Captain-fit analysis is computed in the **worker/store layer** (`mlb-the-show-store.ts`), not ad hoc in React components. The worker parses captain requirement text into structured conditions and determines per-card contribution.

For captain parsing rules, requirement types, and the "UNKNOWN" fallback: see `references/captain-theme-logic.md`.

### 3. Team Builder & Theme Teams

The team builder lets users construct a 26-man roster and see:
- Captain progress: how close the squad is to activating a selected captain's boost
- Theme-team score: percentage of roster matching a franchise/series/rarity constraint
- Estimated squad value: sum of best_buy_price for all rostered cards
- Gaps: which cards would improve captain progress or theme-team purity

Theme-team types and scoring formulas: see `references/captain-theme-logic.md`.

### 4. Collections & Watchlist

Collection tracking shows cards_owned / cards_required per collection, with estimated stub cost to complete and price trend direction of remaining cards.

Watchlist tracks user-selected cards with price-at-add, current price, delta, and user-set alert thresholds.

For data freshness SLAs: see `references/marketplace-mechanics.md`.

## Decision Framework

### When adding a new DD feature:

1. **Is the data sourceable from verified endpoints?** Check `references/api-sources.md`. If not, mark as UNKNOWN and surface raw text — do not invent data.
2. **Does the computation belong in the worker or the frontend?** Anything that crosses cards x captains or cards x collections belongs in `mlb-the-show-store.ts`. The frontend renders pre-computed results.
3. **Does this create a new file?** Check existing handler, source, store, and component files first. Extend existing files. One handler, one source, one store.
4. **Is this local build state or market data?** Parallel mods, prestige status, and user-specific card upgrades are local state. They never mix into marketplace or captain analysis.

### When debugging DD issues:

1. Check sync worker logs: is `bsi-show-dd-sync` running on schedule?
2. Check D1 data freshness: query `show_dd_listings` for `synced_at` timestamps
3. Check KV cache: stale cache can serve old prices after a sync
4. Check API response structure: did SDS change the endpoint schema?
5. Run the test suite before and after any fix

## BSI Integration

All DD code lives inside the BSI monorepo. No separate projects, no external databases, no Vercel.

For file locations, naming conventions, anti-sprawl rules, and the testing checklist: see `references/bsi-integration.md`.

## Resources

- `references/api-sources.md` — Verified endpoints, data models, compat-mode rules
- `references/captain-theme-logic.md` — Captain parsing, fit analysis, theme-team scoring
- `references/marketplace-mechanics.md` — Pricing signals, flip detection, collection tracking, freshness SLAs
- `references/bsi-integration.md` — File locations, naming conventions, testing, anti-sprawl rules
