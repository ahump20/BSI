# Blaze Sports Intel Design Standards: From 3/10 to 9/10+

**Current Assessment:** 3/10
**Target:** 9/10+
**Focus:** College Baseball platform (ESPN's biggest gap)
**Primary Device:** iPhone portrait mode
**Brand Core:** Burnt orange (#BF5700), professional sports intelligence

---

## Executive Summary: The 9/10 Delta

### What's Missing (Critical Gaps)

1. **Information Architecture:** No clear visual hierarchy—everything screams at once
2. **Mobile UX:** Desktop-first approach fails on iPhone (primary device)
3. **Data Presentation:** Box scores buried, stats not scannable, no progressive disclosure
4. **Performance:** Heavy particle systems kill mobile experience
5. **Content Strategy:** Marketing fluff > actionable data (inverse priority needed)
6. **Accessibility:** WCAG AA compliance incomplete, poor contrast ratios
7. **Brand Consistency:** Burnt orange overused → visual fatigue

---

## 1. Design Philosophy: Differentiation Strategy

### Blaze vs. ESPN

| **ESPN's Approach** | **Blaze's Advantage** |
|---------------------|----------------------|
| Mobile app = news feed with scores buried | **Data-first:** Box scores in 2 taps max |
| College baseball = score + inning only | **Complete intelligence:** Full batting/pitching lines |
| Generic national coverage | **Regional authority:** Deep South + Texas focus |
| Ad-cluttered experience | **Clean, focused:** Pay-per-value, no ads |
| Desktop-optimized web | **Mobile-native:** iPhone portrait primary |

### Core Design Principles

1. **Data > Decoration**
   - Box scores visible without scrolling
   - Stats tables scannable at a glance
   - Progressive disclosure: summary → details → advanced metrics

2. **Speed = Trust**
   - Sub-2s page loads on mobile
   - Instant interactions (no 300ms tap delays)
   - Skeleton screens for perceived performance

3. **Burnt Orange as Accent, Not Background**
   - Use sparingly (5-10% of screen real estate)
   - Reserve for CTAs, active states, data highlights
   - Dark charcoal (#0d0d12) as primary surface

4. **Mobile-First, Always**
   - Design for 375px width (iPhone SE)
   - Touch targets ≥44px × 44px (Apple HIG)
   - Thumb-zone optimization (bottom 60% of screen)

---

## 2. Visual Hierarchy: Information Prioritization

### Current Problem
- Hero takes 100vh → user scrolls to see data
- Cards have equal visual weight → nothing stands out
- Particle background competes with content

### Solution: Content-First Hierarchy

#### Mobile Landing Page Structure (iPhone Portrait)

```
┌─────────────────────────┐
│ HEADER (60px)           │ ← Sticky, minimal, burnt orange accent
├─────────────────────────┤
│ HERO (300px max)        │ ← Compressed: tagline + 1 CTA
│ "ESPN Won't. We Will."  │
│ [View Live Games →]     │
├─────────────────────────┤
│ LIVE SCORES TICKER      │ ← Horizontal scroll, real data
│ ⚾ Texas 5-3 TCU (B7)   │
├─────────────────────────┤
│ QUICK ACCESS GRID       │ ← 2×2 grid, iconography-driven
│ ┌──────┬──────┐        │
│ │ Games│Standings│      │
│ ├──────┼──────┤        │
│ │ Teams│ Stats │        │
│ └──────┴──────┘        │
├─────────────────────────┤
│ TODAY'S BOX SCORES      │ ← Expandable cards
│ [Game 1 Summary ▼]     │
│ [Game 2 Summary ▼]     │
├─────────────────────────┤
│ CONFERENCE STANDINGS    │ ← Sortable table
│ [SEC] [Big 12] [Pac-12]│
└─────────────────────────┘
```

**Visual Weight Distribution:**
- 50% → Data tables (box scores, standings)
- 25% → Navigation and quick access
- 15% → Hero/branding
- 10% → Footer/secondary content

---

## 3. Brand Identity: Refined Burnt Orange System

### Color Palette (Revised)

#### Primary Colors

```css
/* Backgrounds (80% of screen) */
--bg-primary: #0d0d12;      /* Deep charcoal */
--bg-secondary: #161620;    /* Elevated surfaces */
--bg-tertiary: #1f1f2e;     /* Cards, modals */

/* Text (Clear hierarchy) */
--text-primary: #ffffff;    /* Headings, critical data */
--text-secondary: #e0e0e0;  /* Body copy */
--text-tertiary: #a0a0a0;   /* Labels, meta */

/* Brand Accents (10% of screen) */
--brand-primary: #bf5700;   /* CTAs, active states */
--brand-hover: #cc6600;     /* Hover effects */
--brand-subtle: #d97b38;    /* Borders, highlights */
```

#### Semantic Colors

```css
/* Status indicators */
--success: #10b981;  /* Win, live, positive */
--warning: #f59e0b;  /* Injury, delay */
--error: #ef4444;    /* Loss, error */
--info: #3b82f6;     /* Neutral info */
```

### Typography Scale

#### Font Families

```css
--font-display: 'Bebas Neue', Impact, sans-serif;  /* Headings only */
--font-body: 'Inter', system-ui, sans-serif;       /* Everything else */
--font-mono: 'SF Mono', 'Courier New', monospace;  /* Stats tables */
```

#### Type Scale (Fluid, Mobile-Optimized)

```css
/* Mobile-first sizes */
--text-xs: 0.75rem;   /* 12px - Labels */
--text-sm: 0.875rem;  /* 14px - Captions */
--text-base: 1rem;    /* 16px - Body (min for mobile) */
--text-lg: 1.125rem;  /* 18px - Subheads */
--text-xl: 1.25rem;   /* 20px - Section titles */
--text-2xl: 1.5rem;   /* 24px - Page titles */
--text-3xl: 2rem;     /* 32px - Hero (mobile) */
```

**Critical Rule:** Body text ≥16px on mobile (prevents iOS zoom on focus)

### Spacing System (8px Grid)

```css
--space-1: 0.25rem;  /* 4px  - Tight spacing */
--space-2: 0.5rem;   /* 8px  - Base unit */
--space-3: 0.75rem;  /* 12px - Small gaps */
--space-4: 1rem;     /* 16px - Standard gaps */
--space-6: 1.5rem;   /* 24px - Section spacing */
--space-8: 2rem;     /* 32px - Major sections */
--space-12: 3rem;    /* 48px - Page sections */
```

---

## 4. Mobile-First Architecture

### Responsive Breakpoints

```css
/* Mobile-first approach */
:root {
  --breakpoint-sm: 375px;  /* iPhone SE (minimum) */
  --breakpoint-md: 768px;  /* iPad portrait */
  --breakpoint-lg: 1024px; /* iPad landscape, small laptops */
  --breakpoint-xl: 1280px; /* Desktop */
}
```

### Touch Target Standards (Apple HIG)

```css
.btn, .nav-link, .card-clickable {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px; /* Ensures 44px height with text */
}

/* Exception: Dense data tables */
.table-cell {
  min-height: 36px; /* Acceptable for non-primary actions */
}
```

### Thumb Zone Optimization

```
┌─────────────────────────┐
│   Hard to Reach         │ ← Logo, metadata
│                         │
├─────────────────────────┤
│   Natural Reach         │ ← Content, scrolling
│                         │
│                         │
├─────────────────────────┤
│   Easy Reach (Thumb)    │ ← Primary CTAs, tabs
│   [Games] [Standings]   │ ← Bottom navigation
└─────────────────────────┘
```

**Place primary actions in bottom 40% of viewport.**

---

## 5. Performance Standards

### Critical Metrics (Mobile)

| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| **First Contentful Paint (FCP)** | <1.8s | ~4s | 🔴 Critical |
| **Largest Contentful Paint (LCP)** | <2.5s | ~5s | 🔴 Critical |
| **Time to Interactive (TTI)** | <3.5s | ~7s | 🔴 Critical |
| **Cumulative Layout Shift (CLS)** | <0.1 | ~0.25 | 🟡 Important |
| **Total Blocking Time (TBT)** | <300ms | ~800ms | 🔴 Critical |

### Particle System: Kill or Simplify

**Current Problem:**
- Three.js + postprocessing = ~500KB bundle
- 60fps particle animation on mobile = battery drain
- Competes with content for visual attention

**Solution A: Static Background (Recommended)**

```css
body {
  background:
    radial-gradient(circle at 20% 30%, rgba(191, 87, 0, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(204, 102, 0, 0.03) 0%, transparent 50%),
    linear-gradient(180deg, #0d0d12 0%, #161620 100%);
}
```

**Solution B: Minimal Canvas (If particles required)**

```javascript
// Ultra-lightweight: 20 particles, no postprocessing
const particleCount = 20; // Down from 500+
const geometry = new THREE.BufferGeometry();
const material = new THREE.PointsMaterial({
  size: 2,
  color: 0xbf5700,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending
});
// Remove: EffectComposer, UnrealBloomPass, etc.
```

### Bundle Size Targets

```
Total JS Bundle: <150KB gzipped
├── Critical path: <50KB (inline)
├── Framework (React/Preact): <40KB
├── UI components: <30KB
└── Utilities: <30KB

Total CSS: <15KB gzipped
├── Critical (above-fold): <5KB (inline)
└── Full stylesheet: <15KB
```

### Image Optimization

```html
<!-- Responsive images with WebP -->
<picture>
  <source srcset="/icons/baseball.webp" type="image/webp">
  <img src="/icons/baseball.png" alt="Baseball" width="32" height="32" loading="lazy">
</picture>
```

**Icon Strategy:**
- Replace Font Awesome with inline SVGs (save ~80KB)
- Use SVG sprites for repeated icons
- Compress with SVGO

---

## 6. Component Architecture: Reusable Design System

### Component Library Structure

```
/components
├── primitives/
│   ├── Button.tsx        # All button variants
│   ├── Card.tsx          # Base card component
│   ├── Input.tsx         # Form inputs
│   └── Typography.tsx    # Text components
├── patterns/
│   ├── DataTable.tsx     # Sortable stats tables
│   ├── BoxScore.tsx      # Baseball box score
│   ├── StandingsTable.tsx
│   └── GameCard.tsx      # Live game summary
├── layouts/
│   ├── Page.tsx          # Page wrapper
│   ├── Section.tsx       # Section spacing
│   └── Grid.tsx          # Responsive grids
└── features/
    ├── LiveScoreTicker.tsx
    ├── ConferenceSelector.tsx
    └── PlayerStatCard.tsx
```

### Design Token System

**File:** `/public/css/bsi-tokens.css` (Already exists—needs refinement)

```css
/* Semantic tokens (component-level) */
:root {
  /* Buttons */
  --btn-primary-bg: var(--brand-primary);
  --btn-primary-hover: var(--brand-hover);
  --btn-primary-text: #ffffff;

  /* Cards */
  --card-bg: var(--bg-secondary);
  --card-border: rgba(255, 255, 255, 0.1);
  --card-hover-shadow: 0 8px 24px rgba(191, 87, 0, 0.15);

  /* Tables */
  --table-header-bg: var(--bg-tertiary);
  --table-row-hover: rgba(191, 87, 0, 0.05);
  --table-border: rgba(255, 255, 255, 0.08);
}
```

---

## 7. Content Presentation: Data-First Design

### Box Score Component (Priority #1)

#### Design Requirements

1. **At-a-Glance Summary (Collapsed State)**
   ```
   ┌─────────────────────────────────────────┐
   │ Texas 5, TCU 3 • Final                  │
   │ ⚾ Mar 15 • 7:05 PM CDT                 │
   │                                          │
   │ [Expand for Full Box Score ▼]          │
   └─────────────────────────────────────────┘
   ```

2. **Full Box Score (Expanded State)**
   ```
   ┌─────────────────────────────────────────┐
   │ BATTING                                  │
   ├───┬───┬──┬──┬───┬───┬──┬──┬─────┤
   │ Player   │AB│ R│ H│RBI│BB│SO│ AVG │
   ├──────────┼──┼──┼──┼───┼──┼──┼─────┤
   │ Smith, J │ 4│ 1│ 2│  1│ 0│ 1│.312 │
   │ Johnson  │ 3│ 2│ 1│  2│ 1│ 0│.289 │
   └──────────┴──┴──┴──┴───┴──┴──┴─────┘

   ┌─────────────────────────────────────────┐
   │ PITCHING                                 │
   ├───────────┬──┬──┬──┬──┬──┬──┬─────┤
   │ Pitcher   │IP│ H│ R│ER│BB│SO│ ERA │
   ├───────────┼──┼──┼──┼──┼──┼──┼─────┤
   │ Davis, M  │6.0│5│ 3│ 3│ 2│ 8│3.15│
   │ Martinez* │3.0│2│ 0│ 0│ 0│ 5│1.98│
   └───────────┴──┴──┴──┴──┴──┴──┴─────┘
   ```

#### Technical Implementation

```tsx
// BoxScore.tsx
interface BoxScoreProps {
  gameId: string;
  homeTeam: Team;
  awayTeam: Team;
  battingStats: PlayerBattingStats[];
  pitchingStats: PlayerPitchingStats[];
  lastUpdated: Date;
}

export const BoxScore: React.FC<BoxScoreProps> = ({ ... }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="box-score">
      <CardHeader>
        <GameSummary {...} />
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Collapse' : 'Expand'} Box Score
        </button>
      </CardHeader>

      {expanded && (
        <CardBody>
          <DataTable
            columns={BATTING_COLUMNS}
            data={battingStats}
            sortable
            dense
          />
          <DataTable
            columns={PITCHING_COLUMNS}
            data={pitchingStats}
            sortable
            dense
          />
        </CardBody>
      )}

      <CardFooter>
        <DataSource>
          ESPN API • Updated {formatTimeAgo(lastUpdated)}
        </DataSource>
      </CardFooter>
    </Card>
  );
};
```

### Standings Table (Priority #2)

#### Design Requirements

```
┌─────────────────────────────────────────────────────────┐
│ SEC STANDINGS • 2025 Season                              │
├────┬──────────────┬────┬────┬─────┬──────┬─────┬───────┤
│Rk │ Team         │ W  │ L  │ Pct │ GB  │Strk │ Home   │
├────┼──────────────┼────┼────┼─────┼──────┼─────┼───────┤
│ 1  │ Tennessee    │ 18 │ 3  │.857 │ -   │ W7  │ 12-1  │
│ 2  │ Texas A&M    │ 16 │ 5  │.762 │ 2.0 │ W3  │ 10-2  │
│ 3  │ Florida      │ 15 │ 6  │.714 │ 3.0 │ L1  │ 9-3   │
│ 4  │ Arkansas     │ 14 │ 7  │.667 │ 4.0 │ W2  │ 8-4   │
└────┴──────────────┴────┴────┴─────┴──────┴─────┴───────┘
```

**Features:**
- Click column headers to sort
- Sticky header on scroll
- Team logos (16×16px) inline with names
- Color-coded streaks (green = win, red = loss)
- Mobile: Hide "Home" column, show in tap-to-expand

---

## 8. Accessibility Compliance (WCAG AA)

### Current Failures

1. **Color Contrast**
   - Text on glassmorphism backgrounds fails 4.5:1 ratio
   - Burnt orange on dark charcoal = 3.2:1 (needs 4.5:1)

2. **Keyboard Navigation**
   - Particle canvas steals focus
   - No visible focus indicators on cards

3. **Screen Reader Support**
   - Missing ARIA labels on data tables
   - Live score updates don't announce to screen readers

### Required Fixes

#### Contrast Ratios (WCAG AA)

```css
/* Pass: 7:1 ratio */
--text-primary: #ffffff;     /* on #0d0d12 */
--text-secondary: #e0e0e0;   /* on #0d0d12 */

/* Pass: 4.8:1 ratio */
--brand-on-dark: #d97b38;    /* Lighter burnt orange for text */

/* Fail: 3.2:1 → Must not use for text */
--brand-primary: #bf5700;    /* Backgrounds/borders only */
```

**Tool for verification:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### Keyboard Navigation

```tsx
// All interactive elements must be keyboard accessible
<Card
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  className="focus-visible:ring-2 focus-visible:ring-brand-primary"
>
  {/* Card content */}
</Card>
```

```css
/* Visible focus indicators */
.focus-visible\:ring-2:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

#### Screen Reader Support

```tsx
// Live regions for score updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {`Texas leads TCU 5 to 3 in the 7th inning`}
</div>

// Data tables with proper structure
<table role="table" aria-label="SEC Baseball Standings">
  <thead>
    <tr>
      <th scope="col" aria-sort="ascending">Rank</th>
      <th scope="col">Team</th>
      <th scope="col" abbr="Wins">W</th>
      <th scope="col" abbr="Losses">L</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <th scope="row">Tennessee</th>
      <td>18</td>
      <td>3</td>
    </tr>
  </tbody>
</table>
```

---

## 9. Deployment Architecture

### Cloudflare Pages + Functions (Current Setup)

**Advantages:**
- Edge CDN (sub-50ms global latency)
- Serverless functions (no server maintenance)
- D1 database (SQL at the edge)
- KV storage (caching layer)

### Recommended Stack Refinement

```yaml
# Current (Heavy)
Frontend:
  - React 18 (~40KB)
  - Three.js (~500KB)
  - Chart.js (~200KB)
  - Font Awesome (~80KB)
Total: ~820KB + app code

# Recommended (Lightweight)
Frontend:
  - Preact (~4KB) or vanilla JS
  - CSS animations (0KB, native)
  - Inline SVG charts (~5KB)
  - SVG sprite icons (~10KB)
Total: <50KB + app code
```

### API Strategy

```javascript
// functions/api/college-baseball/games/live.js
export async function onRequest({ request, env }) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  // Check KV cache (30s TTL for live games)
  let response = await cache.match(cacheKey);
  if (response) return response;

  // Fetch from ESPN API
  const data = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard');
  const json = await data.json();

  // Transform to our schema
  const games = transformESPNData(json);

  // Cache for 30 seconds
  response = new Response(JSON.stringify(games), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
      'CDN-Cache-Control': 'public, max-age=30'
    }
  });

  await cache.put(cacheKey, response.clone());
  return response;
}
```

---

## 10. Competitive Positioning: Visual Differentiation

### Comparative Analysis

| Feature | ESPN | D1Baseball | Baseball America | **Blaze** |
|---------|------|------------|------------------|-----------|
| **Mobile Box Scores** | ❌ Score only | ✅ Full | ⚠️ Paywall | ✅ Free, complete |
| **Conference Standings** | ⚠️ Generic | ✅ Detailed | ✅ With RPI | ✅ + Projections |
| **Player Stats** | ❌ None | ✅ Basic | ✅ Advanced | ✅ + Draft tracking |
| **Design Quality** | 6/10 | 4/10 | 5/10 | **Target: 9/10** |
| **Mobile Performance** | 7/10 | 5/10 | 4/10 | **Target: 9/10** |
| **Data Transparency** | ❌ None | ⚠️ Limited | ⚠️ Limited | ✅ Full sources |

### Visual Differentiation Strategy

**Blaze's Unique Design Language:**

1. **Dark Mode First**
   - ESPN = white backgrounds (eye strain at night)
   - Blaze = OLED-friendly dark theme (battery savings on mobile)

2. **Data Density Without Clutter**
   - ESPN = ads + navigation > content
   - Blaze = 70% screen space for stats

3. **Consistent Iconography**
   - ESPN = mixed styles (some FontAwesome, some custom)
   - Blaze = unified SVG sprite system (recognizable at a glance)

4. **Burnt Orange as Signature, Not Flood**
   - Texas athletics = burnt orange everywhere
   - Blaze = strategic accent (highlights, CTAs) → premium feel

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Priority: Mobile Performance + Data Hierarchy**

- [ ] Remove Three.js particle system (save 500KB)
- [ ] Replace Font Awesome with inline SVGs (save 80KB)
- [ ] Implement mobile-first landing page structure
- [ ] Compress hero section from 100vh to 300px
- [ ] Move live scores ticker to top (above fold)

**Target Metrics:**
- FCP: <1.8s (from ~4s)
- LCP: <2.5s (from ~5s)
- Bundle size: <150KB (from ~1MB)

### Phase 2: Component Library (Week 3-4)

**Priority: Box Scores + Standings Tables**

- [ ] Build `BoxScore.tsx` with expand/collapse
- [ ] Build `StandingsTable.tsx` with sortable columns
- [ ] Build `GameCard.tsx` for live score summaries
- [ ] Build `DataTable.tsx` base component (reusable)
- [ ] Implement responsive breakpoints (mobile-first)

**Target Metrics:**
- Box score visible in <2 taps from homepage
- Standings table scrollable with sticky headers
- All interactive elements ≥44px touch targets

### Phase 3: Accessibility & Polish (Week 5-6)

**Priority: WCAG AA Compliance**

- [ ] Fix color contrast ratios (all text ≥4.5:1)
- [ ] Add visible focus indicators
- [ ] Implement ARIA labels for data tables
- [ ] Add live regions for score updates
- [ ] Test with VoiceOver (iOS) and TalkBack (Android)

**Target Metrics:**
- 0 WCAG AA violations (Lighthouse audit)
- 100% keyboard navigable
- Screen reader compatible

### Phase 4: Advanced Features (Week 7-8)

**Priority: Differentiation**

- [ ] Player stat cards with MLB draft tracking
- [ ] Conference selector with URL state persistence
- [ ] Historical comparisons (season-over-season)
- [ ] AI Copilot integration (natural language search)

**Target Metrics:**
- User engagement: avg 3+ pages per session
- Return visitor rate: >40%

---

## Success Metrics: 9/10 Quality Checklist

### Design Quality (Subjective)

- [ ] **Visual Hierarchy Clear:** Users find box scores in <5 seconds
- [ ] **Brand Consistent:** Burnt orange used strategically (not overwhelming)
- [ ] **Mobile-Optimized:** Navigation thumb-friendly, text readable without zoom
- [ ] **Aesthetically Pleasing:** Clean, modern, not cluttered
- [ ] **Differentiated:** Visually distinct from ESPN/D1Baseball

### Performance (Objective)

- [ ] **FCP:** <1.8s on mobile 4G
- [ ] **LCP:** <2.5s on mobile 4G
- [ ] **CLS:** <0.1 (no layout shifts)
- [ ] **TTI:** <3.5s on mobile 4G
- [ ] **Lighthouse Score:** ≥90 (Performance, Accessibility, Best Practices)

### Accessibility (Objective)

- [ ] **WCAG AA Compliant:** 0 violations in axe DevTools
- [ ] **Keyboard Navigable:** All interactions accessible without mouse
- [ ] **Screen Reader Compatible:** VoiceOver/TalkBack announce content correctly
- [ ] **Touch Targets:** All interactive elements ≥44×44px

### Content Presentation (Objective)

- [ ] **Box Scores Complete:** AB, R, H, RBI, BB, SO, AVG (batting) / IP, H, R, ER, BB, SO, ERA (pitching)
- [ ] **Standings Sortable:** Click column headers to sort
- [ ] **Live Updates:** Scores refresh every 30-60s during games
- [ ] **Data Sourced:** Every stat includes provider + timestamp

### Competitive Positioning (Subjective)

- [ ] **Feature Parity:** Everything ESPN shows + what they don't (box scores)
- [ ] **Design Superior:** More polished than D1Baseball
- [ ] **Mobile Better:** Faster, cleaner UX than all competitors
- [ ] **Trust Signals:** Data sources cited, methodology transparent

---

## Conclusion: Architectural Decisions for 9/10

### Critical Changes (Must-Do)

1. **Kill the particle system** → Save 500KB, eliminate visual distraction
2. **Invert hierarchy** → Data first, branding second
3. **Mobile-optimize everything** → iPhone portrait as primary design canvas
4. **Simplify color usage** → Burnt orange as accent (10% of screen), not background (50%)
5. **Fix accessibility** → WCAG AA compliance non-negotiable

### Strategic Changes (High-Value)

6. **Component library** → Reusable `BoxScore`, `StandingsTable`, `GameCard`
7. **Performance budget** → <150KB JS bundle, <15KB CSS
8. **Data transparency** → Every stat shows source + timestamp
9. **Progressive disclosure** → Summary → details → advanced (don't overwhelm)
10. **Thumb-zone UX** → Primary CTAs in bottom 40% of mobile viewport

### Long-Term Vision

**Blaze = The anti-ESPN for college baseball**

- ESPN shows you ads and scores → Blaze shows you complete intelligence
- ESPN treats mobile as afterthought → Blaze treats mobile as priority
- ESPN hides data sources → Blaze cites every statistic
- ESPN designed for desktop → Blaze designed for iPhone in your hand during games

**When users say "9/10," they mean:**
- "I found what I needed in seconds"
- "The design didn't get in the way"
- "This is clearly better than ESPN for college baseball"
- "I trust this data because sources are cited"
- "It works flawlessly on my phone"

That's the standard. Build to that.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16
**Author:** Claude (Sonnet 4.5) via Blaze Intelligence Architecture Session
**Next Review:** After Phase 1 completion
