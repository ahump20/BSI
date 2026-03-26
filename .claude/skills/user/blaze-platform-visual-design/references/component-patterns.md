# Heritage Component Patterns

Patterns for each BSI surface type. Every component maps to a Heritage class or
token combination. No freestyle — if a pattern exists here, use it.

## Scoreboard / Live Scores

```
Surface:     --surface-scoreboard (#0A0A0A)
Border:      2px top solid --bsi-primary
Font:        --bsi-font-data (IBM Plex Mono) for scores
             --bsi-font-display (Oswald) for team names
Score size:  --font-size-stat (1.5rem) or .led-stat for hero scores
Separator:   6px burnt-orange diamond (rotate 45deg)
Live state:  .live-indicator (green pulse dot + LIVE stamp)
Final state: --bsi-dust color, no animation
Class:       .score-ticker (marquee crawl variant)
Trust cue:   Source + "Updated Xm ago" in --bsi-text-dim
```

### Score Card Layout
```
┌─── 2px --bsi-primary top border ──────────────┐
│  [LIVE dot] Team A Abbr    R  H  E   │ .led-stat
│             Team B Abbr    R  H  E   │
│  ─── --border-vintage ───            │
│  Bottom: Inning · Source · Updated   │ --bsi-text-dim
└───────────────────────────────────────┘
  Surface: --surface-dugout
  Border: --border-vintage
  Radius: 2px
```

## Dashboard Card

```
Surface:     --surface-dugout (#161616)
Border:      --border-vintage (rgba(140,98,57,0.3))
Radius:      2px
Header:      Oswald uppercase, --bsi-dust
Accent:      3px --bsi-primary top bar (.section-rule)
Body font:   --bsi-font-body (Cormorant Garamond)
Stat font:   --bsi-font-data or --bsi-font-mono
Hover:       border → --border-active, subtle glow
Class:       .heritage-card
Trust cue:   Source badge in header area
```

### Dashboard Card Layout
```
┌─── 3px --bsi-primary accent bar ──────────────┐
│  SECTION TITLE (Oswald, --bsi-dust)           │
│  ─── --border-vintage ───                     │
│                                                │
│  Body content (Cormorant Garamond)             │
│  Stat: 42 (IBM Plex Mono, --bsi-bone)         │
│                                                │
│  Source: ESPN · Updated 5m ago                 │
└────────────────────────────────────────────────┘
  Hover: border-color → --border-active
         box-shadow → 0 0 20px rgba(191,87,0,0.08)
```

## Standings Table

```
Container:   .stat-table
Header bg:   --surface-press-box (#111111)
Header line: 2px bottom solid --bsi-primary
Col headers: 9px uppercase, --bsi-dust, 0.15em tracking
Font:        --bsi-font-data (IBM Plex Mono), 11px
Text:        --bsi-bone
Row border:  rgba(140,98,57,0.12)
Row hover:   rgba(191,87,0,0.04)
Sticky:      .sticky-header for scrollable tables
Highlights:  .stat-highlight (columbia-blue) for best-in-column
Negatives:   .stat-negative (oiler-red) for below-average
```

### Table Layout
```
┌────────────────────────────────────────────────┐
│  RK  TEAM        W    L    PCT   RS   RA      │ --surface-press-box
│  ═══════════════════════════════════════════   │ 2px --bsi-primary
│   1  Texas       32   8   .800  312  156      │ --bsi-bone
│   2  LSU         30  10   .750  298  178      │
│   3  Arkansas    28  12   .700  276  190      │ hover: rgba(191,87,0,0.04)
│  ────────────────────────────────────────      │ rgba(140,98,57,0.12)
│   4  Tennessee   27  13   .675  265  195      │
└────────────────────────────────────────────────┘
```

## Editorial Hero

```
Background:  .heritage-hero (--surface-scoreboard + radial glows)
Heading:     Bebas Neue, clamp(2.5rem, 6vw, 5rem), --bsi-bone
Subheading:  Oswald uppercase, --bsi-dust, 0.15em tracking
Body:        Cormorant Garamond, 1.7 line-height, --bsi-bone
Decorations: .corner-marks (desktop only)
             .grain-overlay (desktop only, disabled < 768px)
CTA:         .btn-heritage (outline) or .btn-heritage-fill (solid)
Animations:  bsi-fade-in, bsi-slide-up with stagger
```

### Hero Layout
```
┌────────────────────────────────────────────────┐
│  ┌─ corner ─┐                                  │
│  │          │                                   │
│  │  KICKER (JetBrains Mono, --bsi-primary)     │
│  │  HERO HEADING (Bebas Neue, --bsi-bone)      │
│  │  Subheading (Oswald, --bsi-dust)            │
│  │                                              │
│  │  Body text paragraph                         │
│  │  (Cormorant Garamond, 1.7 line-height)      │
│  │                                              │
│  │  [BTN-HERITAGE]  [BTN-HERITAGE-FILL]        │
│  │                                 ┌─ corner ─┐│
│  │                                 │          ││
│  └─────────────────────────────────┘          ││
│                                    └──────────┘│
│  grain-overlay (desktop only)                   │
└────────────────────────────────────────────────┘
  Background: --surface-scoreboard
  Radial glows: warm left (burnt-orange 8%), cool top-right (columbia-blue 4%)
```

## Rankings Page

```
Table:       .stat-table with .sticky-header
Rank col:    --bsi-primary for top 10 ranks
Movement:    ▲ --heritage-columbia-blue (up), ▼ --heritage-oiler-red (down)
Stats:       .stat-highlight for league leaders
Filters:     .heritage-stamp buttons for conference/division toggles
Loading:     .skeleton rows matching table structure
Empty state: Centered message in --bsi-dust, Oswald
```

## Navigation

```
Desktop:     .heritage-nav — horizontal links
             Default: --bsi-dust
             Hover: --bsi-bone
             Active: --bsi-primary + 2px bottom border
Mobile:      Bottom nav bar with safe-area inset
             Icons: 20px, --bsi-dust default
             Active icon: --bsi-primary
             Label: 10px Oswald uppercase
             Background: --surface-dugout
             Top border: 1px --border-vintage
```

## Section Breaks

```
Between homepage sections: .section-break
  - Gradient lines fading from center
  - 6px burnt-orange diamond in center
  - Max-width: 72rem, centered

Within sections: .heritage-divider
  - Bronze gradient fade
  - opacity: 0.25
  - margin: 1.5rem 0
```

## Loading States

```
Skeleton:    .skeleton (dugout → press-box gradient shimmer)
Shimmer:     .bsi-shimmer (surface → surface-light sweep)
Duration:    1.5s (skeleton), 1.8s (shimmer)
Radius:      2px (matches Heritage card radius)
Reduced:     @media (prefers-reduced-motion: reduce) → no animation, solid surface
```

## Badges & Labels

```
Stamp:       .heritage-stamp
             Oswald, 0.7rem, 600 weight
             --bsi-primary text and border
             1px solid, 1px radius
             0.2em letter-spacing, uppercase

Stale:       .stale-warning
             IBM Plex Mono, 0.7rem
             --heritage-oiler-red text and dashed border
             0.08em tracking, uppercase

Live:        .live-indicator
             Green dot (8px) with pulse animation
             Oswald label, 0.6875rem, 0.08em tracking
```
