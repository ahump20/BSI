# AustinHumphrey.com Work-First Redesign

**Date:** 2026-03-27
**Scope:** portfolio-website/ only (React + Vite + Tailwind, deploys to Cloudflare Pages at austinhumphrey.com)
**Approach:** Clean break — new component files for merged sections, delete replaced files in same commit

## Context

The current portfolio opens Hero → BSIShowcase → Projects → Proof → Origin → AthleticArc → Experience → Education → Philosophy → Contact. A visitor sees a full BSI platform tour before seeing what Austin built. That's backward for a portfolio. The redesign reorders to Hero → Work → Proof → Platform Depth → Origin → Career → Contact, putting shipped work within one scroll.

Secondary goal: collapse 5 story-adjacent sections (About, AthleticArc, Philosophy, Experience, Education) into 2 focused sections (Origin, Career), reducing decorative seam treatments and repeated framing copy.

## Reading Path

```
Hero         → identity + BSI value proposition + 2 CTAs
Work         → 5-project flagship grid (BSI loudest)
Proof        → hand-picked editorial + video reel
Platform     → lean BSI evidence (trust, not tour)
Origin       → unified Texas narrative + covenant accent
Career       → professional timeline + education credentials
Contact      → what to contact for + direct links + secondary form
```

## Component Architecture

### Files Created
- `Origin.tsx` — absorbs About.tsx + AthleticArc.tsx + Philosophy.tsx
- `PlatformDepth.tsx` — replaces BSIShowcase.tsx
- `Career.tsx` — merges Experience.tsx + Education.tsx

### Files Deleted
- `AthleticArc.tsx`
- `Philosophy.tsx`
- `BSIShowcase.tsx`
- `Experience.tsx`
- `Education.tsx`

### Files Modified
- `App.tsx` — new section order, new imports, remove bridge wrappers
- `Hero.tsx` — strip to one-viewport, tighter name split, 2 CTAs
- `Projects.tsx` — flat grid, new card shape, section ID → `work`
- `Proof.tsx` — trim framing copy, remove numbered index
- `Contact.tsx` — lead with purpose, subordinate form, add resume download
- `Navigation.tsx` — new nav items and section IDs
- `Footer.tsx` — update link groups
- `site.ts` — new interfaces
- `index.css` — delete orphaned styles, reduce decorative noise
- `index.html` — update meta title/description/OG/schema

### Files Unchanged
- `AIChatWidget.tsx` — stays as-is (lazy-loaded, fixed position)
- `PlatformStatus.tsx` — reused in PlatformDepth
- `ErrorBoundary.tsx` — retained as safety net
- `concierge.ts` — no changes
- All hooks, utils, fonts, assets, scripts

## Section Specs

### Hero (Hero.tsx)

**Keep:**
- Two-line name split: "Austin" (bone) / "Humphrey" (burnt-orange stroke)
- Reduce Humphrey from `clamp(4rem,14vw,9rem)` to `clamp(3rem,8vw,5.5rem)`
- Gradient mesh background, film grain overlay
- Framer Motion entrance animation

**Add:**
- Two-step supporting copy stack:
  - "Founder of Blaze Sports Intel"
  - "Six leagues of live analytics and original editorial for the athletes outside the spotlight"

