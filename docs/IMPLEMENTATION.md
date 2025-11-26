# Implementation Guide: College Baseball Live Tracker

## Architecture Overview

```
┌─────────────────┐
│   Mobile User   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Cloudflare Pages       │
│  (React Frontend)       │
│  - Live game list       │
│  - Box scores           │
│  - Standings            │
└────────┬────────────────┘
         │
         ▼ API Calls (/api/*)
┌─────────────────────────┐
│  Cloudflare Workers     │
│  (Backend API)          │
│  - Route handling       │
│  - Data aggregation     │
│  - Response formatting  │
└────┬────────────────┬───┘
     │                │
     ▼                ▼
┌──────────┐    ┌──────────┐
│ KV Store │    │ External │
│ (Cache)  │    │  Sources │
└──────────┘    └──────────┘
     │                │
     │                ├─ NCAA.com
     │                ├─ D1Baseball
     │                ├─ Warren Nolan
     │                └─ Conference Sites
     │
     ▼
┌──────────────────┐
│ D1 Database      │
│ (Optional)       │
│ - Historical     │
│ - Player stats   │
└──────────────────┘
```

## Data Flow

### Live Game Updates

1. **Frontend Requests** (`/api/games/live`)
   - Polls every 30 seconds when games are live
   - Less frequent when no live games

2. **Worker Receives Request**
   ```javascript
   // Check cache first
   const cached = await env.KV.get('live-games', 'json');
   if (cached && !isStale(cached)) {
     return cached;
   }
   ```

3. **Fetch from Multiple Sources**
   ```javascript
   const [ncaaGames, d1Games] = await Promise.all([
     scrapeNCAA(),
     scrapeD1Baseball(),
   ]);
   ```

4. **Merge and Deduplicate**
   ```javascript
   const games = mergeGameData(ncaaGames, d1Games);
   ```

5. **Cache and Return**
   ```javascript
   await env.KV.put('live-games', JSON.stringify(games), {
     expirationTtl: 30 // 30 seconds
   });
   return games;
   ```

### Box Score Retrieval

1. **User Taps Game Card**
   - Frontend requests `/api/games/{gameId}/boxscore`

2. **Worker Fetches Detailed Stats**
   - Check cache (15 second TTL for live games)
   - Scrape NCAA box score page
   - Parse batting and pitching tables
   - Enrich with season stats from D1 database

3. **Return Formatted Data**
   - Line score (inning by inning)
   - Full batting stats with AVG
   - Full pitching stats with ERA
   - Current pitcher/batter info

### Standings Updates

1. **User Selects Conference**
   - Frontend requests `/api/standings/{conference}`

2. **Worker Aggregates Data**
   ```javascript
   const [confStandings, rpiData, leaders] = await Promise.all([
     scrapeConferenceStandings(conference),
     fetchRPIData(conference),
     fetchStatLeaders(conference),
   ]);
   ```

3. **Cache for 5 Minutes**
   - Standings don't change rapidly
   - Longer cache = fewer requests

## Key Technical Decisions

### Why Mobile-First?

**User Behavior Analysis:**
- 85%+ of sports content consumed on mobile
- Quick checks between innings
- On-the-go score tracking
- Twitter integration (mobile-heavy)

**Mobile Design Principles:**
- Bottom navigation (thumb-friendly)
- Large tap targets (44x44px minimum)
- Horizontal scrolling tables (inevitable on mobile)
- Aggressive caching (slower mobile connections)
- Touch gestures (swipe between tabs)

### Why Cloudflare Workers?

**Performance:**
- Edge deployment = <100ms response times
- KV cache is globally distributed
- No cold starts (unlike Lambda)

**Cost:**
- Free tier: 100K requests/day
- $5/month: 10M requests
- No bandwidth charges

**Developer Experience:**
- Simple deployment (`wrangler deploy`)
- Integrated stack (Workers + KV + D1 + Pages)
- Good local dev environment

### Caching Strategy

**Critical for Performance:**

```javascript
// Live games: 30s cache
// Balance: Fresh data vs. API load
await env.KV.put('live-games', data, { expirationTtl: 30 });

// Box scores (live): 15s cache
// More aggressive = more current
await env.KV.put(`boxscore-${id}`, data, { expirationTtl: 15 });

// Box scores (final): 1 hour cache
// Final scores don't change
await env.KV.put(`boxscore-${id}`, data, { expirationTtl: 3600 });

// Standings: 5min cache
// Standings are relatively stable
await env.KV.put(`standings-${conf}`, data, { expirationTtl: 300 });

// Season stats: 1 hour cache
// Updated once per day typically
await env.KV.put(`player-${id}`, data, { expirationTtl: 3600 });
```

## Data Sources Integration

### Priority Order

1. **D1Baseball.com** (Primary for live scores)
   - Most reliable real-time updates
   - Better structured HTML
   - Faster updates than NCAA

2. **NCAA.com** (Backup for live, primary for box scores)
   - Official source
   - Has box score details
   - Sometimes slow to update

3. **Warren Nolan** (RPI and advanced stats)
   - Gold standard for RPI
   - Updated daily
   - Has historical data

