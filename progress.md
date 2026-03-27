Original prompt: PLEASE IMPLEMENT THIS PLAN:
# Sandlot Sluggers v2: Preserve the Live Build, Deepen the At-Bat

- 2026-03-26: Confirmed repo only had an older public Sandlot bundle while production was running a newer Vite build from different assets.
- 2026-03-26: Extracted the live production HTML, main bundle, vendor bundle, and GLB assets into a new `games/sandlot-sluggers` workspace as the editable baseline.
- 2026-03-26: Wired the extracted workspace into the repo build so Sandlot now ships from maintainable source into `public/games/sandlot-sluggers`.
- 2026-03-26: Added a deterministic gameplay core for session phases, seeded RNG, difficulty presets, contact grading, ball-in-play resolution, base advancement, scoring, rewards, and Team Mode profile derivation.
- 2026-03-26: Reworked the runtime around an authoritative session-phase model so pause, team select, identity, and game-over overlays freeze live gameplay and resume from the exact prior substate.
- 2026-03-26: Implemented the v2 batting loop: take-by-not-swinging, contact tiers, timing and zone quality, updated quick-play and derby state handling, target-run logic, batter chip, target chip, and result ribbon.
- 2026-03-26: Updated Team Mode to use real team profiles from the live college-baseball endpoint, support player-team and opponent-team selection, rotate real lineups, and generate seeded target difficulty from team quality.
- 2026-03-26: Extended the mini-games API leaderboard to accept optional mode and difficulty filters, store normalized metadata for new submissions, and preserve backward compatibility for older clients.
- 2026-03-26: Fixed local runtime parity issues by making asset URLs base-aware, adding a dev proxy for `/api/college-baseball`, and removing favicon noise from browser verification.
- 2026-03-26: Added regression coverage for Sandlot core rules and leaderboard metadata filtering in `tests/games/sandlot-sluggers-core.test.ts` and `tests/workers/mini-games-leaderboard.test.ts`.
- 2026-03-26: Verified `games/sandlot-sluggers` build output, `workers/mini-games-api` typecheck, targeted Vitest coverage, Quick Play boot, Team Mode roster selection, seeded target generation, and overlay pause freeze in a real browser with zero console errors.
