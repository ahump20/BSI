# Blaze Sports Intel Design System

## Overview

The BSI design system ("Diamond Insights" theme) is a dark-mode native, mobile-first design system built on CSS custom properties and BEM-like component classes.

## Core Principles

1. **Mobile-First**: System fonts on mobile for performance, custom fonts on desktop
2. **Dark-Mode Native**: Optimized for late-night scoreboard checks
3. **Fluid Typography**: Uses `clamp()` for responsive text scaling
4. **Performance**: Minimal custom fonts, optimized asset loading
5. **Accessibility**: High contrast, focus states, semantic HTML

## Design Tokens

All design tokens are documented in `/apps/web/styles/tokens.json` and implemented as CSS custom properties in `/apps/web/app/globals.css`.

### Color System

**Background**

- `--di-bg`: #0b1120 (Deep navy primary background)
- `--di-surface`: #111827 (Card backgrounds)
- `--di-surface-muted`: #1f2937 (Secondary surfaces)

**Text**

- `--di-text`: #e2e8f0 (Primary text)
- `--di-text-muted`: #94a3b8 (Secondary text)

**Accent**

- `--di-accent`: #fbbf24 (Amber/gold primary)
- `--di-accent-strong`: #dc2626 (Red for emphasis)

**Semantic**

- Success: #22c55e (Green)
- Error: #f87171 (Red)
- Warning: #f59e0b (Orange)

### Typography Scale

**Font Families**

- Heading (desktop): 'Source Serif Pro', serif
- Heading (mobile): System sans-serif stack
- Body: 'Inter', system sans-serif stack

**Fluid Scale**

- Hero: `clamp(2.2rem, 7vw, 3.4rem)`
- Page Title: `clamp(1.5rem, 5vw, 2.3rem)`
- Card Heading: 1.35rem
- Body: 1rem
- Small: 0.95rem
- Micro: 0.75rem (uppercase labels)

### Spacing

Uses a consistent 0.25rem base scale (micro, xs, sm, md, lg, xl, 2xl, 3xl).

### Border Radius

- Cards: 18px (`--di-radius`)
- Buttons/Pills: 999px (full)
- Secondary elements: 12-16px

## Component Classes

All component classes use the `di-*` (Diamond Insights) prefix:

### Layout

- `.di-shell` - Page wrapper with gradient background
- `.di-container` - Max-width content container
- `.di-section` - Content section with gap

### Typography

- `.di-title` - Hero title (fluid)
- `.di-page-title` - Page section title
- `.di-subtitle` - Hero subtitle
- `.di-page-subtitle` - Section subtitle
- `.di-kicker` - Uppercase label
- `.di-microcopy` - Small uppercase text

### Components

- `.di-card` - Card container
- `.di-card-grid` - Responsive card grid
- `.di-nav-card` - Navigation card
- `.di-pill` - Badge/pill
- `.di-action` - Primary CTA button
- `.di-action--secondary` - Secondary button
- `.di-inline-link` - Inline link with arrow

### CFP Components

Special components for College Football Playoff pages with `cfp-*` prefix:

- `.cfp-board` - Top 25 board container
- `.cfp-table` - Rankings table
- `.cfp-metric` - KPI card
- `.cfp-simulator` - Scenario simulator
- `.cfp-insights` - Insights panel

## Accessibility

### Focus States

All interactive elements have visible focus states with 2px solid accent outline and 4px offset.

### Color Contrast

All text meets WCAG 2.2 AA standards (4.5:1 for body, 3:1 for large text).

### Keyboard Navigation

- Logical tab order
- No keyboard traps
- Skip links where appropriate

### ARIA

- Landmarks (`main`, `nav`, `section`)
- Labels (`aria-labelledby`, `aria-describedby`)
- Live regions for dynamic content

## Performance

### Font Loading

- Preload critical fonts
- Fallback to system fonts on mobile (<768px)
- `font-display: swap` for custom fonts

### Image Optimization

- `fetchpriority="high"` for hero images
- Lazy loading for below-fold content
- AVIF/WebP with fallbacks

### CSS

- Critical CSS inlined
- Component styles scoped with CSS Modules
- Global styles minimized

## Responsive Breakpoints

- **sm**: 640px - Horizontal CTAs, 2-column layouts
- **md**: 768px - 2-column nav, enhanced typography
- **lg**: 1024px - 3-column nav, complex grids
- **xl**: 1280px - Maximum content width

## Usage

### In React Components

```tsx
export default function Page() {
  return (
    <div className="di-shell">
      <main className="di-container">
        <section className="di-hero">
          <span className="di-pill">New Feature</span>
          <h1 className="di-title">Page Title</h1>
          <p className="di-subtitle">Subtitle description</p>
          <div className="di-actions">
            <Link className="di-action" href="/cta">
              Primary CTA
            </Link>
            <Link className="di-action di-action--secondary" href="/secondary">
              Secondary CTA
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
```

### Custom Components

For custom components, use CSS Modules with the existing design tokens:

```css
/* component.module.css */
.customCard {
  background: var(--di-surface);
  border: 1px solid var(--di-border);
  border-radius: var(--di-radius);
  padding: 1.5rem;
  color: var(--di-text);
}
```

## Future Enhancements

1. **Component Library** - Extract common components into `@bsi/ui` package
2. **Storybook** - Interactive component documentation
3. **Theme Variants** - Sport-specific color schemes (baseball, football, basketball)
4. **Animation System** - Standardized motion design
5. **Icon System** - SVG icon library with consistent sizing
