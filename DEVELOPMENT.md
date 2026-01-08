# BSI Development Guide

Quick reference for developers working on BlazeSportsIntel.com.

---

## Getting Started

```bash
# Clone and install
git clone https://github.com/ahump20/BSI.git
cd BSI
npm install

# Copy environment template
cp .env.example .env.local

# Start dev server (Next.js)
npm run dev
```

Development server runs at `http://localhost:3000`.

---

## npm Scripts Reference

### Development

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run dev:vite` | Start Vite dev server (alternative) |

### Building

| Script | Description |
|--------|-------------|
| `npm run build` | Production build (runs image optimization first) |
| `npm run build:vite` | Vite production build |
| `npm run build:lib` | Build TypeScript library files |
| `npm run build:functions` | Build Cloudflare Functions |

### Testing

| Script | Description |
|--------|-------------|
| `npm run test` | Run Vitest in watch mode |
| `npm run test:ui` | Vitest with UI dashboard |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:api` | API endpoint tests |
| `npm run test:integration` | Integration tests |
| `npm run test:validation` | Data validation tests |
| `npm run test:all` | Run all test suites |
| `npm run test:a11y` | Accessibility tests (Playwright) |

### Code Quality

| Script | Description |
|--------|-------------|
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier check |
| `npm run format:fix` | Prettier with auto-fix |

### Deployment

| Script | Description |
|--------|-------------|
| `npm run deploy` | Deploy to Cloudflare Pages (main branch) |
| `npm run deploy:production` | Production deploy (allows dirty commits) |
| `npm run deploy:preview` | Deploy to preview branch |

### Database

| Script | Description |
|--------|-------------|
| `npm run db:migrate:production` | Run D1 migrations on production |
| `npm run db:seed:production` | Seed production database |

### Performance

| Script | Description |
|--------|-------------|
| `npm run images:optimize` | Optimize images in public/images |
| `npm run perf:check` | Run performance checks |
| `npm run data:freshness` | Check data freshness |
| `npm run cache:warm` | Warm API caches |

---

## Project Architecture

```
BSI/
├── app/                    # Next.js App Router pages
│   ├── (home)/            # Home route group
│   ├── mlb/               # MLB section
│   ├── nfl/               # NFL section
│   ├── college-baseball/  # College baseball section
│   └── dashboard/         # Analytics dashboard
├── components/            # React components
│   ├── ui/                # Base UI components (Button, Card, etc.)
│   ├── dashboard/         # Dashboard-specific components
│   └── common/            # Shared components (Header, Footer, etc.)
├── lib/                   # Utilities and adapters
│   ├── adapters/          # Data source adapters
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Helper functions
├── functions/             # Cloudflare Pages Functions (API routes)
│   └── api/               # API endpoints
├── public/                # Static assets
│   ├── images/            # Image assets (auto-optimized on build)
│   └── js/                # Client-side scripts
├── scripts/               # Build and automation scripts
└── docs/                  # Documentation
```

---

## Key Patterns

### Dynamic Imports (Code-Splitting)

Heavy components like charts are lazy-loaded to reduce initial bundle:

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder />
  }
);
```

Used for: recharts (dashboard), Three.js (hero), and other large dependencies.

### API Routes (Cloudflare Functions)

API endpoints live in `functions/api/`. Each file exports handlers:

```typescript
// functions/api/example.ts
export async function onRequest(context: EventContext) {
  const { request, env } = context;
  // Handle request
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
```

### Component Structure

Components follow this pattern:

```tsx
// components/ExampleComponent.tsx
'use client'; // Only if needed for client-side interactivity

interface ExampleProps {
  title: string;
  data: DataType[];
}

export function ExampleComponent({ title, data }: ExampleProps) {
  // Component logic
  return (/* JSX */);
}
```

### Design Tokens

Use Tailwind classes with BSI color tokens:

```tsx
// Brand colors
className="bg-burnt-orange text-white"      // Primary brand
className="bg-charcoal text-cream"          // Dark theme
className="text-ember"                      // Interactive accent
className="border-texas-soil"               // Heritage accent

// Semantic colors
className="text-green-500"                  // Success/wins
className="text-red-500"                    // Error/losses
className="text-yellow-500"                 // Warning
```

---

## Image Optimization

Images in `public/images` are auto-optimized on build:

1. **WebP conversion** for images >100KB
2. **Quality compression** (80% for WebP/JPEG)
3. **Max dimension** resize to 2000px

Manual optimization:
```bash
# Basic optimization (creates WebP versions)
npm run images:optimize

# Remove originals after WebP conversion (production)
npm run images:optimize -- --remove-originals
```

---

## Environment Variables

Required for full functionality:

```bash
# API Keys
SPORTSDATA_API_KEY=           # SportsDataIO API
CLOUDFLARE_API_TOKEN=         # Cloudflare deployment
STRIPE_SECRET_KEY=            # Stripe payments
STRIPE_PUBLISHABLE_KEY=       # Stripe client-side

# Database
CLOUDFLARE_D1_DATABASE_ID=    # D1 database binding

# Optional
AMPLITUDE_API_KEY=            # Analytics
```

See `.env.example` for full list.

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- path/to/test.ts

# Coverage report
npm run test:coverage
```

### Accessibility Tests (Playwright)

```bash
# Run a11y tests
npm run test:a11y

# Interactive UI mode
npm run test:a11y:ui

# View last report
npm run test:a11y:report
```

---

## Deployment

### Automatic (Recommended)

Push to `main` branch triggers automatic deployment via GitHub Actions.

### Manual

```bash
# Build and deploy
npm run deploy

# Preview deployment
npm run deploy:preview
```

### Cloudflare Workers

Individual workers deploy separately:

```bash
# Deploy specific worker
npx wrangler deploy --config workers/[worker-name]/wrangler.toml
```

---

## Common Tasks

### Adding a New Page

1. Create route in `app/[section]/[route]/page.tsx`
2. Use `PageLayout` component for consistent structure
3. Add to navigation if needed (`components/common/Header.tsx`)

### Adding an API Endpoint

1. Create file in `functions/api/[path].ts`
2. Export `onRequest` or `onRequestGet`/`onRequestPost`
3. Include proper caching headers
4. Add type definitions

### Adding a Component

1. Create in `components/[section]/ComponentName.tsx`
2. Use TypeScript interfaces for props
3. Follow existing patterns for state and hooks
4. Add to barrel export if needed (`components/[section]/index.ts`)

---

## Troubleshooting

### Build Fails

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules && npm install

# Check TypeScript errors
npm run typecheck
```

### API Not Working

1. Check `.env.local` has required keys
2. Verify Cloudflare bindings in `wrangler.toml`
3. Check function logs: `npx wrangler pages functions tail`

### Images Not Loading

1. Verify path starts with `/images/`
2. Check file exists in `public/images/`
3. Run `npm run images:optimize` if WebP needed

---

## Resources

- [CLAUDE.md](./CLAUDE.md) - Project rules and conventions
- [docs/API.md](./docs/API.md) - API documentation
- [Next.js Docs](https://nextjs.org/docs) - Framework documentation
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Edge deployment

---

*Last updated: January 2025*
