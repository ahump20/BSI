# CLAUDE.md - Blaze Sports Intel (BSI)

## Project Overview

**Blaze Sports Intel** is a real-time sports analytics platform delivering live scores, predictions, and data-driven insights for MLB, NFL, NBA, and NCAA (College Baseball and College Football). The project follows a "6-day sprint" development philosophy with rapid prototyping and iteration.

**Owner**: Austin Humphrey
**Location**: Boerne, Texas (America/Chicago timezone)
**Website**: blazesportsintel.com

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run dependency audit
node scripts/audit-deps.cjs

# Check a new package before installing
node scripts/check-new-dep.cjs <package-name> [version]
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript 5.5+ |
| Styling | Tailwind CSS with custom design system |
| UI | React 18.3.1 |
| Animation | Framer Motion |
| Data Fetching | TanStack React Query |
| Edge Functions | Cloudflare Pages Functions |
| AI/ML | TensorFlow.js (Vision Coach), Cloudflare Workers AI |
| Icons | Lucide React |
| Analytics | Amplitude, Web Vitals |
| Error Tracking | Sentry |

## Project Structure

```
BSI/
├── app/                    # Next.js App Router pages
│   ├── cfb/               # College Football pages & articles
│   ├── coach/             # Vision Coach AI feature
│   ├── college-baseball/  # College baseball portal & game pages
│   ├── mlb/               # MLB game pages
│   ├── scores/            # Live scores hub
│   ├── globals.css        # Global styles & design system tokens
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Homepage
│
├── components/            # React components
│   ├── cfb/              # College Football components
│   ├── layout-ds/        # Layout & navigation components
│   ├── sports/           # Sport-specific components (ScoreCard, etc.)
│   ├── ui/               # Core UI primitives (Button, Card, Badge, etc.)
│   └── widgets/          # Dashboard widgets
│
├── functions/            # Cloudflare Pages Functions (API layer)
│   └── api/
│       └── college-football/  # CFB content API proxies
│
├── scripts/              # Build & utility scripts
│   ├── audit-deps.cjs    # Dependency security audit
│   └── check-new-dep.cjs # Pre-install package checker
│
├── public/               # Static assets
│   └── images/brand/     # BSI logos and branding
│
└── .claude/              # Claude agent configurations
    └── agents/           # Specialized agent prompts
        ├── design/       # UI/UX, branding agents
        ├── engineering/  # Development agents
        ├── marketing/    # Growth & content agents
        ├── product/      # Research & prioritization agents
        ├── project-management/  # Sprint & shipping agents
        ├── studio-operations/   # Support, legal, finance agents
        ├── testing/      # QA & performance agents
        └── bonus/        # Studio coach, joker, etc.
```

## Code Conventions

### TypeScript

- Use TypeScript for all new code
- Prefer interfaces over types for object shapes
- Export types alongside components: `export type { ComponentProps }`
- Use strict null checks and defensive coding for API data

### React Components

```tsx
// Component file structure
'use client';  // Only if client-side features needed

import { useState } from 'react';
import { ComponentName } from '@/components/ui';

interface ComponentProps {
  /** JSDoc description */
  prop: string;
}

/**
 * Component description
 */
export function Component({ prop }: ComponentProps) {
  return <div>{prop}</div>;
}

export default Component;
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ScoreCard.tsx` |
| Hooks | camelCase with `use` prefix | `useGameData.ts` |
| Utilities | camelCase | `formatDate.ts` |
| CSS Classes | kebab-case | `glass-card`, `btn-primary` |
| Design Tokens | `--bsi-` or `--color-` prefix | `--bsi-burnt-orange-600` |

### Import Aliases

```tsx
import { Button } from '@/components/ui';      // UI primitives
import { ScoreCard } from '@/components/sports'; // Sport components
import { cn } from '@/lib/utils';              // Utility functions
```

## Design System

### Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-burnt-orange` | `#BF5700` | Primary brand color |
| `--color-midnight` | `#0D0D12` | Dark backgrounds |
| `--color-charcoal` | `#1A1A1A` | Secondary backgrounds |
| `--color-ember` | `#FF6B35` | Accents, highlights |
| `--bsi-gold-500` | `#FDB913` | Championship, premium |

### Sport-Specific Colors

```css
/* Baseball: Forest green */
.text-baseball { color: #228B22; }

/* Football: Saddle brown */
.text-football { color: #8B4513; }

/* Basketball: Orange */
.text-basketball { color: #FF6B35; }
```

### Component Classes

