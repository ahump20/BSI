---
name: blaze-platform-visual-design
description: |
  BSI-specific visual design skill enforcing Heritage Design System v2.1 as the
  mandatory default for all Blaze Sports Intel visual work. Covers token application,
  component patterns, surface design, trust cues, and visual critique. Use when
  building or reviewing any BSI page, component, scoreboard, dashboard card,
  standings table, or editorial hero. Detects and corrects off-brand design.
  Triggers: "BSI page", "scoreboard", "heritage", "off-brand", "design-to-code",
  "visual audit", "heritage card", "heritage tokens", "BSI component", "BSI design",
  "standings table", "game layout", "score ticker", "editorial hero", "rankings page",
  "BSI visual", "brand compliance", "design review BSI", "heritage system".
  Not for: generic web design (use frontend-design), non-BSI projects, backend logic,
  API design, or game development.
---

# Blaze Platform Visual Design

Heritage Design System v2.1 is the law. Every BSI surface — every card, every table,
every hero, every data display — uses Heritage tokens. No exceptions. No negotiations.

## Non-Negotiables

These are hard failures. If any appear in BSI output, the design is wrong:

| Violation | Why it fails |
|-----------|-------------|
| Glass cards (`backdrop-filter: blur`, `.glass-*` classes on content cards) | Heritage uses solid surfaces. Glass is for Labs atmospheric overlay only. |
| Default shadcn components (unstyled radix primitives) | BSI has its own component vocabulary. Map to Heritage equivalents. |
| Startup gradients (purple-to-blue, teal-to-purple, etc.) | BSI palette is burnt-orange through bronze. No silicon-valley gradients. |
| Missing trust cues on data surfaces | Every data display needs: source, freshness timestamp, game state, timezone. |
| Raw hex colors not from the token set | All colors come from CSS custom properties in `bsi-brand.css`. |
| `border-radius: 0.75rem` on Heritage surfaces | Heritage uses `border-radius: 2px` (sharp, editorial). Glass system uses 0.75rem. |
| White or light backgrounds | BSI is dark-mode only. Surfaces range from `#0A0A0A` to `#161616`. |

## Token Quick Reference

### Surfaces (dark to light)
| Token | Hex | Use |
|-------|-----|-----|
| `--surface-scoreboard` | `#0A0A0A` | Hero backgrounds, deepest surfaces |
| `--bsi-surface` / `--bsi-midnight` | `#0D0D0D` | Page background |
| `--surface-press-box` | `#111111` | Table headers, lifted sections |
| `--surface-dugout` | `#161616` | Cards, content containers |
| `--bsi-surface-raised` / `--bsi-charcoal` | `#1A1A1A` | Slightly raised elements |
| `--bsi-surface-overlay` | `#242424` | Overlays, modals |

### Colors
| Token | Hex | Use |
|-------|-----|-----|
| `--bsi-primary` | `#BF5700` | Burnt-orange. Stamps, borders, buttons, accents. |
| `--bsi-accent` | `#FF6B35` | Ember. Hover states, secondary accent. |
| `--bsi-bone` | `#F5F2EB` | Primary text on dark surfaces. |
| `--bsi-dust` | `#C4B8A5` | Secondary text, column headers. |
| `--bsi-text-dim` | `rgba(245,240,235,0.52)` | Tertiary text, timestamps. |
| `--heritage-columbia-blue` | `#4B9CD3` | Data links, stat highlights. |
| `--heritage-oiler-red` | `#C41E3A` | Negative stats, stale warnings. |
| `--heritage-bronze` | `#8C6239` | Corner marks, dividers, warm accents. |
| `--heritage-cream` | `#F0E6D3` | Decorative text, premium labels. |
| `--border-vintage` | `rgba(140,98,57,0.3)` | Subtle card/table borders. |
| `--border-active` | `rgba(191,87,0,0.6)` | Hover/active border state. |

