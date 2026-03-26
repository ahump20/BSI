# BSI Repository Context

Architecture and stack constraints that inform all visual design decisions.

## Stack

| Layer | Technology | Constraint |
|-------|-----------|------------|
| Framework | Next.js 16 | **Static export only.** No SSR. Every dynamic route needs `generateStaticParams()`. |
| UI | React 19 | Components using hooks/browser APIs need `'use client'` directive. |
| Styling | Tailwind CSS 3 | Heritage tokens defined in CSS custom properties, consumed via Tailwind config extensions. |
| Hosting | Cloudflare Pages | Static files only. No Node.js runtime. |
| Workers | Cloudflare Workers (Hono) | API layer. All external data flows through Workers. |
| Storage | D1 / KV / R2 | Structured data, cache, and assets respectively. |
| Testing | Vitest + Playwright | Unit tests via Vitest, route/a11y tests via Playwright. |
| Motion | Framer Motion + CSS | Framer for complex orchestration, CSS for micro-interactions. |
| Charts | Recharts | Data visualizations. Use Heritage chart tokens. |
| Dates | Luxon | Always `America/Chicago` timezone. |
| Payments | Stripe | Key-based auth, no passwords. |

## Directory Map

```
app/                    # Next.js App Router pages
  college-baseball/     # NCAA baseball routes
  mlb/                 # MLB routes
  nfl/                 # NFL routes
  nba/                 # NBA routes
  cfb/                 # College football routes
  auth/                # Authentication
  dashboard/           # User dashboard
  scores/              # Live scores aggregator
  pricing/             # Subscription pricing

components/             # Shared React components
  sports/              # Sport-generic (LiveScoresPanel, StandingsTable, etc.)
  college-baseball/    # Baseball-specific (Linescore, SabermetricsPanel, etc.)
  editorial/           # Content components (AIAnalysisPanel, ProgramHistoryFeature)
  dashboard/           # Dashboard widgets
  home/                # Homepage sections
  layout-ds/           # Layout shell (AppSidebar, navigation)
  ui/                  # Shared primitives (FeedbackModal, etc.)

lib/
  tokens/              # bsi-brand.css (single source of truth for tokens)
  api-clients/         # API client utilities
  hooks/               # React hooks (useSportData, etc.)
  utils/               # Shared utilities

workers/               # Cloudflare Workers (Hono router)
  handlers/            # Sport-specific handlers
  shared/              # Types, helpers, auth
```

## Token Architecture

```
lib/tokens/bsi-brand.css     ← Single source of truth (all CSS custom properties)
        ↓
app/globals.css               ← Imports bsi-brand.css, adds semantic aliases + Heritage classes
        ↓
tailwind.config.ts            ← Extends Tailwind with BSI token values
        ↓
Components                    ← Consume via CSS vars, Tailwind classes, or Heritage utility classes
```

## Key Constraints

1. **No SSR** — Everything is statically exported. Data fetching happens client-side.
2. **Dark mode only** — No light theme. All surfaces are dark.
3. **Mobile-first** — Design for 375px first, then scale up.
4. **Cloudflare-only** — No external databases, no Vercel, no AWS.
5. **One operator** — System must be debuggable by one person.
6. **No glass on content** — Glass system exists for Labs atmospheric overlays only.
   Heritage cards use solid surfaces with `--surface-dugout`.

## Breakpoints

| Name | Width | Use |
|------|-------|-----|
| `xs` | 375px | iPhone SE and small phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

## Image Handling

- `images: { unoptimized: true }` in Next config (Cloudflare Pages constraint)
- Use `loading="lazy"` on below-fold images
- Always include `width` and `height` attributes
- Prefer compressed PNG/JPEG over WebP (broader CDN compatibility)
- OG images at 1200x630px
