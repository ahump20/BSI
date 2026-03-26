---
name: frontend-design
description: |
  Builds, styles, and generates production-grade frontend interfaces with typography,
  color tokens, spatial composition, and motion design. Use when building web components,
  pages, artifacts, dashboards, React components, HTML/CSS layouts, landing pages, or
  when styling web UI. Outputs styled HTML/CSS/JS or React+Tailwind code with custom
  font pairings, CSS animations, and WCAG AA accessibility. Includes design decision
  framework, type scale reference, animation recipes, and anti-patterns checklist.
  Triggers: "build a website", "create a landing page", "design a dashboard",
  "make this look better", "style this component", "React component", "UI design",
  "beautify", "web page", "frontend", "make it look good", "design system".
  Not for: backend logic, API design, database schemas, or mobile-native apps.
---

# Frontend Design v2

Every interface tells a story. The job is to make that story unmistakable — not through decoration, but through intentional decisions about type, color, space, and motion that serve the user's purpose.

## Design Decision Framework

Before writing code, commit to a direction. This isn't optional — undirected design is how generic AI slop happens.

### 1. Purpose + Audience

What problem does this solve? Who uses it? A fintech dashboard for traders and a portfolio site for a photographer need fundamentally different approaches.

### 2. Aesthetic Direction

Pick one and commit. Half-measures produce forgettable work.

| Direction | Characteristics | When to Use |
|-----------|----------------|-------------|
| Brutally minimal | Extreme whitespace, mono type, stark contrast | Data density, dev tools, editorial |
| Maximalist | Layered textures, bold color, rich motion | Creative portfolios, event pages |
| Retro-futuristic | CRT glow, monospace, scanlines, neon accents | Tech products, gaming, nostalgia |
| Organic/natural | Soft edges, earth tones, flowing layouts | Wellness, food, sustainability |
| Luxury/refined | Serif type, gold/black, generous spacing | Fashion, finance, premium brands |
| Playful/toy-like | Rounded shapes, bright primaries, bouncy motion | Kids, social, gamification |
| Editorial/magazine | Column grids, pull quotes, dramatic type scale | Content-heavy, journalism, blogs |
| Brutalist/raw | System fonts, exposed grid, monochrome | Art, counter-culture, statements |
| Industrial/utilitarian | Dense grids, status indicators, mono type | Operations, monitoring, admin |

These are starting points. The real work is making the direction serve the specific context.

### 3. Differentiation

What's the one thing someone remembers? Every interface needs a signature — a type pairing, a transition, a layout decision that makes it unmistakable.

### 4. Constraints

Framework requirements, performance budget, accessibility level (WCAG AA minimum), browser support.

## Typography System

Typography carries 80% of a design's personality. Get this wrong and nothing else saves it.

**Rules:**
- Pair a distinctive display font with a refined body font
- Never use: Arial, Inter, Roboto, system-ui as primary choices
- Load from Google Fonts or CDN — include `font-display: swap`
- Set a type scale: use `clamp()` for fluid sizing

**Pairings that work** (use as inspiration, not defaults — variety matters):
- Playfair Display + Source Sans Pro (editorial)
- Space Grotesk + DM Sans (tech) — but don't default to this
- Cormorant Garamond + Work Sans (luxury)
- JetBrains Mono + IBM Plex Sans (dev tools)
- Libre Baskerville + Karla (classic)

**Never converge on the same font across generations.** Each design gets fresh typography.

For expanded font pairings and type scale calculations: See [references/typography.md](references/typography.md)

## Color + Theme

```css
/* Define a system, don't pick random colors */
:root {
  --color-primary: /* dominant brand color */;
  --color-accent: /* sharp contrast accent */;
  --color-surface: /* background */;
  --color-text: /* primary text */;
  --color-muted: /* secondary text */;
}
```

**Rules:**
- Dominant color + sharp accent outperforms timid, evenly-distributed palettes
- Use CSS custom properties for consistency
- Test contrast ratios: 4.5:1 minimum for text (WCAG AA)
- Vary between light and dark themes across generations

**Anti-pattern:** Purple gradients on white backgrounds. This is the #1 "AI-generated" tell.

## Spatial Composition

Layouts should feel designed, not assembled.

**Techniques:**
- Asymmetry over symmetry (grid-breaking elements create energy)
- Generous negative space OR controlled density — not the medium ground
- Overlap elements for depth (z-index, negative margins, absolute positioning)
- Diagonal flow through rotated elements or angled section dividers
- CSS Grid for complex layouts, not just Flexbox rows

## Motion + Animation

Motion communicates hierarchy and state. Use it with purpose.

**High-impact patterns:**
- Staggered page load reveals (`animation-delay` per element)
- Scroll-triggered entrances (IntersectionObserver or CSS `scroll-timeline`)
- Hover states that surprise — scale, color shift, shadow depth
- Page transitions that maintain spatial continuity

**Priority:** One well-orchestrated page load creates more delight than scattered micro-interactions.

**Implementation:**
- CSS-only for HTML artifacts (prefer `@keyframes` + `transition`)
- Framer Motion for React when available
- Always respect `prefers-reduced-motion`

For animation recipes and performance tips: See [references/animation.md](references/animation.md)

## Backgrounds + Atmosphere

Solid color backgrounds are a missed opportunity. Create depth:

- Gradient meshes (layered radial gradients)
- Noise textures (CSS `filter` or SVG `<feTurbulence>`)
- Geometric patterns (CSS `background-image` repeating patterns)
- Layered transparencies for glass effects
- Grain overlays for film/editorial feel
- Dramatic shadows for elevation hierarchy

## Accessibility (Non-Negotiable)

WCAG AA is the floor, not the ceiling.

- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: all interactive elements focusable with visible focus ring
- Semantic HTML: use proper heading hierarchy, landmarks, ARIA when needed
- `prefers-reduced-motion`: provide reduced/static alternative
- `prefers-color-scheme`: support both light and dark when practical
- Alt text for meaningful images; `aria-hidden` for decorative ones
- Touch targets: minimum 44x44px

## Anti-Patterns (What Makes Something Look "AI-Generated")

Avoid all of these:
- Inter/Roboto/Arial as primary font
- Purple-to-blue gradient on white
- Predictable card grids with uniform spacing
- Generic hero sections with stock imagery feel
- Cookie-cutter component patterns (shadcn defaults unstyled)
- Excessive border-radius with no contrast
- Centered everything with no visual tension
- Same color palette across different designs

**The fix:** Make choices that feel specific to the context. A weather app and a legal firm shouldn't share any design DNA.

## Implementation Standards

- Production-grade: functional, not just pretty
- Single-file artifacts: HTML/CSS/JS in one file (or single .jsx with Tailwind)
- External scripts from `https://cdnjs.cloudflare.com` only
- No placeholder content — generate realistic copy
- Test at mobile breakpoints (responsive from the start)

## Resources

- `references/typography.md` — Extended font pairings, type scales, fluid typography
- `references/animation.md` — Animation recipes, performance patterns, reduced-motion
- `references/heritage-design-system.md` — BSI Heritage v2.1 tokens, classes, conventions (load when working on blazesportsintel.com)

Claude is capable of extraordinary creative work. The constraint isn't ability — it's the courage to make a bold choice and execute it with precision.
