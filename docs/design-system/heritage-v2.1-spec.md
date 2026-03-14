# Heritage Design System v2.1 — Complete Specification

**Owner:** Blaze Sports Intel
**Last updated:** March 14, 2026
**Platform:** React 19 / Next.js 16 static export / Tailwind CSS 3 / Cloudflare Pages

---

## 1. Principles

Heritage Design System exists because BSI is not a startup, not a SaaS dashboard, and not a sports-bar novelty. It is a premium sports intelligence operation with newsroom credibility and dugout grit. Every visual decision should pass this filter:

- **Proof-first.** If the data isn't there, the design doesn't get to pretend it is.
- **Tactile, not glassy.** Solid surfaces, warm borders, grain where it earns its place.
- **Editorial, not startup-generic.** Heritage typography, not system fonts. Heritage palette, not SaaS blue.
- **Dark-surface confident.** No light mode. Dark is the default and only mode.
- **Data-trusting and time-aware.** Every data surface shows source, freshness, and state.

The governing influence breakdown:

| Weight | Influence | What it controls |
|--------|-----------|-----------------|
| 70% | 1998 Texas Longhorns restraint + BSI canonical system | Overall identity, palette, editorial tone |
| 20% | Tennessee Oilers Columbia blue | Data accents, comparison series, press-box atmosphere |
| 10% | Vancouver Grizzlies condensed force | Hero display type only (Bebas Neue at 3rem+) |

**Hard rule:** Data density beats decorative atmosphere, every time, no exceptions.

---

## 2. Color Tokens

### 2.1 Surfaces (Dark Only)

| Token | Hex | Usage |
|-------|-----|-------|
| `--surface-scoreboard` | `#0A0A0A` | Page shells, hero bands, scoreboard rails |
| `--surface-press-box` | `#111111` | Tables, tool chrome, nav bars |
| `--surface-dugout` | `#161616` | Cards and secondary modules |

### 2.2 Brand Colors (Invariant)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bsi-primary` | `#BF5700` | Stamps, buttons, borders, rules, separators. Identity anchor. |
| `--bsi-bone` | `#F5F2EB` | Primary text on dark surfaces |
| `--bsi-dust` | `#C4B8A5` | Secondary text, subdued labels |
| `--bsi-ember` | `#FF6B35` | Heat, urgency, single high-intent CTA (rare) |
| `--border-vintage` | `rgba(140, 98, 57, 0.3)` | Subtle borders, card edges |

### 2.3 Heritage Accents (Data/Atmosphere Only)

| Token | Hex | Usage |
|-------|-----|-------|
| `--heritage-columbia-blue` | `#4B9CD3` | Data links, comparison series, live-data cues |
| `--heritage-oiler-red` | `#C41E3A` | Negative delta, loss indicators, alert states |
| `--heritage-teal` | `#00B2A9` | Positive delta, win indicators, success states |
| `--heritage-bronze` | `#8C6239` | Tertiary accents, decorative borders, metadata |
| `--heritage-cream` | `#F0E6D3` | Warm backgrounds for callout panels, blockquotes |

### 2.4 Usage Rules

- Burnt orange is the anchor, never background wallpaper. Use for identity moments — stamps, CTAs, rules, active states.
- Columbia blue signals data, links, or comparison. It is secondary.
- Ember is optional and should appear at most once per viewport.
- Heritage accents (oiler red, teal, bronze, cream) are for data layers only. Never as primary UI color.
- Do not introduce random blues, teals, purples, or neon accents outside this palette.

### 2.5 Explicitly Forbidden Colors

| Hex | Why |
|-----|-----|
| `#1A1A2E` | Legacy dark purple from old BSI. Not heritage. |
| `#F7931E` | Generic orange. Not burnt orange. |
| Any SaaS blue | Fights the heritage palette. |
| Any purple/gradient | Startup energy, not heritage. |

---

## 3. Typography

### 3.1 Type Stack

| Tier | Family | Role | Tracking | Line Height |
|------|--------|------|----------|-------------|
| Hero display | Bebas Neue | Scores, hero headlines, scoreboard lockups | Normal | 1.1 |
| Section headings | Oswald | Uppercase headings, nav labels, stamps | 0.15–0.2em | 1.2 |
| Body / narrative | Cormorant Garamond | Articles, marketing copy, explanatory text | Normal | 1.7 |
| Data / labels | IBM Plex Mono | Stats, timestamps, source lines, data labels | Normal | 1.4 |

**Canonical rule:** IBM Plex Mono is the data typeface. JetBrains Mono may substitute in code contexts only (IDE, terminal output). Do not mix them in the same surface.

### 3.2 Type Scale

