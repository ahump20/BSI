# Design Implementation Checklist: 3/10 → 9/10

**Quick Reference for Immediate Actions**

---

## Critical Path (Do This First)

### 1. Performance: Remove Visual Bloat

```bash
# Files to modify/delete
- /public/js/blaze-particle-minimal.js → DELETE (save 500KB)
- index.html line 59-66 → REMOVE Three.js imports
- index.html line 197-206 → REMOVE #particle-field styles
- index.html line 1581 → REMOVE <canvas id="particle-field">
```

**Replace with:**

```css
/* Static gradient background (0KB) */
body {
  background:
    radial-gradient(circle at 20% 30%, rgba(191, 87, 0, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(204, 102, 0, 0.03) 0%, transparent 50%),
    linear-gradient(180deg, #0d0d12 0%, #161620 100%);
}
```

**Expected Result:**

- Bundle size: -500KB
- FCP: -2s improvement
- Mobile battery: +30min usage

---

### 2. Hierarchy: Compress Hero, Elevate Data

**Current:** Hero = 100vh (user must scroll to see data)
**Target:** Hero = 300px max (data visible immediately)

```css
/* index.html line 384-393 */
.hero {
  min-height: 300px; /* Changed from 100vh */
  padding: 2rem 1rem; /* Reduced from 6rem 2rem 4rem */
}

.hero-title {
  font-size: clamp(2rem, 6vw, 3.5rem); /* Smaller than current 3rem-6rem */
}

.hero-subtitle {
  max-width: 550px; /* Reduced from 700px */
  font-size: clamp(1rem, 2vw, 1.25rem); /* Smaller for mobile */
}
```

**Add this section BEFORE "Platform Access Hub":**

```html
<!-- Live Scores Ticker (Priority Content) -->
<section class="live-scores-featured" style="padding: 2rem 1rem; background: var(--bg-secondary);">
  <div class="section-container">
    <h2 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--text-secondary);">
      Live Games
    </h2>
    <div id="live-games-container" style="display: flex; gap: 1rem; overflow-x: auto;">
      <!-- Populated via API -->
      <div
        class="game-card-mini"
        style="min-width: 280px; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;"
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Texas</span>
          <strong style="color: var(--brand-primary);">5</strong>
        </div>
        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;"
        >
          <span>TCU</span>
          <strong>3</strong>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 0.5rem;">
          Bottom 7th • 2 Outs
        </p>
      </div>
      <!-- Repeat for each live game -->
    </div>
  </div>
</section>
```

---

### 3. Mobile: Touch Targets & Thumb Zone

**Fix all interactive elements:**

```css
/* Add to index.html <style> section */
.nav-link,
.cta-btn,
.access-card,
.feature-card,
.sport-card {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Bottom navigation for mobile (add before closing </body>) */
@media (max-width: 768px) {
  .mobile-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    justify-content: space-around;
    background: var(--bg-secondary);
    border-top: 1px solid rgba(191, 87, 0, 0.15);
    padding: 0.5rem 0;
  }

  .mobile-bottom-nav a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: 0.75rem;
    min-width: 60px;
  }

  .mobile-bottom-nav a.active {
    color: var(--brand-primary);
  }

  .mobile-bottom-nav svg {
    width: 24px;
    height: 24px;
  }
}
```

**Add before closing `</body>`:**

```html
<!-- Mobile Bottom Navigation (Thumb Zone) -->
<nav class="mobile-bottom-nav" aria-label="Mobile navigation">
  <a href="/college-baseball/games" class="active">
    <svg><!-- Games icon --></svg>
    Games
  </a>
  <a href="/college-baseball/standings">
    <svg><!-- Standings icon --></svg>
    Standings
  </a>
  <a href="/college-baseball/teams">
    <svg><!-- Teams icon --></svg>
    Teams
  </a>
  <a href="/college-baseball/players">
    <svg><!-- Stats icon --></svg>
    Stats
  </a>
</nav>
```

---

### 4. Accessibility: Contrast & Focus