4. **Conference Websites** (Standings)
   - Official conference records
   - Most accurate
   - Each conference has different format

5. **Team Athletic Departments** (Player stats)
   - Some have JSON APIs
   - Season statistics
   - Roster information

### Scraping Challenges

**NCAA.com:**
- JavaScript-rendered content
- Need to find JSON endpoints
- Rate limiting (be respectful)
- HTML structure changes

**Solution:**
```javascript
// Find the actual data endpoint
// Check browser Network tab during page load
// Usually loads JSON that populates the page

const response = await fetch(
  'https://www.ncaa.com/api/gametracker/...',
  {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.ncaa.com',
    }
  }
);
```

**D1Baseball:**
- Clean HTML structure
- Reliable selectors
- Sometimes behind paywall for detailed stats

**Solution:**
```javascript
// Parse the free scoreboard page
// Use consistent CSS selectors
// Handle missing data gracefully

const games = html.querySelectorAll('.game-card');
games.forEach(game => {
  // Extract structured data
});
```

## Implementation Roadmap

### Phase 1: MVP (Current)
- [x] Mobile-first UI
- [x] Live game list
- [x] Box score view
- [x] Standings view
- [x] Mock data structure
- [x] Cloudflare deployment setup

### Phase 2: Real Data Integration
- [ ] Implement NCAA scraper
- [ ] Implement D1Baseball scraper
- [ ] Test data aggregation
- [ ] Handle errors gracefully
- [ ] Set up monitoring

### Phase 3: Enhanced Features
- [ ] Push notifications for score updates
- [ ] Favorite teams
- [ ] Player profile pages
- [ ] Historical game search
- [ ] Advanced stats (launch angle, exit velo)

### Phase 4: Advanced Features
- [ ] Live pitch tracking
- [ ] Weather integration
- [ ] Predictive analytics
- [ ] Social features
- [ ] RSS feeds

## Performance Monitoring

### Key Metrics to Track

```javascript
// Add timing to Worker
const start = Date.now();

// ... fetch data ...

const duration = Date.now() - start;

// Log slow requests
if (duration > 500) {
  console.warn(`Slow request: ${duration}ms for ${path}`);
}
```

**Target Performance:**
- P50 response time: < 100ms (cached)
- P95 response time: < 500ms (uncached)
- P99 response time: < 1000ms
- Frontend FCP: < 1.5s
- Frontend TTI: < 3s

### Error Handling

```javascript
// Graceful degradation
try {
  const games = await fetchLiveGames();
  return games;
} catch (error) {
  console.error('Primary source failed:', error);
  
  // Try backup source
  try {
    const fallbackGames = await fetchFromBackup();
    return fallbackGames;
  } catch (backupError) {
    console.error('Backup failed:', backupError);
    
    // Return cached data even if stale
    return await env.KV.get('live-games-stale', 'json') || [];
  }
}
```

## Testing Strategy

### Local Development

```bash
# Terminal 1: Run Worker locally
cd worker
wrangler dev

# Terminal 2: Run frontend
npm run dev
```

### Testing Live Data

1. Start during live games
2. Monitor console for errors
3. Check data accuracy against ESPN/official sources
4. Test error handling (disable scrapers one by one)

### Load Testing

```bash
# Use wrk or similar
wrk -t12 -c400 -d30s http://your-worker.workers.dev/api/games/live
```

**Expected Results:**
- 95% requests < 100ms (with cache)
- 99% requests < 500ms
- 0% error rate

## Deployment Checklist

- [ ] Set up Cloudflare account
- [ ] Create KV namespace
- [ ] Update wrangler.toml with KV ID
- [ ] Deploy Worker: `wrangler deploy`
- [ ] Build frontend: `npm run build`
- [ ] Deploy Pages: `wrangler pages deploy dist`
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Configure analytics
- [ ] Set up error monitoring

## Cost Estimates

**Cloudflare (assuming 100K daily users during season):**
- Workers: Free tier sufficient initially
- KV: Free tier (1GB storage, 100K reads/day)
- Pages: Free (unlimited requests)
- D1: Free tier (5GB storage)

**Total: $0-5/month** to start

**Scaling costs:**
- 1M requests/day: ~$5/month
- 10M requests/day: ~$50/month

## Next Steps

1. **Get the deployment working with mock data**
   - Verify UI on your phone
   - Test all interactions
   - Check performance

2. **Implement one data source**
   - Start with D1Baseball (easiest)
   - Get live scores working
   - Validate data accuracy

3. **Add NCAA box scores**
   - This is the killer feature
   - Parse batting/pitching tables
   - Display with season stats

4. **Deploy and test with real users**
   - Share with friends who follow college baseball
   - Get feedback
   - Iterate quickly

5. **Add remaining conferences**
   - Expand beyond SEC
   - Each conference needs custom scraper
   - Prioritize by popularity/demand

## Questions?

This is a working foundation. The hard part (UI, infrastructure, data models) is done. Now it's about connecting the data pipes.

Real talk: NCAA and D1Baseball scraping will be trial and error. Their HTML changes. You'll need to maintain the scrapers. But the value you're providing (full box scores for college baseball) is worth it.