| Level | Size | Weight | Family | Use |
|-------|------|--------|--------|-----|
| Display XL | 4rem (64px) | 400 | Bebas Neue | Scoreboard hero, game scores |
| Display | 3rem (48px) | 400 | Bebas Neue | Page hero headlines |
| H1 | 2rem (32px) | 600 | Oswald | Section titles |
| H2 | 1.5rem (24px) | 500 | Oswald | Subsection titles |
| H3 | 1.25rem (20px) | 500 | Oswald | Card titles, table group headers |
| Body | 1rem (16px) | 400 | Cormorant Garamond | Paragraph text |
| Body Small | 0.875rem (14px) | 400 | Cormorant Garamond | Captions, supporting text |
| Data | 0.875rem (14px) | 500 | IBM Plex Mono | Statistics, metrics |
| Data Small | 0.75rem (12px) | 400 | IBM Plex Mono | Timestamps, source lines |
| Label | 0.6875rem (11px) | 600 | Oswald | Stamps, badges, eyebrows |

### 3.3 Typography Rules

- All Oswald usage is uppercase with tight tracking. No exceptions.
- Cormorant Garamond body text uses 1.7 line-height for readability on dark surfaces.
- Bebas Neue is reserved for moments that need force — hero scores, scoreboard lockups, display headlines at 3rem+.
- No system fonts. If font loading fails, preserve the hierarchy (sans → serif → mono) even if exact families differ.

---

## 4. Spacing

### 4.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Inline gaps, icon padding |
| `--space-2` | 8px | Tight element spacing, badge padding |
| `--space-3` | 12px | Form field padding, compact cards |
| `--space-4` | 16px | Default component padding |
| `--space-5` | 20px | Corner mark inset, card padding |
| `--space-6` | 24px | Section padding (horizontal) |
| `--space-8` | 32px | Section gaps |
| `--space-10` | 40px | Major section separation |
| `--space-12` | 48px | Page section padding |
| `--space-16` | 64px | Hero section vertical padding |
| `--space-20` | 80px | Page-level vertical rhythm |

### 4.2 Container Widths

| Token | Value | Usage |
|-------|-------|-------|
| `--container-sm` | 640px | Narrow content (articles, forms) |
| `--container-md` | 768px | Standard content width |
| `--container-lg` | 1024px | Dashboard and table layouts |
| `--container-xl` | 1280px | Full-width dashboard |
| `--container-max` | 1440px | Maximum page width |

---

## 5. Borders and Radius

### 5.1 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0px | Tables, score tickers |
| `--radius-sm` | 2px | Cards, buttons, inputs — **maximum** for all standard UI |
| `--radius-full` | 9999px | Badges, pills, avatars only |

**Hard rule:** 2px maximum radius for cards, buttons, and containers. The only exception is circular badges/pills at `9999px`. No 4px, 8px, 12px, or 16px radius values exist in this system.

### 5.2 Border Styles

| Token | Value | Usage |
|-------|-------|-------|
| `--border-vintage` | `1px solid rgba(140, 98, 57, 0.3)` | Default card and module borders |
| `--border-primary` | `1px solid #BF5700` | Active states, selected items, primary CTAs |
| `--border-data` | `1px solid rgba(75, 156, 211, 0.2)` | Data containers, chart wrappers |
| `--border-subtle` | `1px solid rgba(245, 242, 235, 0.06)` | Dividers, table row separators |

---

## 6. Shadows and Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 4px rgba(0, 0, 0, 0.2)` | Subtle lift (buttons, small cards) |
| `--shadow-md` | `0 8px 16px rgba(0, 0, 0, 0.25)` | Cards, dropdowns |
| `--shadow-lg` | `0 18px 40px rgba(0, 0, 0, 0.35)` | Modals, featured cards |
| `--shadow-glow-primary` | `0 0 20px rgba(191, 87, 0, 0.15)` | Hover state for primary elements |
| `--shadow-glow-data` | `0 0 12px rgba(75, 156, 211, 0.1)` | Hover state for data elements |

---

## 7. Motion

### 7.1 Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 120ms | Hover states, focus rings |
| `--duration-normal` | 200ms | Transitions, state changes |
| `--duration-slow` | 350ms | Entrances, panel reveals |
| `--duration-orchestrated` | 600ms | Hero entrance, page transitions |

### 7.2 Easing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Default exit/settle |
| `--ease-in-out` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | State transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful entrances (use sparingly) |

### 7.3 Motion Rules

- Prefer one orchestrated entrance over many small tricks.
- Framer Motion for React is fine, but use restraint.
- Always respect `prefers-reduced-motion`. Reduce or eliminate animation, never just slow it down.
- Grain, texture, and overlays stay subtle — disabled entirely below 768px.

---

