# BSI Savant Visual Redesign — Claude Code Prompt

> Paste this entire block into Claude Code to execute the Savant visual system build.

---

## Context

BSI's Savant page at `/college-baseball/savant` needs two immediate bug fixes and three new D3+React visualization components. The data already exists (batting leaderboard, pitching leaderboard, park factors, conference strength). The gap is presentation — tables-only → interactive visual tools.

All changes are in `BSI-local/`. D3 and @types/d3 are already installed.

## Step 1: Fix Spotlight Card Bugs

### Bug 1: `-Infinity` / `Infinity` in spotlight cards

**File:** `app/college-baseball/savant/page.tsx` — `findLeader()` function (around line 445)

**Root cause:** When the API strips pro-gated fields (wOBA, wRC+, FIP, ERA-), `data[i][key]` is `undefined`. The current code falls back to `-Infinity` or `Infinity`, and those values "win" the comparison.

**Fix:** Skip rows where the metric value is `undefined`, `null`, or non-finite:

```typescript
function findLeader(
  data: Record<string, unknown>[],
  key: string,
  higherIsBetter: boolean,
): { name: string; team: string; value: number } | null {
  if (data.length === 0) return null;

  let best: Record<string, unknown> | null = null;
  let bestVal = higherIsBetter ? -Infinity : Infinity;

  for (const row of data) {
    const raw = row[key];
    if (raw == null || typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    if (higherIsBetter ? raw > bestVal : raw < bestVal) {
      best = row;
      bestVal = raw;
    }
  }

  if (!best || !Number.isFinite(bestVal)) return null;

  return {
    name: best.player_name as string,
    team: best.team as string,
    value: bestVal,
  };
}
```

### Bug 2: All gated values show ".350"

**File:** `components/analytics/SavantLeaderboard.tsx` — line ~280

**Root cause:** The blurred placeholder for gated columns uses `col.format(0.350)` regardless of column type. FIP shows ".350", wRC+ shows ".350", etc.

**Fix:** Use column-appropriate placeholder values:

```typescript
{col.format ? col.format(
  col.key === 'wrc_plus' || col.key === 'ops_plus' || col.key === 'era_minus' ? 105
  : col.key === 'fip' || col.key === 'era' ? 3.85
  : col.key === 'k_bb' ? 2.80
  : col.key === 'lob_pct' ? 0.72
  : 0.320
) : '0.0'}
```

## Step 2: Create `/college-baseball/savant/visuals` Page

Create `app/college-baseball/savant/visuals/page.tsx` — a gallery of visual tool cards. Each available tool opens its visualization inline when clicked.

The page fetches from:
- `/api/savant/batting/leaderboard?limit=200` — for scatter and percentile card
- `/api/savant/conference-strength` — for heatmap

Card grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile. Available tools show a green dot and "Click to explore". Coming-soon tools are dimmed with a "Coming Soon" label.

Available tools: Plate Discipline Scatter, Conference Heatmap, Percentile Player Card.
Coming soon: Power vs Speed, Pitch Arsenal, Spray Chart, ERA vs FIP Gap, Player Similarity Map.

## Step 3: Build `PercentilePlayerCard` Component

**File:** `components/analytics/PercentilePlayerCard.tsx`

D3+React component. Horizontal percentile bars grouped by stat category (Hitting, Advanced, Discipline). Each bar:
- Left: stat label (JetBrains Mono, 10px)
- Center: colored bar on track background, width = percentile 0-100
- Right of bar: raw stat value
- Far right: percentile number in matching color

Uses `getPercentileColor()` from `PercentileBar.tsx`. Bars animate in with `d3.easeCubicOut` over 700ms. Legend at bottom.

Props: `playerName`, `team`, `position?`, `groups: StatGroup[]`

Where `StatGroup = { label: string, stats: PercentileStat[] }` and `PercentileStat = { key, label, value, percentile, higherIsBetter, format? }`.

## Step 4: Build `PlateDisciplineScatter` Component

**File:** `components/analytics/PlateDisciplineScatter.tsx`

D3+React scatter plot. X-axis = K%, Y-axis = BB%. Median lines divide four quadrants:
- Top-left: "Elite Eye" (low K, high BB)
- Bottom-left: "Patient Contact" (low K, low BB)
- Top-right: "Aggressive Power" (high K, high BB)
- Bottom-right: "Free Swinger" (high K, low BB)

Bubble size = `pa` (plate appearances), mapped through `d3.scaleSqrt`. Color = conference from hardcoded `CONF_COLORS` map. Tooltip on hover shows player name, team, K%, BB%, PA. Conference filter dropdown. Clickable conference legend for filtering.

Props: `data: ScatterPlayer[]`, `onPlayerClick?`, `className?`

## Step 5: Build `ConferenceHeatmap` Component

**File:** `components/analytics/ConferenceHeatmap.tsx`

D3+React grid. Rows = conferences (sorted by strength_index desc). Columns = STR, ERA, wOBA, OPS. Each cell is a rounded rectangle with:
- Background fill = percentile color at 15% opacity
- Text = formatted metric value in percentile color

P5 conferences get a small "P5" badge. Tooltip on cell hover shows conference, metric, value, percentile. Cells animate in with staggered delay (row * 30ms + col * 60ms).

Props: `data: ConferenceHeatmapRow[]`, `className?`

## Step 6: Add Visuals Link to Savant Page

In `app/college-baseball/savant/page.tsx`, add an "Interactive Visuals" link next to the existing "Explore Full Labs Portal" link in the hero section. The visuals link should be primary (burnt-orange), the labs link demoted to secondary (text-muted).

## Step 7: Verify Build

```bash
cd BSI-local
rm -rf .next
npm run build
```

Must pass with zero errors. The `_global-error` prerender failure is a pre-existing Next.js 16 issue — if it appears, delete `.next` and rebuild.

## Step 8: Deploy

```bash
npm run deploy:production
```

Verify at:
- `blazesportsintel.com/college-baseball/savant` — spotlight cards show real values
- `blazesportsintel.com/college-baseball/savant/visuals` — gallery renders, tools interactive

## Files Created/Modified

| File | Action |
|------|--------|
| `app/college-baseball/savant/page.tsx` | Fix findLeader + add visuals link |
| `components/analytics/SavantLeaderboard.tsx` | Fix .350 placeholder |
| `components/analytics/PercentilePlayerCard.tsx` | **NEW** |
| `components/analytics/PlateDisciplineScatter.tsx` | **NEW** |
| `components/analytics/ConferenceHeatmap.tsx` | **NEW** |
| `app/college-baseball/savant/visuals/page.tsx` | **NEW** |
| `savant-visual-system.html` | **NEW** — standalone playground |

## Dependencies

- `d3` and `@types/d3` — already installed
- `getPercentileColor()` — from `components/analytics/PercentileBar.tsx`
- `withAlpha()` — from `lib/utils/color.ts`
- `useSportData` — from `lib/hooks/useSportData.ts`
- Brand tokens — from `lib/tokens/bsi-brand.css`
