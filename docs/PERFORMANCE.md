# Performance Optimization & Caching Strategy

## Overview

This document outlines performance optimization strategies and caching policies for the BSI API to ensure sub-second response times and efficient resource usage.

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Response Time (p50)** | < 200ms | > 500ms |
| **API Response Time (p95)** | < 500ms | > 1000ms |
| **API Response Time (p99)** | < 1000ms | > 2000ms |
| **Validation Latency** | < 10ms | > 50ms |
| **Database Query Time** | < 50ms | > 200ms |
| **Cache Hit Rate** | > 80% | < 60% |
| **Time to First Byte (TTFB)** | < 100ms | > 300ms |

## Caching Strategy

### Cache Layers

```
┌─────────────────────────────────────────────┐
│          CDN/Edge Cache (Cloudflare)        │ ← 60s-3600s
├─────────────────────────────────────────────┤
│          Application Cache (Redis)          │ ← 30s-300s
├─────────────────────────────────────────────┤
│       In-Memory Cache (Node.js Map)         │ ← 5s-60s
├─────────────────────────────────────────────┤
│          Database Query Cache               │ ← 10s-120s
└─────────────────────────────────────────────┘
```

### Caching Policies by Endpoint

#### Live Data (Real-Time)
**TTL**: 30-60 seconds
**Strategy**: Short-lived cache with stale-while-revalidate

```javascript
// /api/live-scores
cache: 'public, max-age=45, stale-while-revalidate=30'
```

**Endpoints**:
- `GET /api/live-scores` → 45s
- `GET /api/games` (status=live) → 30s
- `GET /api/team/:sport/:teamKey/analytics` (live game day) → 60s

---

#### Historical Data (Static)
**TTL**: 1-24 hours
**Strategy**: Long-lived cache with immutable data

```javascript
// /api/games/:gameId (completed game)
cache: 'public, max-age=86400, immutable'
```

**Endpoints**:
- `GET /api/games/:gameId` (completed) → 24h
- `GET /api/team/:sport/:teamKey/stats` (season=past) → 12h
- `GET /api/player/:playerId/stats` (season=past) → 12h

---

#### Standings & Rankings
**TTL**: 5-15 minutes
**Strategy**: Medium-duration cache, frequent updates

```javascript
// /api/standings
cache: 'public, max-age=300, stale-while-revalidate=60'
```

**Endpoints**:
- `GET /api/mlb/standings` → 5min
- `GET /api/teams/rankings` → 5min
- `GET /api/ncaa/standings` → 10min

---

#### ML Predictions
**TTL**: 15-30 minutes
**Strategy**: Cached but revalidated regularly

```javascript
// /api/predict/game
cache: 'private, max-age=900'
```

**Endpoints**:
- `POST /api/predict/game` → 15min (cache by hash of request)
- `POST /api/predict/player` → 15min
- `POST /api/v1/scheduling/optimizer` → 30min (expensive computation)

---

#### Static/Reference Data
**TTL**: 24 hours+
**Strategy**: Long-lived, rarely changes

```javascript
// /api/teams
cache: 'public, max-age=86400'
```

**Endpoints**:
- `GET /api/teams` → 24h
- `GET /api/team/:sport/:teamKey` (basic info) → 24h
- `GET /health` → 60s

---

## Cache Implementation

### 1. Redis Caching (Application Level)

```javascript
// api/services/cache-service.js

import Redis from 'ioredis';

class CacheService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            retryStrategy: (times) => Math.min(times * 50, 2000)
        });
    }

    /**
     * Get cached value
     * @param {string} key - Cache key
     * @returns {Promise<any>} Cached value or null
     */
    async get(key) {
        try {
            const value = await this.redis.get(key);
            if (value) {
                this.logCacheHit(key);
                return JSON.parse(value);
            }
            this.logCacheMiss(key);
            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null; // Fail gracefully
        }
    }

    /**
     * Set cached value
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds
     */
    async set(key, value, ttl = 300) {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
            this.logCacheSet(key, ttl);
        } catch (error) {
            console.error('Cache set error:', error);
            // Don't throw - caching is not critical
        }
    }

    /**
     * Delete cached value
     */
    async delete(key) {
        await this.redis.del(key);
    }

    /**
     * Get or compute value
     */
    async getOrCompute(key, computeFn, ttl = 300) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }

        const value = await computeFn();
        await this.set(key, value, ttl);
        return value;
    }

    logCacheHit(key) {
        // Emit metric: cache_hits_total{key}
    }

    logCacheMiss(key) {
        // Emit metric: cache_misses_total{key}
    }

    logCacheSet(key, ttl) {
        // Emit metric: cache_sets_total{key,ttl}
    }
}

export default new CacheService();
```