**Change:**
- CTAs: "See the work" (anchor #work) + "Blaze Sports Intel" (external). Two only.

**Remove:**
- "Sports Intelligence Architect" label
- "Born to Blaze the Path Beaten Less" tagline (lives in footer/origin)
- Stats marquee track
- Scroll indicator chevron
- Resume CTA (moves to Contact)

### Work (Projects.tsx, section ID: `work`)

**Layout:** Desktop: BSI card spans 2 columns in a 2-col grid (full row). Remaining 4 cards fill 2 rows of 2. Mobile: single column stack, BSI first.

**Card shape (3+1 scanning layers):**
1. Project name — Oswald, uppercase
2. Category — mono, small (e.g., "Analytics Platform")
3. Outcome — serif, one sentence (what it proves)
4. Tech line — 2-3 key techs as subtle inline text

**Project order:** Blaze Sports Intel, BSI Radar Lab, BlazeCraft, Sandlot Sluggers, A Documented Heritage.

**BSI card** gets larger treatment — full-width, burnt-orange left accent. Outcome: "Six leagues, solo-built, live in production."

**Remove:** Featured/supporting split, long descriptions, tech pill clouds, LiveBadge ping animation.

**site.ts:** `PORTFOLIO_PROJECTS` becomes flat `Project[]`:
```ts
type Project = {
  name: string;
  category: string;
  outcome: string;
  href: string;
  techs: string[]; // 2-3 items
  state: 'live' | 'building';
};
```

### Proof (Proof.tsx)

**Keep:** Featured piece, supporting editorial entries, "View All Writing" link, video reel.

**Remove:**
- "Editorial Ledger" label + framing paragraph
- Numbered index (01, 02) on entries
- "Why It Matters" sidebar on featured piece
- "Also exported as audio via NotebookLM" note (or fold into video section)

### Platform Depth (PlatformDepth.tsx, section ID: `platform`)

**Content:**
- One thesis paragraph (keep the Rice/Sam Houston hook)
- Stats row: 6 leagues, 330+ programs, 58+ articles
- League list inline
- PlatformStatus badge (live)
- Tech stack as inline text sentence, not pills
- CTA: "Visit BSI" only

**Remove:** Architecture flow diagram, capabilities grid (4 cards), BlazeCraft Dashboard CTA, tagline repetition.

### Origin (Origin.tsx, section ID: `origin`)

**Content:**
- Heading: "Born in Memphis. Rooted in Texas Soil."
- Editorial lead paragraph
- Three origin moments (soil, sports culture, BSI naming) — flowing narrative, no numbered index
- Two photos: Texas soil + young Austin Longhorns
- Sidebar (sticky): 3-4 facts (Born, Birth Soil, Named After), Davy Crockett quote card, Blaze dog photo
- Covenant accent closing: "It's not where you're from. It's how you show up." as typographic punchline

**Remove:**
- AthleticArc photo grid (running vs Tivy, chargers w/dad, last game, friendsgiving)
- Philosophy blockquote + supporting paragraphs (strongest line preserved as accent)
- `origin-bridge-shell`, `section-seam` wrappers
- Diamond dividers
- "Why It Matters" sidebar card
- "Shares Birthday: Davy Crockett" fact
- "Family in Texas: 127+ years" fact

### Career (Career.tsx, section ID: `career`)

**Professional timeline (3 entries):**
1. Founder & Builder — Blaze Sports Intel (2023–Present) — burnt-orange accent, loudest
2. Advertising Account Executive — Spectrum Reach (2022–2025)
3. Financial Representative — Northwestern Mutual (2020–2022)

**Education + credentials (compact row below timeline):**
"Full Sail M.S. (2026) · UT Austin B.A. (2020) · McCombs AI/ML Certificate (in progress) · ATO Rush Captain, UT Austin"

Single line, no cards. ATO stays as credential/leadership signal for AI/recruiter parsing.

### Contact (Contact.tsx)

**Changes:**
- Lead with purpose: "Platform work, sports intelligence partnerships, or product conversations."
- Direct link grid stays (email, LinkedIn, BSI, GitHub, X)
- Resume download moves here from hero
- Form moves below links (full-width, visually secondary) instead of side-by-side
- Cut the "Direct Line" card that duplicates section heading

**Keep:** Turnstile protection, PostHog tracking, honeypot field.

### Navigation

**New nav items:** Home, Work, Proof, Platform, Origin, Career, Contact

### Footer

Update `FOOTER_LINK_GROUPS` to match new section IDs. Remove Covenant from Navigate group. Tagline stays in bottom bar.

## CSS Changes (index.css)

**Delete (orphaned):**
- `.section-seam`, `.origin-bridge-shell`
- `.philosophy-bg`, `.athletic-arc-bg`, `.accent-line-horizontal`
- `.vignette-inset`, `.grid-full-span`, `.min-h-photo`
- `.marquee-track`, `@keyframes marquee`
- `.bsi-showcase-bg`
- `.section-divider` (if spacing replaces dividers)

**Keep:**
- Hero: `.hero-grain`, `.hero-gradient-mesh`, `.hero-first-name`, `.hero-last-name` (with updated sizes)
- Cards: `.card`, `.card-featured`, `.gradient-border-hover`
- Buttons: `.btn-primary`, `.btn-outline`
- Typography: `.section-label`, `.section-title`, `.editorial-lead`
- Layout: `.section-padding`, `.container-custom`, `.section-border`
- Widget: all AIChatWidget styles
- Utilities: `.text-shadow-glow`, `.text-stroke`, `.scrollbar-hide`
- Footer: `.footer-bg`, `.footer-accent-line`, `.footer-link`

**Add:**
- `.platform-depth-bg` if needed (or inline Tailwind)
- `.career-bg` if needed

## Metadata (index.html)

- Title: "Austin Humphrey — Founder, Blaze Sports Intel"
- Meta description: "Austin Humphrey — founder of Blaze Sports Intel, a six-league analytics platform with live scores, advanced sabermetrics, and original editorial. Solo-built on Cloudflare."
- OG/Twitter title: same
- Schema.org `jobTitle`: "Founder & Builder"

## Testing

1. `npm run build` in portfolio-website/ — fix any TypeScript/build regressions
2. Playwright smoke test (`tests/portfolio/smoke.spec.ts`):
   - Hero: identity + BSI value prop + 2 CTAs visible in first viewport
   - Work section follows Hero directly (no BSI platform section between)
   - Proof appears before Platform/Origin
   - Mobile navigation shows new section order
   - Contact links and form remain functional
3. Browser verification at desktop (1440x980) and mobile (390x844):
   - No horizontal overflow
   - Tap targets ≥ 44px
   - Section anchor navigation works
   - Video embed plays
   - AI chat widget doesn't obscure hero or contact on mobile
4. Visual diff: compare before/after for section order, spacing, content removal
