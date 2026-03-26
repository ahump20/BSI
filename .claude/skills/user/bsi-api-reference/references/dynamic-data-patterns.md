# Dynamic Data Patterns

This reference documents patterns for handling dates, seasons, caching, and error handling to prevent hardcoded static data.

## Date Handling

### ESPN Format (YYYYMMDD)
```typescript
function getESPNDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

// Examples:
getESPNDate()                          // "20251224"
getESPNDate(new Date('2025-03-15'))   // "20250315"
```

### ESPN Date Range
```typescript
function getESPNDateRange(start: Date, end: Date): string {
  return `${getESPNDate(start)}-${getESPNDate(end)}`;
}

// Example: "20251201-20251231"
```

### MLB StatsAPI Format (YYYY-MM-DD)
```typescript
function getMLBDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// Example: "2025-12-24"
```

### SportsDataIO Format (YYYY-MMM-DD)
```typescript
function getSDIODate(date: Date = new Date()): string {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Example: "2025-DEC-24"
```

### Timezone-Aware Date (America/Chicago)
```typescript
function getChicagoDate(): string {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Chicago' 
  });
}

// Returns: "2025-12-24" (in Central Time)
```

---

## Season Detection

### MLB Season Logic
```typescript
function getMLBSeason(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  
  // MLB season: March (2) through October (9)
  // Before March = previous year's season (offseason)
  // November onwards = current year complete
  if (month < 2) {
    return year - 1; // Still in previous season's offseason
  }
  return year;
}
```

### NFL Season Logic
```typescript
function getNFLSeason(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // NFL season: September (8) through February (1)
  // Before September = previous season
  if (month < 8) {
    return year - 1;
  }
  return year;
}

function getNFLWeek(date: Date = new Date()): { season: number; week: number; seasonType: number } {
  // This is approximate - real implementation should use API
  const season = getNFLSeason(date);
  const seasonStart = new Date(season, 8, 5); // First Thursday of September (approximate)
  const daysDiff = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    return { season, week: 1, seasonType: 1 }; // Preseason
  }
  
  const week = Math.min(18, Math.floor(daysDiff / 7) + 1);
  return { season, week, seasonType: 2 }; // Regular season
}
```

### NBA Season Logic
```typescript
function getNBASeason(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // NBA season: October through June
  // July-September = offseason
  if (month >= 6 && month <= 8) {
    return year; // Offseason, reference upcoming season
  }
  if (month >= 9) {
    return year + 1; // Season started, it's the YYYY-YY+1 season
  }
  return year; // Jan-June, still in current season
}
```

### College Season Logic
```typescript
function getCollegeFootballSeason(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // CFB: August through January
  if (month < 7) {
    return year - 1; // Before August, previous season
  }
  return year;
}

function getCollegeBasketballSeason(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // CBB: November through April
  // Before November = upcoming season (year-year+1)
  // After April = just completed season
  if (month >= 10 || month <= 3) {
    // Active season
    return month >= 10 ? year + 1 : year;
  }
  return year; // Offseason, reference completed season
}
```

---

## Caching Strategies

### Cache Key Patterns
```typescript
// Include all variable components in cache keys
const cacheKey = `${sport}:${endpoint}:${date}:${optional_params}`;

// Examples:
`nfl:scoreboard:20251224`
`mlb:schedule:2025-12-24`
`espn:cfb:scoreboard:20251224:groups=80`
`player:stats:660271:2024`
```

### TTL by Data Type
```typescript
const TTL = {
  LIVE_SCORES: 15,      // 15 seconds for in-progress games
  RECENT_SCORES: 60,    // 1 minute for completed games today
  SCHEDULE: 300,        // 5 minutes for upcoming schedule
  STANDINGS: 900,       // 15 minutes for standings
  TEAM_INFO: 3600,      // 1 hour for team metadata
  PLAYER_INFO: 3600,    // 1 hour for player metadata
  HISTORICAL: 86400,    // 24 hours for historical data
  STATIC: 604800,       // 1 week for truly static data (venues, team IDs)
};
```

### Stale-While-Revalidate Pattern
```typescript
async function fetchWithSWR(
  env: Env, 
  cacheKey: string, 
  fetchFn: () => Promise<any>,
  ttl: number,
  staleWindow: number = ttl * 2
): Promise<{ data: any; stale: boolean }> {
  const cached = await env.KV.getWithMetadata<{ fetchedAt: number }>(cacheKey, 'json');
  
  if (cached.value) {
    const age = Date.now() - (cached.metadata?.fetchedAt || 0);
    
    if (age < ttl * 1000) {
      return { data: cached.value, stale: false };
    }
    
    if (age < staleWindow * 1000) {
      // Return stale, trigger background refresh
      fetchFn().then(fresh => 
        env.KV.put(cacheKey, JSON.stringify(fresh), {
          expirationTtl: staleWindow,
          metadata: { fetchedAt: Date.now() }
        })
      );
      return { data: cached.value, stale: true };
    }
  }
  
  const fresh = await fetchFn();
  await env.KV.put(cacheKey, JSON.stringify(fresh), {
    expirationTtl: staleWindow,
    metadata: { fetchedAt: Date.now() }
  });
  
  return { data: fresh, stale: false };
}
```

