# BSI Agent Deployment Prompt — Sports Data Pipeline Activation

> **Purpose:** Feed this prompt to the BSI agent to execute and deploy all sports
> data sources on blazesportsintel.com. This covers every adapter, wiring step,
> and verification task needed to go from seed data → live data.

---

## Phase 1: Activate FREE Data Sources (No Keys Needed)

These three sources are already built and wired. They work immediately.

### 1A. Baseball Savant / Statcast (LIVE NOW)

**What it does:** Fetches real pitch-level MLB Statcast data (exit velocity, launch
angle, spin rate, release extension, barrel rate, sprint speed) directly from
Baseball Savant's public CSV endpoint.

**Endpoint:** `https://baseballsavant.mlb.com/statcast_search/csv`
**Auth:** None — public endpoint
**Rate limit:** ~25,000 rows/query, use 5-7 day windows
**BSI adapter:** `lib/api-clients/baseball-savant.ts`
**Wired into:** `app/mlb/statcast/page.tsx` (fallback when Worker proxy unavailable)

**Agent task:**
```
Verify the Statcast page at /mlb/statcast loads and the fetchStatcastLeaderboard()
function returns real data. Test with:
  import { fetchStatcastLeaderboard } from '@/lib/api-clients/baseball-savant';
  const result = await fetchStatcastLeaderboard('exit_velocity', { season: 2026, limit: 10 });
  console.log(result.success, result.rowCount, result.data?.slice(0, 3));
If the 2026 season hasn't started yet, test with season: 2025.
```

### 1B. Driveline Open Biomechanics (LIVE NOW)

**What it does:** Fetches real pitcher biomechanics data (arm slot, hip-shoulder
separation, elbow varus moment, velocity, trunk rotation) from Driveline's
open-source GitHub dataset. 92 metrics per pitch at 360 Hz.

**Data source:** `https://raw.githubusercontent.com/drivelineresearch/openbiomechanics/main/baseball_pitching/data/poi/poi_metrics.csv`
**Auth:** None — CC BY 4.0 license
**BSI adapter:** `lib/api-clients/driveline-biomechanics.ts`
**Wired into:** `components/baseball/PitcherBiomechanics.tsx` (real benchmarks replace static)

**Agent task:**
```
Verify Driveline data loads correctly. Test with:
  import { computeDrivelineBenchmarks, getDrivelineSessions, drivelineSessionToProfile } from '@/lib/api-clients/driveline-biomechanics';
  const benchmarks = await computeDrivelineBenchmarks();
  console.log('Arm slot mean:', benchmarks.armSlot.mean, 'p10:', benchmarks.armSlot.p10, 'p90:', benchmarks.armSlot.p90);
  const sessions = await getDrivelineSessions();
  console.log('Available sessions:', sessions.length);
  if (sessions.length > 0) {
    const profile = await drivelineSessionToProfile(sessions[0]);
    console.log('Profile:', profile?.playerName, profile?.mechanics.armSlotDegrees, profile?.injuryRisk.elbowStressProxy);
  }
```

### 1C. SkillCorner Open Data (LIVE NOW)

**What it does:** Fetches real broadcast-derived player tracking data (XY positions
at 10fps, speed, distance, sprint counts) from SkillCorner's open-source GitHub
repository. 10 A-League 2024/25 matches.

**Data source:** `https://github.com/SkillCorner/opendata`
**Auth:** None — MIT license
**BSI adapter:** `lib/api-clients/skillcorner-opendata.ts`
**Wired into:** `components/sports-tracking/MatchTracking.tsx`

**Agent task:**
```
Verify SkillCorner open data loads correctly. Test with:
  import { getAvailableMatches, fetchOpenMatchTracking } from '@/lib/api-clients/skillcorner-opendata';
  const matches = getAvailableMatches();
  console.log('Available matches:', matches.length);
  const tracking = await fetchOpenMatchTracking(matches[0].id);
  console.log('Home team:', tracking.homeTeam.teamName, 'Players:', tracking.homeTeam.players.length);
  console.log('Top player:', tracking.homeTeam.players[0]?.playerName, tracking.homeTeam.players[0]?.metrics.topSpeedKmh, 'km/h');
```

---

## Phase 2: Activate TRIAL Data Sources (Free Signup Required)

### 2A. Sportradar MLB v8 (ABS Challenge Data)

**What it does:** Official MLB data distribution — game schedules, play-by-play,
pitch-level Statcast metrics, and (when 2026 season starts) ABS challenge data.

**Registration:** https://developer.sportradar.com/member/register
**Process:**
1. Register with email → verify email
2. Go to Marketplace → find MLB → click "Add Trial"
3. Trial key appears in dashboard (40-char alphanumeric string)
4. Trial lasts 30 days, 1 QPS rate limit

**Auth:** Query parameter `?api_key=YOUR_KEY`
**Base URL (trial):** `https://api.sportradar.com/mlb/trial/v8/en`
**Base URL (production):** `https://api.sportradar.com/mlb/production/v8/en`

**Key endpoints:**
| Endpoint | URL Pattern |
|----------|------------|
| Daily Schedule | `/games/{year}/{month}/{day}/schedule.json` |
| Game Play-by-Play | `/games/{game_id}/pbp.json` |
| Game Pitch Metrics | `/games/{game_id}/pitch_metrics.json` |
| Seasonal Stats | `/seasons/{year}/REG/statistics.json` |
| League Leaders | `/seasons/{year}/REG/leaders.json` |

