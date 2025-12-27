# CLAUDE.md - Blaze Sports Intelligence (BSI) Development Guide

> This document provides comprehensive guidelines for AI assistants working with the BSI codebase. Follow these conventions to ensure consistent, high-quality output.

## Project Overview

**Blaze Sports Intelligence** is an enterprise-grade sports analytics platform for Texas Longhorns athletics. It provides real-time MLB, NFL, NBA, and NCAA data with advanced metrics, live scoring, and predictive intelligence.

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 3.4 + CSS Custom Properties
- **Build**: Vite 7.1 (legacy), Next.js (main)
- **State**: TanStack Query, Zod validation
- **Backend**: Cloudflare Workers, PostgreSQL, Prisma
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Charts**: Recharts

---

## Critical Rules

### NEVER Do These
1. **NEVER add soccer/futbol functionality** - Soccer is explicitly forbidden across all layers (SOCCER_FORBIDDEN error)
2. **NEVER hardcode colors** - Always use design tokens from `styles/tokens.css` or Tailwind config
3. **NEVER use inline styles** unless truly necessary - Use Tailwind classes or component CSS
4. **NEVER import new icon packages** - Use only `lucide-react` for icons
5. **NEVER use `process.env` unguarded in library code** - Check ESLint rules
6. **NEVER create placeholder assets** - Use provided assets from `/public` or Figma MCP

### ALWAYS Do These
1. **ALWAYS use components from `/components/ui`** for primitives (Button, Card, Badge)
2. **ALWAYS follow the burnt orange brand color** (`#BF5700`) as the primary accent
3. **ALWAYS use Central Time (America/Chicago)** for any date/time operations
4. **ALWAYS use CSS custom properties** from `styles/tokens.css` when available
5. **ALWAYS maintain dark mode by default** - The app uses `class="dark"` on html element

---

## Project Structure

```
/home/user/BSI/
├── apps/                    # Multiple applications
│   ├── web/                 # Main Next.js web app
│   ├── api-worker/          # Cloudflare Worker API
│   └── games/               # Game apps (Phaser, Godot)
├── components/              # Shared React components
│   ├── ui/                  # Primitive components (Button, Card, Badge)
│   ├── layout/              # Layout components (Header)
│   ├── sports/              # Sports-specific (SportTabs, ScoreCard)
│   ├── box-score/           # Box score components
│   ├── live-game/           # Live game components
│   ├── college-baseball/    # College baseball specific
│   ├── recruiting/          # Recruiting components
│   └── watchlist/           # Watchlist components
├── app/                     # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles + Tailwind
├── lib/                     # Shared libraries (40+ subdirectories)
├── hooks/                   # Custom React hooks
├── styles/                  # Design tokens
│   ├── tokens.json          # Source of truth
│   └── tokens.css           # CSS custom properties
├── public/                  # Static assets
│   └── images/              # Logos, photos
├── workers/                 # Cloudflare Workers
└── tests/                   # Test suites
```

### File Placement Rules
| Type | Location | Example |
|------|----------|---------|
| UI primitives | `/components/ui/` | `Button.tsx`, `Card.tsx` |
| Feature components | `/components/{feature}/` | `sports/ScoreCard.tsx` |
| Shared hooks | `/hooks/` | `useLiveScores.ts` |
| Utilities | `/lib/` | `lib/api/`, `lib/utils/` |
| Pages | `/app/` | `app/analytics/page.tsx` |
| Styles | `/styles/` or component-adjacent | `tokens.css`, `Component.css` |
| Assets | `/public/images/` | `bsi-logo.png` |

---

## Design System

