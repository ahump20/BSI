# Heritage Design System v2.1 — BSI

Site-wide design system for blazesportsintel.com. Every page and component uses these tokens. Load this reference when building or modifying any BSI page.

## Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-dugout` | #161616 | Cards, content panels |
| `--surface-scoreboard` | #0A0A0A | Hero backgrounds, page backgrounds |
| `--surface-press-box` | #111111 | Table headers, nav elements |

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bsi-primary` | #BF5700 | Burnt-orange — stamps, borders, buttons, brand accent |
| `--bsi-bone` | #F5F2EB | Primary text |
| `--bsi-dust` | #C4B8A5 | Secondary/muted text |
| `--heritage-columbia-blue` | #4B9CD3 | Data links, interactive elements |
| `--border-vintage` | rgba(140,98,57,0.3) | Subtle borders, dividers |

## Typography

- **Bebas Neue** — Hero headings at `clamp(2.5rem, 6vw, 5rem)`
- **Oswald** — Section headings (uppercase, tracking)
- **Cormorant Garamond** — Body text
- **JetBrains Mono** — Code, data values

## Classes

| Class | Purpose |
|-------|---------|
| `.heritage-stamp` | Oswald, burnt-orange label badges |
| `.heritage-card` | Solid-surface card (dugout bg, vintage border) |
| `.btn-heritage` | Outlined button (burnt-orange border) |
| `.btn-heritage-fill` | Filled button (burnt-orange bg) |
| `.corner-marks` | 20px inset decorative corner accents |
| `.grain-overlay` | Scoped film-grain texture overlay |

## Score Ticker

CSS marquee animation with burnt-orange diamond separators and 2px top border.

## Anti-Patterns (BSI-Specific)

- Never use glass-card, bg-zinc, bg-gray, bg-slate tokens — Heritage replaces all of these
- Never use Inter, Roboto, or system fonts — Heritage has its own type stack
- Never use purple/blue gradients — BSI's accent is burnt-orange
- Cards use solid surfaces, not transparency/blur effects
