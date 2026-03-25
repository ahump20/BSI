# PASS 2: Execution Packets

> Generated 2026-03-20 from `bsi-pass-2-dependency-map.md` + canonical repo file traces.
> Doc-only. No code changes.

---

## Packet 1: `/college-baseball/scores` — API endpoint returning error

**Route:** `/college-baseball/scores`

**Page / component files touched:**
- `app/college-baseball/scores/page.tsx` (main page, `CollegeBaseballScoresPage`)
- `app/college-baseball/scores/layout.tsx` (metadata only)
- `components/intel/IntelStreamCard.tsx` (pregame intel overlay within score cards)

**Hooks / loaders / fetch utilities touched:**
- `lib/hooks/useSportData.ts` — generic fetch hook used by scores page
- `lib/utils/public-api.ts` — `getReadApiUrl()` resolves fetch target
- `lib/utils/data-meta.ts` — `toDataMeta()` + `extractDataMeta()`
- `lib/utils/timezone.ts` — `formatScheduleDate()`, `getDateOffset()`

**API endpoint(s) involved:**
- `/api/college-baseball/schedule` — what the page actually fetches (line 246: `useSportData<ScoresApiResponse>('/api/college-baseball/schedule?date=...')`)
- `/api/college-baseball/scores` — registered at `workers/index.ts:396` but NOT what the page hits. The intel hook (`lib/intel/hooks.ts`) calls this endpoint instead.

**Worker / handler file(s) involved:**
- `workers/index.ts` (line 396: scores route, line 412: schedule route)
- `workers/handlers/college-baseball/scores.ts` — `handleCollegeBaseballScores()` and `handleCollegeBaseballSchedule()`
- `workers/handlers/scores.ts` — unified multi-sport scores handler (imports `handleCollegeBaseballSchedule`)

**Likely root cause:**
- KNOWN: The page fetches `/api/college-baseball/schedule`, not `/api/college-baseball/scores`.
- KNOWN: Both endpoints are registered in `workers/index.ts` (lines 396, 412).
- KNOWN: `handleCollegeBaseballScores` attempts ESPN + Highlightly dual-source fetch with KV cache.
- SUSPECTED: The error is upstream — either Highlightly API key misconfigured, ESPN rate-limited, or the handler's error path returns a non-JSON response that `useSportData` can't parse. The page has proper error/empty/loading states, so the issue is the API returning a shape the client treats as error.
- UNKNOWN: Whether the error is in `/schedule` or `/scores` specifically. Need browser network tab to confirm which endpoint 500s.

**Minimum fix surface:**
1. `workers/handlers/college-baseball/scores.ts` — fix error handling in `handleCollegeBaseballScores` and/or `handleCollegeBaseballSchedule` to return valid JSON on upstream failure
2. Possibly `workers/index.ts` — if the route binding is wrong or the handler import is stale

**Verification:** A visitor navigating to `/college-baseball/scores` sees a date selector, conference filter pills, and a grid of game cards (live/final/scheduled) for today's date. The error card ("Unable to Load Scores") must NOT appear. If no games exist for today, the page should auto-fallback to yesterday's results with "Yesterday's Results" label.

**Risk level:** Medium — the handler code exists and is wired, but the failure mode isn't confirmed without hitting the live endpoint. Could be a simple env var (Highlightly API key) or a deeper data-shape issue.

**Overlap:** `workers/handlers/college-baseball/scores.ts` is shared with Packet 3 (game sub-pages use `handleCollegeBaseballGame` from the same file). `workers/index.ts` is shared with Packets 2, 3, and 4. `lib/hooks/useSportData.ts` is shared with other sport scores pages but NOT with any other PASS 2 packet.

---

## Packet 2: `/intel` hub — `[object Object]` / bad data transform

**Route:** `/intel`

**Page / component files touched:**
- `app/intel/page.tsx` (main `IntelDashboard` component)
- `components/dashboard/intel/IntelHeader.tsx`
- `components/dashboard/intel/SportFilter.tsx`
- `components/dashboard/intel/GameGrid.tsx`
- `components/dashboard/intel/GameCardHero.tsx`
- `components/dashboard/intel/GameCardMarquee.tsx`
- `components/dashboard/intel/SignalFeed.tsx`
- `components/dashboard/intel/StandingsTable.tsx`
- `components/dashboard/intel/PrioritySignals.tsx`
- `components/dashboard/intel/IntelSidebar.tsx`
- `components/dashboard/intel/IntelSkeleton.tsx`
- `components/dashboard/intel/NewsFeed.tsx`
- `components/dashboard/intel/PitcherFatigue.tsx`
- `components/dashboard/intel/ModelHealth.tsx` (dynamic import)
- `components/dashboard/intel/NetRatingBar.tsx` (dynamic import)
- `components/dashboard/intel/GameDetailSheet.tsx` (dynamic import)
- `components/dashboard/intel/CommandPalette.tsx` (dynamic import)