### Typography
| Token | Stack | Use |
|-------|-------|-----|
| `--bsi-font-display-hero` | Bebas Neue | Hero headings at `clamp(2.5rem,6vw,5rem)` |
| `--bsi-font-display` | Oswald | Section headings, stamps, nav (uppercase) |
| `--bsi-font-body` | Cormorant Garamond | Body text, editorial prose |
| `--bsi-font-data` | IBM Plex Mono | Score tickers, stat tables, timestamps |
| `--bsi-font-mono` | JetBrains Mono | Code, metadata labels, kickers |

### Heritage Classes
| Class | Purpose |
|-------|---------|
| `.heritage-card` | Solid dugout surface, vintage border, 2px radius |
| `.heritage-stamp` | Oswald branded label with burnt-orange border |
| `.heritage-divider` | Bronze gradient fade divider |
| `.btn-heritage` | Outline button, fills on hover |
| `.btn-heritage-fill` | Solid burnt-orange button |
| `.heritage-hero` | Scoreboard bg + additive warm/cool glows |
| `.heritage-nav` | Bone hover, burnt-orange active state |
| `.corner-marks` | Crop-mark decorative corners (20px inset) |
| `.grain-overlay` | Scoped film grain texture (desktop only) |
| `.scanlines` | Horizontal repeating gradient overlay |
| `.section-break` | Diamond divider between homepage sections |
| `.score-ticker` | Broadcast crawl with 2px top border |
| `.stat-table` | Vintage data table (press-box header, mono font) |
| `.led-stat` | Amber-glowing scoreboard numbers |
| `.skeleton` | Heritage shimmer (dugout/press-box gradient) |

### Sport Theming
BSI supports per-sport accent colors via `data-sport` attribute:
- `college-baseball`: `#6B8E23` (olive)
- `mlb`: `#BF5700` (burnt-orange)
- `nfl`: `#355E3B` (forest green)
- `nba`: `#E25822` (deep orange)
- `cfb`: `#8B4513` (saddle brown)

Sport theming modifies `--sport-accent`, `--sport-glow`, `--sport-border`.
Heritage base tokens remain constant across all sports.

## Trust Cue Requirements

Every data surface must include:
1. **Source attribution** — "Source: ESPN" / "Source: Highlightly" / "Source: SportsDataIO"
2. **Freshness timestamp** — "Updated 2m ago" or ISO timestamp in America/Chicago
3. **Game state** — "LIVE", "FINAL", "Scheduled", "Delayed", "Postponed"
4. **Timezone** — Always CT (Central Time). Never UTC in user-facing display.

Implementation: use `.heritage-stamp` for source, `.stale-warning` for stale data,
`.live-indicator` for live game state.

## Component Patterns

### Scoreboard / Live Scores
- Surface: `--surface-scoreboard` background
- Score ticker: `.score-ticker` class with CSS marquee
- Score values: `.led-stat` with Bebas Neue
- Live indicator: green pulse dot + "LIVE" stamp
- Final games: muted text, no pulse
- Separators: burnt-orange diamond (`rotate(45deg)`)

### Dashboard Card
- Container: `.heritage-card` (dugout surface, vintage border)
- Header: Oswald uppercase, burnt-orange accent bar (`.section-rule`)
- Body: Cormorant Garamond
- Stat values: IBM Plex Mono / JetBrains Mono
- Hover: border shifts to `--border-active`, subtle glow

### Standings Table
- Container: `.stat-table` class
- Header row: `--surface-press-box` background, 2px burnt-orange bottom border
- Column headers: 9px uppercase, `--bsi-dust` color, 0.15em tracking
- Data cells: 11px IBM Plex Mono, `--bsi-bone` text
- Row hover: `rgba(191,87,0,0.04)` background
- Row borders: `rgba(140,98,57,0.12)` bottom border