```css
/* Glass morphism cards */
.glass-card { /* Semi-transparent with blur */ }
.glass-card-hover { /* With hover effects */ }

/* Buttons */
.btn-primary { /* Burnt orange solid */ }
.btn-secondary { /* Outline with hover fill */ }
.btn-ghost { /* Transparent with hover */ }

/* Loading states */
.skeleton { /* Animated shimmer */ }
.bsi-skeleton-fire { /* Brand-colored shimmer */ }
```

### Typography

| Font Variable | Font Family | Usage |
|---------------|-------------|-------|
| `--font-display` | Bebas Neue, Oswald | Headlines, titles |
| `--font-sans` | Inter | Body text |
| `--font-mono` | JetBrains Mono | Scores, stats, code |
| `--font-serif` | Playfair Display, Cormorant | Editorial content |

## API Patterns

### Cloudflare Pages Functions

```typescript
// functions/api/[route].ts
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Proxy to Cloudflare Worker
    const response = await fetch('https://worker.ahump20.workers.dev/endpoint');
    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: corsHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Service unavailable' }),
      { status: 500, headers: corsHeaders }
    );
  }
};
```

### Client-Side Data Fetching

```tsx
// Use React Query patterns
const { data, isLoading, error } = useQuery({
  queryKey: ['games', sport, date],
  queryFn: () => fetch(`/api/${sport}/games?date=${date}`).then(r => r.json()),
});
```

## Key Features

### Sport Coverage

- **MLB**: Live scores, box scores, play-by-play, team stats
- **NFL**: Scores, standings
- **NBA**: Scores, standings
- **College Baseball**: Portal tracker, game pages, rankings
- **CFB (College Football)**: AI-powered previews and recaps

### Vision Coach

AI-powered pose and face analysis using TensorFlow.js. Located at `/coach` route. Uses dynamic imports to avoid SSR issues with browser APIs.

### AI Content

Cloudflare Workers AI generates game previews, recaps, and analysis for college football content.

## Development Workflow

### 6-Day Sprint Philosophy

1. **Days 1-2**: Project setup, core features
2. **Days 3-4**: Secondary features, UX polish
3. **Day 5**: User testing, iteration
4. **Day 6**: Launch preparation, deployment

### Dependency Management

Before adding any new package:

```bash
# Check security score first
node scripts/check-new-dep.cjs <package> <version>

# Thresholds:
# >= 85: Install immediately
# 70-84: Research further
# < 70: Find alternative
```

### Commit Guidelines

- Use conventional commit format
- Include security score in commit message for new dependencies
- Test locally before pushing

### Branch Strategy

- `main`: Production branch
- `develop`: Integration branch
- `claude/*`: AI-assisted feature branches

## Accessibility

- Skip links for keyboard navigation
- `prefers-reduced-motion` support for animations
- Proper ARIA labels on interactive elements
- Focus-visible styles using burnt orange outline
- Screen reader-friendly game status announcements

## Performance

- Next.js App Router with server components
- Dynamic imports for heavy client-side features
- Font optimization with `next/font`
- Image optimization with `next/image`
- Edge functions for low-latency API responses

## Claude Agent Guidelines

### Available Specialized Agents

| Agent | Use Case |
|-------|----------|
| `rapid-prototyper` | New features, MVPs, experiments |
| `frontend-developer` | UI implementation, React components |
| `backend-architect` | API design, database, auth |
| `ai-engineer` | ML features, LLM integration |
| `test-writer-fixer` | Testing and test maintenance |
| `studio-coach` | Multi-agent coordination |
| `whimsy-injector` | Adding delight and polish to UI |

### When to Use Agents

1. **Complex Multi-Step Tasks**: Use `studio-coach` to coordinate
2. **New Features**: Start with `rapid-prototyper`
3. **UI Polish**: Follow up with `whimsy-injector`
4. **After Code Changes**: Use `test-writer-fixer`

### Key Principles

- **Ship fast, iterate based on feedback**
- **Mobile-first design**
- **Quality over speed (quality IS speed)**
- **Progress over perfection**
- **Every game matters to someone**

## Environment Variables

```bash
# Analytics
AMPLITUDE_API_KEY=

# Error Tracking
SENTRY_DSN=

# API Keys (in Cloudflare Workers)
SOCKET_API_KEY=  # Dependency auditing
```

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check

# Dependency Management
node scripts/audit-deps.cjs        # Full audit
node scripts/audit-deps.cjs --ci   # CI mode
node scripts/audit-deps.cjs --json # JSON output

# Git
git log --oneline -10    # Recent commits
```

## Contact

- **Email**: ahump20@outlook.com
- **Repository**: github.com/ahump20/BSI

---

*Last updated: December 2025*
