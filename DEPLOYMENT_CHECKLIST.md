# Texas Longhorns Deployment Checklist

## 🎯 Deployment Status

**Branch:** `claude/longhorns-mcp-builder-011CUP1fZ6eDSeThjFfLiuLX`
**Target:** Production at `blazesportsintel.com/texas-longhorns`
**All Code:** ✅ Complete and pushed to remote

---

## Step 1: Create Pull Request ⏳ REQUIRED

### Quick Link Method (Fastest)
Click this link to create the PR:
**https://github.com/ahump20/BSI/compare/main...claude/longhorns-mcp-builder-011CUP1fZ6eDSeThjFfLiuLX**

### PR Details to Use:

**Title:**
```
Texas Longhorns Production Deployment with Cloudflare Integration
```

**Description:** Copy from section below

<details>
<summary>Click to expand PR description (copy this)</summary>

```markdown
## Summary

This PR deploys the Texas Longhorns sports intelligence platform to production at **blazesportsintel.com/texas-longhorns** with comprehensive Cloudflare integration.

### 🎯 Features Implemented

#### ✅ Enhanced Texas Longhorns MCP Data
- **Baseball**: 6 national championships, legends (Roger Clemens, Huston Street)
- **Football**: 4 national championships, 2 Heisman winners (Earl Campbell, Ricky Williams)
- **Basketball**: Men's Final Fours, Women's 1986 perfect season (34-0)
- **Track & Field**: 40 Olympic medals, 14 women's NCAA championships

#### ✅ Production-Quality Web Page
- Route: `/texas-longhorns`
- Responsive design with site branding
- Championship grids, player cards, stat displays

#### ✅ Cloudflare Integration
- KV caching (1hr for MCP, 5min for live data)
- Live NCAA data APIs
- Images optimization with React components
- Edge runtime for <50ms response times

### 📁 Key Files

**Data & Pages:**
- MCP feeds for 4 sports (baseball, football, basketball, track-field)
- `apps/web/app/texas-longhorns/page.tsx` (520 lines)
- `apps/web/app/texas-longhorns/longhorns.css` (344 lines)

**APIs:**
- `apps/web/app/api/ncaa/baseball/route.ts` - Live NCAA data
- `apps/web/app/api/longhorns/route.ts` - MCP data with search

**Cloudflare:**
- `apps/web/lib/cloudflare-images.ts` - Image utilities
- `apps/web/components/CloudflareImage.tsx` - React components
- `scripts/setup-cloudflare-kv.sh` - Automated KV setup

**Docs:**
- `docs/CLOUDFLARE_DEPLOYMENT.md` (285 lines)
- `docs/CLOUDFLARE_SETUP.md` (470 lines)

### 🚀 Post-Merge Steps

1. Configure Cloudflare Pages
2. Run KV setup script
3. Verify deployment

See `DEPLOYMENT_CHECKLIST.md` for complete instructions.

### ✅ Testing
- ✅ All tests passing
- ✅ Build succeeds
- ✅ TypeScript validates
- ✅ 35 routes generated

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

</details>

### After Creating PR:
1. Review the changes
2. **Merge the PR** (this triggers deployment if Cloudflare Pages is connected)
3. Continue to Step 2 below

---

## Step 2: Connect Cloudflare Pages to GitHub 🔄

### Option A: Automatic Deployment (Recommended)

1. **Go to Cloudflare Dashboard:**
   - Navigate to: https://dash.cloudflare.com
   - Select your account

2. **Create Pages Project:**
   - Click: **Workers & Pages** → **Create Application** → **Pages** tab
   - Click: **Connect to Git**

3. **Connect Repository:**
   - Select: **GitHub**
   - Authorize Cloudflare if needed
   - Choose repository: **ahump20/BSI**

4. **Configure Build Settings:**
   ```
   Project name: blazesportsintel
   Production branch: main
   Framework preset: Next.js
   Build command: pnpm install && pnpm --filter @bsi/web build
   Build output directory: apps/web/.next
   Root directory: /
   ```

5. **Add Environment Variables:**
   ```
   NODE_VERSION = 22
   NEXT_TELEMETRY_DISABLED = 1
   ```

6. **Save and Deploy:**
   - Click "Save and Deploy"
   - Cloudflare will automatically build and deploy
   - Wait 3-5 minutes for first deployment

### Option B: Manual Deployment with Wrangler

If you prefer manual control:

```bash
# 1. Authenticate with Cloudflare
pnpm wrangler login

# 2. Build the application
pnpm --filter @bsi/web build

# 3. Deploy to Cloudflare Pages
pnpm wrangler pages deploy apps/web/.next \
  --project-name=blazesportsintel \
  --branch=main
```

---

## Step 3: Setup Cloudflare KV 🗄️

### Automated Setup (Recommended)

From the repository root, run:

```bash
# Make script executable
chmod +x scripts/setup-cloudflare-kv.sh

