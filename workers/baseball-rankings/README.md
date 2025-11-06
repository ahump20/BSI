# NCAA Baseball Top 25 Rankings Worker

A Cloudflare Worker that serves a server-rendered HTML page displaying the D1Baseball Top 25 rankings.

## Features

- 🚀 **Fast**: Server-rendered HTML with edge caching
- 💾 **Efficient**: 12-hour KV cache to minimize data fetches
- 📱 **Responsive**: Mobile-first design with clean typography
- 🎨 **Branded**: Blaze Sports Intel styling with burnt orange accents
- ⚾ **Accurate**: Rankings sourced from D1Baseball

## Live URL

Production: `https://blazesportsintel.com/baseball/rankings`

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:8787
```

## Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Tail logs in real-time
npm run tail
```

## Data Source

Rankings are fetched from `/data/d1-baseball-rankings.json` in the BSI repository and cached in Cloudflare KV for 12 hours.

### Updating Rankings

To update the rankings:

1. Edit `/data/d1-baseball-rankings.json` in the main BSI repository
2. Commit and push changes to GitHub
3. The Worker will automatically fetch the updated data on the next cache refresh (max 12 hours)
4. To force an immediate update, purge the KV cache:
   ```bash
   wrangler kv:key delete --binding=BSI_KV "baseball-rankings"
   ```

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Cloudflare Worker   │
│ /baseball/rankings  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   KV Cache (12h)    │ ◄───┐
└──────┬──────────────┘     │
       │ Cache Miss         │
       ▼                    │
┌─────────────────────┐     │
│  GitHub Raw JSON    ├─────┘
│  d1-baseball-       │
│  rankings.json      │
└─────────────────────┘
```

## Configuration

- **KV Namespace**: `BSI_KV` (shared with main project)
- **Cache TTL**: 12 hours (43,200 seconds)
- **Browser Cache**: 1 hour (3,600 seconds)
- **Routes**:
  - `blazesportsintel.com/baseball/rankings`
  - `www.blazesportsintel.com/baseball/rankings`

## Performance

- **Initial Load**: < 200ms (edge cached)
- **Subsequent Loads**: < 50ms (browser cached)
- **Data Freshness**: Max 12 hours old

## Future Enhancements

- [ ] Real-time data from D1Baseball API
- [ ] Historical ranking trends
- [ ] Team detail pages
- [ ] Conference filter view
- [ ] Mobile app integration
- [ ] RSS feed for ranking updates

## Maintenance

### KV Namespace ID

The Worker uses the existing `CACHE` KV namespace from the main project:
- **ID**: `a53c3726fc3044be82e79d2d1e371d26`
- **Binding**: `BSI_KV`

### Monitoring

View Worker metrics in Cloudflare Dashboard:
- https://dash.cloudflare.com → Workers & Pages → bsi-baseball-rankings

### Troubleshooting

**Worker not deploying:**
```bash
# Verify authentication
wrangler whoami

# Check wrangler.toml syntax
wrangler dev
```

**Rankings not updating:**
```bash
# Check KV cache
wrangler kv:key get --binding=BSI_KV "baseball-rankings"

# Purge cache
wrangler kv:key delete --binding=BSI_KV "baseball-rankings"
```

**Route not working:**
```bash
# Verify route is configured
wrangler deployments list

# Check DNS settings in Cloudflare Dashboard
```

## License

MIT © Blaze Sports Intel