**Hooks / loaders / fetch utilities touched:**
- `lib/intel/hooks.ts` — `useIntelDashboard()`, `usePinnedBriefing()`, `useIntelSearch()`
- `lib/intel/use-preferences.ts` — `useIntelPreferences()`
- `lib/intel/outcome-tracker.ts` — `useOutcomeTracker()`
- `lib/intel/types.ts` — `IntelGame`, `IntelSport`, `SPORT_ACCENT`, ESPN endpoint maps
- `lib/intel/sample-data.ts` — `SIGNAL_TYPES_BY_MODE`

**API endpoint(s) involved:**
- `/api/college-baseball/scores` (d1bb sport scores via `scoresEndpoint`)
- `/api/college-baseball/standings` (d1bb standings)
- `/api/mlb/scores`, `/api/nfl/scores`, `/api/nba/scoreboard`, `/api/cfb/scores` (multi-sport)
- `/api/mlb/standings`, `/api/nfl/standings`, `/api/nba/standings`, `/api/cfb/standings`
- `/api/intel/news?sport=...` (news feed)
- ESPN direct fallbacks for d1bb and cbb (defined in `ESPN_SCORES_MAP`, `ESPN_STANDINGS_MAP`)

**Worker / handler file(s) involved:**
- `workers/index.ts` (all sport score/standing routes)
- `workers/handlers/college-baseball/scores.ts` — `handleCollegeBaseballScores`
- `workers/handlers/college-baseball/standings.ts` — `handleCollegeBaseballStandings`
- `workers/handlers/scores.ts` — unified multi-sport handler
- `workers/handlers/cfb.ts`, `workers/handlers/mlb.ts`, `workers/handlers/nba.ts`, `workers/handlers/nfl.ts`

**Likely root cause:**
- KNOWN: `[object Object]` appearing on the page means a React component is rendering a raw object instead of a string. This is a data transform issue, not an API failure.
- KNOWN: `useIntelDashboard` runs `normalizeToIntelGames()` and `normalizeCollegeBaseballGames()` to convert API responses into `IntelGame[]`. These functions use `dig()` helpers extensively.
- SUSPECTED: One of the normalization functions returns an object where a string is expected — likely in team name resolution (`normalizeTeam` returns `displayName` from `dig()`, but if ESPN changes their payload shape, `dig()` could return an object instead of a string). The `String(...)` wrapper should prevent this, but the `[object Object]` symptom is classic for `String(someObject)`.
- SUSPECTED: Could also be in `StandingsTable`, `SignalFeed`, or `GameCardHero` rendering a nested object field directly.
- UNKNOWN: Which specific component renders the `[object Object]` string. Browser DOM inspection needed.

**Minimum fix surface:**
1. `lib/intel/hooks.ts` — audit `normalizeTeam()`, `normalizeToIntelGames()`, `normalizeCollegeBaseballGames()`, and `normalizeStandings()` for cases where `dig()` returns an object instead of a primitive. Add defensive `typeof` guards.
2. The rendering component(s) in `components/dashboard/intel/` that display the `[object Object]` — likely `GameCardHero.tsx`, `GameCardMarquee.tsx`, `StandingsTable.tsx`, or `SignalFeed.tsx`. Need browser inspection to narrow.

**Verification:** A visitor navigating to `/intel` sees the full intel dashboard: sport filter bar, game grid with hero/marquee/standard cards showing real team names and scores (no `[object Object]` anywhere), a signal feed sidebar, standings table, and news feed. All text fields display human-readable strings.

**Risk level:** Medium — the normalization code is ~700 lines with many `dig()` calls. The fix is likely a few targeted guards, but finding the exact field requires browser verification or systematic audit of every `dig()` → render path.

**Overlap:** `workers/index.ts` shared with Packets 1, 3, 4. `workers/handlers/college-baseball/scores.ts` shared with Packet 1. No other PASS 2 packet touches `lib/intel/hooks.ts` or `components/dashboard/intel/`.

---

## Packet 3: Game sub-pages — headers render, content panels empty

**Route:** `/college-baseball/game/[gameId]/box-score`, `/college-baseball/game/[gameId]/play-by-play`, `/college-baseball/game/[gameId]/recap`, `/college-baseball/game/[gameId]/team-stats` (and equivalent routes for MLB, NFL, NBA, CFB)

