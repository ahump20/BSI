# CLAUDE.md — austinhumphrey.com

Personal portfolio site for Austin Humphrey. Deployed to Cloudflare Pages at `austinhumphrey.com`.

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS 3** (utility-first, dark-only palette)
- **Framer Motion** (scroll-triggered animations, hero entrance, chat widget, mobile menu)

No R3F, Three.js, GSAP, Lenis, or react-hot-toast. Bundle: ~229KB JS (71KB gzipped).

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
  App.tsx                     # Root layout: Nav → sections → Footer → chat widget
  index.css                   # Tailwind layers, dark-only CSS vars, film grain, component styles
  content/
    site.ts                   # All site content — nav, projects, platform, proof, origin, career, contact, footer
    concierge.ts              # AI chat widget content — greeting, fallback responses, suggested prompts
  components/
    Navigation.tsx            # Glass-on-scroll nav, IntersectionObserver active tracking, layoutId indicator
    Hero.tsx                  # Gradient-mesh editorial hero with large outlined name, subtitle, dual CTAs
    Projects.tsx              # 5-project grid — BSI flagship (full-width), 4 supporting projects (2-col)
    Proof.tsx                 # Featured editorial lead + secondary pieces list + speaking reel video
    PlatformDepth.tsx         # BSI platform section — live status badge, thesis, stats, league list, tech line
    Origin.tsx                # Two-column layout: photos + narrative moments left, sticky sidebar right
    Career.tsx                # Professional timeline (3 entries, color-coded dots) + education credentials
    Contact.tsx               # Contact cards grid + form with Turnstile, honeypot, error handling
    Footer.tsx                # 4-column link grid, Cloudflare badge, tagline, copyright
    PlatformStatus.tsx        # Live BSI health indicator (polls /api/platform-health every 60s)
    AIChatWidget.tsx          # Lazy-loaded FAB with Claude Haiku streaming + local fallback + clear button
    ErrorBoundary.tsx         # React error boundary with PostHog reporting
  hooks/
    usePlatformHealth.ts      # Shared singleton health poller (useSyncExternalStore)
    usePrefersReducedMotion.ts  # Accessibility — respects reduced motion preference
  utils/
    animations.ts             # Framer Motion variants (stagger, fadeIn), EASE_OUT_EXPO
    analytics.ts              # PostHog analytics helpers
functions/
  api/
    chat.ts                   # Pages Function — Claude Haiku streaming SSE for portfolio Q&A
    contact.ts                # Pages Function — contact form → Resend email (noreply@blazesportsintel.com)
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
| `spectrum-blue` | `#3B82F6` | Spectrum Reach career dot |
| `nw-navy` | `#1E3A5F` | Northwestern Mutual career dot |

### Fonts

| Role | Family | Usage |
|------|--------|-------|
| Headings | Oswald (uppercase, 600) | `font-sans` |
| Body | Cormorant Garamond | `font-serif` |
| Labels / Code | JetBrains Mono | `font-mono` |
| Editorial leads | Libre Baskerville | `font-display` |

### Design Patterns

- **Section labels**: `// The Work` — JetBrains Mono, 0.65rem, tracking 0.35em, burnt-orange
- **Section titles**: Oswald 600, `clamp(2rem, 4vw, 3rem)`, uppercase
- **Cards**: charcoal bg, bone/5 border, hover lift + bg darken
- **Timeline**: left 1px border, 2.5px colored dots with glow shadow
- **Buttons**: `btn-primary` (filled burnt-orange) + `btn-outline` (border)
- **Film grain**: SVG `feTurbulence` on hero section
- **Contact cards**: grid layout with icon, label, and value

### Animation

- Framer Motion `whileInView` for scroll-triggered section reveals
- `staggerContainer` + `staggerItem` for cascading child entrances
- `viewport={{ once: true, amount: 0.05 }}` standard trigger
- Nav `layoutId` for active indicator spring animation
- Hero staggered entrance (name → subtitle → CTAs)
- Easing: `EASE_OUT_EXPO` → `cubic-bezier(0.19, 1, 0.22, 1)`

## Pages Functions

| Function | Purpose | Secrets Required |
|----------|---------|-----------------|
| `/api/chat` | Claude Haiku streaming SSE for portfolio Q&A | `ANTHROPIC_API_KEY` |
| `/api/contact` | Form submission → email via Resend | `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` (optional) |
| `/api/platform-health` | Same-origin proxy for BSI health check | None |

## Deployment

- **Host:** Cloudflare Pages
- **Project:** `austin-humphrey-professional-resume-portfolio`
- **Domain:** `austinhumphrey.com`
- **Deploy:** `npm run deploy`

## Conventions

- Files: kebab-case
- Components: PascalCase
- Functions: camelCase, verb-first
- Constants: SCREAMING_SNAKE
- Commits: `type(scope): description`

## Lighthouse Scores (March 28, 2026)

- Accessibility: 100
- Best Practices: 100
- SEO: 100
- LCP: 545ms, CLS: 0.00, TTFB: 104ms

## Gotchas

- Repo lives on iCloud Drive — git operations can hang. Use `--no-verify` if hooks stall.
- `tsconfig.json` has `noUnusedLocals` and `noUnusedParameters` — clean up imports.
- The `_redirects` file sends all routes to `index.html` (SPA fallback).
- Contact form uses `noreply@blazesportsintel.com` as from address (verified Resend domain).
- Chat widget uses Claude Haiku 4.5 with 500 token limit and 6-message context window.
