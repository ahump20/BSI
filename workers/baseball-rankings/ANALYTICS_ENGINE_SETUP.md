# Analytics Engine Setup Instructions

## Current Status

✅ **Code Complete**: Analytics tracking is fully implemented in `index.ts` and `wrangler.toml`
⚠️ **Deployment Blocked**: Analytics Engine must be enabled in Cloudflare Dashboard

## Blocker Details

When deploying the Worker with Analytics Engine binding:

```
✘ [ERROR] A request to the Cloudflare API (/accounts/.../workers/scripts/bsi-baseball-rankings/versions) failed.
You need to enable Analytics Engine. Head to the Cloudflare Dashboard to enable:
https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/workers/analytics-engine
[code: 10089]
```

## Manual Setup Required

### Step 1: Enable Analytics Engine

1. Navigate to Cloudflare Dashboard:
   https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/workers/analytics-engine

2. Click "Enable Analytics Engine" button

3. Confirm enablement

### Step 2: Deploy Worker

Once Analytics Engine is enabled, deploy the Worker:

```bash
cd /Users/AustinHumphrey/BSI/workers/baseball-rankings

CLOUDFLARE_API_TOKEN=r-2jlIcjxuS-INveZJAaJS-IzwtJeh6HvH9qi9Fi \
  ~/.npm-global/bin/wrangler deploy
```

### Step 3: Verify Analytics Tracking

After successful deployment:

1. **Test the page**:

   ```bash
   curl -I https://blazesportsintel.com/baseball/rankings
   ```

2. **Check response headers** (should include):
   - `X-Cache-Status: hit` or `miss`
   - `X-Data-Source: live_scrape` or `fallback`
   - `X-Response-Time: XXms`

3. **View analytics in Dashboard**:
   - Navigate to Analytics Engine in Cloudflare Dashboard
   - Select `baseball_rankings_analytics` dataset
   - Verify data points are being written

## What Analytics Tracks

The Worker collects the following metrics:

### Page Views

- **Blobs**: `['rankings_view', cacheStatus, dataSource]`
- **Doubles**: `[responseTime]`
- **Indexes**: `['baseball-rankings']`

**Example Data Point**:

```typescript
{
  blobs: ['rankings_view', 'hit', 'live_scrape'],
  doubles: [142], // response time in ms
  indexes: ['baseball-rankings']
}
```

### Errors

- **Blobs**: `['rankings_error', errorMessage]`
- **Doubles**: `[responseTime]`
- **Indexes**: `['baseball-rankings']`

**Example Data Point**:

```typescript
{
  blobs: ['rankings_error', 'D1Baseball fetch failed with status 503'],
  doubles: [5234], // response time before error
  indexes: ['baseball-rankings']
}
```

## Analytics Queries

Once data is flowing, you can query it via GraphQL API:

```graphql
query {
  viewer {
    accounts(filter: { accountTag: "a12cb329d84130460eed99b816e4d0d3" }) {
      analyticsEngineDataset(name: "baseball_rankings_analytics") {
        metrics(filter: { index1: "baseball-rankings" }, limit: 100, orderBy: [timestamp_DESC]) {
          blob1 # Event type: 'rankings_view' or 'rankings_error'
          blob2 # Cache status: 'hit' or 'miss'
          blob3 # Data source: 'live_scrape' or 'fallback'
          double1 # Response time in ms
          timestamp
        }
      }
    }
  }
}
```

## Useful Metrics to Track

Once Analytics Engine is enabled and data is flowing:

1. **Cache Hit Rate**:

   ```
   (count where blob2='hit') / (total count) * 100
   ```

2. **Average Response Time**:

   ```
   avg(double1)
   ```

3. **Error Rate**:

   ```
   (count where blob1='rankings_error') / (total count) * 100
   ```

4. **Data Source Distribution**:
   ```
   count by blob3 ('live_scrape' vs 'fallback')
   ```

## Troubleshooting

### Deployment still fails after enabling

- Verify you're using the correct account ID in the dashboard URL
- Check that your API token has Analytics Engine permissions
- Try logging out and back in to Cloudflare Dashboard

### No data appearing in Analytics Engine

- Verify deployment succeeded with `wrangler deployments list`
- Check Worker logs with `wrangler tail` to see if writeDataPoint is being called
- Ensure at least one request has been made to the Worker since deployment

### Response headers missing

- Clear browser cache
- Use `curl -I` instead of browser to verify headers
- Check if you're hitting the correct route (not a cached CDN response)

---

**Created**: November 5, 2025
**Worker Version**: 1e3ea7c3-10b5-49c1-aad5-02a45173e3fb (current live version without analytics)
**Next Deployment**: Will be a new version with Analytics Engine binding once enabled
