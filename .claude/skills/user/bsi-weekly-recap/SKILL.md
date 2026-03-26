---
name: bsi-weekly-recap
description: Generate and verify weekly college baseball recap articles for BSI. Covers D1Baseball rankings, stat verification against live sources, article creation following BSI editorial voice, sitemap updates, and deployment. Invoke at the start of each week's editorial cycle.
---

# BSI Weekly College Baseball Recap

End-to-end workflow for producing a weekly college baseball recap article — from data collection through verified publication.

## When to Use This Skill

- User asks for a Weekend N recap article
- User says "weekly recap", "weekend recap", "college baseball editorial"
- Beginning of a new week during college baseball season (mid-February through June)
- User invokes `/bsi-weekly-recap`

## Phase 0: Variable Collection

Derive or prompt for these values before starting:

| Variable | How to derive | Example |
|----------|---------------|---------|
| `WEEKEND_NUMBER` | Count weekends from Opening Day (usually Presidents' Day weekend) | `3` |
| `WEEKEND_DATES` | Friday–Sunday of the weekend being recapped | `February 27 – March 1, 2026` |
| `PUBLISH_DATE` | Monday after the weekend (or Tuesday if rankings drop Monday) | `March 2, 2026` |
| `PREV_ARTICLE_SLUG` | Check `app/college-baseball/editorial/` for the most recent recap | `weekend-2-recap` |
| `NEXT_WEEKEND_DATES` | Following Friday–Sunday | `March 6–8, 2026` |

If the user provides a week number, derive dates from the 2026 college baseball calendar. If not provided, use the most recent completed weekend.

## Phase 1: Data Collection & Verification

### Sources (in priority order)

1. **D1Baseball.com** — Top 25 rankings, analysis, player stats
2. **ESPN college baseball** — Box scores, game results, play-by-play
3. **Team athletics sites** (e.g., texassports.com, arkansasrazorbacks.com) — Official stats, recap articles
4. **NCAA stats** — Official statistics and records
5. **Conference sites** (SEC, Big 12, ACC, Big Ten) — Weekly awards, standings

### Required Data Points

For each weekend recap, collect and verify:

- [ ] **D1Baseball Top 25** — Full order, records, movement, who entered/dropped out
- [ ] **Headline series** — 2-3 marquee matchups with game scores and key performers
- [ ] **Statistical standouts** — Players with exceptional individual performances
- [ ] **Upsets** — Ranked teams that lost to unranked opponents, with context
- [ ] **Undefeated tracker** — Teams still unbeaten, aggregate stats
- [ ] **Weekend N+1 preview** — 3-4 matchups to watch with dates/times

### Verification Protocol

Every stat line in the article must trace to a verifiable source. Run web searches for each data cluster:

1. Search `"[Team] baseball [date] box score"` for game scores
2. Search `"[Player] [Team] baseball [year]"` for individual stats
3. Search `"D1Baseball top 25 [date]"` for rankings
4. Cross-reference game scores with aggregate totals (e.g., if you claim "outscored 30-8" verify 10+5+15=30 and 2+1+5=8)

**Flag categories:**
- **VERIFIED** — Found in at least one credible source
- **PLAUSIBLE** — Consistent with available data but no direct source found
- **UNVERIFIED** — Cannot confirm; needs manual review before publication
- **ERROR** — Contradicted by source data; must be corrected

## Phase 2: Article Creation

### File Location

```
BSI-local/app/college-baseball/editorial/weekend-{N}-recap/page.tsx
```

### Component Imports (verified from canonical examples)

```tsx
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';
```

### Article Structure

The article is a **server component** (no `'use client'`) with this architecture:

```
1. Metadata export (title, description, openGraph)
2. Rankings data (RankingEntry[] with rank, team, record, change, prev, headline)
3. Stats data (4 stat cards for the hero section)
4. Page component:
   a. Breadcrumb (College Baseball > Editorial > Weekend N Recap)
   b. Hero (Badge, date, read time, headline, subhead)
   c. Stat cards grid (2x2 mobile, 4-col desktop)
   d. Lede section (2 paragraphs establishing the weekend's narrative)
   e. 3-4 narrative sections (marquee series, standout performance, upset report, etc.)
   f. Rankings table (full Top 25 with sortable columns)
   g. 1-2 additional narrative sections (undefeateds, conference implications)
   h. Weekend N+1 preview (3-4 matchups with dates/times/stakes)
   i. BSI Verdict (2-paragraph synthesis with forward-looking conclusion)
   j. Attribution (DataSourceBadge + navigation links)
   k. Footer
```

### Design Tokens

- Section backgrounds alternate: default (midnight) → `background="charcoal"` → default → charcoal
- Headings: `font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange` with `border-b border-burnt-orange/15`
- Body text: `font-serif text-lg leading-[1.78] text-white/80`
- Strong names: `<strong className="text-white font-semibold">`
- Rankings table: `font-display` headers, `font-serif` body, `font-mono` records
- Movement colors: green for up, red for down, ember for NEW, white/30 for unchanged
- BSI Verdict box: `bg-gradient-to-br from-burnt-orange/8 to-[#8B4513]/5 border border-burnt-orange/15`

### Typography Rules

- Use `&mdash;` for em-dashes, `&ndash;` for en-dashes, `&rsquo;` for apostrophes
- Game scores use en-dashes: `10&ndash;2`
- Ranges use en-dashes: `February 27&ndash;March 1`
- Ampersands in JSX: `&amp;`

### Target Length

~400-450 lines of TSX. Long enough for depth, short enough to respect the reader's time.

## Phase 3: Editorial Voice

### BSI College Baseball Voice

The article reads like a scout's notebook crossed with long-form journalism. Not a box-score recap — a narrative that earns its length by connecting what happened to what it means.

**Structure:** Specific observation first, then structural insight, then implication. Earn the generalization from concrete details.

**Tone:** Declarative. Compressed. Em-dashes punch. Evidence enters mid-argument at the point where the claim needs it. One clear thesis per section.

**What to avoid:**
- Summary-style recaps ("Team X beat Team Y 5-3 on Saturday")
- Generic transitions ("Moving to the SEC...")
- Hype language ("incredible", "amazing", "dominant display")
- Hedge stacking ("it might perhaps be worth noting")
- Bullet-point prose when continuous prose would be stronger

**What to do:**
- Name the mechanism, not just the result ("The margin wasn't the story. The mechanism was.")
- Connect individual performance to team identity
- Use the upset to reveal something structural about the losing team
- Frame the preview around questions the games will answer, not just who plays whom
- Close with a reframe that pushes forward, never a summary

### Stat Presentation

Stats earn their place by supporting a claim. Don't front-load stat lines — weave them into the argument.

```
// BAD: "Cholowsky went 7-for-16 with 5 HR and 10 RBI. He hit a grand slam in Game 1."
// GOOD: "Cholowsky opened Game 1 with a grand slam in the second inning and followed it with a solo shot in the fourth. Five home runs in a three-game series against a ranked opponent isn't a hot weekend — it's a demolition notice."
```

## Phase 4: Sitemap Update

Add the article URL to the sitemap in `BSI-local/app/sitemap.ts`:

```typescript
{
  url: `${baseUrl}/college-baseball/editorial/weekend-${N}-recap`,
  lastModified: new Date('YYYY-MM-DD'),
  changeFrequency: 'weekly' as const,
  priority: 0.7,
},
```

Verify the entry exists. If the sitemap uses a different pattern, match it.

## Phase 5: Build & Verify

```bash
cd BSI-local && npm run build
```

The build must succeed (static export). Check for:
- No TypeScript errors that break the build (note: `next.config.ts` skips TS build errors, but still verify)
- The route appears in the `out/` directory
- No missing component imports

## Phase 6: Deploy

After user approval:

```bash
cd BSI-local && npm run deploy:production
```

This deploys to Cloudflare Pages. Verify the article is live at `blazesportsintel.com/college-baseball/editorial/weekend-{N}-recap`.

## Canonical Examples

Reference these files for structure, voice, and component usage:
- `BSI-local/app/college-baseball/editorial/week-1-recap/page.tsx`
- `BSI-local/app/college-baseball/editorial/weekend-2-recap/page.tsx`

## Post-Write Gate (HWI Quick Audit)

Run this on the completed article before the build step. Adapted from the Humphrey Writing Index.

### Five Questions (2 minutes)

1. **What is the verdict sentence?** Can you underline one sentence that functions as the article's thesis? If none exists, rewrite until it does.
2. **Where is the turn?** The counterintuitive finding — the consequence of the obvious consequence. If the article only confirms what readers already believe, add one.
3. **Where is the concrete anchor?** A player, a stadium, a stat deployed at the point of need. If the article is floating in abstraction, ground it.
4. **Does the cadence move?** Anchor (short) → Expand (long) → Drive (medium). If 4+ sentences are the same length in a row, rebuild the rhythm.
5. **Does the ending push forward?** If the BSI Verdict summarizes what was just said, reframe it — widen the lens, point at what the next weekend will answer.

### Pass Threshold

3 of 5 = pass. Below 3 = structural revision needed before build.

---

## Checklist

Before marking complete:
- [ ] All stat lines verified or flagged for manual review
- [ ] Rankings match D1Baseball published poll
- [ ] Game scores cross-checked against box scores
- [ ] Individual stats confirmed via team/ESPN/NCAA sources
- [ ] Article follows BSI editorial voice (no hype, no summaries, specific → structural → implication)
- [ ] **HWI Quick Audit passed (3/5 minimum)**
- [ ] Component imports match canonical examples
- [ ] Sitemap entry added
- [ ] `npm run build` succeeds
- [ ] Deployed (after user approval)