### Editorial Hero
- Background: `.heritage-hero` (scoreboard + radial glows)
- Heading: Bebas Neue at `clamp(2.5rem,6vw,5rem)`
- Subheading: Oswald uppercase, `--bsi-dust` color
- Body: Cormorant Garamond, 1.7 line height
- Decorations: `.corner-marks`, `.grain-overlay` (desktop only)
- CTA: `.btn-heritage` or `.btn-heritage-fill`

### Rankings Page
- Table: `.stat-table` with sticky header (`.sticky-header`)
- Rank column: burnt-orange accent for top 10
- Movement indicators: heritage-columbia-blue (up), oiler-red (down)
- Stat highlights: `.stat-highlight` (columbia-blue, bold)

## Source Priority

When building BSI visual work, resolve conflicts in this order:
1. **User brief** — explicit instructions from Austin override everything
2. **CLAUDE.md** — project-level Heritage token definitions
3. **Heritage tokens** — `bsi-brand.css` values (this skill's reference)
4. **Component patterns** — this skill's pattern library
5. **Figma exports** — adapt to Heritage, don't copy raw
6. **Generic design principles** — frontend-design skill (lowest priority)

## Visual Critique Rubric

When reviewing BSI visual output, check these dimensions:

| Dimension | Pass | Fail |
|-----------|------|------|
| **Surface compliance** | All surfaces use Heritage tokens | Any raw hex or non-token surface |
| **Typography** | Correct font stack per context | Wrong font family or missing uppercase on headings |
| **Color fidelity** | All colors from token set | Any color not in bsi-brand.css |
| **Trust cues** | Source + freshness + state + timezone present | Any data surface missing trust metadata |
| **Border radius** | 2px on Heritage cards, 1px on stamps/buttons | 0.75rem on content cards |
| **Spacing** | Uses BSI space scale (4px base) | Arbitrary px values |
| **Responsive** | Mobile-first, works at 375px | Breaks below 768px |
| **Accessibility** | WCAG AA contrast, 44px touch targets, focus rings | Low contrast, small targets, no focus |
| **Motion** | Uses BSI duration/ease tokens, respects reduced-motion | Custom timings, no reduced-motion |
| **Sport theming** | Uses `data-sport` + `--sport-accent` when applicable | Hardcoded sport colors |

## Output Protocol

For ambiguous design tasks, produce a spec before code:

1. **Surface map** — which Heritage surfaces apply where
2. **Token plan** — which colors, fonts, spacing tokens are used
3. **Component inventory** — which Heritage classes are needed
4. **Trust cue placement** — where source/freshness/state appear
5. **Responsive notes** — what changes at 375px, 768px, 1024px

For clear tasks, proceed directly to implementation using Heritage tokens.

## Animations

Use BSI animation tokens:
- Micro-interactions: `--bsi-duration-fast` (200ms) with `--bsi-ease-default`
- Transitions: `--bsi-duration-normal` (300ms) with `--bsi-ease-out`
- Hero animations: `--bsi-duration-slow` (500ms), staggered with `--bsi-ease-default`
- Data updates: `.data-update-flash` (0.6s amber flash)
- Loading: `.skeleton` shimmer or `.bsi-shimmer`
- Live state: `.live-indicator__dot` pulse (2s ease-in-out)

Always include `@media (prefers-reduced-motion: reduce)` override.

## Savant Percentile Scale

For BSI Savant analytics visualizations:
| Token | Hex | Meaning |
|-------|-----|---------|
| `--savant-elite` | `#c0392b` | 99th+ percentile |
| `--savant-great` | `#e74c3c` | 90-98th percentile |
| `--savant-above` | `#d4775c` | 75-89th percentile |
| `--savant-avg` | `#aaaaaa` | 25-74th percentile |
| `--savant-below` | `#5b9bd5` | 10-24th percentile |
| `--savant-poor` | `#2980b9` | 2-9th percentile |
| `--savant-very-poor` | `#1a5276` | 1st percentile |