# Run the setup script
./scripts/setup-cloudflare-kv.sh
```

This script will:
- ✅ Create production KV namespace: `LONGHORNS_CACHE`
- ✅ Create preview KV namespace: `LONGHORNS_CACHE` (preview)
- ✅ Update `apps/api-worker/wrangler.toml` with namespace IDs
- ✅ Seed baseball data (6 championships, legends)
- ✅ Seed football data (Heisman winners, championships)
- ✅ Seed basketball data (men's & women's programs)
- ✅ Seed track & field data (Olympic athletes)
- ✅ Create combined "all sports" cache entry

### Manual Setup (if needed)

<details>
<summary>Click to expand manual KV setup instructions</summary>

```bash
# 1. Create namespaces
pnpm wrangler kv:namespace create "LONGHORNS_CACHE"
# Note the ID from output

pnpm wrangler kv:namespace create "LONGHORNS_CACHE" --preview
# Note the preview ID

# 2. Update wrangler.toml
# Edit apps/api-worker/wrangler.toml and add:
[[kv_namespaces]]
binding = "LONGHORNS_CACHE"
id = "YOUR_PRODUCTION_ID"
preview_id = "YOUR_PREVIEW_ID"

# 3. Seed data
pnpm wrangler kv:key put --namespace-id=YOUR_ID \
  "longhorns:mcp:baseball" \
  "$(cat mcp/texas-longhorns/feeds/baseball.json)"

pnpm wrangler kv:key put --namespace-id=YOUR_ID \
  "longhorns:mcp:football" \
  "$(cat mcp/texas-longhorns/feeds/football.json)"

pnpm wrangler kv:key put --namespace-id=YOUR_ID \
  "longhorns:mcp:basketball" \
  "$(cat mcp/texas-longhorns/feeds/basketball.json)"

pnpm wrangler kv:key put --namespace-id=YOUR_ID \
  "longhorns:mcp:track-field" \
  "$(cat mcp/texas-longhorns/feeds/track-field.json)"
```

</details>

### Bind KV to Pages Project

```bash
# Link KV namespace to Pages
pnpm wrangler pages deployment create \
  --project-name=blazesportsintel \
  --kv LONGHORNS_CACHE:YOUR_NAMESPACE_ID
```

---

## Step 4: Setup Cloudflare Images (Optional) 🖼️

### Enable Cloudflare Images

1. Go to: **Cloudflare Dashboard** → **Images**
2. Click: **Enable Cloudflare Images**
3. Note your **Account Hash** (shown in Images settings)

### Add Environment Variables

In Cloudflare Pages → Settings → Environment Variables:

```
NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH = your_account_hash_here
CLOUDFLARE_ACCOUNT_ID = your_account_id
CLOUDFLARE_API_TOKEN = your_api_token_with_images_permissions
```

### Upload Sample Images (Optional)

```bash
# Upload team logo
pnpm wrangler images upload /path/to/longhorns-logo.png \
  --name=longhorns-logo

# Upload player photos, etc.
```

---

## Step 5: Verify Deployment ✅

### Test All Endpoints

```bash
# 1. Texas Longhorns main page
curl -I https://blazesportsintel.com/texas-longhorns
# Expected: 200 OK

# 2. MCP API - All sports
curl https://blazesportsintel.com/api/longhorns | jq '.data'
# Expected: JSON with baseball, football, basketball, trackField

# 3. MCP API - Specific sport
curl https://blazesportsintel.com/api/longhorns?sport=baseball | jq '.data.nationalChampionships'
# Expected: Array of 6 championships

# 4. NCAA Live Data API
curl "https://blazesportsintel.com/api/ncaa/baseball?team=texas" | jq '.games'
# Expected: Array of game data (or empty if no games)

# 5. MCP Search
curl -X POST https://blazesportsintel.com/api/longhorns \
  -H "Content-Type: application/json" \
  -d '{"sport":"football","query":"Heisman"}' | jq '.results'
# Expected: Results with Earl Campbell and Ricky Williams
```

### Check Cache Headers

```bash
# First request (cache miss)
curl -I https://blazesportsintel.com/api/longhorns
# Look for: Cache-Control: public, s-maxage=3600

# Second request (cache hit)
curl -I https://blazesportsintel.com/api/longhorns
# Should be faster, served from KV cache
```

### Browser Testing

Open in browser:
- https://blazesportsintel.com/texas-longhorns

Verify:
- ✅ Page loads with Texas Longhorns branding
- ✅ Baseball section shows 6 championships
- ✅ Football section shows 2 Heisman winners
- ✅ Basketball section shows men's & women's programs
- ✅ Track & Field section shows Olympic medals
- ✅ Responsive design works on mobile
- ✅ Dark mode with burnt orange accents

---

## Step 6: Monitor Performance 📊

### Cloudflare Analytics

1. Go to: **Cloudflare Pages** → **blazesportsintel** → **Analytics**
2. Monitor:
   - Requests per second
   - Bandwidth usage
   - Error rate
   - Response times (should be <50ms globally)

### KV Usage

```bash
# List all cached keys
pnpm wrangler kv:key list --namespace-id=YOUR_ID