**Fix failing contrast ratios:**

```css
/* Replace in index.html :root section */
:root {
  /* OLD (fails WCAG AA): */
  /* --text-tertiary: rgba(255, 235, 215, 0.75); */

  /* NEW (passes 4.5:1): */
  --text-tertiary: #b8b8b8; /* Lighter gray for contrast */

  /* Brand text (for on-dark backgrounds): */
  --brand-text: #d97b38; /* Lighter burnt orange (4.8:1 ratio) */
}

/* Replace all instances of var(--blaze-copper) for TEXT with: */
color: var(--brand-text);
```

**Add visible focus states:**

```css
/* Add after line 395 in index.html */
*:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
a:focus-visible,
.card:focus-visible {
  box-shadow: 0 0 0 4px rgba(191, 87, 0, 0.3);
}
```

---

### 5. Brand: Strategic Burnt Orange Usage

**Current Problem:** Burnt orange everywhere = visual fatigue

**Solution:** Use burnt orange for 10% of screen (accents only)

```css
/* Surface colors (80% of screen) */
body {
  background: var(--dark-charcoal);
}
.card {
  background: var(--bg-secondary);
}
.section {
  background: var(--bg-tertiary);
}

/* Burnt orange accents (10% of screen) - ONLY for: */
.cta-btn-primary {
  background: var(--gradient-primary);
} /* Primary CTAs */
.nav-btn-primary {
  background: var(--gradient-primary);
} /* Active nav */
.brand-highlight {
  color: var(--brand-text);
} /* Key metrics */
.border-accent {
  border-left: 4px solid var(--brand-primary);
} /* Visual emphasis */
```

**Remove burnt orange from:**

- Card backgrounds (use dark gray)
- Body text (use white/gray)
- All borders (use subtle white/10% opacity)
- Hover effects on non-CTAs (use subtle glow instead)

---

## Component Library (Build These Next)

### BoxScore Component

**File:** `/components/BoxScore.tsx`

```tsx
import { useState } from 'react';

interface BoxScoreProps {
  gameId: string;
  homeTeam: { name: string; abbr: string; score: number };
  awayTeam: { name: string; abbr: string; score: number };
  battingStats: Array<{
    player: string;
    ab: number;
    r: number;
    h: number;
    rbi: number;
    bb: number;
    so: number;
    avg: string;
  }>;
  pitchingStats: Array<{
    player: string;
    ip: string;
    h: number;
    r: number;
    er: number;
    bb: number;
    so: number;
    era: string;
  }>;
}

export const BoxScore: React.FC<BoxScoreProps> = ({
  homeTeam,
  awayTeam,
  battingStats,
  pitchingStats,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="box-score-card">
      {/* Summary (Always Visible) */}
      <div className="box-score-summary">
        <div className="score-line">
          <span className="team-name">{awayTeam.name}</span>
          <strong className="score">{awayTeam.score}</strong>
        </div>
        <div className="score-line">
          <span className="team-name">{homeTeam.name}</span>
          <strong className="score">{homeTeam.score}</strong>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="expand-btn"
          aria-expanded={expanded}
        >
          {expanded ? 'Hide' : 'Show'} Full Box Score
        </button>
      </div>

      {/* Detailed Stats (Collapsible) */}
      {expanded && (
        <div className="box-score-details">
          <h3>Batting</h3>
          <table role="table" aria-label="Batting statistics">
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col" abbr="At Bats">
                  AB
                </th>
                <th scope="col" abbr="Runs">
                  R
                </th>
                <th scope="col" abbr="Hits">
                  H
                </th>
                <th scope="col" abbr="RBI">
                  RBI
                </th>
                <th scope="col" abbr="Walks">
                  BB
                </th>
                <th scope="col" abbr="Strikeouts">
                  SO
                </th>
                <th scope="col" abbr="Batting Average">
                  AVG
                </th>
              </tr>
            </thead>
            <tbody>
              {battingStats.map((player, i) => (
                <tr key={i}>
                  <th scope="row">{player.player}</th>
                  <td>{player.ab}</td>
                  <td>{player.r}</td>
                  <td>{player.h}</td>
                  <td>{player.rbi}</td>
                  <td>{player.bb}</td>
                  <td>{player.so}</td>
                  <td>{player.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Pitching</h3>
          <table role="table" aria-label="Pitching statistics">
            <thead>
              <tr>
                <th scope="col">Pitcher</th>
                <th scope="col" abbr="Innings Pitched">
                  IP
                </th>
                <th scope="col" abbr="Hits">
                  H
                </th>
                <th scope="col" abbr="Runs">
                  R
                </th>
                <th scope="col" abbr="Earned Runs">
                  ER
                </th>
                <th scope="col" abbr="Walks">
                  BB
                </th>
                <th scope="col" abbr="Strikeouts">
                  SO
                </th>
                <th scope="col" abbr="ERA">
                  ERA
                </th>
              </tr>
            </thead>
            <tbody>
              {pitchingStats.map((pitcher, i) => (
                <tr key={i}>
                  <th scope="row">{pitcher.player}</th>
                  <td>{pitcher.ip}</td>
                  <td>{pitcher.h}</td>
                  <td>{pitcher.r}</td>
                  <td>{pitcher.er}</td>
                  <td>{pitcher.bb}</td>
                  <td>{pitcher.so}</td>
                  <td>{pitcher.era}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

**Styles:** Add to `/public/css/components.css`

```css
.box-score-card {
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.box-score-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.score-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.125rem;
}

