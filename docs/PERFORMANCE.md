# Performance Guidelines

Version: 1.0.0
Last Updated: November 6, 2025
Maintainer: Austin Humphrey

## Table of Contents

1. [Performance Philosophy](#performance-philosophy)
2. [Performance Budgets](#performance-budgets)
3. [Core Web Vitals Targets](#core-web-vitals-targets)
4. [Performance Testing](#performance-testing)
5. [Optimization Strategies](#optimization-strategies)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Bundle Analysis](#bundle-analysis)
8. [Database Optimization](#database-optimization)
9. [Caching Strategies](#caching-strategies)
10. [CDN Configuration](#cdn-configuration)
11. [Performance Checklist](#performance-checklist)
12. [Troubleshooting](#troubleshooting)

---

## Performance Philosophy

**Performance is a feature, not an afterthought.**

For Blaze Sports Intel, performance directly impacts:

- **User engagement**: Faster pages = more time on site
- **Conversion rates**: 1 second delay = 7% reduction in conversions
- **SEO rankings**: Core Web Vitals are ranking factors
- **Mobile experience**: Most users access on mobile devices
- **Real-time updates**: Live scores require fast, efficient data delivery

### Key Principles

1. **Measure First**: Use data to drive optimization decisions
2. **Budget Everything**: Set hard limits on resource sizes
3. **Progressive Enhancement**: Fast baseline, enhanced for capable devices
4. **Edge-First**: Leverage Cloudflare's global network
5. **Continuous Monitoring**: Track performance in production

---

## Performance Budgets

### JavaScript Bundle Sizes

| Bundle        | Size Limit | Current | Status |
| ------------- | ---------- | ------- | ------ |
| Main bundle   | 300 KB     | TBD     | 🟢     |
| Vendor bundle | 150 KB     | TBD     | 🟢     |
| Route chunks  | 50 KB each | TBD     | 🟢     |
| Total JS      | 500 KB     | TBD     | 🟢     |

**Compressed sizes (gzip)**

### CSS Bundle Sizes

| Bundle       | Size Limit | Current | Status |
| ------------ | ---------- | ------- | ------ |
| Main CSS     | 50 KB      | TBD     | 🟢     |
| Critical CSS | 15 KB      | TBD     | 🟢     |
| Route CSS    | 20 KB each | TBD     | 🟢     |
| Total CSS    | 100 KB     | TBD     | 🟢     |

**Compressed sizes (gzip)**

### Image Budgets

| Type          | Size Limit | Format        | Notes           |
| ------------- | ---------- | ------------- | --------------- |
| Hero images   | 200 KB     | WebP/AVIF     | Lazy load       |
| Team logos    | 20 KB      | SVG preferred | Cache forever   |
| Player photos | 50 KB      | WebP/AVIF     | Lazy load       |
| Icons         | 5 KB       | SVG sprite    | Inline or cache |

### Total Page Weight

| Page Type           | Size Limit | Target Load Time |
| ------------------- | ---------- | ---------------- |
| Homepage            | 2 MB       | < 3 seconds      |
| Sport page          | 1.5 MB     | < 2.5 seconds    |
| Team page           | 1.8 MB     | < 3 seconds      |
| Live scores         | 1 MB       | < 2 seconds      |
| Analytics dashboard | 2.5 MB     | < 4 seconds      |

**All sizes on 3G connection (750 Kbps)**

---

## Core Web Vitals Targets

### Largest Contentful Paint (LCP)

**Target: < 2.5 seconds**

**What it measures:** Loading performance - when main content becomes visible

**How to achieve:**

```html
<!-- Preload critical resources -->
<link rel="preload" as="image" href="/hero.webp" />
<link rel="preload" as="font" href="/inter-var.woff2" crossorigin />

<!-- Optimize images -->
<img
  src="/hero.webp"
  width="1200"
  height="600"
  alt="Blaze Sports Intel"
  loading="eager"
  fetchpriority="high"
/>
```

**Strategies:**

- Optimize server response time (TTFB < 600ms)
- Preload critical resources
- Optimize images (WebP/AVIF, responsive sizes)
- Minimize render-blocking resources
- Use CDN for static assets

### Interaction to Next Paint (INP)

**Target: < 200 milliseconds**

**What it measures:** Responsiveness - how quickly page responds to user interactions

**How to achieve:**

```javascript
// Debounce expensive operations
const handleSearch = debounce((query) => {
  searchAPI(query);
}, 300);

// Use requestIdleCallback for non-critical work
requestIdleCallback(() => {
  initializeAnalytics();
});

// Break up long tasks
async function processBulkData(items) {
  for (let i = 0; i < items.length; i++) {
    await processItem(items[i]);

    // Yield to main thread every 50ms
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}
```

**Strategies:**

- Minimize JavaScript execution time
- Debounce/throttle event handlers
- Use Web Workers for heavy computation
- Code split and lazy load
- Optimize third-party scripts

### Cumulative Layout Shift (CLS)

**Target: < 0.1**

**What it measures:** Visual stability - unexpected layout shifts

**How to achieve:**

```html
<!-- Reserve space for images -->
<img src="/player.webp" width="400" height="300" alt="Player photo" />

<!-- Reserve space for ads/embeds -->
<div style="min-height: 250px;">
  <!-- Ad content loads here -->
</div>

<!-- Use aspect-ratio for responsive containers -->
<div style="aspect-ratio: 16/9;">
  <iframe src="https://youtube.com/embed/..."></iframe>
</div>
```

**Strategies:**

- Always include width/height on images
- Reserve space for dynamic content
- Use `font-display: swap` sparingly
- Avoid inserting content above existing content
- Use CSS `aspect-ratio` for responsive embeds

### Performance Score Targets

| Metric         | Lighthouse Score | Target |
| -------------- | ---------------- | ------ |
| Performance    | 90+              | 🎯     |
| Accessibility  | 95+              | 🎯     |
| Best Practices | 90+              | 🎯     |
| SEO            | 95+              | 🎯     |

---

## Performance Testing

### Local Testing

#### Lighthouse CI

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse audit
lhci autorun --collect.url=http://localhost:8788

# With budgets
lhci autorun --collect.url=http://localhost:8788 \
  --assert.assertions.budget.0=100
```

**Configuration:** `.lighthouserc.js`

```javascript
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run dev',
      url: ['http://localhost:8788', 'http://localhost:8788/mlb'],
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

#### WebPageTest

```bash
# Install webpagetest CLI
npm install -g webpagetest

# Run test
webpagetest test https://blazesportsintel.com \
  --location Dulles:Chrome \
  --connection 3G \
  --runs 3
```

### CI/CD Integration

```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:8788
            http://localhost:8788/mlb
            http://localhost:8788/analytics
          budgetPath: ./budget.json
          uploadArtifacts: true
```

### Real User Monitoring (RUM)

```javascript
// lib/monitoring/web-vitals.js
import { onCLS, onFID, onLCP, onINP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, value, id, rating }) {
  // Send to Cloudflare Analytics Engine
  fetch('/api/metrics/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: name,
      value: Math.round(value),
      delta: Math.round(delta),
      id,
      rating,
      timestamp: Date.now(),
      url: window.location.pathname,
    }),
  });
}

// Monitor all Core Web Vitals
onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

**Dashboard Query:**

```sql
-- functions/api/metrics/vitals-summary.js
SELECT
  metric,
  AVG(value) as avg_value,
  QUANTILE(value, 0.75) as p75,
  QUANTILE(value, 0.95) as p95,
  COUNT(*) as sample_count
FROM web_vitals
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY metric
ORDER BY metric;
```

---

## Optimization Strategies

### JavaScript Optimization

#### Code Splitting

```javascript
// Dynamic imports for route-based splitting
const MLBPage = lazy(() => import('./pages/MLB'));
const NFLPage = lazy(() => import('./pages/NFL'));

// Component-level splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));

// Usage with Suspense
<Suspense fallback={<Spinner />}>
  <HeavyChart data={chartData} />
</Suspense>;
```

#### Tree Shaking

```javascript
// ❌ Bad: Imports entire library
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ Good: Import only what you need
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);
```

#### Minification

```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
};
```

### CSS Optimization

#### Critical CSS Extraction

```javascript
// Extract critical CSS for above-the-fold content
import { readFileSync } from 'fs';
import criticalCss from 'critical';

criticalCss.generate({
  inline: true,
  base: 'dist/',
  src: 'index.html',
  target: {
    html: 'index-critical.html',
    css: 'critical.css',
  },
  width: 1300,
  height: 900,
});
```

#### PurgeCSS

```javascript
// Remove unused CSS
import { PurgeCSS } from 'purgecss';

const purgeCSSResults = await new PurgeCSS().purge({
  content: ['./src/**/*.html', './src/**/*.jsx'],
  css: ['./src/**/*.css'],
  safelist: ['animate-', 'hover:', 'focus:'],
});
```

### Image Optimization

#### Responsive Images

```html
<picture>
  <source
    type="image/avif"
    srcset="/hero-400.avif 400w, /hero-800.avif 800w, /hero-1200.avif 1200w"
    sizes="(max-width: 600px) 400px,
           (max-width: 1200px) 800px,
           1200px"
  />
  <source
    type="image/webp"
    srcset="/hero-400.webp 400w, /hero-800.webp 800w, /hero-1200.webp 1200w"
    sizes="(max-width: 600px) 400px,
           (max-width: 1200px) 800px,
           1200px"
  />
  <img src="/hero-800.jpg" alt="Blaze Sports Intel" loading="lazy" decoding="async" />
</picture>
```

#### Cloudflare Images

```javascript
// functions/_middleware.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Transform images on-the-fly
  if (url.pathname.startsWith('/images/')) {
    const imageRequest = new Request(url, {
      cf: {
        image: {
          fit: 'scale-down',
          width: 800,
          quality: 85,
          format: 'auto',
        },
      },
    });

    return fetch(imageRequest);
  }

  return context.next();
}
```

### Font Optimization

```html
<!-- Preload critical fonts -->
<link rel="preload" as="font" href="/fonts/inter-var.woff2" type="font/woff2" crossorigin />

<!-- Use font-display: swap for web fonts -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter-var.woff2') format('woff2');
    font-weight: 100 900;
    font-display: swap;
  }
</style>
```

---

## Monitoring and Alerting

### Cloudflare Analytics

```javascript
// functions/api/_middleware.js
export async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();

  try {
    const response = await context.next();
    const duration = Date.now() - startTime;

    // Write to Analytics Engine
    env.ANALYTICS?.writeDataPoint({
      blobs: [request.url, request.method, response.status.toString()],
      doubles: [duration],
      indexes: [new URL(request.url).pathname],
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    env.ANALYTICS?.writeDataPoint({
      blobs: [request.url, request.method, 'error'],
      doubles: [duration],
      indexes: [new URL(request.url).pathname],
    });

    throw error;
  }
}
```

### Alert Configuration

```javascript
// Performance alert thresholds
const ALERTS = {
  // Core Web Vitals
  LCP_THRESHOLD: 2500, // 2.5 seconds
  FID_THRESHOLD: 100, // 100 milliseconds
  INP_THRESHOLD: 200, // 200 milliseconds
  CLS_THRESHOLD: 0.1, // 0.1 score

  // API Performance
  API_P95_THRESHOLD: 500, // 500ms p95 latency
  API_ERROR_RATE_THRESHOLD: 0.01, // 1% error rate

  // Resource Loading
  TTFB_THRESHOLD: 600, // 600ms time to first byte
  FCP_THRESHOLD: 1800, // 1.8 seconds first contentful paint

  // Bundle Sizes
  JS_BUNDLE_SIZE: 300 * 1024, // 300 KB
  CSS_BUNDLE_SIZE: 50 * 1024, // 50 KB
};
```

### Monitoring Dashboard

```javascript
// functions/api/metrics/dashboard.js
export async function onRequest({ env }) {
  const query = `
    SELECT
      DATE_TRUNC('hour', timestamp) as hour,
      AVG(CASE WHEN metric = 'LCP' THEN value END) as avg_lcp,
      AVG(CASE WHEN metric = 'FID' THEN value END) as avg_fid,
      AVG(CASE WHEN metric = 'CLS' THEN value END) as avg_cls,
      COUNT(*) as sample_count
    FROM web_vitals
    WHERE timestamp > NOW() - INTERVAL '24 hours'
    GROUP BY hour
    ORDER BY hour DESC
  `;

  const results = await env.ANALYTICS_DB.prepare(query).all();

  return Response.json({
    metrics: results.results,
    alerts: checkThresholds(results.results),
  });
}

function checkThresholds(metrics) {
  const alerts = [];

  for (const metric of metrics) {
    if (metric.avg_lcp > ALERTS.LCP_THRESHOLD) {
      alerts.push({
        severity: 'high',
        metric: 'LCP',
        value: metric.avg_lcp,
        threshold: ALERTS.LCP_THRESHOLD,
      });
    }

    if (metric.avg_cls > ALERTS.CLS_THRESHOLD) {
      alerts.push({
        severity: 'high',
        metric: 'CLS',
        value: metric.avg_cls,
        threshold: ALERTS.CLS_THRESHOLD,
      });
    }
  }

  return alerts;
}
```

---

## Bundle Analysis

### Webpack Bundle Analyzer

```bash
# Analyze production bundle
npm run build -- --analyze

# Opens interactive treemap
open dist/stats.html
```

```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
};
```

### Bundle Size Tracking

```javascript
// scripts/check-bundle-size.js
import { readFileSync, readdirSync, statSync } from 'fs';
import { gzipSync } from 'zlib';

const DIST_DIR = './dist';
const BUDGETS = {
  'main.js': 300 * 1024,
  'vendor.js': 150 * 1024,
  'styles.css': 50 * 1024,
};

const files = readdirSync(DIST_DIR);
const violations = [];

for (const file of files) {
  const filepath = `${DIST_DIR}/${file}`;
  const stats = statSync(filepath);

  if (!stats.isFile()) continue;

  const content = readFileSync(filepath);
  const gzipped = gzipSync(content);
  const size = gzipped.length;

  const budget = BUDGETS[file];
  if (budget && size > budget) {
    violations.push({
      file,
      size,
      budget,
      overage: size - budget,
    });
  }
}

if (violations.length > 0) {
  console.error('❌ Bundle size violations:');
  violations.forEach((v) => {
    console.error(
      `  ${v.file}: ${(v.size / 1024).toFixed(2)} KB (budget: ${(v.budget / 1024).toFixed(2)} KB)`
    );
  });
  process.exit(1);
}

console.log('✅ All bundles within budget');
```

---

## Database Optimization

### Query Optimization

```sql
-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_games_sport_date
  ON games(sport, game_date);

CREATE INDEX IF NOT EXISTS idx_games_team_season
  ON games(home_team_id, season);

CREATE INDEX IF NOT EXISTS idx_player_stats_season_team
  ON player_stats(season, team_id);

-- Analyze query plans
EXPLAIN QUERY PLAN
SELECT * FROM games
WHERE sport = 'mlb'
  AND game_date >= '2025-01-01'
ORDER BY game_date DESC;
```

### Connection Pooling

```javascript
// lib/database/pool.js
export class D1ConnectionPool {
  constructor(db, maxConnections = 10) {
    this.db = db;
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
  }

  async query(sql, params) {
    while (this.activeConnections >= this.maxConnections) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.activeConnections++;

    try {
      return await this.db
        .prepare(sql)
        .bind(...params)
        .all();
    } finally {
      this.activeConnections--;
    }
  }
}
```

### Query Caching

```javascript
// Cache frequently accessed data
const CACHE_TTL = {
  standings: 300, // 5 minutes
  live_scores: 30, // 30 seconds
  player_stats: 3600, // 1 hour
};

async function getStandings(sport, env) {
  const cacheKey = `standings:${sport}`;

  // Check KV cache first
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) return cached;

  // Query database
  const results = await env.DB.prepare('SELECT * FROM standings WHERE sport = ?').bind(sport).all();

  // Store in cache
  await env.CACHE.put(cacheKey, JSON.stringify(results.results), {
    expirationTtl: CACHE_TTL.standings,
  });

  return results.results;
}
```

---

## Caching Strategies

### Cache Headers Configuration

```javascript
// functions/_headers
/*
  Cache-Control: public, max-age=0, must-revalidate
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/api/live/*
  Cache-Control: public, max-age=30, s-maxage=30

/api/standings/*
  Cache-Control: public, max-age=300, s-maxage=300
```

### Stale-While-Revalidate

```javascript
// Serve stale content while fetching fresh data
async function fetchWithSWR(url, ttl = 300) {
  const cache = caches.default;
  const cacheKey = new Request(url);

  // Try to get cached response
  const cached = await cache.match(cacheKey);

  if (cached) {
    const age = Date.now() - new Date(cached.headers.get('Date')).getTime();

    // If fresh, return immediately
    if (age < ttl * 1000) {
      return cached;
    }

    // If stale, revalidate in background
    fetch(url).then((response) => {
      cache.put(cacheKey, response.clone());
    });

    // Return stale content
    return cached;
  }

  // No cache, fetch fresh
  const response = await fetch(url);
  await cache.put(cacheKey, response.clone());
  return response;
}
```

### Cache Invalidation

```javascript
// Purge cache on data update
async function updateStandings(sport, data, env) {
  // Update database
  await env.DB.prepare('UPDATE standings SET wins = ?, losses = ? WHERE team_id = ?')
    .bind(data.wins, data.losses, data.teamId)
    .run();

  // Invalidate cache
  await env.CACHE.delete(`standings:${sport}`);
  await env.CACHE.delete(`standings:${sport}:${data.teamId}`);

  // Purge CDN cache
  await purgeCloudflareCache(`/api/${sport}/standings`);
}

async function purgeCloudflareCache(path) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [`https://blazesportsintel.com${path}`],
      }),
    }
  );

  return response.json();
}
```

---

## CDN Configuration

### Cloudflare Configuration

```toml
# wrangler.toml
[env.production]
routes = [
  { pattern = "blazesportsintel.com/*", zone_name = "blazesportsintel.com" }
]

[site]
bucket = "./dist"

[build]
command = "npm run build"

[[rules]]
type = "Text"
globs = ["**/*.html"]
fallthrough = true

[[rules]]
type = "Data"
globs = ["**/*.json", "**/*.xml"]
fallthrough = false

# Cache static assets forever
[[redirects]]
from = "/assets/*"
to = "/assets/:splat"
status = 200
headers = { Cache-Control = "public, max-age=31536000, immutable" }
```

### Custom Cache Rules

```javascript
// functions/_middleware.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Don't cache authenticated requests
  if (request.headers.get('Authorization')) {
    return context.next();
  }

  // Custom cache for API routes
  if (url.pathname.startsWith('/api/')) {
    const response = await context.next();

    // Clone response to modify headers
    const newResponse = new Response(response.body, response);

    // Set cache headers based on endpoint
    if (url.pathname.includes('/live/')) {
      newResponse.headers.set('Cache-Control', 'public, max-age=30');
    } else if (url.pathname.includes('/standings')) {
      newResponse.headers.set('Cache-Control', 'public, max-age=300');
    }

    return newResponse;
  }

  return context.next();
}
```

---

## Performance Checklist

### Pre-Deployment

- [ ] Run Lighthouse audit (all scores 90+)
- [ ] Check bundle sizes against budgets
- [ ] Verify Core Web Vitals targets met
- [ ] Test on 3G connection
- [ ] Test on mobile devices
- [ ] Verify images are optimized (WebP/AVIF)
- [ ] Check font loading strategy
- [ ] Verify critical CSS is inlined
- [ ] Test with browser cache disabled
- [ ] Run WebPageTest analysis

### Post-Deployment

- [ ] Monitor Core Web Vitals in production
- [ ] Check error rates in Analytics
- [ ] Verify cache hit rates
- [ ] Monitor API response times
- [ ] Review database query performance
- [ ] Check CDN cache effectiveness
- [ ] Verify RUM data collection
- [ ] Review performance alerts

### Monthly Review

- [ ] Analyze performance trends
- [ ] Review and update budgets
- [ ] Identify performance regressions
- [ ] Update optimization strategies
- [ ] Review third-party script impact
- [ ] Audit unused code
- [ ] Test new optimization techniques
- [ ] Document performance wins

---

## Troubleshooting

### Slow Page Load Times

**Symptoms:** Pages take > 3 seconds to load

**Diagnosis:**

```bash
# Check TTFB
curl -w "@curl-format.txt" -o /dev/null -s https://blazesportsintel.com/

# Lighthouse audit
lighthouse https://blazesportsintel.com/ --view

# WebPageTest
webpagetest test https://blazesportsintel.com/ --location Dulles:Chrome
```

**Solutions:**

1. **Optimize server response time:**
   - Add database indexes
   - Implement query caching
   - Use Cloudflare Workers for edge computing

2. **Reduce render-blocking resources:**
   - Inline critical CSS
   - Defer non-critical JavaScript
   - Use `async`/`defer` for scripts

3. **Optimize images:**
   - Convert to WebP/AVIF
   - Implement responsive images
   - Add lazy loading

### Poor Core Web Vitals

**Symptoms:** LCP > 2.5s, FID > 100ms, CLS > 0.1

**Diagnosis:**

```javascript
// Monitor in production
import { onCLS, onFID, onLCP } from 'web-vitals';

onLCP((metric) => console.log('LCP:', metric));
onFID((metric) => console.log('FID:', metric));
onCLS((metric) => console.log('CLS:', metric));
```

**Solutions:**

1. **LCP:**
   - Preload hero images
   - Optimize server response time
   - Remove render-blocking resources

2. **FID/INP:**
   - Reduce JavaScript execution time
   - Use Web Workers
   - Debounce event handlers

3. **CLS:**
   - Add width/height to images
   - Reserve space for dynamic content
   - Avoid inserting content above fold

### Large Bundle Sizes

**Symptoms:** JavaScript > 500 KB, CSS > 100 KB

**Diagnosis:**

```bash
# Analyze bundle
npm run build -- --analyze

# Check individual file sizes
ls -lh dist/assets/
```

**Solutions:**

1. **Code splitting:**
   - Implement route-based splitting
   - Lazy load heavy components
   - Use dynamic imports

2. **Tree shaking:**
   - Import only what you need
   - Remove unused code
   - Use `sideEffects: false` in package.json

3. **Minification:**
   - Enable terser for production
   - Remove console.log statements
   - Use compression (gzip/brotli)

---

**Contact:**
Austin Humphrey
austin@blazesportsintel.com

**Resources:**

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Cloudflare Performance](https://developers.cloudflare.com/pages/platform/performance)