## 8. Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default content |
| `--z-card` | 10 | Cards, elevated content |
| `--z-dropdown` | 100 | Dropdowns, popovers |
| `--z-sticky` | 200 | Sticky headers, score tickers |
| `--z-modal` | 300 | Modals, dialogs |
| `--z-toast` | 400 | Toast notifications |
| `--z-overlay` | 500 | Full-screen overlays |

---

## 9. Components

### 9.1 Cards

**Structure:** Eyebrow → Title → Metric or Body → Action

| Property | Value |
|----------|-------|
| Background | `--surface-dugout` |
| Border | `--border-vintage` |
| Radius | `--radius-sm` (2px) |
| Shadow | `--shadow-md` |
| Padding | `--space-5` (20px) |
| Text color | `--bsi-bone` |

**States:**

| State | Treatment |
|-------|-----------|
| Default | As specified |
| Hover | `--shadow-lg` + subtle border brightness increase |
| Active | `--border-primary` |
| Loading | Skeleton with `--surface-press-box` pulse |
| Empty | Dust-colored "No data" message, centered |

**Variants:**

- **Data card:** Adds trust layer (source + freshness badge). Monospace metrics.
- **Editorial card:** Adds article metadata. Cormorant Garamond body text.
- **Action card:** Adds primary CTA. Burnt orange button or stamp.

### 9.2 Buttons

| Variant | Background | Border | Text | Hover |
|---------|------------|--------|------|-------|
| Primary | `--bsi-primary` | `--bsi-primary` | `--bsi-bone` | Slight lift + `--shadow-glow-primary` |
| Secondary | transparent | `--bsi-primary` | `--bsi-bone` | Background fades to `rgba(191, 87, 0, 0.1)` |
| Ghost | transparent | none | `--bsi-dust` | Text shifts to `--bsi-bone` |
| Danger | transparent | `--heritage-oiler-red` | `--heritage-oiler-red` | Background fades to `rgba(196, 30, 58, 0.1)` |

**Shared properties:** Font: Oswald, uppercase, `--radius-sm` (2px), `--duration-fast` transition. No giant radius. No soft shadows for character.

**Sizes:**

| Size | Padding | Font Size |
|------|---------|-----------|
| sm | 6px 12px | 12px |
| md | 8px 16px | 14px |
| lg | 12px 24px | 16px |

**States:** Default, Hover, Active (slight scale 0.98), Disabled (0.4 opacity, no pointer), Loading (spinner replaces label).

### 9.3 Navigation

- Font: Oswald or IBM Plex Mono labels. Not soft startup nav.
- Active indicator: Burnt-orange underline or left border. Not filled pills.
- Surface: `--surface-press-box`
- Compact and tactile. On mobile, preserve hierarchy before animation.
- Taxonomy: SCORES | COLLEGE BASEBALL | MLB | COLLEGE FOOTBALL | NFL | NBA | CBB (M) | CBB (W) | INTEL

### 9.4 Tables

| Element | Treatment |
|---------|-----------|
| Header row | `--surface-press-box`, Oswald uppercase, `--bsi-dust` text |
| Body rows | `--surface-scoreboard`, `--bsi-bone` text |
| Alternate rows | `--surface-dugout` (subtle stripe) |
| Borders | `--border-subtle` between rows |
| Sort indicator | `--bsi-primary` arrow icon |
| Hover row | `rgba(191, 87, 0, 0.05)` background tint |
| Data values | IBM Plex Mono |
| Column labels | Oswald or IBM Plex Mono, `--bsi-dust` |

**Rules:** Column rhythm matters more than card chrome. Stale or live states visible without reading a paragraph. Every table shows source and freshness.

### 9.5 Charts (Recharts)

| Element | Treatment |
|---------|-----------|
| Primary series | `--bsi-primary` (burnt orange) |
| Secondary series | `--heritage-columbia-blue` |
| Positive delta | `--heritage-teal` |
| Negative delta | `--heritage-oiler-red` |
| Grid lines | `rgba(245, 242, 235, 0.06)` — quiet |
| Axis labels | IBM Plex Mono, `--bsi-dust` |
| Tooltip | `--surface-dugout` background, `--border-vintage` border |
| Legend | IBM Plex Mono, `--bsi-dust` |

**Rules:** Never use a rainbow palette for serious analytics. One dominant series, one comparison. Labels and legends legible on dark backgrounds.

### 9.6 Heritage Stamps

Inline labels with editorial authority.

| Property | Value |
|----------|-------|
| Font | Oswald, uppercase |
| Tracking | 0.08em |
| Color | `--bsi-primary` |
| Display | inline-flex, centered |
| Gap | 0.5rem (icon + text) |

### 9.7 Corner Marks

Decorative inset frames for hero sections and featured cards.

