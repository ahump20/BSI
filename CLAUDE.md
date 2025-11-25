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

### Brand Colors (NEVER hardcode - use these tokens)

```css
/* Primary Brand */
--color-burnt-orange: #bf5700;       /* Primary accent */
--color-burnt-orange-50: #fff5ed;    /* Lightest */
--color-burnt-orange-600: #9c4500;   /* Darker */

/* Backgrounds */
--color-charcoal-900: #111827;       /* Primary background */
--color-charcoal-950: #0a0a0f;       /* Darkest */

/* Semantic */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;
```

### Typography

```css
/* Font Families */
--font-sans: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto;
--font-display: Bebas Neue, Impact, Arial Black;
--font-mono: SF Mono, Consolas, Monaco, Courier New;

/* Use these Tailwind classes */
font-sans          /* Body text */
font-display       /* Headlines, stats */
font-mono          /* Code, data */
```

### Spacing (8px base unit)
Use Tailwind spacing utilities: `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px)

### Effects

```css
/* Glassmorphism - use .glass-card class */
.glass-card {
  background: var(--color-surface);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Glow effects */
--shadow-glow-sm: 0 0 20px rgba(191, 87, 0, 0.3);
--shadow-glow-md: 0 0 40px rgba(191, 87, 0, 0.4);
--shadow-glow-lg: 0 0 60px rgba(204, 102, 0, 0.5);
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
<div className="animate-fade-in-up">      // Fade in from below
<div className="animate-slide-in-right">  // Slide from right
<div className="animate-pulse-glow">      // Pulsing glow effect
<div className="animate-spin-slow">       // Slow rotation
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