**Page / component files touched (college baseball — primary):**
- `app/college-baseball/game/[gameId]/layout.tsx` (exports `useGameData`, calls `GameLayoutClient`)
- `app/college-baseball/game/[gameId]/GameLayoutClient.tsx` (wraps `GameLayoutShell` with college baseball config)
- `app/college-baseball/game/[gameId]/box-score/CollegeBoxScoreClient.tsx`
- `app/college-baseball/game/[gameId]/box-score/page.tsx`
- `app/college-baseball/game/[gameId]/play-by-play/CollegePlayByPlayClient.tsx`
- `app/college-baseball/game/[gameId]/play-by-play/page.tsx`
- `app/college-baseball/game/[gameId]/recap/CollegeRecapClient.tsx`
- `app/college-baseball/game/[gameId]/recap/page.tsx`
- `app/college-baseball/game/[gameId]/team-stats/CollegeTeamStatsClient.tsx`
- `app/college-baseball/game/[gameId]/team-stats/page.tsx`
- `app/college-baseball/game/[gameId]/CollegeGameSummaryClient.tsx`
- `app/college-baseball/game/[gameId]/page.tsx`

**Shared layout component:**
- `components/sports/GameLayoutShell.tsx` — provides `useGameData()` context, fetches `${config.apiPrefix}/game/${gameId}`
- `components/sports/scoreboards/BaseballScoreboard.tsx`

**Equivalent files for other sports (same pattern, different sport prefix):**
- `app/mlb/game/[gameId]/` (GameLayoutClient, BoxScoreClient, PlayByPlayClient, RecapClient, TeamStatsClient, GameSummaryClient)
- `app/nfl/game/[gameId]/` (same set)
- `app/nba/game/[gameId]/` (same set)
- `app/cfb/game/[gameId]/` (same set)

**Hooks / loaders / fetch utilities touched:**
- `components/sports/GameLayoutShell.tsx` line 140: `fetch(\`${config.apiPrefix}/game/${gameId}\`)` — this is the single fetch that populates ALL sub-page content via React context
- `lib/generate-static-params.ts` — `cbbGameParams()` for build-time param generation

**API endpoint(s) involved:**
- `/api/college-baseball/game/:gameId` — registered at `workers/index.ts:439`
- `/api/college-baseball/games/:gameId` — alias at `workers/index.ts:440`
- `/api/mlb/game/:gameId` (line 537), `/api/nfl/game/:gameId` (line 561), `/api/nba/game/:gameId` (line 572), `/api/cfb/game/:gameId` (line 508)

**Worker / handler file(s) involved:**
- `workers/index.ts` (game detail route registrations)
- `workers/handlers/college-baseball/scores.ts` — `handleCollegeBaseballGame()` (line 147+)
- `workers/handlers/college-baseball/transforms.ts` — `transformHighlightlyGame()`, `transformEspnGameSummary()`
- `workers/handlers/mlb.ts`, `workers/handlers/nfl.ts`, `workers/handlers/nba.ts`, `workers/handlers/cfb.ts`

**Likely root cause:**
- KNOWN: `GameLayoutShell` fetches `${apiPrefix}/game/${gameId}` and provides the full response via React context. Child pages (`CollegeBoxScoreClient`, etc.) consume this via `useGameData()`.
- KNOWN: The dependency map says "headers render, content panels empty" — meaning the layout shell works (breadcrumbs, tabs, scoreboard header) but the content tab components get `undefined` or empty for their specific data fields.
- SUSPECTED: The API returns a response, but it doesn't include the expected nested fields (`boxscore`, `plays`, `teamStats`, `recap`). The handler (`handleCollegeBaseballGame`) likely returns a top-level game summary without the sub-fields that each tab component expects.
- SUSPECTED: The `transformHighlightlyGame()` or `transformEspnGameSummary()` transform may omit these fields or place them under different keys than what the client components expect.
- UNKNOWN: Whether this is college-baseball specific or affects all 5 sports. Need to test with a real game ID per sport.
- BLOCKED: Requires a valid, real game ID from a recent game. Sample IDs from `generateStaticParams` may not have data.

**Minimum fix surface:**
1. `workers/handlers/college-baseball/scores.ts` — `handleCollegeBaseballGame()`: ensure response includes `boxscore`, `plays`, `teamStats`, `recap` fields
2. `workers/handlers/college-baseball/transforms.ts` — ensure transforms map upstream data into the expected shape
3. Each `*Client.tsx` sub-page component — verify the exact field paths they read from `useGameData()` and reconcile with what the API actually returns

