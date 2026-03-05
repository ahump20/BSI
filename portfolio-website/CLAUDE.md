# CLAUDE.md — austinhumphrey.com

Personal portfolio site for Austin Humphrey. Deployed to Cloudflare Pages at `austinhumphrey.com`.

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS 3** (utility-first, dark-only palette)
- **Framer Motion** (nav animations, hero entrance, chat widget, mobile menu)
- **@heroicons/react** (icons)

No R3F, Three.js, GSAP, Lenis, or react-hot-toast. Bundle: ~297KB JS (95KB gzipped).

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # tsc + vite build → dist/
npm run preview      # Serve production build locally
npm run deploy       # Build + wrangler pages deploy dist
```

## Architecture

```
src/
  main.tsx                    # Entry point — StrictMode + App
  App.tsx                     # Root — section layout + inline footer
  index.css                   # Tailwind layers, dark-only CSS vars, film grain, reveal animations
  components/
    Navigation.tsx            # Transparent → glass-on-scroll nav, IntersectionObserver active tracking
    Hero.tsx                  # 2D canvas particle system + radial blur overlays + italic tagline
    About.tsx                 # Origin story — 2-col narrative + sticky sidebar facts
    Experience.tsx            # Left-border timeline with burnt-orange dot markers
    Education.tsx             # 3-card grid (Full Sail, McCombs, UT Austin)
    BSIShowcase.tsx           # 2-col description + stats/league rows + tech stack tags
    AIFeatures.tsx            # 4 gradient-top-border cards
    Podcast.tsx               # Centered CTA box with NotebookLM link
    Philosophy.tsx            # Centered Austin covenant quote
    Contact.tsx               # Centered link grid (email, LinkedIn, BSI, GitHub, X)
    AIChatWidget.tsx          # Fixed bottom-right FAB with keyword-based local responses
    ErrorBoundary.tsx         # Safety net for async component issues
  hooks/
    usePrefersReducedMotion.ts  # Accessibility — disables canvas particles when reduced motion
  utils/                      # (empty — animation utilities removed)
```

## Design System

### Palette (dark-only, source of truth: `tailwind.config.js`)

| Token | Hex | Usage |
|-------|-----|-------|
| `midnight` | `#0D0D0D` | Primary background (`--color-bg`) |
| `charcoal` | `#1A1A1A` | Secondary background (`--color-bg-secondary`) |
| `bone` | `#F5F0EB` | Primary text (`--color-text`) |
| `warm-gray` | `#A89F95` | Muted text (`--color-text-muted`) |
| `burnt-orange` | `#BF5700` | Primary accent (`--color-accent`) |
| `texas-soil` | `#8B4513` | Secondary accent |
| `ember` | `#FF6B35` | Gradient accent |
| `sand` | `#F4EEE7` | Legacy alias for bone |

No light mode. No `data-theme` attribute. No ThemeToggle.

### Fonts

| Role | Family | Usage |
|------|--------|-------|
| Headings | Oswald (uppercase, 600 weight) | `font-sans` |
| Body | Cormorant Garamond | `font-serif` |
| Section labels / Code | JetBrains Mono | `font-mono` |

### Design Patterns

- **Section labels**: `// The Origin` — JetBrains Mono, 0.65rem, tracking 0.35em, burnt-orange
- **Section titles**: Oswald 600, `clamp(2rem, 4vw, 3rem)`, uppercase
- **Cards**: `rgba(26,26,26,0.6)` bg, `rgba(245,240,235,0.04)` border, hover lifts
- **Timeline**: left 1px gradient line, 9px burnt-orange dots with glow shadow
- **Buttons**: `btn-primary` (filled) + `btn-outline` (border), Oswald 500, 0.75rem
- **Film grain**: SVG `feTurbulence` on `body::after`, opacity 0.4, pointer-events: none

### Animation

- Framer Motion for nav `layoutId`, hero entrance, `AnimatePresence` (mobile menu, chat widget)
- IntersectionObserver + CSS `.reveal` / `.reveal.visible` for scroll-triggered section reveals
- Easing: `ease-out-expo` → `cubic-bezier(0.19, 1, 0.22, 1)`
- Canvas particle hero respects `prefers-reduced-motion` via `usePrefersReducedMotion` hook

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

## Performance

- Bundle: 297KB JS (95KB gzipped) — down from 900KB+ with R3F
- Zero WebGL — 2D canvas only, no SecurityError risk
- Scroll animations: CSS transitions on compositor thread (no React re-renders)
- Canvas particles: 80 particles, `requestAnimationFrame`, disabled on reduced-motion

## Gotchas

- Repo lives on iCloud Drive — git operations can hang. Use `--no-verify` if hooks stall. Remove stale `.git/index.lock` if git hangs.
- `tsconfig.json` has `noUnusedLocals` and `noUnusedParameters` — clean up imports.
- `ErrorBoundary.tsx` is retained but not currently imported — available as safety net.
