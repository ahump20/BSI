# Heritage Design System v2.1 — Full Token Reference

Complete token map sourced from `lib/tokens/bsi-brand.css` and `app/globals.css`.
This is the canonical reference. If tokens change in the source CSS, this file
must be updated to match.

## Anchor Palette

| Token | Value | Description |
|-------|-------|-------------|
| `--bsi-primary` | `#BF5700` | Burnt-orange. The brand anchor. |
| `--bsi-primary-rgb` | `191, 87, 0` | RGB components for rgba() usage |
| `--bsi-primary-light` | `#D4722A` | Lighter burnt-orange |
| `--bsi-accent` | `#FF6B35` | Ember. Secondary accent. |
| `--bsi-accent-rgb` | `255, 107, 53` | RGB components |
| `--bsi-gold` | `#FDB913` | Gold accent |

## Extended Brand Scale

| Token | Value |
|-------|-------|
| `--bsi-primary-50` | `#fff5ed` |
| `--bsi-primary-100` | `#ffead5` |
| `--bsi-primary-200` | `#ffd0aa` |
| `--bsi-primary-300` | `#ffad74` |
| `--bsi-primary-400` | `#ff7d3c` |
| `--bsi-primary-500` | `#BF5700` |
| `--bsi-primary-600` | `#9c4500` |
| `--bsi-primary-700` | `#7d3700` |
| `--bsi-primary-800` | `#5e2900` |
| `--bsi-primary-900` | `#3f1c00` |

## Surfaces

| Token | Value | Use |
|-------|-------|-----|
| `--surface-scoreboard` | `#0A0A0A` | Hero backgrounds, deepest layer |
| `--bsi-surface` / `--bsi-midnight` | `#0D0D0D` | Page background |
| `--surface-press-box` | `#111111` | Table headers, lifted sections |
| `--surface-dugout` | `#161616` | Cards, content containers |
| `--bsi-surface-raised` / `--bsi-charcoal` | `#1A1A1A` | Slightly raised elements |
| `--bsi-surface-overlay` | `#242424` | Overlays, modals |

## Text Colors

| Token | Value | Contrast on #0D0D0D |
|-------|-------|---------------------|
| `--bsi-text` / `--bsi-bone` | `#F5F0EB` / `#F5F2EB` | ~16:1 (AAA) |
| `--bsi-text-muted` / `--bsi-dust` | `#A89F95` / `#C4B8A5` | ~7:1 / ~10:1 (AA+) |
| `--bsi-text-dim` | `rgba(245,240,235,0.52)` | ~5.1:1 (AA) |

## Heritage Vintage Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--bsi-bone` | `#F5F2EB` | Primary text, score values |
| `--bsi-dust` | `#C4B8A5` | Secondary text, column headers |
| `--heritage-columbia-blue` | `#4B9CD3` | Data links, stat highlights |
| `--heritage-oiler-red` | `#C41E3A` | Negative stats, stale warnings |
| `--heritage-teal` | `#00B2A9` | Supplementary accent |
| `--heritage-bronze` | `#8C6239` | Corner marks, dividers |
| `--heritage-cream` | `#F0E6D3` | Decorative text, premium |

## Borders

| Token | Value | Use |
|-------|-------|-----|
| `--border-vintage` | `rgba(140,98,57,0.3)` | Default card/table borders |
| `--border-active` | `rgba(191,87,0,0.6)` | Hover/active state |
| `--border-focus` | `rgba(75,156,211,0.8)` | Focus ring color |
| `--bsi-border` | `rgba(245,240,235,0.04)` | Very subtle borders |
| `--bsi-border-hover` | `rgba(191,87,0,0.3)` | Hover border state |

## Brand Accents

| Token | Value | Use |
|-------|-------|-----|
| `--bsi-texas-soil` | `#8B4513` | Warm earthy accent |
| `--bsi-blaze` | `#ff4500` | Hot accent (sparingly) |
| `--bsi-texas-orange` | `#ff6600` | Secondary warm accent |

## Semantic Status

| Token | Value |
|-------|-------|
| `--bsi-error` | `#EF4444` |
| `--bsi-warning` | `#F59E0B` |
| `--bsi-success` | `#10B981` |
| `--bsi-info` | `#3B82F6` |

## Typography

| Token | Stack |
|-------|-------|
| `--bsi-font-display` | `'Oswald', system-ui, sans-serif` |
| `--bsi-font-display-hero` | `'Bebas Neue', Oswald fallback` |
| `--bsi-font-body` | `'Cormorant Garamond', Georgia, serif` |
| `--bsi-font-data` | `'IBM Plex Mono', JetBrains Mono, monospace` |
| `--bsi-font-mono` | `'JetBrains Mono', Fira Code, monospace` |

## Type Scale

| Token | Size | Use |
|-------|------|-----|
| `--font-size-micro` | `0.5625rem` (9px) | Metadata, timestamps |
| `--font-size-label` | `0.625rem` (10px) | Column headers, badges |
| `--font-size-caption` | `0.6875rem` (11px) | Secondary text, scores |
| `--font-size-body` | `0.875rem` (14px) | Body text |
| `--font-size-stat` | `1.5rem` (24px) | Stat values |
| `--font-size-stat-lg` | `2.25rem` (36px) | Hero stats |

