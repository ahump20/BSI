# Cloudflare Integration Setup Guide

This guide covers setting up Cloudflare KV, Images, and NCAA Live Data APIs for the Blaze Sports Intel platform.

## Table of Contents

1. [Cloudflare KV for Caching](#cloudflare-kv)
2. [Cloudflare Images](#cloudflare-images)
3. [NCAA Live Data APIs](#ncaa-apis)
4. [Deployment](#deployment)

---

## Cloudflare KV for Caching {#cloudflare-kv}

Cloudflare KV provides edge caching for MCP data and live NCAA data with sub-50ms read times globally.

### Setup

#### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
chmod +x scripts/setup-cloudflare-kv.sh
./scripts/setup-cloudflare-kv.sh
```

This script will:
- Create production and preview KV namespaces
- Update `apps/api-worker/wrangler.toml` with namespace IDs
- Seed all Texas Longhorns MCP data
- Configure bindings

#### Option 2: Manual Setup

```bash
# Create KV namespace
wrangler kv:namespace create "LONGHORNS_CACHE"
# Note the namespace ID

# Create preview namespace
wrangler kv:namespace create "LONGHORNS_CACHE" --preview
# Note the preview ID

# Update apps/api-worker/wrangler.toml
[[kv_namespaces]]
binding = "LONGHORNS_CACHE"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_ID"
```

### Usage in API Routes

```typescript
// apps/web/app/api/longhorns/route.ts
export async function GET(request: NextRequest) {
  const cacheKey = 'longhorns:mcp:baseball';

  // Read from KV
  const cached = await LONGHORNS_CACHE.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  // Write to KV
  await LONGHORNS_CACHE.put(
    cacheKey,
    JSON.stringify(data),
    { expirationTtl: 3600 } // 1 hour
  );
}
```

### Cache Keys

```
longhorns:mcp:baseball        - Baseball MCP data
longhorns:mcp:football        - Football MCP data
longhorns:mcp:basketball      - Basketball MCP data
longhorns:mcp:track-field     - Track & Field MCP data
longhorns:mcp:all             - All sports combined
ncaa:baseball:games:all       - Live NCAA baseball games
ncaa:baseball:games:texas     - Texas Longhorns games only
```

### Cache TTLs

- **MCP Static Data**: 3600s (1 hour)
- **Live NCAA Data**: 300s (5 minutes)
- **Player Stats**: 1800s (30 minutes)

---

## Cloudflare Images {#cloudflare-images}

Cloudflare Images provides automatic image optimization, responsive images, and global CDN delivery.

### Setup

1. **Enable Cloudflare Images in your account:**
   ```bash
   # Visit Cloudflare Dashboard → Images
   # Enable Cloudflare Images
   # Copy your Account Hash
   ```

2. **Add environment variables:**
   ```bash
   # .env.local
   NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH=your_account_hash
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   ```

3. **Update wrangler.toml:**
   ```toml
   [env.production.vars]
   IMAGES_ACCOUNT_HASH = "your_account_hash"
   IMAGES_DELIVERY_URL = "https://imagedelivery.net"
   ```

### Usage

#### Basic Image Component

```tsx
import { CloudflareImage } from '@/components/CloudflareImage';

<CloudflareImage
  imageId="longhorns-hero-2025"
  alt="Texas Longhorns Championship"
  width={1920}
  height={1080}
  fit="cover"
  quality={90}
/>
```

#### Responsive Images

```tsx
import { CloudflareImage } from '@/components/CloudflareImage';

<CloudflareImage
  imageId="player-photo-123"
  alt="Player Name"
  width={400}
  height={300}
  fit="cover"
  // Automatically generates srcset for:
  // 320w, 640w, 768w, 1024w, 1280w, 1536w
/>
```

#### Background Images

```tsx
import { CloudflareBackgroundImage } from '@/components/CloudflareImage';

<CloudflareBackgroundImage
  imageId="stadium-background"
  alt="DKR Stadium"
  className="hero-section"
>
  <h1>Welcome to Texas Football</h1>
</CloudflareBackgroundImage>
```

#### Avatar Images

```tsx
import { CloudflareAvatar } from '@/components/CloudflareImage';

<CloudflareAvatar
  imageId="coach-sarkisian"
  alt="Coach Sarkisian"
  size={128}
/>
```

### Pre-configured Variants

```typescript
import { getVariantUrl, IMAGE_VARIANTS } from '@/lib/cloudflare-images';

// Available variants:
const variants = {
  thumbnail: { width: 200, height: 200, fit: 'cover', quality: 80 },
  card: { width: 400, height: 300, fit: 'cover', quality: 85 },
  hero: { width: 1920, height: 1080, fit: 'cover', quality: 90 },
  avatar: { width: 128, height: 128, fit: 'cover', quality: 85 },
  og: { width: 1200, height: 630, fit: 'cover', quality: 90 },
};

// Usage:
const ogImageUrl = getVariantUrl('post-image-123', 'og');
```

### Uploading Images (Server-side)

```typescript
import { uploadToCloudflareImages } from '@/lib/cloudflare-images';

// In API route
const file = await request.formData().get('file') as File;
const result = await uploadToCloudflareImages(file, {
  sport: 'football',
  team: 'texas-longhorns',
  year: '2025',
});

console.log('Uploaded:', result.id, result.url);
```

---

## NCAA Live Data APIs {#ncaa-apis}

Connects to live NCAA Stats API for real-time game data.

### API Endpoints

#### Get Live Baseball Games

```bash
# All games
GET /api/ncaa/baseball

# Texas Longhorns games only
GET /api/ncaa/baseball?team=texas

# Response:
{
  "games": [
    {
      "gameId": "game-123",
      "date": "2025-03-15T18:00:00Z",
      "homeTeam": "Texas Longhorns",
      "awayTeam": "LSU Tigers",
      "homeScore": 5,
      "awayScore": 3,
      "inning": "9th",
      "status": "live"
    }
  ],
  "cached": false,
  "timestamp": "2025-03-15T20:30:00Z"
}
```

#### Get MCP Data

```bash
# All sports
GET /api/longhorns?all=true

# Specific sport
GET /api/longhorns?sport=baseball

# Response:
{
  "data": { /* MCP data */ },
  "cached": true,
  "timestamp": "2025-03-15T20:30:00Z"
}
```

#### Search MCP Data

```bash
POST /api/longhorns
Content-Type: application/json

{
  "sport": "football",
  "query": "heisman"
}

# Response:
{
  "results": [
    {
      "type": "player",
      "data": {
        "id": "earl-campbell",
        "name": "Earl Campbell",
        "accolades": ["1977 Heisman Trophy", ...]
      }
    }
  ],
  "sport": "football",
  "query": "heisman"
}
```

### Rate Limiting

NCAA API calls are cached in Cloudflare KV:
- **First request**: Hits NCAA API, caches for 5 minutes
- **Subsequent requests**: Served from edge cache (sub-50ms)

### Error Handling

All APIs return standardized error responses:

```json
{
  "error": "Failed to fetch NCAA data",
  "timestamp": "2025-03-15T20:30:00Z"
}
```

---

## Deployment {#deployment}

### Prerequisites

```bash
# Install dependencies
pnpm install

# Login to Cloudflare
wrangler login

# Setup KV namespace
./scripts/setup-cloudflare-kv.sh
```

### Local Development

```bash
# Start Next.js dev server
pnpm dev

# Test with Cloudflare Workers locally
wrangler dev
```

### Production Deployment

#### Option 1: GitHub Actions (Automatic)

Merge to `main` branch - GitHub Actions will:
1. Build Next.js with OpenNext
2. Deploy to Cloudflare Pages
3. Deploy API Worker with KV bindings
4. Seed KV with MCP data

#### Option 2: Manual Deployment

```bash
# Build the app
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy apps/web/.open-next --project-name=blazesportsintel

# Deploy API Worker
cd apps/api-worker && wrangler deploy
```

### Verification

After deployment, test the endpoints:

```bash
# Test MCP API
curl https://blazesportsintel.com/api/longhorns?sport=baseball

# Test NCAA API
curl https://blazesportsintel.com/api/ncaa/baseball?team=texas

# Test Images
curl https://imagedelivery.net/YOUR_HASH/test-image/public
```

---

## Monitoring

### KV Analytics

```bash
# View KV metrics
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Check specific key
wrangler kv:key get --namespace-id=YOUR_NAMESPACE_ID "longhorns:mcp:baseball"
```

### Images Analytics

Visit: Cloudflare Dashboard → Images → Analytics

### API Logs

```bash
# Stream Worker logs
wrangler tail

# Filter by status
wrangler tail --status error
```

---

## Cost Optimization

### KV Storage
- **Free tier**: 1 GB, 100K reads/day
- **Paid**: $0.50/GB/month, $0.50/million reads

### Images
- **Free tier**: Up to 100K images
- **Paid**: $5/month for 100K images, $1/month per additional 100K

### Workers
- **Free tier**: 100K requests/day
- **Paid**: $5/month for 10M requests

### Recommendations
- Use KV TTL to auto-expire old data
- Enable Cloudflare Cache for static assets
- Use Image variants instead of dynamic transformations

---

## Troubleshooting

### KV Issues

**Problem**: `LONGHORNS_CACHE is not defined`
**Solution**: Ensure wrangler.toml has correct KV binding and namespace ID

**Problem**: Stale data in cache
**Solution**: Clear KV manually:
```bash
wrangler kv:key delete --namespace-id=YOUR_ID "cache-key"
```

### Images Issues

**Problem**: Images not loading
**Solution**: Check NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH in environment variables

**Problem**: 404 on image URLs
**Solution**: Verify image ID exists in Cloudflare Images dashboard

### NCAA API Issues

**Problem**: Rate limiting
**Solution**: KV cache should prevent this - check KV is working

**Problem**: No games returned
**Solution**: NCAA API may be down or no games scheduled

---

## Support

For issues:
1. Check Cloudflare Workers logs: `wrangler tail`
2. Verify KV data: `wrangler kv:key list`
3. Check deployment status: Cloudflare Dashboard → Pages
4. Review GitHub Actions logs

---

**Last Updated**: 2025-10-22
**Version**: 1.0.0
