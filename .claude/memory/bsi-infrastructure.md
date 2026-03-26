# BSI Infrastructure Reference
> Simplified reference. Canonical source: `~/.claude/projects/-Users-AustinHumphrey/memory/infrastructure.md` (19 workers, verified Mar 21, 2026)

## Production Workers (canonical names)
- blazesportsintel-worker-prod — main site (Hono framework, Next.js static export from R2)
- blaze-field-site — BlazeCraft dashboard (routes blazecraft.app)
- bsi-live-scores — WebSocket Durable Objects for real-time scores
- bsi-savant-compute — sabermetrics engine (cron, 6-hour cycle)
- bsi-cbb-ingest — college baseball data ingestion
- bsi-error-tracker — error logging and clustering
- bsi-synthetic-monitor — uptime monitoring
- bsi-push-notifications — push notification Worker (created March 2026)

## Databases
- bsi-prod-db (D1, UUID: 6921617f-5351-4df3-aeab-07425e72ec6b) — 70+ tables
- bsi-game-db (D1, UUID: 88eb676f-af0f-470c-a46a-b9429f5b51f3)

## KV Namespaces
- BSI_PROD_CACHE, PREDICTION_CACHE, BSI_SPORTRADAR_CACHE, MONITOR_KV, ERROR_LOG

## Repos
- github.com/ahump20/BSI — single canonical repo, main branch
- Local paths: /Users/AustinHumphrey/bsi-repo (primary), /Users/AustinHumphrey/Documents/BSI

## Sites
- blazesportsintel.com — BSI main site
- austinhumphrey.com — personal portfolio
- blazecraft.app — BlazeCraft dashboard

## Data Sources
- SportsDataIO (pro leagues), Highlightly Pro (college), ESPN (fallback)
