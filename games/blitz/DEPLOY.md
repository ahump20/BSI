# Blaze Blitz Football - Deployment Guide

## Quick Deploy Command

Run this in Claude Code from the BSI root directory:

```bash
# Deploy Blaze Blitz to production
cd /sessions/wizardly-blissful-darwin/mnt/BSI/games/blitz && npm run build && npx wrangler deploy
```

---

## Full Deployment Prompt for Claude Code

Copy and paste this prompt:

```
Deploy Blaze Blitz Football to blazesportsintel.com/games/blitz/

## Steps:

1. Navigate to the game directory:
   cd /sessions/wizardly-blissful-darwin/mnt/BSI/games/blitz

2. Install dependencies (if not already):
   npm install

3. Build the production bundle:
   npm run build

4. Create the D1 leaderboard table (first deploy only):
   npx wrangler d1 execute bsi-game-db --command="CREATE TABLE IF NOT EXISTS blitz_leaderboard (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     player_id TEXT NOT NULL,
     player_name TEXT NOT NULL,
     score INTEGER NOT NULL,
     touchdowns INTEGER DEFAULT 0,
     yards_gained INTEGER DEFAULT 0,
     game_mode TEXT DEFAULT 'standard',
     created_at TEXT NOT NULL
   )"

5. Deploy the worker with static assets:
   npx wrangler deploy

6. Verify deployment:
   curl https://blazesportsintel.com/games/blitz/api/health

The game should now be live at:
https://blazesportsintel.com/games/blitz/
```

---

## Manual Steps (if automatic deploy fails)

### 1. Build the Game

```bash
cd /sessions/wizardly-blissful-darwin/mnt/BSI/games/blitz
npm run build
```

### 2. Verify Build Output

```bash
ls -la dist/
# Should show: index.html, assets/
```

### 3. Deploy via Wrangler

```bash
npx wrangler deploy --config wrangler.jsonc
```

### 4. If Route Conflict

Add route manually in Cloudflare Dashboard:

- Workers & Pages → bsi-blitz-game → Triggers
- Add route: `blazesportsintel.com/games/blitz/*`

---

## Configuration

### wrangler.jsonc Settings

- **Worker Name**: `bsi-blitz-game`
- **D1 Database**: `bsi-game-db` (shared with other BSI games)
- **KV Namespace**: Main BSI cache namespace
- **R2 Bucket**: `bsi-game-assets`
- **Route**: `blazesportsintel.com/games/blitz/*`

### Environment Variables

Already configured in wrangler.jsonc:

- `ENVIRONMENT`: production
- `GAME_VERSION`: 1.0.0

---

## Post-Deployment Checklist

- [ ] Game loads at https://blazesportsintel.com/games/blitz/
- [ ] Health endpoint works: /games/blitz/api/health
- [ ] 3D scene renders correctly
- [ ] Touch controls work on mobile
- [ ] Audio plays after first interaction
- [ ] Leaderboard API responds: /games/blitz/api/leaderboard

---

## Troubleshooting

### "Worker not found"

Run: `npx wrangler deploy` again with `--dry-run` flag first to check config

### "Route already exists"

Another worker may own the route. Check Cloudflare Dashboard.

### "D1 table error"

Run the CREATE TABLE command manually through wrangler d1.

### "Assets not loading"

Check that `dist/` folder exists and contains built files.
Verify the `assets` binding in wrangler.jsonc is correct.

---

## Adding to BSI Game Arcade

After deployment, add the game to the BSI arcade index:

```tsx
// In app/games/page.tsx or equivalent
{
  id: 'blitz',
  title: 'Blaze Blitz Football',
  description: 'Arcade-style football action! Score touchdowns in 60 seconds.',
  thumbnail: '/games/blitz/thumbnail.png',
  url: '/games/blitz/',
  tags: ['arcade', 'football', '3D'],
}
```