### 2. In-Memory Caching (Hot Data)

```javascript
// api/services/memory-cache.js

class MemoryCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxSize = options.maxSize || 1000;
        this.defaultTTL = options.defaultTTL || 60000; // 60 seconds
    }

    set(key, value, ttl = this.defaultTTL) {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        const expiresAt = Date.now() + ttl;
        this.cache.set(key, { value, expiresAt });
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    clear() {
        this.cache.clear();
    }
}

// Use for frequently accessed, small datasets
export const hotCache = new MemoryCache({ maxSize: 500, defaultTTL: 30000 });
```

### 3. Query Result Caching

```javascript
// api/services/database-service.js

async function queryWithCache(sql, params, ttl = 60) {
    const cacheKey = `query:${hashQuery(sql, params)}`;

    // Try in-memory cache first (fastest)
    let result = hotCache.get(cacheKey);
    if (result) return result;

    // Try Redis cache (medium speed)
    result = await cacheService.get(cacheKey);
    if (result) {
        hotCache.set(cacheKey, result, 10000); // Cache in memory for 10s
        return result;
    }

    // Execute query (slowest)
    result = await db.query(sql, params);

    // Cache results
    await cacheService.set(cacheKey, result, ttl);
    hotCache.set(cacheKey, result, 10000);

    return result;
}
```

## Performance Optimizations

### 1. Database Query Optimization

#### Use Indexes
```sql
-- Critical indexes for BSI
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_team ON games(home_team_id, away_team_id);
CREATE INDEX idx_games_status ON games(status) WHERE status IN ('live', 'scheduled');
CREATE INDEX idx_team_season ON team_stats(team_id, season);

-- Composite index for common query patterns
CREATE INDEX idx_games_lookup ON games(sport, league, game_date, status);
```

#### Connection Pooling
```javascript
// api/database/connection-service.js
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    max: 20, // Maximum connections
    min: 5,  // Minimum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

#### Query Optimization
```javascript
// ❌ Bad: N+1 queries
async function getTeamsWithPlayers(sportId) {
    const teams = await db.query('SELECT * FROM teams WHERE sport_id = $1', [sportId]);
    for (const team of teams) {
        team.players = await db.query('SELECT * FROM players WHERE team_id = $1', [team.id]);
    }
    return teams;
}

// ✅ Good: Single JOIN query
async function getTeamsWithPlayers(sportId) {
    return db.query(`
        SELECT
            t.*,
            jsonb_agg(p.*) as players
        FROM teams t
        LEFT JOIN players p ON p.team_id = t.id
        WHERE t.sport_id = $1
        GROUP BY t.id
    `, [sportId]);
}
```

### 2. Validation Performance

#### Compile Schemas Once
```javascript
// ❌ Bad: Schema created on every request
app.post('/api/endpoint', (req, res) => {
    const schema = z.object({ name: z.string() });
    const result = schema.parse(req.body);
});

// ✅ Good: Schema compiled once at startup
const schema = z.object({ name: z.string() });
app.post('/api/endpoint', (req, res) => {
    const result = schema.parse(req.body);
});
```

#### Avoid Complex Regex
```javascript
// ❌ Slow: Complex regex
const emailSchema = z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);

// ✅ Fast: Use built-in validator
const emailSchema = z.string().email();
```

### 3. Response Compression

```javascript
// api/server.js
import compression from 'compression';

app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6 // Balance between speed and compression
}));
```

### 4. Lazy Loading & Pagination

```javascript
// ✅ Always paginate large datasets
export const teamsListSchema = z.object({
    query: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
        // ... other fields
    })
});

// ✅ Provide cursor-based pagination for very large datasets
export const cursorPaginationSchema = z.object({
    query: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(20),
        cursor: z.string().optional(), // Last item ID from previous page
    })
});
```

### 5. Async/Parallel Processing

```javascript
// ❌ Bad: Sequential fetches
async function getGameData(gameId) {
    const game = await getGame(gameId);
    const homeTeam = await getTeam(game.homeTeamId);
    const awayTeam = await getTeam(game.awayTeamId);
    const stats = await getGameStats(gameId);
    return { game, homeTeam, awayTeam, stats };
}

