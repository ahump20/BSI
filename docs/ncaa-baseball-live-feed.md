# NCAA Baseball Live Feed Integration

## Overview
Diamond Insights ingests NCAA Division I baseball pitch data from the official NCAA LiveStats TCP feed whenever it is available. The worker opens a raw socket, normalizes every pitch into our internal schema, and merges those events with conference standings and a guarded HTML fallback sourced from `stats.ncaa.org`.

## Required Configuration
Set the following environment variables before deploying the worker:

| Variable | Purpose |
| --- | --- |
| `NCAA_LIVESTATS_HOST` | LiveStats TCP host provided by the NCAA. |
| `NCAA_LIVESTATS_PORT` | LiveStats TCP port number. |
| `NCAA_LIVESTATS_GAME_ID` | Default game identifier used for live snapshots and fallbacks. |
| `NCAA_PLAY_BY_PLAY_BASE` *(optional)* | Override base URL for play-by-play scraping. |
| `NCAA_PLAY_BY_PLAY_URL_TEMPLATE` *(optional)* | Template URL that includes `{gameId}` token for play-by-play scraping. |
| `NCAA_BASEBALL_STANDINGS_URL` | JSON endpoint containing conference standings. |
| `NCAA_REQUEST_USER_AGENT` *(optional)* | Custom User-Agent string for NCAA requests. |

> **Note:** Credentials and host access are NCAA-controlled. Blaze Sports Intel must maintain the official distribution agreement and keep all secrets in secure storage (Vercel env vars, Cloudflare secrets, etc.). Never hardcode credentials in the repository.

## Network Requirements
- Allow outbound TCP traffic from the worker/VPC to `NCAA_LIVESTATS_HOST:NCAA_LIVESTATS_PORT`.
- NCAA LiveStats typically restricts by source IP; coordinate with NCAA operations to whitelist Cloudflare Workers egress or the ingest worker’s static IP.
- Limit concurrent socket connections to the minimum required (one per active game) to respect NCAA throughput rules.

## Fallback Chain
1. **Live TCP feed** – `functions/api/baseball-live.js` establishes a socket, retries on failure, and emits normalized pitch events.
2. **Play-by-play scraper** – `functions/api/sources/ncaa/play-by-play-scraper.js` requests `stats.ncaa.org` only when robots.txt permits crawling. HTML selectors are guarded to handle layout changes gracefully.
3. **Standings merge** – The worker fetches `NCAA_BASEBALL_STANDINGS_URL` to attach the latest conference tables.
4. **Cache window** – Successful snapshots are cached for 60 seconds via `SPORTS_CACHE` KV to keep live updates responsive without overloading upstream providers.

If every layer fails, the API returns metadata describing which step blocked the update so on-call engineers can react quickly.

## Operational Notes
- Rotate NCAA credentials quarterly per the data sharing agreement.
- Monitor socket error rates and scraper responses; repeated HTTP 403s usually indicate a robots.txt change.
- Log summary metrics (connection timeouts, retries, events captured) to the observability stack instead of raw play-by-play payloads to avoid storing proprietary data.
