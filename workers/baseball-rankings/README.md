# Baseball Rankings Edge Worker

This Worker exposes `/baseball/rankings` for Cloudflare Pages and routes traffic to
Blaze Sports Intel's college baseball rankings feed. Responses are cached in
Cloudflare KV to keep latency low for the live dashboards and upcoming mobile
clients.

## Deployment Checklist

1. **Build Output**
   - Pages project: `dist/`
   - Worker entry: `workers/baseball-rankings/index.ts`

2. **Wrangler Configuration**
   - `name = "bsi-baseball-rankings"`
   - `main = "workers/baseball-rankings/index.ts"`
   - `[[kv_namespaces]]` binding: `BSI_KV`
     - Production ID: `b1d2f4e8c5a8471c9a4f01d2e9b7c815`
     - Preview ID: `4c5d7e9a1b2c3d4e5f6a7b8c9d0e1f20`

3. **Cloudflare Pages Routing**
   - Dashboard → Pages → `college-baseball-tracker`
   - Settings → Functions → **Custom routes**
   - Add a route: `/baseball/rankings*` pointing to the **bsi-baseball-rankings** Worker
   - Ensure the default function bundle does not also match this pattern

4. **Environment Variables**
   - Optional: `BASEBALL_API_BASE` (defaults to `https://blazesportsintel.com/api/v1`)
   - Configure via `wrangler secret put BASEBALL_API_BASE --env baseball_rankings`

5. **Publishing**
   ```bash
   # Preview deployment (uses preview KV namespace)
   npx wrangler deploy --env baseball_rankings --dry-run

   # Production deployment
   npx wrangler deploy --env baseball_rankings
   ```

6. **Cache Warmup**
   ```bash
   curl "https://<your-pages-domain>/baseball/rankings?poll=d1baseball&season=2025"
   ```
   - Verify the response shows `"source": "origin"`
   - Repeat the request; the second call should return `"source": "cache"`

## Troubleshooting

- 502 errors usually indicate the upstream API is unreachable. Inspect
  `details` in the JSON response for the HTTP status from the origin API.
- Purge cache manually by adding `forceRefresh=1` to the query string.
- Confirm the Worker binding on the Pages dashboard is pointing to the
  production namespace when promoting from preview.
