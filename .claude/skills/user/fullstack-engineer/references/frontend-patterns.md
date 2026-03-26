# Frontend Patterns

## Design Direction Decision

Before writing a single CSS rule, commit to a direction:

| Direction | When to Use | Signature Moves |
|-----------|-------------|-----------------|
| Brutally minimal | Data-dense tools, editorial | Extreme whitespace, mono type, stark contrast |
| Industrial/utilitarian | Dashboards, monitoring, ops | Dense grids, status indicators, monospace data |
| Editorial/magazine | Content-heavy, journalism | Column grids, pull quotes, dramatic type scale |
| Luxury/refined | Premium products, finance | Serif display, generous spacing, gold/black |
| Retro-futuristic | Tech products, gaming | CRT glow, scanlines, neon accents |

For BSI: Industrial/utilitarian base with editorial typography. Data density beats atmosphere. Trust layer (source, freshness, stale state) on every data surface.

## Typography Recipes

**The 80% rule**: Typography carries 80% of a design's personality. Get type wrong and nothing saves it.

**Pairing structure**: One distinctive display/heading font + one refined body font.

| Pairing | Feel | Use For |
|---------|------|---------|
| Oswald + Cormorant Garamond | Bold authority + classic readability | BSI canonical |
| Space Grotesk + DM Sans | Clean tech | Dashboards, tools |
| Playfair Display + Source Sans Pro | Editorial elegance | Content pages |
| JetBrains Mono + IBM Plex Sans | Developer precision | Data-heavy interfaces |
| Bebas Neue + Work Sans | Impact + neutral body | Display headlines, hero sections |

**Fluid type scale**:
```css
:root {
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-xl: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
  --text-2xl: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
  --text-display: clamp(3rem, 2rem + 5vw, 6rem);
}
```

## Color System

```css
:root {
  --color-primary: ;    /* dominant brand color */
  --color-accent: ;     /* sharp contrast — use sparingly */
  --color-surface: ;    /* background */
  --color-surface-alt: ;/* secondary background */
  --color-text: ;       /* primary text */
  --color-muted: ;      /* secondary text */
  --color-border: ;     /* dividers, separators */
  --color-success: ;
  --color-warning: ;
  --color-error: ;
}
```

**BSI palette** (invariant):
- Burnt orange `#BF5700` (primary)
- Texas soil `#8B4513` (secondary)
- Charcoal `#1A1A1A` (surface)
- Midnight `#0D0D0D` (deep surface)
- Bone `#F5F2EB` (text/light)
- Dust `#C4B8A5` (muted)
- Ember `#FF6B35` (accent only)

## Layout Patterns

**Asymmetry over symmetry.** Predictable card grids signal "AI-generated." Break the grid intentionally.

**CSS Grid for real layouts:**
```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}
.hero { grid-column: 1 / -1; }
.main { grid-column: 1 / 9; }
.sidebar { grid-column: 9 / -1; }
```

**Depth through overlap:**
- Negative margins to overlap elements
- `z-index` layering for visual hierarchy
- Box shadows that feel like real elevation, not flat borders

## Animation Recipes

**Staggered page load** (highest impact, lowest effort):
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeUp 0.6s ease-out both;
}
.animate-in:nth-child(1) { animation-delay: 0.1s; }
.animate-in:nth-child(2) { animation-delay: 0.2s; }
.animate-in:nth-child(3) { animation-delay: 0.3s; }
```

**Hover states that surprise:**
```css
.card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Always respect reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Background Atmosphere

Solid backgrounds are missed opportunities:

- **Gradient mesh**: Layered `radial-gradient` for depth
- **Film grain**: SVG `<feTurbulence>` overlay at low opacity
- **Geometric patterns**: CSS `background-image` with `repeating-linear-gradient`
- **Radial glow**: Positioned `radial-gradient` behind hero content

## Accessibility Checklist

Non-negotiable:
- [ ] Color contrast 4.5:1 for text, 3:1 for large text
- [ ] All interactive elements keyboard-focusable with visible focus ring
- [ ] Semantic HTML: proper heading hierarchy, landmarks, labels
- [ ] `prefers-reduced-motion` alternative
- [ ] Alt text for meaningful images, `aria-hidden` for decorative
- [ ] Touch targets minimum 44x44px
- [ ] Forms: associated labels, error messages linked to inputs

## Anti-Patterns (AI-Generated Tells)

Avoid all of these:
- Inter/Roboto/Arial as primary font
- Purple-to-blue gradient on white background
- Predictable card grids with uniform spacing
- Generic hero with stock-photo energy
- Excessive border-radius with no contrast
- Centered everything with no visual tension
- Same palette across different designs