---

## Error Handling

### Retry with Exponential Backoff
```typescript
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        // Don't retry 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

### Fallback Chain
```typescript
async function fetchScoresWithFallback(sport: string, date: string): Promise<any> {
  const sources = [
    () => fetchFromESPN(sport, date),
    () => fetchFromSportsDataIO(sport, date),
    () => fetchFromMLBStats(date), // MLB only
  ];
  
  for (const fetchFn of sources) {
    try {
      const data = await fetchFn();
      if (data && (data.events?.length > 0 || data.games?.length > 0)) {
        return data;
      }
    } catch (error) {
      console.error(`Source failed: ${error}`);
      continue;
    }
  }
  
  throw new Error('All data sources failed');
}
```

---

## Validation Patterns

### Response Validation
```typescript
interface ExpectedResponse {
  events?: any[];
  games?: any[];
  dates?: any[];
}

function validateResponse(data: unknown, source: string): ExpectedResponse {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid response from ${source}: not an object`);
  }
  
  const response = data as ExpectedResponse;
  
  // At least one of these should exist
  if (!response.events && !response.games && !response.dates) {
    console.warn(`Response from ${source} has no events, games, or dates`);
  }
  
  return response;
}
```

### Data Freshness Check
```typescript
function isDataFresh(fetchedAt: string, maxAgeSeconds: number): boolean {
  const fetchTime = new Date(fetchedAt).getTime();
  const now = Date.now();
  return (now - fetchTime) < maxAgeSeconds * 1000;
}
```

---

## Anti-Pattern Detection

### Static Data Warning Signs

If you see any of these patterns in code, replace with dynamic fetches:

```typescript
// ❌ WRONG: Hardcoded team arrays
const teams = ['Cardinals', 'Cubs', 'Brewers'];
// ✅ CORRECT: Fetch from API
const teams = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1')
  .then(r => r.json())
  .then(d => d.teams);

// ❌ WRONG: Static season year
const season = 2024;
// ✅ CORRECT: Calculate dynamically
const season = getMLBSeason();

// ❌ WRONG: Hardcoded scores or results
const score = { home: 5, away: 3 };
// ✅ CORRECT: Fetch from scoreboard API

// ❌ WRONG: Assumed current week
const week = 15;
// ✅ CORRECT: Calculate or fetch
const { week } = getNFLWeek();

// ❌ WRONG: Static player IDs list
const topPlayers = [660271, 592450, 545361];
// ✅ CORRECT: Fetch from leaders endpoint
const leaders = await fetch('.../stats/leaders?...');
```

---

## Complete Worker Template

```typescript
interface Env {
  KV: KVNamespace;
  SPORTSDATAIO_KEY: string;
}

interface DataResponse {
  meta: {
    source: string;
    endpoint: string;
    date: string;
    fetched_at: string;
    timezone: 'America/Chicago';
    cached: boolean;
  };
  data: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const sport = url.searchParams.get('sport') || 'mlb';
    const endpoint = url.searchParams.get('endpoint') || 'scoreboard';
    
    // Dynamic date - NEVER static
    const requestedDate = url.searchParams.get('date');
    const date = requestedDate || getChicagoDate();
    
    // Cache check with date in key
    const cacheKey = `${sport}:${endpoint}:${date}`;
    const cached = await env.KV.get(cacheKey, 'json') as DataResponse | null;
    
    if (cached && isDataFresh(cached.meta.fetched_at, 60)) {
      return Response.json({ ...cached, meta: { ...cached.meta, cached: true } });
    }
    
    try {
      const data = await fetchSportsData(sport, endpoint, date, env);
      
      const response: DataResponse = {
        meta: {
          source: getSourceName(sport),
          endpoint,
          date,
          fetched_at: new Date().toISOString(),
          timezone: 'America/Chicago',
          cached: false,
        },
        data,
      };
      
      await env.KV.put(cacheKey, JSON.stringify(response), { 
        expirationTtl: getTTL(endpoint) 
      });
      
      return Response.json(response);
    } catch (error) {
      return Response.json({
        error: (error as Error).message,
        meta: { date, sport, endpoint }
      }, { status: 500 });
    }
  }
};

function getChicagoDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

function isDataFresh(fetchedAt: string, maxAgeSeconds: number): boolean {
  return (Date.now() - new Date(fetchedAt).getTime()) < maxAgeSeconds * 1000;
}

function getSourceName(sport: string): string {
  return sport === 'mlb' ? 'statsapi.mlb.com' : 'ESPN';
}

function getTTL(endpoint: string): number {
  const ttls: Record<string, number> = {
    scoreboard: 30,
    schedule: 300,
    standings: 900,
    teams: 3600,
  };
  return ttls[endpoint] || 60;
}

async function fetchSportsData(sport: string, endpoint: string, date: string, env: Env): Promise<unknown> {
  // Implementation depends on sport/endpoint
  // This is where you use the API references
  throw new Error('Implement based on sport and endpoint');
}
```
