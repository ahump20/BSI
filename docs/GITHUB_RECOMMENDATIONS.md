# GitHub Repository Recommendations for BSI

**Date:** 2026-01-14  
**Purpose:** Actionable improvements sourced from GitHub research to enhance blazesportsintel.com

---

## Executive Summary

Research identified repositories and best practices across:
- Sports analytics tracking (56 repos found)
- Next.js dashboard implementations (5 relevant repos)
- Baseball-specific analytics (4 sabermetrics repos)
- Real-time scoreboard patterns (6 implementations)

Key finding: BSI's architecture is solid. Focus should be on adding **proven patterns** from these repos rather than wholesale changes.

---

## Priority 1: Real-Time Tracking Improvements

### Source Repository: ScorePulse
**URL:** https://github.com/aryaan022/ScorePulse  
**Language:** JavaScript (React)  
**Stars:** 1  
**Value:** Production-ready real-time refresh pattern

#### Applicable Pattern
```javascript
// Auto-refresh every N seconds without page reload
useEffect(() => {
  const interval = setInterval(() => {
    fetchLiveData();
  }, 5000); // 5 second refresh
  return () => clearInterval(interval);
}, []);
```

#### BSI Implementation
**File to modify:** `app/college-baseball/games/page.tsx`, `app/mlb/scores/page.tsx`

**Current issue:** Per CURRENT_STATE.md, "College baseball shows 'Loading...'" - likely stale endpoints.

**Action:**
1. Add auto-refresh hook to live score pages
2. Implement exponential backoff on API failures
3. Add visual indicator when data is stale (timestamp + "Updated X seconds ago")

**Minimal change:**
- Create `hooks/useAutoRefresh.ts` (new file, 30 lines)
- Add to existing score pages (2 line change per file)

---

## Priority 2: College Baseball Analytics

### Source Repository: collegebaseball (Python)
**URL:** http://collegebaseball.readthedocs.io/  
**Language:** Python  
**Value:** Advanced metrics calculation patterns

#### Applicable Patterns
1. **WAR (Wins Above Replacement) calculation methodology** - BSI already has WAR in README, verify implementation matches industry standard
2. **Park factor adjustments** - Critical for college baseball where field dimensions vary wildly
3. **Conference strength ratings** - Use SOS (Strength of Schedule) multipliers

#### BSI Implementation
**Files to review:** `lib/adapters/ncaa-baseball-adapter.ts`

**Action:**
1. Verify BSI's WAR calculation matches collegebaseball's formula
2. Add park factor table to D1 database (300+ D1 programs = 300 park factors)
3. Implement conference strength multiplier in rankings

**Database addition:**
```sql
-- Add to schema/
CREATE TABLE park_factors (
  team_id INTEGER PRIMARY KEY,
  park_name TEXT NOT NULL,
  runs_factor REAL DEFAULT 1.0,
  hr_factor REAL DEFAULT 1.0,
  last_updated TEXT NOT NULL
);
```

---

## Priority 3: Sports Analytics Ball Tracking (Video)

### Source Repository: fast-volleyball-tracking-inference
**URL:** https://github.com/asigatchov/fast-volleyball-tracking-inference  
**Language:** Python (ONNX model)  
**Stars:** 35  
**Value:** Real-time ball tracking at 100 FPS on CPU

#### Applicable Concept
BSI currently has no video analysis. This repo demonstrates:
- Lightweight ONNX models (no GPU required)
- CSV output for tracking coordinates
- Optional visualization overlay

#### BSI Implementation (Future Enhancement)
**Not immediate priority** - BSI lacks video infrastructure. Document for Phase 2.

**If implemented:**
1. Add `workers/bsi-video-tracker` Cloudflare Worker
2. Use R2 bucket `blaze-video-archive` for storage
3. Output tracking data to D1 `bsi-game-db`

**Estimated effort:** 40 hours (not minimal change - defer)

---

## Priority 4: Next.js Dashboard Components

### Source Repository: TailAdmin Components
**URL:** https://tailadmin.com/nextjs-components  
**Value:** 500+ dashboard components for Next.js + Tailwind

#### Applicable Components
BSI already uses Tailwind. TailAdmin offers production-ready:
1. **Stat cards with sparklines** - for dashboard KPIs
2. **Live data tables** - sortable, filterable team/player stats
3. **Timeline components** - for game progression/play-by-play