> **Source of Truth**: These styles are derived from the live production site at [blazesportsintel.com](https://blazesportsintel.com)

### Brand Colors (NEVER hardcode - use these tokens)

```css
/* Primary Brand Colors */
--color-burnt-orange: #BF5700;       /* Primary accent - THE brand color */
--color-ember: #FF6B35;              /* Secondary accent, gradients */
--color-flame: #E85D04;              /* Tertiary accent */

/* Accent Colors */
--color-texas-soil: #8B4513;         /* Earthy accent */
--color-gold: #C9A227;               /* Highlight, values, badges */

/* Neutral Colors */
--color-midnight: #0D0D0D;           /* Darkest background */
--color-charcoal: #1A1A1A;           /* Primary background */
--color-cream: #FAF8F5;              /* Primary text on dark */
--color-warm-white: #FAFAFA;         /* Alternative light text */

/* Semantic Colors */
--color-success: #10b981;            /* Live indicators, positive status */
--color-warning: #f59e0b;            /* Loading states, caution */
--color-error: #ef4444;              /* Error states */
--color-info: #3b82f6;               /* Informational */
```

### Color Usage Examples

```css
/* Primary button gradient */
background: linear-gradient(135deg, var(--color-burnt-orange), var(--color-ember));

/* Card backgrounds */
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(191, 87, 0, 0.1);

/* Hover states */
background: rgba(191, 87, 0, 0.05);

/* Hero gradient overlay */
background: linear-gradient(135deg, #0a0a0a 0%, var(--color-charcoal) 50%, #1a1510 100%);
```

### Typography

> **Production Fonts**: The live site uses a sophisticated serif-forward type system

```css
/* Font Families - PRODUCTION VALUES */
--font-display: 'Playfair Display', Georgia, serif;     /* Headlines, hero text */
--font-body: 'Source Serif 4', Georgia, serif;          /* Body copy, paragraphs */
--font-ui: 'IBM Plex Sans', -apple-system, sans-serif;  /* Interface labels, nav */
--font-mono: 'IBM Plex Mono', 'JetBrains Mono', monospace; /* Data, scores, code */

/* Tailwind class mapping */
font-display       /* Headlines, hero sections - Playfair Display */
font-serif         /* Body text - Source Serif 4 */
font-sans          /* UI elements, navigation - IBM Plex Sans */
font-mono          /* Scores, data tables, code - IBM Plex Mono */
```

### Typography Scale (Fluid with clamp())

```css
/* Headlines - responsive scaling */
--text-hero: clamp(2.25rem, 7vw, 4.5rem);      /* Hero headlines */
--text-h1: clamp(1.75rem, 5vw, 2.5rem);        /* Page titles */
--text-h2: clamp(1.5rem, 4vw, 2rem);           /* Section headers */
--text-h3: clamp(1.25rem, 3vw, 1.5rem);        /* Card titles */

/* Body text */
--text-body: 0.875rem - 1.0625rem;             /* Standard body */
--text-small: 0.75rem - 0.875rem;              /* Captions, meta */

/* UI labels */
--text-label: 0.6875rem - 0.8125rem;           /* Uppercase labels */
letter-spacing: 0.1em - 0.15em;                /* Label spacing */
```

### Font Weights

```css
--font-weight-regular: 400;    /* Body text */
--font-weight-medium: 500;     /* Navigation, UI */
--font-weight-semibold: 600;   /* Emphasis, subheadings */
--font-weight-bold: 700;       /* Headings */
--font-weight-extrabold: 800;  /* Hero headlines */
```

### Spacing System

Base unit: `0.25rem` (4px)

```css
/* Spacing scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

### Effects & Glassmorphism

```css
/* Navigation frosted glass - PRODUCTION */
.nav-glass {
  background: rgba(13, 13, 13, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Card glass effect */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(191, 87, 0, 0.1);
  border-radius: 16px;
}

/* Glow effects */
--shadow-glow-sm: 0 0 20px rgba(191, 87, 0, 0.3);
--shadow-glow-md: 0 0 40px rgba(191, 87, 0, 0.4);
--shadow-glow-lg: 0 0 60px rgba(204, 102, 0, 0.5);

/* Button shadows */
--shadow-button: 0 4px 15px rgba(191, 87, 0, 0.3);
--shadow-button-hover: 0 6px 20px rgba(191, 87, 0, 0.4);
```

### Border Radius

```css
--radius-sm: 8px;      /* Small elements */
--radius-md: 12px;     /* Cards, inputs */
--radius-lg: 16px;     /* Large cards - PRODUCTION default */
--radius-xl: 24px;     /* Hero elements */
--radius-full: 9999px; /* Pills, avatars */
```

### Z-Index Scale
```
dropdown: 1000
sticky: 1010
fixed: 1020
modal-backdrop: 1030
modal: 1040
popover: 1050
tooltip: 1060
notification: 1080
```

---

## Component Patterns

### UI Primitives (use these, don't recreate)

```tsx
// Button - /components/ui/Button.tsx
import { Button } from '@/components/ui/Button';
<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary" size="sm" isLoading>Loading</Button>
<Button variant="ghost" size="lg">Ghost</Button>

// PRODUCTION BUTTON STYLES:
// Primary: Linear gradient (burnt-orange → ember) with shadow elevation
// Secondary: Transparent with cream border
// Hover: translateY(-2px) + enhanced shadow

// Card - /components/ui/Card.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
<Card variant="default" padding="md">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>{children}</CardContent>
</Card>

// Badge - /components/ui/Badge.tsx
import { Badge, LiveBadge } from '@/components/ui/Badge';
<Badge variant="success">Active</Badge>
<LiveBadge /> // Animated live indicator
```

### Component Structure Template

```tsx
'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils'; // If available

export interface ComponentNameProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'alternate';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-charcoal-900 border-charcoal-700',
  alternate: 'bg-charcoal-800 border-burnt-orange-500',
} as const;

const sizeStyles = {
  sm: 'p-2 text-sm',
  md: 'p-4 text-base',
  lg: 'p-6 text-lg',
} as const;

export const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ComponentName.displayName = 'ComponentName';
```

### Data Fetching Pattern

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';

interface DataType {
  id: string;
  name: string;
}

async function fetchData(): Promise<DataType[]> {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export function DataComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState />;

  return <DataDisplay data={data} />;
}
```

---

## Icon Usage

### Only Use Lucide React

```tsx
// ✅ CORRECT - Import from lucide-react
import { Search, Settings, ChevronDown, Trophy, Activity } from 'lucide-react';

// Icon with Tailwind sizing
<Search className="w-4 h-4" />           // 16px - small, inline
<Settings className="w-5 h-5" />          // 20px - default
<Trophy className="w-6 h-6" />            // 24px - medium
<Activity className="w-8 h-8" />          // 32px - large

// With color
<Search className="w-5 h-5 text-burnt-orange-500" />
<Settings className="w-5 h-5 text-charcoal-400" />

// ❌ WRONG - Never import other icon packages
// import { FaSearch } from 'react-icons/fa';  // NO!
// import Icon from '@material-ui/icons';       // NO!
```

---

## Styling Rules

### Tailwind CSS (Primary)

```tsx
// ✅ CORRECT - Use Tailwind utilities
<div className="bg-charcoal-900 text-white p-4 rounded-lg shadow-glow-sm">
  <h2 className="text-xl font-display text-burnt-orange-500">Title</h2>
  <p className="text-sm text-charcoal-300">Description</p>
</div>

// ❌ WRONG - Inline styles
<div style={{ backgroundColor: '#111827', padding: '16px' }}>
```

### CSS Custom Properties

```tsx
// ✅ CORRECT - Reference tokens
<div style={{ boxShadow: 'var(--shadow-glow-md)' }}>

// ✅ CORRECT - Use defined classes
<div className="glass-card">
```

### Responsive Design (Mobile-First)

```tsx
// Tailwind breakpoints
<div className="
  p-4                    // Mobile (default)
  md:p-6                 // Tablet (768px+)
  lg:p-8                 // Desktop (1024px+)
  xl:grid xl:grid-cols-3 // Large desktop (1280px+)
">
```

### Animation Classes

```tsx
// Available animations in tailwind.config.ts
<div className="animate-fade-in">         // Fade in
<div className="animate-fade-in-up">      // Fade in from below (30px translate)
<div className="animate-slide-in-right">  // Slide from right
<div className="animate-pulse-glow">      // Pulsing glow effect
<div className="animate-spin-slow">       // Slow rotation
```

### Animation Timing (Production Values)

```css
/* Transition durations */
--transition-fast: 200ms;      /* Hover states, micro-interactions */
--transition-normal: 300ms;    /* Standard transitions */
--transition-slow: 500ms;      /* Complex animations, image zoom */

/* Easing curves */
--ease-smooth: cubic-bezier(0.0, 0.0, 0.2, 1);     /* Standard smooth */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);    /* Dramatic exits */
--ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy feel */
```

### Staggered Animations (Production Pattern)

```tsx
// Hero section stagger effect - 200ms intervals
<div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>First</div>
<div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>Second</div>
<div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>Third</div>
<div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>Fourth</div>
```

### Live Indicator Animation

```css
/* LIVE badge pulse - used across the platform */
@keyframes pulse-live {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.live-indicator {
  animation: pulse-live 2s ease-in-out infinite;
}
```

### Shimmer Loading Animation

```css
/* Loading skeleton shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.03) 25%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## Page Layout Patterns

### Hero Section (Production Pattern)

```tsx
// Grid layout: 1.2fr 1fr on desktop, single column on mobile
<section className="min-h-screen relative">
  {/* Radial gradient background overlay */}
  <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent" />

  <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
    <div className="space-y-6">
      <h1 className="font-display text-hero">Hero Headline</h1>
      <p className="font-serif text-cream/80">Subheading text</p>
      <Button variant="primary">Call to Action</Button>
    </div>
    <div className="relative aspect-square">
      {/* Hero image or visual */}
    </div>
  </div>
</section>
```

### Gallery Grid (Production Pattern)

```tsx
// Responsive grid: 2 cols → 3 cols → 4 cols
// Featured items span 2x2
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <div className="col-span-2 row-span-2 aspect-square group">
    <img className="transition-transform duration-500 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
  {/* Regular 1x1 items */}
  <div className="aspect-square group">...</div>
</div>
```

### Score Cards (Production Pattern)

```tsx
// Status-indicator left border, monospace scores
<div className="relative pl-3 border-l-4 border-success bg-charcoal/50 rounded-lg p-4">
  <span className="absolute -left-1 top-4 w-2 h-2 bg-success rounded-full animate-pulse" />
  <div className="flex justify-between items-center">
    <span className="font-sans text-sm uppercase tracking-wide text-cream/60">MLB</span>
    <span className="font-mono text-xs text-success">LIVE</span>
  </div>
  <div className="mt-2 font-mono text-lg">
    <span>Cardinals</span>
    <span className="ml-auto">5</span>
  </div>
</div>
```

### Values Banner (Production Pattern)

```tsx
// Centered flex with icon circles and gold labels
<div className="flex flex-wrap justify-center items-center gap-8">
  {values.map((value, i) => (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-burnt-orange to-ember flex items-center justify-center">
          <Icon className="w-6 h-6 text-cream" />
        </div>
        <span className="font-sans text-xs uppercase tracking-widest text-gold">{value.label}</span>
      </div>
      {i < values.length - 1 && <span className="text-burnt-orange text-2xl">•</span>}
    </>
  ))}
</div>
```

---

## Code Standards

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ScoreCard.tsx`, `WinProbabilityChart.tsx` |
| Functions | camelCase | `fetchStandings()`, `formatPercent()` |
| Variables | camelCase | `gameStatus`, `teamScore` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE`, `MAX_RETRIES` |
| Directories | kebab-case | `live-game/`, `box-score/` |
| CSS classes | kebab-case | `.game-card`, `.btn-primary` |
| CSS variables | kebab-case with prefix | `--color-burnt-orange` |

### TypeScript Guidelines

```typescript
// ✅ CORRECT - Strict interfaces with explicit types
interface TeamStanding {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  pct: string;
}

// ✅ CORRECT - Use satisfies for type safety
const variantStyles = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
} as const satisfies Record<ButtonVariant, string>;

