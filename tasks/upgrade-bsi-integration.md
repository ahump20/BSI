# BSI Integration Upgrade Plan

## Goal
Maximize utilization of configured Cloudflare resources and external API secrets that are currently available but underutilized.

## Current State Analysis

### Deployed Resources (Production)

| Category | Count | Status |
|----------|-------|--------|
| Workers | 41 | Active |
| KV Namespaces | 39 | Active |
| D1 Databases | 12 | Active |
| R2 Buckets | 17 | Active |
| Vectorize Index | 1 | Active |
| Analytics Engine | 2 | Active |

### Newly Created Resources (This Session)

| Resource | ID | Purpose |
|----------|-----|---------|
| BSI_SESSIONS KV | bbd57107270f485cb105adde9bcab727 | User session storage |
| SPORTS_DATA_KV | 59cef06483214198b85a6946af5ad8c2 | Predictions/ML pipeline |
| BSI_FANBASE_CACHE KV | 88ada3ae7b2849349c260adabf209760 | Fanbase sentiment caching |
| BSI_CACHE KV | 3f449451253444989e49e02d8ba379ed | General content caching |
| bsi-content-db D1 | 36d95906-6a44-492e-a07f-8b816ebc188d | CMS/content management |

---

## Upgrade Opportunities

### 1. AI/ML Pipeline (HIGH PRIORITY)

**Available but underutilized:**
- Workers AI binding (configured)
- Vectorize index `sports-scouting-index` (configured)
- R2 `blaze-sports-data-lake` (has data)
- SPORTS_DATA_KV (now configured)

**Current gap:** The prediction dashboard and ML models reference `SPORTS_DATA_KV` but it wasn't bound. Now fixed.

**Upgrade actions:**
```bash
# The binding is now in wrangler.toml. Redeploy to activate:
npx wrangler deploy
```

**New capabilities unlocked:**
- Real-time prediction caching
- ML model result storage
- Betting line history tracking

---

### 2. Fanbase Sentiment System (MEDIUM PRIORITY)

**Available resources:**
- bsi-fanbase-db D1 (deployed, has schema)
- BSI_FANBASE_CACHE KV (now configured)
- bsi-fanbase-sentiment worker (deployed)
- bsi-fanbase-updater worker (deployed)

**Current gap:** Cache binding was commented out in wrangler.toml. Now fixed.

**Upgrade actions:**
1. Run the fanbase migration if not already done:
   ```bash
   npx wrangler d1 execute bsi-fanbase-db --file=./migrations/011_fanbase_sentiment.sql
   ```
2. Redeploy main site to pick up new binding

**New capabilities unlocked:**
- Real-time fanbase mood tracking
- Social sentiment aggregation
- Fan engagement metrics

---

### 3. Content Management System (MEDIUM PRIORITY)

**Available resources:**
- bsi-content-db D1 (just created: 36d95906-6a44-492e-a07f-8b816ebc188d)
- BSI_CONTENT_DB binding (now configured in bsi-production)

**Current gap:** Database was placeholder. Now created.

**Upgrade actions:**
1. Create content schema:
   ```sql
   CREATE TABLE articles (
     id TEXT PRIMARY KEY,
     slug TEXT UNIQUE NOT NULL,
     title TEXT NOT NULL,
     content TEXT,
     author TEXT,
     sport TEXT,
     tags TEXT, -- JSON array
     published_at TEXT,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
     updated_at TEXT DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE pages (
     id TEXT PRIMARY KEY,
     slug TEXT UNIQUE NOT NULL,
     title TEXT NOT NULL,
     content TEXT,
     meta_description TEXT,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
     updated_at TEXT DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_articles_sport ON articles(sport);
   CREATE INDEX idx_articles_published ON articles(published_at);
   ```

2. Deploy the worker with new binding

**New capabilities unlocked:**
- Dynamic article/news management
- SEO-optimized pages without code deploys
- Editorial workflow

---

### 4. Session Management (HIGH PRIORITY)

**Available resources:**
- BSI_SESSIONS KV (now configured: bbd57107270f485cb105adde9bcab727)
- JWT_SECRET (needs to be set)
- SESSION_SECRET (needs to be set)

**Current gap:** Session KV was pointing to wrong namespace. Now fixed.

