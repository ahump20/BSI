# Sweep Notes: Pro Sports (Agent 3)

## Shared Component Issues Found

### `components/mlb-the-show/` (outside my scope)
- Diamond Dynasty pages are fully functional (not stubs), wired to real API endpoints. No issues found.

### `components/sports/GameLayoutShell` (outside my scope)
- Game detail pages across all 4 sports (MLB, NFL, NBA, CFB) use the shared GameLayoutShell correctly. Placeholder shell pattern works as designed.

### `lib/hooks/useSportData.ts` (outside my scope)
- No bugs found. Loading/error state management is correct. The `fetchData` callback properly handles URL changes, skip toggling, and abort cleanup.

## Issues Fixed in This Sweep

### 1. Scores Overview: NFL/NBA/CFB date filtering (app/scores/page.tsx)
- **Bug**: NFL showed the February Super Bowl as "1 Today". CFB showed 118+ future games (Aug-Sep 2026) leaking into featured cards. NBA was fine (games were actually today).
- **Root cause**: Only CFB used `countTodayGames()` for todayCount. NFL and NBA used raw `games.length` without filtering. Also, `isGameToday()` returned `true` for games with no date field, which included non-today games.
- **Fix**: Applied `countTodayGames()` to all sports. Changed `isGameToday()` to return `false` (not `true`) for games with no date or unparseable dates.

### 2. Scores Overview: pluralization (app/scores/page.tsx)
- **Bug**: "View All 1 Games" when a sport had exactly 1 game today.
- **Fix**: `{count === 1 ? 'Game' : 'Games'}` ternary.

### 3. Spring Training: pluralization (app/mlb/spring-training/page.tsx)
- **Bug**: Badge always said "X Games" and schedule header always said "X games" regardless of count.
- **Fix**: Singular/plural ternary on both instances.

### 4. CFB Hub: standings data shape mismatch (app/cfb/page.tsx)
- **Bug**: The CFB standings API returns `{ standings: [{ name: "SEC", teams: [...] }] }` (nested by conference). The hub page treated `standings` as a flat team array, pushing conference objects into `allTeams` — no team matched any target conference, showing empty standings.
- **Fix**: Detect nested format (objects with `teams` key) and iterate through conference groups to extract individual teams.

### 5. NBA/NFL Standings: removed 500+ lines of hardcoded zero-data static standings
- **Issue**: Both pages had entire conferences of teams hardcoded at 0-0 as "fallback". The API works. The zero data was never shown to visitors (the off-season empty state caught it), but it was 870+ lines of dead weight violating the anti-mock-data protocol.
- **Fix**: Replaced with empty array fallback. Added error states with retry buttons. Off-season text still shows when API returns no data.

## Pages Verified (no issues found)
- `app/mlb/scores/page.tsx` — proper date nav, filtering, pluralization
- `app/mlb/spring-training/scores/page.tsx` — correct pluralization, date nav
- `app/mlb/spring-training/standings/page.tsx` — wired to API
- `app/mlb/the-show-26/**` — all 8 DD pages wired to real endpoints, not stubs
- `app/nfl/games/page.tsx` — properly structured
- `app/nba/games/page.tsx` — properly structured
- `app/cfb/scores/page.tsx` — properly structured
- All 4 game detail layouts (MLB, NFL, NBA, CFB) — placeholder shell pattern correct
- All error.tsx pages — functional with reset buttons
- All not-found.tsx pages — functional