// ✅ Good: Parallel fetches
async function getGameData(gameId) {
    const [game, stats] = await Promise.all([
        getGame(gameId),
        getGameStats(gameId)
    ]);

    const [homeTeam, awayTeam] = await Promise.all([
        getTeam(game.homeTeamId),
        getTeam(game.awayTeamId)
    ]);

    return { game, homeTeam, awayTeam, stats };
}
```

## Monitoring Performance

### Key Metrics

```javascript
// Instrument critical paths
import { performance } from 'perf_hooks';

function instrumentEndpoint(name) {
    return async (req, res, next) => {
        const start = performance.now();

        res.on('finish', () => {
            const duration = performance.now() - start;

            // Emit metrics
            metrics.timing('api.response_time', duration, {
                endpoint: name,
                method: req.method,
                status: res.statusCode
            });

            // Log slow requests
            if (duration > 1000) {
                logger.warn('Slow request', {
                    endpoint: name,
                    duration,
                    method: req.method,
                    query: req.query
                });
            }
        });

        next();
    };
}
```

### Performance Testing

```javascript
// tests/performance/load-test.js
import autocannon from 'autocannon';

async function runLoadTest() {
    const result = await autocannon({
        url: 'http://localhost:3000/api/health',
        connections: 100,
        duration: 30,
        pipelining: 1
    });

    console.log(result);

    // Assert performance requirements
    if (result.latency.p99 > 1000) {
        throw new Error(`p99 latency too high: ${result.latency.p99}ms`);
    }
}
```

## Cache Invalidation

### Strategies

1. **Time-Based (TTL)** - Simplest, works for most use cases
2. **Event-Based** - Invalidate on data updates
3. **Versioned** - Include version in cache key

### Implementation

```javascript
// Event-based invalidation
eventBus.on('game.updated', async (gameId) => {
    await cacheService.delete(`game:${gameId}`);
    await cacheService.delete(`game:${gameId}:analytics`);
    await cacheService.delete('live-scores:*'); // Invalidate pattern
});

// Versioned caching
const cacheKey = `team:${teamId}:${dataVersion}`;
```

## CDN Configuration (Cloudflare)

### Cache Rules

```javascript
// cloudflare.toml
[env.production]
routes = [
    # Cache static assets aggressively
    { pattern = "/*.js", custom_cache = { cache_control = "public, max-age=31536000, immutable" } },
    { pattern = "/*.css", custom_cache = { cache_control = "public, max-age=31536000, immutable" } },

    # Cache API responses with varying TTLs
    { pattern = "/api/health", custom_cache = { cache_control = "public, max-age=60" } },
    { pattern = "/api/live-scores", custom_cache = { cache_control = "public, max-age=45, stale-while-revalidate=30" } },
    { pattern = "/api/standings/*", custom_cache = { cache_control = "public, max-age=300" } },
]
```

## Best Practices

### ✅ Do's

- Always set appropriate `Cache-Control` headers
- Use Redis for shared cache across multiple server instances
- Implement cache warming for critical data
- Monitor cache hit rates
- Use compression for responses > 1KB
- Paginate large result sets
- Use database connection pooling
- Index frequently queried fields
- Implement circuit breakers for external APIs

### ❌ Don'ts

- Don't cache authenticated/user-specific data in public cache
- Don't set TTLs longer than data freshness requirements
- Don't skip validation to improve performance
- Don't cache error responses (except 404s)
- Don't use in-memory cache for data > 1MB per entry
- Don't make synchronous calls in request handlers
- Don't fetch more data than needed

## Performance Checklist

Before deploying:

- [ ] All endpoints return in < 2s (p99)
- [ ] Database queries use appropriate indexes
- [ ] Cache-Control headers set for all responses
- [ ] Validation schemas are optimized
- [ ] Response compression is enabled
- [ ] Database connection pooling configured
- [ ] Large responses are paginated
- [ ] Parallel processing used where possible
- [ ] Performance tests passing
- [ ] Cache hit rate > 70%

## Resources

- **Load Testing Tool**: autocannon, k6, Apache JMeter
- **Profiling**: Node.js --inspect, clinic.js
- **Monitoring**: Grafana dashboards
- **Cache**: Redis, Cloudflare Cache
- **Documentation**: See `/docs/VALIDATION.md` for validation performance

---

**Last Updated**: 2024-10-23
**Next Review**: 2024-11-23
**Owner**: Performance Team
