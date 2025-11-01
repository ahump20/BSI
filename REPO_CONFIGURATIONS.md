# Repository-Specific Configurations

This document provides specific configuration details for each Blaze Sports Intel repository.

## ahump20/BSI (Main Site)

**Purpose**: Main Blaze Sports Intel brand site
**Deploy Target**: Cloudflare Pages
**Domain**: `blazesportsintel.com`
**Workflow**: `deploy-pages.yml`

### Required Secrets
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT` = `bsi-main`
- `R2_BUCKET_NAME` = `bsi-media-prod` (optional, for media)

### Configuration
```json
// package.json
{
  "scripts": {
    "build": "vite build",  // or your build command
    "preview": "vite preview"
  }
}
```

### Build Output
- Directory: `./dist`
- Static files: HTML, CSS, JS, images

### Cloudflare Pages Project
```bash
wrangler pages project create bsi-main
```

### Domain Setup
1. Add custom domain in Cloudflare Pages dashboard
2. Point DNS to Cloudflare nameservers
3. Enable automatic HTTPS

---

## ahump20/BI (Legacy Site)

**Purpose**: Legacy/alternate Blaze Intelligence site
**Deploy Target**: Cloudflare Pages
**Domain**: TBD (subdomain or archive)
**Workflow**: `deploy-pages.yml`

### Required Secrets
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT` = `bsi-legacy`

### Configuration
```json
// package.json
{
  "scripts": {
    "build": "npm run build",  // verify actual command
  }
}
```

### Build Output
- Directory: `./dist` (verify in repo)

### Cloudflare Pages Project
```bash
wrangler pages project create bsi-legacy
```

### Notes
- Consider archiving if no longer actively maintained
- May redirect to main BSI site

---

## ahump20/lone-star-legends-championship

**Purpose**: Event microsite for Lone Star Legends Championship
**Deploy Target**: Cloudflare Pages
**Domain**: `blazesportsintel.com/lone-star-legends` or subdomain
**Workflow**: `deploy-pages.yml`

