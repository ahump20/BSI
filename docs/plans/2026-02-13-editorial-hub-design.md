# Editorial Hub + Conference Landing Pages — Design

**Date:** 2026-02-13
**Status:** Approved
**Approach:** Static data pages (Approach A)

## Scope

4 new pages:

1. **Editorial Hub** — `/college-baseball/editorial/` — Magazine-style index of all 52+ editorial articles
2. **SEC Conference** — `/college-baseball/editorial/sec/` — Unique SEC editorial landing
3. **Big 12 Conference** — `/college-baseball/editorial/big-12/` — Unique Big 12 editorial landing
4. **Big Ten Conference** — `/college-baseball/editorial/big-ten/` — Unique Big Ten editorial landing

## Editorial Hub Structure

- Breadcrumb: College Baseball / Editorial
- Hero: Featured article (large card)
- Conference preview row: 3 cards linking to conference pages
- Feature articles: Grid of standalone editorial pieces (opening weekend previews, weekly features)
- Team previews by conference: SEC (16), Big 12 (14), Big Ten (17) — grid cards with projection tier badges

## Conference Pages (each unique)

- SEC: "The Standard" — deep midnight, SEC gold accents, 16 teams
- Big 12: "New Blood" — warmer palette, expansion narrative, 14 teams
- Big Ten: "Northern Rising" — cooler steel/blue tones, 17 teams

Each includes: conference-specific hero/stats, team preview grid sorted by tier, cross-links to sibling conferences, full metadata

## Aesthetic

Magazine editorial tone. Dark theme (BSI palette). Oswald + Cormorant Garamond. Burnt orange dominant. Projection tier color-coded badges. Staggered scroll reveals. No generic AI slop.

## Data

Static TypeScript arrays. No shared registry. No changes to existing 47 team preview pages.

## Cross-linking

- Hub links to all content
- Conference pages link back to hub and to sibling conferences
- Update main college baseball page Editorial CTA section to link to hub
