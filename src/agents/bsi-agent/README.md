# BSI Portal Intelligence Agent

Automated transfer portal tracking for college baseball. Monitors Twitter and scrapes D1Baseball to detect portal entries in real-time, then dispatches alerts.

## Quick Start

```bash
cd src/agents/bsi-agent

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run locally (uses scraping - free, no API needed)
npm start
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Detection Layer                          │
├──────────────────────┬───────────────────────────────────────┤
│  Twitter API         │  Puppeteer Scraper                    │
│  ($200/mo Basic)     │  (Free fallback)                      │
│  - 15K reads/month   │  - D1Baseball portal page             │
│  - Real-time search  │  - Baseball America                   │
│  - Engagement data   │  - Twitter public profiles            │
└──────────┬───────────┴───────────────────┬───────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      Processing                               │
│  - Deduplicate across sources                                 │
│  - Parse player/school/position                               │
│  - Calculate engagement scores                                │
│  - Store in Cloudflare D1                                     │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                     Alert Dispatch                            │
├───────────────┬───────────────┬──────────────────────────────┤
│  OneSignal    │  Resend       │  Webhooks                    │
│  Push Notif.  │  Email        │  Custom endpoints            │
└───────────────┴───────────────┴──────────────────────────────┘
```

## Data Sources

### Twitter API (Optional - $200/mo)
- Real-time search for portal announcements
- Engagement metrics (likes, retweets)
- Best for: Breaking news, high-engagement detection

**Monitored accounts:**
- @kendallrogersD1 (Kendall Rogers)
- @d1baseball (D1Baseball)
- @BaseballAmerica (Baseball America)
- @NCAABaseball (NCAA Baseball)
- @PG_Scouting (Perfect Game)
- @prepbaseball (Prep Baseball Report)

### Puppeteer Scraping (Free)
- D1Baseball transfer tracker page
- Baseball America portal page
- Twitter public profiles (rate limited)
- Best for: Cost-free operation, testing

## Configuration

### Environment Variables

```bash
# Twitter API (optional - enables real-time detection)
TWITTER_BEARER_TOKEN=xxx

# Push notifications
ONESIGNAL_APP_ID=xxx
ONESIGNAL_API_KEY=xxx

# Email alerts
RESEND_API_KEY=xxx

# Webhooks (comma-separated)
WEBHOOK_URLS=https://your-server.com/webhook
```

### Alert Filters

Configure which entries trigger alerts:

```typescript
alertConfig: {
  channels: { push: true, email: false, webhook: true },
  filters: {
    conferences: ["SEC", "Big 12", "ACC"],
    minEngagement: 10,
  },
}
```

## Deployment

### As Cloudflare Worker

```bash
# Create D1 database
wrangler d1 create bsi-portal-db

# Update wrangler.toml with database_id

# Add secrets
wrangler secret put TWITTER_BEARER_TOKEN
wrangler secret put ONESIGNAL_API_KEY

# Deploy
wrangler deploy
```

### Scheduled Polling

The worker includes cron triggers:
- **Portal season (May-June):** Every 10 minutes
- **Off-season:** Every 4 hours

## API Endpoints

When deployed as a Worker:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/detect` | POST | Trigger detection manually |
| `/stats` | GET | Get agent statistics |
| `/entries` | GET | List recent portal entries |

## Cost Analysis

| Component | Cost | Notes |
|-----------|------|-------|
| Twitter Basic | $200/mo | 15K reads - optional |
| Cloudflare Workers | Free | 100K requests/day |
| Cloudflare D1 | Free | 5M reads/day |
| OneSignal | Free | 10K subscribers |
| Resend | Free | 3K emails/month |

**Minimum viable:** $0/mo (scraping only)
**Full featured:** $200/mo (with Twitter API)

## Development

```bash
# Type check
npm run typecheck

# Build
npm run build

# Test Twitter connection
npm run test

# Development mode (watch)
npm run dev
```

## License

UNLICENSED - Proprietary to Blaze Sports Intel LLC