**Verification:** A visitor navigating to `/college-baseball/game/{validGameId}/box-score` sees a populated box score table with player rows, innings, hits, runs, errors. The same standard applies to play-by-play (chronological event list), team-stats (comparison tables), and recap (narrative or summary content). At minimum, college baseball must be verified. Other sports are stretch goals.

**Risk level:** High — this touches the most files (20+ across 5 sports), the transforms are complex, and verification requires real game IDs with data. The fix surface spans handler + transform + client components.

**Overlap:** `workers/handlers/college-baseball/scores.ts` shared with Packet 1. `workers/index.ts` shared with Packets 1, 2, 4. `components/sports/GameLayoutShell.tsx` is NOT touched by any other packet.

---

## Packet 4: `/college-baseball/transfer-portal/[playerId]` — unregistered endpoint

**Route:** `/college-baseball/transfer-portal/[playerId]`

**Page / component files touched:**
- `app/college-baseball/transfer-portal/[playerId]/page.tsx` — wrapper with `generateStaticParams` + `dynamicParams = false`
- `app/college-baseball/transfer-portal/[playerId]/PlayerDetailClient.tsx` — full player detail UI
- `app/college-baseball/transfer-portal/page.tsx` — portal listing (links to player detail)
- `app/college-baseball/transfer-portal/layout.tsx` — layout wrapper
- `components/portal/StatusBadge.tsx` (imported as `StatusBadge`)

**Hooks / loaders / fetch utilities touched:**
- None — `PlayerDetailClient` uses raw `fetch()` directly (line 96: `fetch(\`/api/portal/player/${playerId}\`)`)

**API endpoint(s) involved:**
- `/api/portal/player/:playerId` — **NOT REGISTERED** in `workers/index.ts`. Zero matches for `api/portal/player` in the entire worker file. Confirmed by grep.
- `/api/college-baseball/transfer-portal` — registered at `workers/index.ts:417` (listing endpoint, not player detail)

**Worker / handler file(s) involved:**
- `workers/index.ts` — needs new route registration
- `workers/handlers/college-baseball/players.ts` — likely home for the new handler (already handles player-related routes)
- `workers/handlers/college-baseball/shared.ts` — portal-related keyword definitions exist (line 702)

**Likely root cause:**
- KNOWN (confirmed): The endpoint `/api/portal/player/:playerId` does not exist. Zero handler registrations. The client `PlayerDetailClient.tsx` fetches it (line 96), gets a 404, and shows "Unable to load player data."
- KNOWN (confirmed): `page.tsx` has `dynamicParams = false` with `generateStaticParams` returning only `['sample-player-1', 'sample-player-2']`. This means ANY real player URL 404s at the Next.js page level before the API is even called.
- KNOWN: This is a double failure — page-level 404 AND API-level 404.

**Minimum fix surface:**
1. `app/college-baseball/transfer-portal/[playerId]/page.tsx` — change `dynamicParams = false` to `dynamicParams = true` (or use placeholder-shell fallback pattern like game detail pages)
2. `workers/index.ts` — register new route: `app.get('/api/portal/player/:playerId', handler)`
3. `workers/handlers/college-baseball/players.ts` — add `handlePortalPlayerDetail()` handler that queries D1 portal data by player ID
4. Possibly `workers/handlers/college-baseball/shared.ts` — if portal D1 query helpers need to be added

**Verification:** A visitor navigating to `/college-baseball/transfer-portal/{realPlayerId}` sees a player profile card with: player name, position, class year, transfer path (from → to), stats grid, and bio section. The "Unable to load player data" error must NOT appear.

**Risk level:** Medium — the page-level fix is trivial (`dynamicParams = true`), but the API handler needs to be built from scratch. However, the listing endpoint (`/api/college-baseball/transfer-portal`) already exists, and the D1 schema likely has the data. The `PlayerDetailClient.tsx` already handles loading/error/empty states correctly.

**Overlap:** `workers/index.ts` shared with Packets 1, 2, 3. `workers/handlers/college-baseball/players.ts` is NOT touched by any other packet. No other shared files.

---

## Execution Grouping

### Shared File Matrix

| File | P1 (Scores) | P2 (Intel) | P3 (Game sub-pages) | P4 (Portal) |
|------|:-----------:|:----------:|:-------------------:|:-----------:|
| `workers/index.ts` | ✓ (read) | ✓ (read) | ✓ (read) | ✓ (WRITE) |
| `workers/handlers/college-baseball/scores.ts` | ✓ (WRITE) | ✓ (read) | ✓ (WRITE) | — |
| `workers/handlers/college-baseball/transforms.ts` | — | — | ✓ (WRITE) | — |
| `workers/handlers/college-baseball/players.ts` | — | — | — | ✓ (WRITE) |
| `lib/intel/hooks.ts` | — | ✓ (WRITE) | — | — |
| `lib/hooks/useSportData.ts` | ✓ (read) | — | — | — |
| `components/sports/GameLayoutShell.tsx` | — | — | ✓ (read) | — |
| `components/dashboard/intel/*` | — | ✓ (WRITE) | — | — |
| `app/college-baseball/scores/page.tsx` | ✓ (read) | — | — | — |
| `app/college-baseball/transfer-portal/[playerId]/*` | — | — | — | ✓ (WRITE) |