#### BSI Implementation
**File to modify:** `app/dashboard/page.tsx`

**Current issue:** Per CURRENT_STATE.md, "Dashboard shows placeholder data"

**Action:**
1. Replace placeholder cards with TailAdmin stat card pattern (maintains existing Tailwind classes)
2. Add live data wiring to existing API endpoints
3. Use TailAdmin table component for stats tables

**License check:** TailAdmin offers free tier (check before use). If paid, use patterns only (no copy-paste).

**Minimal change:**
- Refactor dashboard cards (50 lines)
- Wire to APIs (20 lines per card)

---

## Priority 5: Cloudflare Workers API Pattern

### Source Repository: api_soccerOddsMyanmar
**URL:** https://github.com/aunghein-dev/api_soccerOddsMyanmar  
**Language:** JavaScript  
**Stars:** 1  
**Value:** Clean Cloudflare Worker API proxy pattern

#### Applicable Pattern
```javascript
// Cloudflare Worker proxy with caching
export default {
  async fetch(request, env) {
    const cache = caches.default;
    let response = await cache.match(request);
    
    if (!response) {
      response = await fetch(externalAPI);
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=300');
      await cache.put(request, response.clone());
    }
    
    return response;
  }
};
```

#### BSI Implementation
**Files to review:** `workers/bsi-*` and `functions/api/*`

**Action:**
1. Audit existing workers for cache-first pattern
2. Add standardized caching to all API functions
3. Implement stale-while-revalidate for live scores

**Minimal change:**
- Add caching wrapper utility (30 lines)
- Apply to 10-15 API functions (2 lines each)

---

## Priority 6: Chart Library for Sports Data

### Research Finding: Recharts vs Chart.js
**Recharts:** React-native, excellent TypeScript support, composable  
**Chart.js:** More popular, extensive chart types, harder React integration

**BSI current state:** Uses Recharts (per package.json: `"recharts": "^3.5.1"`)

#### Recommendation
**Keep Recharts.** BSI already has it. Add patterns from:
- https://ably.com/blog/informational-dashboard-with-nextjs-and-recharts (Recharts + Next.js guide)

#### Applicable Patterns
1. **Area chart for WAR trends** (player career arcs)
2. **Radar chart for player comparisons** (5-tool comparison)
3. **Bar chart for team stats** (conference standings)

**Current use:** Dashboard likely uses basic charts. Expand to advanced visualizations.

**Action:**
1. Add WAR trend chart to player pages
2. Add radar chart to player comparison tool
3. Ensure all charts are accessible (ARIA labels, keyboard nav)

**Files to modify:**
- `app/college-baseball/players/[playerId]/page.tsx` (add WAR chart)
- `components/dashboard/` (create PlayerRadarChart.tsx)

---

## Priority 7: TypeScript Sports API Patterns

### Finding: No dominant TypeScript sports API wrapper
Most sports API wrappers are Python. BSI's TypeScript approach is correct for Cloudflare Workers.

#### BSI Implementation (Validation)
**Files to review:** `lib/adapters/*`

**Action:**
1. Ensure all adapters have explicit return types (per CLAUDE.md)
2. Add Zod validation for external API responses
3. Create shared types for common entities (Game, Team, Player)

**Example improvement:**
```typescript
// lib/adapters/types.ts (new file)
import { z } from 'zod';

export const GameSchema = z.object({
  id: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
  status: z.enum(['scheduled', 'live', 'final']),
  timestamp: z.string().datetime(),
});

export type Game = z.infer<typeof GameSchema>;
```

**Minimal change:**
- Create shared types file (100 lines)
- Add Zod validation to adapters (5 lines per adapter)

---

## Priority 8: Sabermetrics Formulas

### Source Repository: 2025-Undervalued-MLB-Players
**URL:** https://github.com/shirinalapati/2025-Undervalued-MLB-Players  
**Language:** Python  
**Value:** UVS (Undervalued Score) formula implementation

#### Applicable Concept
BSI has "NIL Valuation Engine using FMNV models" per README. Similar concept to UVS.

**Action:**
1. Cross-reference BSI's FMNV formula with UVS methodology
2. Verify BSI accounts for:
   - Market size adjustments (Texas vs. small market schools)
   - Position scarcity multipliers (catchers vs. outfielders)
   - Performance trends (hot streaks weighted higher)