**BSI adapter:** `lib/api-clients/sportradar-abs.ts`
**Wired into:** `app/mlb/abs/page.tsx`

**Once you have the key, set it:**
```bash
# In .env.local
SPORTRADAR_API_KEY=your_40_char_key_here
```

**Agent task after key is set:**
```
The Sportradar adapter at lib/api-clients/sportradar-abs.ts currently uses
speculative ABS-specific endpoints (/abs/aggregates.json, /abs/challenges.json).
These may not exist yet (ABS launches with 2026 regular season).

Immediate action: Update the adapter to also fetch from the EXISTING v8 endpoints:
- Use /games/{date}/schedule.json to get game IDs for a date
- Use /games/{game_id}/pbp.json to get play-by-play with pitch data
- Use /games/{game_id}/pitch_metrics.json for Statcast-level metrics
- Extract plate_x/plate_z from pitch data to compute zone accuracy (ABS proxy)

The adapter should:
1. Try ABS-specific endpoints first (future-proofed for when they launch)
2. Fall back to PBP/pitch metrics endpoints
3. Fall back to seed data if API is down
```

---

## Phase 3: Enterprise Data Sources (Contact Sales)

These adapters are built with seed data fallbacks. They'll activate when keys are obtained.

### 3A. SkillCorner Full API

**Contact:** support@skillcorner.com
**Auth:** Username + password (not API key)
**Python SDK:** `pip install skillcorner`
**Env vars:** `SKILLCORNER_USERNAME`, `SKILLCORNER_PASSWORD`
**BSI adapter:** `lib/api-clients/skillcorner.ts`

**When credentials are obtained, update the adapter:**
```
The current SkillCorner adapter uses Bearer token auth. SkillCorner actually
uses username/password authentication. Update the adapter:
1. Change auth from Bearer token to Basic auth or session-based auth
2. Use their Python SDK as reference: https://skillcorner.readthedocs.io/
3. Key endpoints: /api/matches/, /api/match/{id}/tracking/, /api/physical/
4. Until then, the open data adapter (skillcorner-opendata.ts) serves real data
```

### 3B. KinaTrax / Rapsodo / PitcherNet

**Status:** No public APIs exist for any of these.
- KinaTrax: Stadium-installed markerless motion capture, enterprise only
- Rapsodo: Hardware-coupled to their pitch tracking units
- PitcherNet: IP owned by Baltimore Orioles, paper only (CVPR 2024)

**BSI solution:** Driveline Open Biomechanics provides the same category of data
(arm slot, hip-shoulder sep, elbow varus moment, trunk rotation) from real
motion capture sessions. This is already wired and live.

---

## Phase 4: Deploy to blazesportsintel.com

**Agent task — full deployment checklist:**
```
1. VERIFY all free adapters load data successfully:
   - Run: node -e "import('./lib/api-clients/baseball-savant.ts')"
   - Run: node -e "import('./lib/api-clients/driveline-biomechanics.ts')"
   - Run: node -e "import('./lib/api-clients/skillcorner-opendata.ts')"

2. BUILD the Next.js app:
   - Run: npm run build (or next build)
   - Fix any TypeScript errors in new files
   - Verify all pages compile: /mlb/abs, /mlb/statcast

3. SET environment variables on hosting platform:
   - If Vercel: vercel env add SPORTRADAR_API_KEY (once obtained)
   - If Cloudflare: wrangler secret put SPORTRADAR_API_KEY
   - Baseball Savant + Driveline + SkillCorner Open = no env vars needed

4. DEPLOY:
   - Push to main branch or trigger deploy
   - Verify /mlb/statcast shows Statcast leaderboards
   - Verify /mlb/abs shows ABS challenge tracker (seed data until season)
   - Verify PitcherBiomechanics component shows Driveline benchmarks

5. MONITOR:
   - Baseball Savant: Check for 429 errors if querying too frequently
   - Driveline: Data is cached 24 hours, check cache invalidation
   - Sportradar: Trial expires after 30 days — plan for production key
```

---

## Summary: Data Source Status Matrix

| Source | Key Required | Status | Adapter File | Live Data |
|--------|-------------|--------|-------------|-----------|
| Baseball Savant | None | ACTIVE | `baseball-savant.ts` | Yes — real MLB Statcast |
| Driveline Open Bio | None | ACTIVE | `driveline-biomechanics.ts` | Yes — real motion capture |
| SkillCorner Open | None | ACTIVE | `skillcorner-opendata.ts` | Yes — real A-League tracking |
| Sportradar MLB v8 | Trial (free) | READY | `sportradar-abs.ts` | After signup + key |
| SkillCorner Full | Enterprise | READY | `skillcorner.ts` | After sales contact |
| KinaTrax | N/A | SEED | `pitchernet-biomechanics.ts` | No public API |
| Rapsodo | N/A | SEED | `pitchernet-biomechanics.ts` | No public API |
| PitcherNet | N/A | SEED | `pitchernet-biomechanics.ts` | No public API |

**3 of 8 data sources are streaming real data right now with zero API keys.**