// ✅ CORRECT - Discriminated unions for variants
type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa';
```

### Import Order

```typescript
// 1. React/External libraries
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types (separate import)
import type { Sport } from '@/types';

// 3. Local components
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// 4. Local utilities
import { formatDate } from '@/lib/utils';

// 5. Styles (if needed)
import './Component.css';
```

### Prettier Config (enforced)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## MCP Servers

### Figma MCP Server Rules

- The Figma MCP server provides an assets endpoint which can serve image and SVG assets
- **IMPORTANT**: If the Figma MCP server returns a localhost source for an image or an SVG, use that image or SVG source directly
- **IMPORTANT**: DO NOT import/add new icon packages, all the assets should be in the Figma payload
- **IMPORTANT**: Do NOT use or create placeholders if a localhost source is provided

### Required Figma Flow (do not skip)

1. Run `get_design_context` first to fetch the structured representation for the exact node(s)
2. If the response is too large or truncated, run `get_metadata` to get the high-level node map and then re-fetch only the required node(s) with `get_design_context`
3. Run `get_screenshot` for a visual reference of the node variant being implemented
4. Only after you have both `get_design_context` and `get_screenshot`, download any assets needed and start implementation
5. Translate the output into this project's conventions (React + TypeScript + Tailwind)
6. Reuse the project's color tokens, components, and typography wherever possible
7. Validate against Figma for 1:1 look and behavior before marking complete

---

## Accessibility (WCAG)

```tsx
// ✅ Required accessibility patterns
<button
  aria-label="Search"
  aria-disabled={isLoading}
  aria-busy={isLoading}