**Files to review:**
- Search for NIL valuation logic: `grep -r "NIL" lib/`
- Verify formula transparency (citations required per CLAUDE.md)

**Minimal change:**
- Document FMNV formula in `docs/NIL_METHODOLOGY.md` (new file)
- Add formula citations to NIL pages

---

## Priority 9: Real-Time WebSocket Pattern

### Source Repository: Sports-Club-Management
**URL:** https://github.com/AnasSlimani/Sports-Club-Management  
**Features:** "real-time team chat with WebSocket"

#### Applicable Concept
BSI has Durable Objects binding (`bsi-news-ticker` per CURRENT_STATE.md). Not using WebSockets yet.

**Potential use cases:**
1. Live score updates pushed to clients (no polling)
2. Breaking news ticker (transfer portal, injuries)
3. Real-time betting line movements (if BSI adds sports betting)

**Action (deferred):**
Not minimal change. WebSocket requires infrastructure shift. Document for future.

**If implemented:**
- Use Cloudflare Durable Objects for WebSocket state
- Create `workers/bsi-live-updates` with WebSocket handler
- Add WebSocket client to dashboard

**Estimated effort:** 20 hours (defer to Phase 2)

---

## Implementation Priority Matrix

| Priority | Item | Effort | Impact | Files Changed |
|----------|------|--------|--------|---------------|
| **P1** | Auto-refresh hook | 1 hour | High | 1 new, 3 modified |
| **P2** | Park factors table | 2 hours | Medium | 1 schema, 1 adapter |
| **P3** | Dashboard live data | 3 hours | High | 5 modified |
| **P4** | TypeScript shared types | 2 hours | Medium | 1 new, 10 modified |
| **P5** | API caching wrapper | 2 hours | High | 1 new, 15 modified |
| **P6** | Advanced charts | 4 hours | Medium | 2 new, 3 modified |
| **P7** | NIL methodology docs | 1 hour | Low | 1 new |
| **P8** | Zod validation | 3 hours | Medium | 1 new, 8 modified |
| **P9** | WebSockets (defer) | 20 hours | Low | N/A |
| **P10** | Video tracking (defer) | 40 hours | Low | N/A |

**Total immediate work:** 18 hours (P1-P8)  
**Total deferred work:** 60 hours (P9-P10)

---

## Non-Recommendations (Avoided Sprawl)

### Rejected Ideas
1. **Don't add:** New UI framework (BSI uses Tailwind + Next.js - solid)
2. **Don't add:** Python data pipeline (BSI is TypeScript-only per CLAUDE.md)
3. **Don't add:** GraphQL layer (REST APIs work, don't overcomplicate)
4. **Don't add:** Separate mobile app (BSI is mobile-first responsive)
5. **Don't add:** New database (D1 + KV + R2 covers all use cases)

### Rationale
Per CLAUDE.md: "Every file added is technical debt. Every abstraction is complexity. Default to less."

These repos use different tech stacks. Extract **patterns**, not dependencies.

---

## Next Steps

1. **Validate with owner:** Review this document with Austin Humphrey
2. **Select P1-P3:** Start with highest impact, lowest effort items
3. **Create issues:** One GitHub issue per priority item
4. **Implement incrementally:** Use `report_progress` after each item
5. **Document sources:** Add citations to code comments (per CLAUDE.md)

---

## Resources

### GitHub Repositories Referenced
- [ScorePulse](https://github.com/aryaan022/ScorePulse) - Real-time refresh
- [collegebaseball](http://collegebaseball.readthedocs.io/) - Advanced metrics
- [fast-volleyball-tracking-inference](https://github.com/asigatchov/fast-volleyball-tracking-inference) - Video analysis
- [api_soccerOddsMyanmar](https://github.com/aunghein-dev/api_soccerOddsMyanmar) - Cloudflare Worker pattern
- [2025-Undervalued-MLB-Players](https://github.com/shirinalapati/2025-Undervalued-MLB-Players) - Valuation formulas

### Documentation
- [TailAdmin Components](https://tailadmin.com/nextjs-components)
- [Recharts + Next.js Guide](https://ably.com/blog/informational-dashboard-with-nextjs-and-recharts)
- [SportsDataverse](https://www.sportsdataverse.org/packages)

---

*Generated: 2026-01-14 | Based on GitHub search of 56 sports analytics repos*