### SAFE TO PARALLELIZE

**Packet 2 (Intel)** and **Packet 4 (Portal)** have zero shared WRITE files.
- P2 writes to `lib/intel/hooks.ts` + `components/dashboard/intel/*`
- P4 writes to `workers/handlers/college-baseball/players.ts` + `app/college-baseball/transfer-portal/[playerId]/*`
- Both read `workers/index.ts` but only P4 writes to it (adds one route)
- **Safe to run in parallel** as long as P4's `workers/index.ts` edit is a single additive line (new route registration) that won't conflict with any other packet.

### MUST BE SEQUENTIAL

**Packet 1 (Scores)** and **Packet 3 (Game sub-pages)** both write to `workers/handlers/college-baseball/scores.ts`.
- P1 fixes `handleCollegeBaseballScores` / `handleCollegeBaseballSchedule` error handling
- P3 fixes `handleCollegeBaseballGame` response shape + transforms
- Same file, different functions, but merge conflicts are likely if done simultaneously
- **P1 must complete before P3 starts** — P1's fixes may change shared imports, error helpers, or caching logic in `scores.ts` that P3 depends on.

### BLOCKED

**Packet 3 (Game sub-pages)** is partially blocked:
- Requires a valid, recent game ID with data to verify. Cannot confirm fix without a real game.
- Depends on P1 completing first (shared handler file).
- If Highlightly API is down or unconfigured, the game detail endpoint returns empty regardless of code fixes.

**Packet 4 (Portal)** is partially blocked:
- The new handler needs to query D1 portal data. If the `bsi-portal-sync` worker hasn't populated D1, the endpoint will return empty even when correctly wired.
- The page-level fix (`dynamicParams = true`) is NOT blocked and can ship immediately.

---

## Strict Execution Order

| Order | Packet | Terminal | Rationale |
|:-----:|--------|----------|-----------|
| 1 | **P1: Scores** | Claude Code Terminal A | Unblocks P3. Fixes the most-used handler file first. |
| 1 | **P2: Intel** | Claude Code Terminal B (parallel) | Zero file overlap with P1. Can start immediately. |
| 1 | **P4: Portal (page-level fix only)** | Claude Code Terminal B or Cowork | `dynamicParams = true` is a 1-line change, zero conflict. Ship the page fix while the handler is built. |
| 2 | **P4: Portal (handler build)** | Claude Code Terminal B | After P2 completes. Writes to `workers/index.ts` + new handler. No conflict with P1. |
| 3 | **P3: Game sub-pages** | Claude Code Terminal A | After P1 completes. Shares `scores.ts`. Requires real game ID for verification. |

### Terminal Assignment

- **Terminal A:** P1 (Scores) → P3 (Game sub-pages). Sequential. Same handler file.
- **Terminal B:** P2 (Intel) ∥ P4 page fix → P4 handler build. Intel and portal are independent.
- **Cowork (verification only):** Browser verification of all four packets after code changes ship. Cowork does NOT edit code — it confirms rendered output.

---

## Do Not Combine

These workstreams are mutually exclusive and must never run in the same terminal simultaneously:

1. **P1 + P3** — both write `workers/handlers/college-baseball/scores.ts`. P1 must finish first.
2. **P1 + P4 handler** — both write `workers/index.ts` (P1 may not write it, but if error handling requires route changes, conflict is possible). Low risk but sequence anyway.
3. **P3 + P4 handler** — P3 may touch `workers/index.ts` if game route bindings change. Sequence P4 handler before P3.

Safe combinations:
- **P2 + P1** — fully parallel, zero shared write files
- **P2 + P4 page fix** — fully parallel, zero shared files
- **P2 + P4 handler** — parallel if P4 only adds one line to `workers/index.ts`

---

## Highest-Leverage First Fix

**Fix the `/api/college-baseball/scores` (really `/schedule`) error handling in `workers/handlers/college-baseball/scores.ts`** — this unblocks the most-visited data page on the site, unblocks Packet 3 (game sub-pages share the handler file), and the fix is likely a small error-path correction in a handler that already has the right structure.