## Spacing Scale (4px base)

| Token | Value |
|-------|-------|
| `--bsi-space-1` | `0.25rem` (4px) |
| `--bsi-space-2` | `0.5rem` (8px) |
| `--bsi-space-3` | `0.75rem` (12px) |
| `--bsi-space-4` | `1rem` (16px) |
| `--bsi-space-6` | `1.5rem` (24px) |
| `--bsi-space-8` | `2rem` (32px) |
| `--bsi-space-12` | `3rem` (48px) |
| `--bsi-space-16` | `4rem` (64px) |
| `--bsi-space-24` | `6rem` (96px) |

## Motion

| Token | Value | Use |
|-------|-------|-----|
| `--bsi-duration-instant` | `100ms` | Tooltips, cursor feedback |
| `--bsi-duration-fast` | `200ms` | Micro-interactions, hover |
| `--bsi-duration-normal` | `300ms` | Standard transitions |
| `--bsi-duration-slow` | `500ms` | Hero reveals, modals |
| `--bsi-duration-slower` | `800ms` | Full-section animations |
| `--bsi-ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose |
| `--bsi-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit animations |
| `--bsi-ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful emphasis |

## Glow System

| Token | Value |
|-------|-------|
| `--glow-primary` | `0 0 30px rgba(191,87,0,0.2)` |
| `--glow-primary-strong` | `0 0 60px rgba(191,87,0,0.3)` |
| `--glow-primary-subtle` | `0 0 20px rgba(191,87,0,0.1)` |
| `--glow-error` | `0 0 20px rgba(239,68,68,0.2)` |
| `--glow-success` | `0 0 20px rgba(16,185,129,0.2)` |
| `--bsi-glow-sm` | `0 0 20px rgba(191,87,0,0.3)` |
| `--bsi-glow-md` | `0 0 40px rgba(191,87,0,0.4), 0 0 60px rgba(191,87,0,0.2)` |
| `--bsi-glow-lg` | `0 0 60px rgba(204,102,0,0.5), 0 0 100px rgba(191,87,0,0.3)` |

## Savant Percentile Scale

| Token | Hex | Percentile |
|-------|-----|------------|
| `--savant-elite` | `#c0392b` | 99th+ |
| `--savant-great` | `#e74c3c` | 90-98th |
| `--savant-above` | `#d4775c` | 75-89th |
| `--savant-avg` | `#aaaaaa` | 25-74th |
| `--savant-below` | `#5b9bd5` | 10-24th |
| `--savant-poor` | `#2980b9` | 2-9th |
| `--savant-very-poor` | `#1a5276` | 1st |

## Chart System

| Token | Value |
|-------|-------|
| `--chart-grid` | `rgba(255,255,255,0.04)` |
| `--chart-axis-text` | `var(--bsi-text-dim)` |
| `--chart-label` | `var(--bsi-text-muted)` |

## Radar Bands

| Token | Value | Percentile |
|-------|-------|------------|
| `--radar-band-50` | `rgba(170,170,170,0.08)` | Average |
| `--radar-band-75` | `rgba(91,155,213,0.08)` | Above average |
| `--radar-band-90` | `rgba(231,76,60,0.08)` | Great |
| `--radar-band-99` | `rgba(192,57,43,0.08)` | Elite |

## Accessibility

| Token | Value |
|-------|-------|
| `--a11y-focus-ring` | `2px solid var(--bsi-primary)` |
| `--a11y-min-target` | `44px` |

## Sport Theming

| Sport | Accent | Glow | Border |
|-------|--------|------|--------|
| `college-baseball` | `#6B8E23` | `rgba(107,142,35,0.4)` | `rgba(107,142,35,0.3)` |
| `mlb` | `#BF5700` | `rgba(191,87,0,0.4)` | `rgba(191,87,0,0.3)` |
| `nfl` | `#355E3B` | `rgba(53,94,59,0.4)` | `rgba(53,94,59,0.3)` |
| `nba` | `#E25822` | `rgba(226,88,34,0.4)` | `rgba(226,88,34,0.3)` |
| `cfb` | `#8B4513` | `rgba(139,69,19,0.4)` | `rgba(139,69,19,0.3)` |

Applied via `data-sport` attribute on container element.

## Animations

| Name | Duration | Use |
|------|----------|-----|
| `scan-line` | continuous | Atmospheric overlay |
| `glow-pulse` | continuous | Ambient card glow |
| `shimmer` | 1.8s | Loading skeleton |
| `marquee` | 25-40s | Score ticker crawl |
| `live-pulse` | 2s | Live indicator dot |
| `data-flash` | 0.6s | Data update highlight |
| `bsi-fade-in` | custom | Hero entrance |
| `bsi-slide-up` | custom | Staggered content reveal |
| `hero-mesh` | 12s | Hero gradient drift |
| `broadcast-pulse` | continuous | Live broadcast indicator |