### Required Secrets
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT` = `lone-star-legends`

### Configuration
```json
// package.json
{
  "scripts": {
    "build": "npm run build"
  }
}
```

### Build Output
- Directory: `./dist`

### Cloudflare Pages Project
```bash
wrangler pages project create lone-star-legends
```

### Path-based Routing (Option 1)
Deploy to subdirectory via Cloudflare Page Rules:
```
/lone-star-legends/* → lone-star-legends.pages.dev/*
```

### Subdomain (Option 2)
Deploy to dedicated subdomain:
```
lone-star-legends.blazesportsintel.com
```

---

## ahump20/Blaze-College-Baseball

**Purpose**: College baseball coverage and analytics
**Deploy Target**: Cloudflare Pages
**Domain**: `blazesportsintel.com/college-baseball`
**Workflow**: `deploy-pages.yml`

### Required Secrets
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT` = `blaze-college-baseball`

### Configuration
```json
// package.json
{
  "scripts": {
    "build": "npm run build"
  }
}
```

### Build Output
- Directory: `./dist`

### Cloudflare Pages Project
```bash
wrangler pages project create blaze-college-baseball
```

### Integration
- May integrate with live-sports-scoreboard-api
- Consider KV caching for game data

---

## ahump20/blaze-worlds-github

**Purpose**: Track & Field World Championships coverage
**Deploy Target**: Cloudflare Pages
**Domain**: `blazesportsintel.com/worlds`
**Workflow**: `deploy-pages.yml`

### Required Secrets
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT` = `blaze-worlds`

### Configuration
```json
// package.json
{
  "scripts": {
    "build": "npm run build"
  }
}
```

### Build Output
- Directory: `./dist`

### Cloudflare Pages Project
```bash
wrangler pages project create blaze-worlds
```

---

## ahump20/live-sports-scoreboard-api

**Purpose**: Real-time sports scores and data API
**Deploy Target**: Cloudflare Worker with D1, KV, R2
**Domain**: `api.blazesportsintel.com/scores`
**Workflow**: `deploy-worker.yml`

### Required Secrets
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `D1_DATABASE_NAME` = `bsi-scores`
- `R2_BUCKET_NAME` = `bsi-media-prod`

### Configuration

#### wrangler.toml
```toml
name = "bsi-scores-api"
main = "src/index.js"
compatibility_date = "2025-11-01"

[env.production]
name = "bsi-scores-api"
route = { pattern = "api.blazesportsintel.com/scores/*", zone_name = "blazesportsintel.com" }

[env.staging]
name = "bsi-scores-api-staging"
route = { pattern = "staging-api.blazesportsintel.com/scores/*", zone_name = "blazesportsintel.com" }

[[d1_databases]]
binding = "DB"
database_name = "bsi-scores"
database_id = "YOUR_D1_DATABASE_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "bsi-media-prod"
```

### D1 Database Setup

#### Create Database
```bash
wrangler d1 create bsi-scores
# Output will include database_id - save this!
```

#### Create Migrations Directory
```bash
mkdir -p migrations
```

#### Example Migration: Initial Schema
```sql
-- migrations/0001_initial_schema.sql
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  score_home INTEGER,
  score_away INTEGER,
  status TEXT NOT NULL,
  scheduled_time DATETIME,
  started_time DATETIME,
  finished_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  score_home INTEGER NOT NULL,
  score_away INTEGER NOT NULL,
  quarter TEXT,
  time_remaining TEXT,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(game_id)
);

CREATE INDEX idx_games_game_id ON games(game_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_scheduled_time ON games(scheduled_time);
CREATE INDEX idx_history_game_id ON scores_history(game_id);
CREATE INDEX idx_history_recorded_at ON scores_history(recorded_at);
```

#### Apply Migrations
```bash
# Local testing
wrangler d1 migrations apply bsi-scores --local

# Production (done automatically by CI, or manually)
wrangler d1 migrations apply bsi-scores --remote
```

### KV Namespace Setup
```bash
# Production
wrangler kv:namespace create CACHE
# Save the ID output

# Staging (optional)
wrangler kv:namespace create CACHE --env staging
```

### R2 Bucket Setup
```bash
wrangler r2 bucket create bsi-media-prod
wrangler r2 bucket create bsi-media-staging
```

### API Endpoints

#### Example Structure
```
GET  /scores                    - List all current games
GET  /scores/:gameId            - Get specific game details
POST /scores/:gameId            - Update game score (authenticated)
GET  /scores/:gameId/history    - Get score history
GET  /health                    - Health check
```

### Worker Code Structure
```
live-sports-scoreboard-api/
├── src/
│   ├── index.js              # Main worker entry point
│   ├── routes/
│   │   ├── scores.js         # Score endpoints
│   │   └── health.js         # Health check
│   ├── db/
│   │   └── queries.js        # D1 query functions
│   ├── cache/
│   │   └── kv.js             # KV caching layer
│   └── utils/
│       └── auth.js           # Authentication helpers
├── migrations/
│   └── 0001_initial_schema.sql
├── wrangler.toml
└── package.json
```

### Testing Locally
```bash
# Start local dev server
wrangler dev

# Test endpoints
curl http://localhost:8787/scores
curl http://localhost:8787/health
```

### CORS Configuration
```javascript
// Add CORS headers for frontend consumption
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## Build Command Audit Checklist

Run these commands in each repo to verify build configuration:

```bash
# Check if build script exists
cat package.json | jq '.scripts.build'

# If missing, add appropriate build command
npm pkg set scripts.build="vite build"        # For Vite
npm pkg set scripts.build="next build"        # For Next.js
npm pkg set scripts.build="react-scripts build"  # For CRA
npm pkg set scripts.build="webpack --mode production"  # For Webpack

# Test build locally
npm install
npm run build

# Verify output directory
ls -la dist/  # or build/ or out/
```

---

## Environment Variables

### Build-time Variables
Add to workflow files if needed:

```yaml
- name: Build
  run: npm run build
  env:
    NODE_ENV: production
    VITE_API_URL: https://api.blazesportsintel.com
    VITE_SITE_URL: https://blazesportsintel.com
```

### Runtime Variables (Workers)
Use `wrangler secret` for sensitive values:

```bash
# Set secrets (not visible in wrangler.toml)
wrangler secret put API_KEY --env production
wrangler secret put DATABASE_CONNECTION_STRING --env production

# Set public vars in wrangler.toml
[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"
CACHE_TTL = "300"
```

---

## Monitoring & Alerts

### Cloudflare Analytics
- Enable Web Analytics for all Pages projects
- Track Core Web Vitals
- Monitor error rates

### Worker Analytics
- Track request volume
- Monitor execution time
- Track error rates
- Set up alerts for failures

### Custom Logging
```javascript
// In Worker
export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();

    try {
      const response = await handleRequest(request, env);

      // Log successful requests
      console.log({
        method: request.method,
        url: request.url,
        status: response.status,
        duration: Date.now() - startTime,
      });

      return response;
    } catch (error) {
      // Log errors
      console.error({
        method: request.method,
        url: request.url,
        error: error.message,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }
};
```

---

## Rollback Procedures

### Pages Rollback
```bash
# List deployments
wrangler pages deployment list --project-name=bsi-main

# Rollback to specific deployment
wrangler pages deployment rollback <deployment-id> --project-name=bsi-main
```

### Worker Rollback
```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback --message "Rolling back due to issue"
```

### D1 Migration Rollback
Create a down migration:
```sql
-- migrations/0002_rollback_feature.sql
DROP TABLE IF EXISTS new_table;
ALTER TABLE old_table RENAME TO old_table_backup;
-- etc.
```

---

## Performance Optimization

### Pages
- Enable Cloudflare CDN caching
- Use image optimization
- Enable Brotli compression
- Set appropriate Cache-Control headers

### Workers
- Use KV for caching frequently accessed data
- Implement cache warming for critical data
- Use D1 query result caching
- Minimize database queries per request

### Example Caching Strategy
```javascript
async function getGameScore(gameId, env) {
  const cacheKey = `game:${gameId}`;

  // Try KV cache first
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  // Query D1 if not cached
  const result = await env.DB.prepare(
    'SELECT * FROM games WHERE game_id = ?'
  ).bind(gameId).first();

  // Cache for 30 seconds
  await env.CACHE.put(cacheKey, JSON.stringify(result), {
    expirationTtl: 30
  });

  return result;
}
```

---

## Security Best Practices

### API Authentication
- Use Cloudflare API tokens with minimal required permissions
- Rotate tokens regularly
- Use separate tokens for production and staging

### Worker Security
- Validate all input
- Use CORS appropriately
- Rate limit API endpoints
- Sanitize database queries (use prepared statements)

### Secrets Management
- Never commit secrets to git
- Use GitHub Secrets for CI/CD
- Use `wrangler secret` for Worker secrets
- Audit secret access regularly

---

## Contact & Support

For issues specific to individual repos:
- Create issue in the respective repository
- Tag with `ci/cd` label
- Include deployment logs and error messages

For general CI/CD infrastructure questions:
- See `CLOUDFLARE_CI_CD_SETUP.md`
- Check GitHub Actions logs
- Review Cloudflare dashboard logs
