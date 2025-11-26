# Quick Start - Get Running in 10 Minutes

## Prerequisites

```bash
node >= 18
npm
```

## Step 1: Install Dependencies (2 min)

```bash
cd college-baseball-tracker
npm install

# Install Wrangler globally
npm install -g wrangler
```

## Step 2: Set Up Cloudflare (3 min)

```bash
# Log in to Cloudflare
wrangler login

# This will open your browser to authenticate
```

## Step 3: Create KV Namespace (1 min)

```bash
# Create the KV namespace for caching
wrangler kv:namespace create "KV"

# You'll get output like:
# [[kv_namespaces]]
# binding = "KV"
# id = "abc123..."

# Copy the ID and update worker/wrangler.toml
# Replace "your_kv_namespace_id" with the actual ID
```

**Edit `worker/wrangler.toml`:**
```toml
kv_namespaces = [
  { binding = "KV", id = "abc123..." }  # <-- Your actual ID here
]
```

## Step 4: Start Local Development (1 min)

**Terminal 1 - Backend:**
```bash
cd worker
wrangler dev
```

**Terminal 2 - Frontend:**
```bash
cd college-baseball-tracker
npm run dev
```

Open http://localhost:3000 on your phone or browser.

## Step 5: Test on Your Phone (2 min)

**Option A - Same WiFi:**
1. Find your computer's IP address:
   - Mac: `ifconfig | grep inet`
   - Windows: `ipconfig`
2. Open `http://YOUR_IP:3000` on your phone

**Option B - Use ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel
ngrok http 3000

# Use the https URL on your phone
```

## Step 6: Deploy to Production (1 min)

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run it
./deploy.sh
```

Or deploy manually:

```bash
# Deploy Worker
cd worker
wrangler deploy

# Deploy Frontend
cd ..
npm run build
wrangler pages deploy dist --project-name=college-baseball-tracker
```

## What You Have Now

✅ Mobile-first college baseball tracker
✅ Live game tracking UI
✅ Full box score views
✅ Conference standings
✅ Running on Cloudflare Edge (fast globally)
✅ Currently using mock data

## Next: Connect Real Data

**See `worker/scrapers.js` for templates to integrate:**
- NCAA.com for official game data
- D1Baseball for real-time scores
- Warren Nolan for RPI rankings

**Start with D1Baseball:**

```javascript
// In worker/index.js, replace mock data:
import { D1BaseballScraper } from './scrapers';

async function fetchLiveGames(env) {
  const cached = await env.KV.get('live-games', 'json');
  if (cached) return cached;

  const scraper = new D1BaseballScraper();
  const games = await scraper.getLiveScores();
  
  await env.KV.put('live-games', JSON.stringify(games), {
    expirationTtl: 30
  });
  
  return games;
}
```

## Troubleshooting

**Port 3000 already in use?**
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.js
```

**Worker won't deploy?**
```bash
# Check you're logged in
wrangler whoami

# Check wrangler.toml has correct KV ID
```

**Frontend can't reach API?**
```bash
# Check worker is running on port 8787
curl http://localhost:8787/api/games/live

# Check vite proxy in vite.config.js
```

**CSS not loading?**
```bash
# Check all .css files are imported
# Check browser console for errors
```

## File Structure Reference

```
college-baseball-tracker/
├── src/
│   ├── App.jsx                 # Main app
│   ├── components/
│   │   ├── LiveGameTracker.jsx # Live games
│   │   ├── BoxScore.jsx        # Box scores
│   │   └── Standings.jsx       # Standings
│   └── main.jsx
├── worker/
│   ├── index.js                # API routes
│   ├── mockData.js             # Mock data
│   ├── scrapers.js             # Data source templates
│   └── wrangler.toml           # Worker config
└── deploy.sh                   # Deployment script
```

## Commands Reference

```bash
# Development
npm run dev              # Start frontend
cd worker && wrangler dev # Start backend

# Build
npm run build            # Build frontend

# Deploy
wrangler deploy          # Deploy worker
wrangler pages deploy dist # Deploy frontend

# Logs
wrangler tail            # Stream worker logs

# KV Operations
wrangler kv:key list --namespace-id=YOUR_ID
wrangler kv:key get "live-games" --namespace-id=YOUR_ID
```

## Resources

- Cloudflare Workers: https://developers.cloudflare.com/workers
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler
- KV Storage: https://developers.cloudflare.com/kv
- D1 Database: https://developers.cloudflare.com/d1

## Get Help

Check `IMPLEMENTATION.md` for detailed architecture and data integration guide.

---

**You now have ESPN-beating college baseball coverage running in under 10 minutes.**

The foundation is solid. Now connect real data and ship it.