>
  <Search className="w-5 h-5" />
</button>

// Skip links for keyboard navigation
<a href="#main" className="skip-link">Skip to content</a>

// Semantic HTML
<nav aria-label="Main navigation">
<main id="main" role="main">
<footer role="contentinfo">

// Color contrast - use provided palette (pre-validated)
```

---

## Testing

### Commands

```bash
npm run test              # Unit tests (Vitest)
npm run test:ui           # Interactive test UI
npm run test:a11y         # Accessibility tests (Playwright)
npm run test:api          # API integration tests
npm run lint              # ESLint
npm run typecheck         # TypeScript checking
```

---

## Common Patterns

### Error Handling

```tsx
// API error handling
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) {
      console.error(`API Error: ${res.status}`);
      return fallbackData; // Graceful degradation
    }
    return res.json();
  } catch (error) {
    console.error('Network error:', error);
    return fallbackData;
  }
}
```

### Loading States

```tsx
import { Skeleton } from '@/components/ui/Skeleton';

// Use skeleton components for loading
if (isLoading) {
  return (
    <Card>
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </Card>
  );
}
```

### Toast Notifications

```tsx
import { toast } from '@/components/ToastNotification';

// Success
toast.success('Data saved successfully');

// Error
toast.error('Failed to save data');

// Info
toast.info('Processing your request...');
```

---

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Design system (colors, fonts, animations) |
| `styles/tokens.css` | CSS custom properties |
| `app/globals.css` | Global styles + Tailwind layers |
| `components/ui/` | UI primitive components |
| `lib/` | Shared utilities and business logic |

### Supported Sports

- ✅ MLB (Major League Baseball)
- ✅ NFL (National Football League)
- ✅ NBA (National Basketball Association)
- ✅ NCAA (College Baseball, Football, Basketball, Track & Field)
- ❌ **Soccer/Futbol (FORBIDDEN)**

### Brand Assets

| Asset | Path |
|-------|------|
| Main logo | `/public/bsi-logo.png` |
| Nav logo | `/public/bsi-logo-nav.png` |
| Blaze logo | `/public/images/logo/blaze-logo.png` |

### Site Navigation Structure (Production)

Based on [blazesportsintel.com](https://blazesportsintel.com):

```
Home (/)
├── Our Story (#origin)
├── Coverage (#coverage)
├── About (#about)
├── Analytics (/analytics)
├── Football Analytics (/football-analytics)
└── Draft Guide (/draft-guide)
```

### Page Sections (Production)

| Section | Purpose | Pattern |
|---------|---------|---------|
| Hero | Full-screen intro | min-h-screen, radial gradient, 1.2fr/1fr grid |
| Values Banner | Horizontal stats | Centered flex, icon circles, gold labels |
| Origin | Story section | Sticky sidebar, two-column layout |
| Birth Certificate | Certification | Centered card with decorative elements |
| Philosophy | Quote showcase | Large decorative quotation marks (6rem, 20% opacity) |
| Gallery | Image grid | 2→4 columns, 2x2 featured spans, hover reveals |
| Coverage | Service cards | Four-column grid, icon-led cards |
| Analytics Vacuum | Comparison | Side-by-side cards, contrast styling |
| About | Team info | Two-column layout |
| Footer | Links & info | Multi-column structure |

### Branding Elements

- **Tagline**: "Born to Blaze the Path Less Beaten"
- **Founded**: August 17, 1995, Memphis, TN
- **Mission**: College baseball coverage ESPN ignores
- **Logo treatment**: 48-52px height with drop-shadow filter

---

## Do Not

- Add soccer functionality (will trigger SOCCER_FORBIDDEN error)
- Hardcode color values (use tokens)
- Create new icon packages (use lucide-react)
- Use inline styles when Tailwind classes exist
- Skip accessibility attributes
- Push directly to main/master branch
- Use `any` type without justification
- Create placeholder images when real assets are available