| Property | Value |
|----------|-------|
| Inset | 20px from edges |
| Border | `1px solid rgba(196, 184, 165, 0.16)` |
| Pointer events | none |
| Usage | Hero and media surfaces only |

### 9.8 Grain Overlay

Subtle atmospheric texture.

| Property | Value |
|----------|-------|
| Opacity | 0.05 maximum |
| Pointer events | none |
| Breakpoint | Disabled below 768px |
| Scope | Hero and media surfaces only, never full-page |

---

## 10. Patterns

### 10.1 Analytics Landing Page Rhythm

1. Hero with a hard claim and immediate proof (real metrics, live-data cues)
2. Score ticker, source strip, or credibility rail
3. Key capabilities or product modules
4. Data snapshot or workflow explanation
5. CTA close with clear next action

The hero should never feel like a blank billboard. Get real data above the fold.

### 10.2 Dashboard / Scoreboard Surface

- Visible freshness and source state
- Strong table headers (Oswald, uppercase)
- Chart restraint — one or two series max
- Dense but readable spacing
- Active state clarity
- Fast scan hierarchy from left to right
- Dark shells, lighter text, warm accent control points

### 10.3 Trust Layer (Required)

Every data surface exposes at least one of: source, last-updated time, game state, freshness badge, timezone context. If the UI hides time, source, or status, it feels fake.

### 10.4 CTA Hierarchy

| Level | Treatment |
|-------|-----------|
| Primary | Burnt orange filled button — one per viewport max |
| Secondary | Outlined button (bone text, primary border) |
| Tertiary | Text link or subdued action |

### 10.5 Content Priority Matrix (Homepage)

Live > Breaking > Analysis > Evergreen. Content surfaces should respect this hierarchy in layout weight and position.

---

## 11. Responsive Breakpoints

| Token | Value | Target |
|-------|-------|--------|
| `--bp-sm` | 640px | Mobile landscape |
| `--bp-md` | 768px | Tablet / texture cutoff |
| `--bp-lg` | 1024px | Desktop |
| `--bp-xl` | 1280px | Wide desktop |
| `--bp-2xl` | 1440px | Maximum container |

**Rules:** Disable grain/texture/scanlines below 768px. Preserve hierarchy before animation on mobile. Touch targets minimum 44px.

---

## 12. Accessibility

- WCAG 2.1 AA minimum for all text contrast on dark surfaces.
- Heading order must be semantic (h1 → h2 → h3, no skipping).
- All interactive elements must have visible focus indicators (burnt-orange ring).
- Keyboard navigation must work for all interactive components.
- Touch targets: 44px minimum.
- `prefers-reduced-motion`: reduce or eliminate animation, never just slow it down.
- `prefers-color-scheme`: ignored (dark mode only, by design).

---

## 13. Anti-Patterns (Forbidden)

Do not ship any of the following:

- Light mode
- Rounded corners beyond 2px (except circular badges)
- Glass cards or backdrop-blur as design language
- Generic purple-blue gradients
- Blue, green, or purple primary accents (heritage colors are data-layer only)
- System fonts
- Placeholder content ("Lorem ipsum," "Coming soon," fake data)
- Full-screen texture overlays
- Direct franchise mimicry
- CSS ranges as values
- Evenly spaced, personality-free card farms
- Default shadcn look without meaningful restyling
- Centered-everything hero sections with no tension
- Bright SaaS blues that fight the heritage palette
- Rainbow chart palettes
- `#1A1A2E` or `#F7931E` anywhere

---

## 14. Audit Findings (March 14, 2026)

Issues found in existing implementation artifacts:

| Issue | Location | Severity | Resolution |
|-------|----------|----------|------------|
| `--radius-card: 16px` contradicts 2px max rule | `heritage-tokens.css` | Critical | Corrected to 2px in updated tokens |
| Tailwind extension uses JetBrains Mono, spec says IBM Plex Mono | `heritage-tailwind-extension.ts` | Medium | Corrected to IBM Plex Mono in updated extension |
| Heritage accents missing from Tailwind extension | `heritage-tailwind-extension.ts` | Medium | Added all five accent colors |
| No spacing scale defined | Both files | Medium | Added 11-step spacing scale |
| No motion tokens | Both files | Low | Added duration and easing tokens |
| No z-index system | Both files | Low | Added 7-level z-index scale |
| No shadow elevation levels | Both files | Medium | Added 5-level shadow system |
| No border token variants | Both files | Medium | Added 4 border styles |
| No responsive breakpoints | Both files | Medium | Added 6 breakpoints |
| `.heritage-card` uses 16px radius | `heritage-tokens.css` | Critical | Corrected to 2px |

---

*This document is the single source of truth for Heritage Design System v2.1. When conflicts arise between this spec and implementation files, this spec wins. When conflicts arise between this spec and Austin's direct instructions, Austin wins.*
