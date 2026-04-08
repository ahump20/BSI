# CLAUDE.md — austinhumphrey.com

Personal portfolio site for Austin Humphrey. Deployed to Cloudflare Pages at `austinhumphrey.com`.

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS 3** (utility-first, dark-only palette)
- **Framer Motion** (scroll-triggered animations, hero entrance, chat widget, mobile menu)

No R3F, Three.js, GSAP, Lenis, or react-hot-toast. Bundle: ~231KB JS (72KB gzipped).

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # tsc + vite build → dist/
npm run preview      # Serve production build locally
npm run deploy       # sync-stats + build + wrangler pages deploy dist
```

## Architecture

```
src/
  main.tsx                    # Entry point — StrictMode + App
  App.tsx                     # Root layout: ErrorBoundary → Nav → sections → Footer → chat widget
  index.css                   # Tailwind layers, dark-only CSS vars, film grain, component styles
  content/
    site.ts                   # All site content — hero, nav, work, proof, origin, contact, footer
    concierge.ts              # AI chat widget content — greeting, fallback responses, suggested prompts
  components/
    Navigation.tsx            # Glass-on-scroll nav, IntersectionObserver active tracking, layoutId indicator
    Hero.tsx                  # Photo-backed hero with thesis → name → tagline entrance sequence + scroll indicator
    Work.tsx                  # BSI flagship showcase (animated stat counters, browser-chrome screenshot, capabilities, supporting projects)
    Proof.tsx                 # Editorial pull-quotes + speaking reel video with poster frame
    Origin.tsx                # Documentary photo narrative (8 chapters, photo grids, quick facts sidebar)
    Contact.tsx               # Contact links + form with Turnstile, honeypot, inline validation
    Footer.tsx                # Link groups, credentials, tagline, copyright
    PlatformStatus.tsx        # Live BSI health indicator (polls /api/platform-health every 60s)
    AIChatWidget.tsx          # Lazy-loaded FAB with Claude Haiku streaming + local fallback
    ErrorBoundary.tsx         # React error boundary with PostHog reporting
  hooks/
    usePlatformHealth.ts      # Shared singleton health poller (useSyncExternalStore)
    usePrefersReducedMotion.ts  # Accessibility — respects reduced motion preference
  utils/
    animations.ts             # Framer Motion variants (stagger, fadeIn, scaleIn), SCROLL_VIEWPORT config
    analytics.ts              # PostHog analytics helpers
functions/
  api/
    chat.ts                   # Pages Function — Claude Haiku streaming SSE for portfolio Q&A
    contact.ts                # Pages Function — contact form → Resend email delivery
    platform-health.ts        # Pages Function — same-origin proxy for BSI health endpoint
```

## Design System

### Palette (dark-only, source of truth: `tailwind.config.js`)

| Token | Hex | Usage |
|-------|-----|-------|
| `midnight` | `#0D0D0D` | Primary background |
| `charcoal` | `#1A1A1A` | Secondary background |
| `bone` | `#F5F0EB` | Primary text |
| `warm-gray` | `#A89F95` | Muted text |
| `burnt-orange` | `#BF5700` | Primary accent |
| `texas-soil` | `#8B4513` | Secondary accent |
| `ember` | `#FF6B35` | Gradient accent |

No light mode. No `data-theme` attribute.

### Fonts

| Role | Family | Usage |
|------|--------|-------|
| Headings | Oswald (uppercase, 600) | `font-sans` |
| Body | Cormorant Garamond | `font-serif` |
| Labels / Code | JetBrains Mono | `font-mono` |
| Editorial leads | Libre Baskerville | `font-display` |

### Design Patterns

- **Section labels**: JetBrains Mono, 0.65rem, tracking 0.35em, burnt-orange
- **Section titles**: Oswald 600, `clamp(2rem, 4vw, 3rem)`, uppercase
- **Cards**: `rgba(26,26,26,0.6)` bg, `rgba(245,240,235,0.04)` border, hover lifts
- **Buttons**: `btn-primary` (filled) + `btn-outline` (border), Oswald 500, 0.75rem
- **Film grain**: SVG `feTurbulence` overlay, subtle opacity
- **Photo breaks**: full-bleed cinematic images between sections
- **Screenshot frame**: browser-chrome treatment on product screenshots

### Animation

- Framer Motion `whileInView` for scroll-triggered section reveals
- `staggerContainer` + `staggerItem` for cascading child entrances
- `SCROLL_VIEWPORT = { once: true, margin: '-60px 0px' }` for all sections
- Nav `layoutId` for active indicator spring animation
- Mobile menu staggered item entrances
- Easing: `EASE_OUT_EXPO` → `cubic-bezier(0.19, 1, 0.22, 1)`
- Hero Ken Burns zoom on background photo (25s, CSS animation)
- Animated stat counters (count up on scroll-into-view)
- Respects `prefers-reduced-motion` globally

## Pages Functions

Three Cloudflare Pages Functions power server-side features:

| Function | Purpose | Secrets Required |
|----------|---------|-----------------|
| `/api/chat` | Claude Haiku streaming SSE for portfolio Q&A | `ANTHROPIC_API_KEY` |
| `/api/contact` | Form submission → email via Resend | `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` (optional) |
| `/api/platform-health` | Same-origin proxy for BSI health check | None |

## Deployment

- **Host:** Cloudflare Pages
- **Project:** `austin-humphrey-professional-resume-portfolio`
- **Domain:** `austinhumphrey.com`
- **Deploy:** `npm run deploy` or `npx wrangler pages deploy dist --project-name austin-humphrey-professional-resume-portfolio --branch main`

## Conventions

- Files: kebab-case
- Components: PascalCase
- Functions: camelCase, verb-first
- Constants: SCREAMING_SNAKE
- Commits: `type(scope): description`

## SEO

- Full Open Graph + Twitter Card (summary_large_image) meta tags
- JSON-LD structured data (Person schema with education, occupation, sameAs)
- Canonical URL, sitemap.xml, robots.txt
- Hero image preloaded for LCP optimization
- Self-hosted fonts preloaded (Oswald, Cormorant)

## Gotchas

- Repo lives on iCloud Drive — git operations can hang. Use `--no-verify` if hooks stall.
- `tsconfig.json` has `noUnusedLocals` and `noUnusedParameters` — clean up imports.
- The `_redirects` file sends all routes to `index.html` (SPA fallback).
- Contact form requires `RESEND_API_KEY` secret set on the Pages project.