**Upgrade actions:**
1. Set secrets:
   ```bash
   echo "your-32-char-jwt-secret" | npx wrangler secret put JWT_SECRET --name bsi-home
   echo "your-session-secret" | npx wrangler secret put SESSION_SECRET --name bsi-home
   ```

**New capabilities unlocked:**
- Persistent user sessions
- Remember me functionality
- Cross-device session sync

---

### 5. External API Integrations

**Configured but potentially underutilized:**

| API | Secret | Current Usage | Potential |
|-----|--------|---------------|-----------|
| SportsDataIO | SPORTSDATAIO_API_KEY | MLB/NFL/NBA scores | Historical stats, player tracking |
| College Football Data | CFBDATA_API_KEY | CFB schedules | Recruiting, team stats, play-by-play |
| The Odds API | THEODDS_API_KEY | Not used | Live betting lines, odds comparison |
| Resend | RESEND_API_KEY | Auth emails | Newsletters, score alerts, weekly digests |
| Google Gemini | GOOGLE_GEMINI_API_KEY | AI insights | Game summaries, player analysis |
| Notion | NOTION_TOKEN | Portfolio sync | Content pipeline, editorial workflow |
| Cloudflare Stream | CLOUDFLARE_STREAM_TOKEN | Video management | Live game clips, highlight reels |

**Quick wins:**
1. **The Odds API** - Add betting lines to game pages
2. **Resend newsletters** - Weekly digest of scores/news
3. **Cloudflare Stream** - Embed game highlights

---

### 6. Blazecraft.app Enhancements

**Available resources:**
- blazecraft-db D1 (deployed, 139KB data)
- blazecraft-replays R2 (deployed)
- bsi-blazecraft-assets R2 (deployed)
- blazecraft-gateway-db D1 (just created)
- BLAZECRAFT_CACHE KV (deployed)
- BLAZECRAFT_SESSIONS KV (deployed)
- BLAZECRAFT_CONFIG KV (deployed)

**Current gap:** BSI_API_KEY not set for cross-site authentication.

**Upgrade actions:**
1. Set the API key:
   ```bash
   echo "your-bsi-api-key" | npx wrangler secret put BSI_API_KEY --name blazecraft
   ```

**New capabilities unlocked:**
- Authenticated BSI API calls from Blazecraft
- Player stats integration
- Cross-game leaderboards

---

## Secrets Configuration

Run the new configuration script:
```bash
# Dry run first
./scripts/configure-secrets.sh --dry-run

# Configure all
./scripts/configure-secrets.sh

# Configure specific site
./scripts/configure-secrets.sh --site blazesportsintel
./scripts/configure-secrets.sh --site blazecraft
```

Required `.env.secrets` file:
```env
# Core (REQUIRED)
SPORTSDATAIO_API_KEY=your-key
CFBDATA_API_KEY=your-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=32-char-minimum-secret
RESEND_API_KEY=re_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Optional but recommended
GOOGLE_GEMINI_API_KEY=...
THEODDS_API_KEY=...
CLOUDFLARE_STREAM_TOKEN=...
```

---

## Deployment Checklist

- [ ] Create `.env.secrets` with actual values
- [ ] Run `./scripts/configure-secrets.sh`
- [ ] Deploy main site: `npx wrangler pages deploy`
- [ ] Deploy bsi-home worker: `cd bsi-production && npx wrangler deploy`
- [ ] Run content-db migration
- [ ] Run fanbase-db migration (if needed)
- [ ] Test session persistence
- [ ] Test AI search with new bindings
- [ ] Verify Stripe webhooks

---

## Files Modified

1. `/wrangler.toml` - Added SPORTS_DATA_KV, BSI_FANBASE_CACHE, BSI_SESSIONS bindings
2. `/bsi-production/wrangler.toml` - Fixed BSI_CONTENT_DB, BSI_SESSIONS, BSI_CACHE IDs
3. `/scripts/configure-secrets.sh` - New secrets configuration script

---

## Architecture Notes

All BSI infrastructure follows Cloudflare-only architecture:
- No external databases (D1 only)
- No external storage (R2 only)
- No external cache (KV only)
- Edge-first AI (Workers AI + Vectorize)
- Timezone: America/Chicago