.team-name {
  font-weight: 600;
  color: var(--text-primary);
}

.score {
  font-size: 1.5rem;
  font-family: var(--font-display);
  color: var(--brand-primary);
}

.expand-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: var(--bg-primary);
  border-color: var(--brand-primary);
  color: var(--brand-text);
}

.box-score-details {
  margin-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 1rem;
}

.box-score-details h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.box-score-details table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.box-score-details thead {
  background: var(--bg-tertiary);
}

.box-score-details th,
.box-score-details td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.box-score-details th[scope='col'] {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  font-weight: 600;
}

.box-score-details th[scope='row'] {
  font-weight: 500;
  color: var(--text-primary);
}

.box-score-details td {
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

/* Mobile: Smaller fonts, compact spacing */
@media (max-width: 768px) {
  .box-score-details table {
    font-size: 0.75rem;
  }

  .box-score-details th,
  .box-score-details td {
    padding: 0.375rem 0.5rem;
  }
}
```

---

### StandingsTable Component

**File:** `/components/StandingsTable.tsx`

```tsx
import { useState } from 'react';

interface Team {
  rank: number;
  name: string;
  logo: string;
  wins: number;
  losses: number;
  pct: string;
  gb: string;
  streak: string;
  home: string;
  away: string;
}

interface StandingsTableProps {
  conference: string;
  teams: Team[];
}

type SortKey = keyof Team;
type SortDirection = 'asc' | 'desc';

export const StandingsTable: React.FC<StandingsTableProps> = ({ conference, teams }) => {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const multiplier = sortDir === 'asc' ? 1 : -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * multiplier;
    }
    return String(aVal).localeCompare(String(bVal)) * multiplier;
  });

  return (
    <div className="standings-table-wrapper">
      <h2 className="standings-title">{conference} Standings</h2>
      <div className="table-scroll">
        <table role="table" aria-label={`${conference} baseball standings`}>
          <thead>
            <tr>
              <th scope="col" onClick={() => handleSort('rank')} className="sortable">
                Rk {sortKey === 'rank' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" onClick={() => handleSort('name')} className="sortable team-col">
                Team {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" onClick={() => handleSort('wins')} className="sortable">
                W {sortKey === 'wins' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" onClick={() => handleSort('losses')} className="sortable">
                L {sortKey === 'losses' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" onClick={() => handleSort('pct')} className="sortable">
                Pct {sortKey === 'pct' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" abbr="Games Back">
                GB
              </th>
              <th scope="col">Strk</th>
              <th scope="col" className="hide-mobile">
                Home
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team) => (
              <tr key={team.name}>
                <td className="rank-col">{team.rank}</td>
                <th scope="row" className="team-col">
                  <img src={team.logo} alt="" width="16" height="16" />
                  {team.name}
                </th>
                <td>{team.wins}</td>
                <td>{team.losses}</td>
                <td>{team.pct}</td>
                <td>{team.gb}</td>
                <td
                  className={`streak ${team.streak.startsWith('W') ? 'win-streak' : 'loss-streak'}`}
                >
                  {team.streak}
                </td>
                <td className="hide-mobile">{team.home}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

**Styles:** Add to `/public/css/components.css`

```css
.standings-table-wrapper {
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.standings-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.table-scroll {
  overflow-x: auto;
}

.standings-table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.standings-table-wrapper thead {
  background: var(--bg-tertiary);
  position: sticky;
  top: 0;
  z-index: 10;
}

.standings-table-wrapper th,
.standings-table-wrapper td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.standings-table-wrapper th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.standings-table-wrapper th.sortable:hover {
  background: var(--bg-primary);
}

.standings-table-wrapper .team-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.standings-table-wrapper .team-col img {
  flex-shrink: 0;
}

.standings-table-wrapper .rank-col {
  color: var(--text-tertiary);
  font-weight: 600;
}

.standings-table-wrapper .streak.win-streak {
  color: var(--success);
  font-weight: 600;
}

.standings-table-wrapper .streak.loss-streak {
  color: var(--error);
  font-weight: 600;
}

@media (max-width: 768px) {
  .hide-mobile {
    display: none;
  }

  .standings-table-wrapper th,
  .standings-table-wrapper td {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
}
```

---

## Testing Checklist

### Lighthouse Audit Targets

Run: `npx lighthouse https://blazesportsintel.com --view`

**Before Changes:**

- Performance: ~40 (poor)
- Accessibility: ~75 (needs work)
- Best Practices: ~85 (good)
- SEO: ~95 (excellent)

**After Changes (Target):**

- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90
- SEO: ≥95

### Manual Testing (Mobile)

**Device:** iPhone 12/13/14 (375×812px viewport)

1. **Load Time**
   - [ ] Homepage loads in <2s on 4G
   - [ ] No layout shifts during load (CLS < 0.1)
   - [ ] Content readable without zoom

2. **Navigation**
   - [ ] All nav links ≥44px touch targets
   - [ ] Bottom nav visible and functional
   - [ ] Sticky header doesn't obscure content

3. **Data Visibility**
   - [ ] Box scores visible in <2 taps from homepage
   - [ ] Standings table scrollable horizontally
   - [ ] Live scores update without refresh

4. **Accessibility**
   - [ ] VoiceOver announces all content correctly
   - [ ] Keyboard navigation works (tab through all interactive elements)
   - [ ] Focus indicators visible

---

## Deployment

```bash
# 1. Commit changes
git add .
git commit -m "DESIGN: Mobile-first optimization - Remove particles, compress hero, add bottom nav"

# 2. Deploy to Cloudflare Pages
npx wrangler pages deploy . --project-name blazesportsintel --branch main

# 3. Verify deployment
curl -I https://blazesportsintel.com | grep -i "cf-ray"

# 4. Run Lighthouse audit
npx lighthouse https://blazesportsintel.com --output html --output-path ./lighthouse-report.html --view
```

---

## Success Criteria

### Definition of "9/10 Quality"

**User says:** "This is clearly better than ESPN for college baseball"

**Measurable proof:**

- [ ] Box score visible in <5 seconds from homepage
- [ ] Mobile Lighthouse Performance ≥90
- [ ] 0 WCAG AA violations
- [ ] User completes task (find game, view stats) in <3 taps
- [ ] Visual design feels premium (not amateurish)

**When you achieve this, you've hit 9/10.**

---

**Last Updated:** 2025-10-16
**Next Review:** After Phase 1 implementation