# Check specific cache entry
pnpm wrangler kv:key get --namespace-id=YOUR_ID "longhorns:mcp:baseball"

# Monitor cache hits/misses in Analytics
```

### View Deployment Logs

```bash
# List deployments
pnpm wrangler pages deployment list --project-name=blazesportsintel

# Tail live logs
pnpm wrangler pages deployment tail --project-name=blazesportsintel
```

---

## Troubleshooting 🔧

### Build Fails

```bash
# Test build locally first
pnpm --filter @bsi/web build

# Check for errors in output
# If successful locally, issue is with Cloudflare config
```

### 404 on /texas-longhorns

- Verify deployment completed successfully
- Check that `apps/web/app/texas-longhorns/page.tsx` exists in build
- Review Cloudflare Pages build logs

### API Routes Return 500

- Check KV namespace is bound to Pages project
- Verify namespace IDs in wrangler.toml are correct
- Run KV setup script again

### Cache Not Working

```bash
# Verify KV namespace exists
pnpm wrangler kv:namespace list

# Check if data is seeded
pnpm wrangler kv:key list --namespace-id=YOUR_ID

# Re-run setup script
./scripts/setup-cloudflare-kv.sh
```

### Images Not Loading

- Verify `NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH` is set
- Check account hash is correct
- Ensure Cloudflare Images is enabled

---

## Performance Expectations 🚀

After successful deployment, you should see:

### Response Times
- **Static Pages**: 10-30ms (CDN edge)
- **API Routes (cached)**: 20-50ms (KV lookup)
- **API Routes (uncached)**: 100-300ms (origin fetch)

### Cache Hit Rates
- **MCP Data**: 95%+ (1-hour TTL)
- **Live NCAA Data**: 80%+ (5-minute TTL)

### Bandwidth Savings
- **With Images Optimization**: 60-80% reduction
- **With Edge Caching**: 90%+ reduction in origin requests

### Free Tier Limits
- **KV Reads**: 100,000/day ✅
- **KV Writes**: 1,000/day ✅
- **Pages Requests**: 100,000/day ✅
- **Images Transforms**: 100,000/month ✅

Current configuration stays well within free tier limits.

---

## Success Criteria ✅

Deployment is successful when:

- ✅ PR merged to main branch
- ✅ Cloudflare Pages build completes successfully
- ✅ `/texas-longhorns` page loads in browser
- ✅ All 4 sports sections display correctly
- ✅ MCP API returns data at `/api/longhorns`
- ✅ NCAA API responds at `/api/ncaa/baseball`
- ✅ KV cache is working (check response headers)
- ✅ Response times are <50ms globally
- ✅ No console errors in browser
- ✅ Mobile responsive design works

---

## Quick Reference Commands

```bash
# Build locally
pnpm --filter @bsi/web build

# Deploy to Cloudflare
pnpm wrangler pages deploy apps/web/.next --project-name=blazesportsintel

# Setup KV
./scripts/setup-cloudflare-kv.sh

# View logs
pnpm wrangler pages deployment tail

# List KV keys
pnpm wrangler kv:key list --namespace-id=YOUR_ID

# Test endpoints
curl https://blazesportsintel.com/texas-longhorns
curl https://blazesportsintel.com/api/longhorns?sport=baseball
```

---

## Support & Documentation

- **Full Deployment Guide**: `docs/CLOUDFLARE_DEPLOYMENT.md`
- **Technical Setup**: `docs/CLOUDFLARE_SETUP.md`
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Next.js on Pages**: https://developers.cloudflare.com/pages/framework-guides/nextjs/

---

## Next Steps After Deployment

1. **Custom Domain** (if needed):
   - Configure `blazesportsintel.com/texas-longhorns` routing
   - Add DNS records in Cloudflare

2. **Preview Deployments**:
   - Enable for branch testing
   - Configure in Cloudflare Pages settings

3. **Web Analytics**:
   - Enable in Cloudflare Dashboard
   - Track page views, visitors, performance

4. **Rate Limiting** (if needed):
   - Configure in Cloudflare Firewall
   - Protect API endpoints from abuse

5. **Monitoring Alerts**:
   - Set up email/Slack notifications
   - Alert on errors, downtime, high latency

---

**Last Updated**: 2025-10-23
**Branch**: claude/longhorns-mcp-builder-011CUP1fZ6eDSeThjFfLiuLX
**Commits**: 8 total, all pushed ✅
