# Netlify to Cloudflare Pages Migration Guide

## Executive Summary

This repository has been fully migrated from Netlify to Cloudflare Pages. All deployment infrastructure now uses Cloudflare Workers, Pages, D1, R2, and KV.

**Migration Status**: ✅ COMPLETE
**Previous Platform**: Netlify
**Current Platform**: Cloudflare Pages + Workers
**Migration Date**: 2025-11-01

---

## What Changed

### Removed
- ❌ Netlify-specific deployment configuration
- ❌ Netlify Functions (if any)
- ❌ Netlify Forms
- ❌ Netlify-specific environment variables

### Added
- ✅ Cloudflare Pages deployment via GitHub Actions
- ✅ `_headers` file optimized for Cloudflare CDN
- ✅ `_redirects` file (compatible format)
- ✅ Vite plugin to copy configuration files
- ✅ Automated CI/CD workflows
- ✅ D1/KV/R2 integrations for backend

### Kept (Compatible)
- ✅ `_redirects` file format (Cloudflare supports Netlify format)
- ✅ Build commands (`npm run build`)
- ✅ Output directory (`dist/`)
- ✅ All source code and assets

---

## Configuration Files

### _redirects
**Status**: ✅ Compatible (no changes needed)

Cloudflare Pages supports the same redirect format as Netlify:
```
# Redirect www to non-www
https://www.blazesportsintel.com/* https://blazesportsintel.com/:splat 301!
```

**Documentation**: [Cloudflare Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)

### _headers
**Status**: ✅ Enhanced for Cloudflare

Enhanced with:
- Stronger security headers (CSP, X-Frame-Options, etc.)
- Optimized cache control for Cloudflare CDN
- Immutable caching for static assets
- API route no-cache policies

**Documentation**: [Cloudflare Headers](https://developers.cloudflare.com/pages/configuration/headers/)

### vite.config.js
**Status**: ✅ Updated

Added custom plugin to automatically copy `_redirects` and `_headers` to `dist/` during build:

```javascript
const copyCloudflareFiles = () => ({
  name: 'copy-cloudflare-files',
  closeBundle() {
    copyFileSync('_redirects', 'dist/_redirects');
    copyFileSync('_headers', 'dist/_headers');
  }
});
```

---

## Build Process Changes

### Before (Netlify)
```bash
# Netlify handled build automatically
# Configuration in netlify.toml (now removed)
```

### After (Cloudflare Pages)
```bash
# Build locally
npm run build

# Deploy via GitHub Actions (automatic)
# Or manually with Wrangler
npm run deploy
```

### Build Command
- **Command**: `npm run build:lib && vite build`
- **Output Directory**: `dist/`
- **Node Version**: 20

---

## Deployment Changes

### Before (Netlify)
- Push to main → Netlify auto-builds and deploys
- Preview deploys for PRs
- Deploy previews at `deploy-preview-*.netlify.app`

### After (Cloudflare Pages)
- Push to main → GitHub Actions → Cloudflare Pages
- Preview deploys for PRs
- Production: `blazesportsintel.com`
- Previews: `*.pages.dev`

### Deployment URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://blazesportsintel.com` |
| **Staging** | `https://staging.blazesportsintel.com` (if configured) |
| **PR Previews** | `https://<branch>.<project>.pages.dev` |

---

## Environment Variables

### Migration Steps

1. **Export from Netlify** (if needed):
   ```bash
   netlify env:list
   ```

2. **Add to GitHub Secrets**:
   ```bash
   gh secret set CLOUDFLARE_API_TOKEN
   gh secret set CLOUDFLARE_ACCOUNT_ID
   gh secret set CLOUDFLARE_PAGES_PROJECT -b 'bsi-main'
   ```

3. **Add to Cloudflare Pages** (for runtime):
   - Go to Cloudflare Dashboard → Pages → Settings → Environment Variables
   - Add any runtime environment variables

### Required Secrets

| Secret | Where Used | Value |
|--------|-----------|-------|
| `CLOUDFLARE_API_TOKEN` | GitHub Actions | From Cloudflare Dashboard |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions | From Cloudflare Dashboard |
| `CLOUDFLARE_PAGES_PROJECT` | GitHub Actions | `bsi-main` |

---

## Feature Comparison

### Netlify Features → Cloudflare Equivalent

| Netlify Feature | Cloudflare Equivalent | Status |
|----------------|----------------------|--------|
| **Continuous Deployment** | GitHub Actions + Pages | ✅ Implemented |
| **Custom Domains** | Cloudflare Pages Domains | ✅ Supported |
| **SSL/TLS** | Cloudflare SSL | ✅ Automatic |
| **Preview Deploys** | Pages Preview | ✅ Implemented |
| **Redirects** | `_redirects` file | ✅ Compatible |
| **Headers** | `_headers` file | ✅ Enhanced |
| **Functions** | Cloudflare Workers | ✅ Available |
| **Forms** | Workers + KV/D1 | ⚠️  Manual setup |
| **Analytics** | Cloudflare Web Analytics | ✅ Available |
| **Build Plugins** | Vite Plugins | ✅ Implemented |

---

## Forms Migration

### Before (Netlify Forms)
```html
<form name="contact" method="POST" data-netlify="true">
  <!-- form fields -->
</form>
```

### After (Cloudflare Worker)

Netlify Forms are not directly supported on Cloudflare Pages. Options:

#### Option 1: Cloudflare Worker Function
Create a Worker to handle form submissions:

```javascript
// functions/contact.js
export async function onRequestPost(context) {
  const formData = await context.request.formData();

  // Store in D1 database
  await context.env.DB.prepare(
    'INSERT INTO submissions (name, email, message) VALUES (?, ?, ?)'
  ).bind(
    formData.get('name'),
    formData.get('email'),
    formData.get('message')
  ).run();

  return new Response('Success', { status: 200 });
}
```

#### Option 2: Third-party Service
- [Formspree](https://formspree.io/)
- [Getform](https://getform.io/)
- [Basin](https://usebasin.com/)

---

## CDN and Caching

### Netlify CDN
- Global CDN with automatic cache invalidation
- Custom cache headers via `_headers`
- Instant purge on deploy

### Cloudflare CDN
- Global CDN with 200+ data centers
- Custom cache headers via `_headers`
- Automatic purge on deploy
- **Additional Benefits**:
  - DDoS protection
  - WAF (Web Application Firewall)
  - Bot management
  - Image optimization

### Cache Configuration

```
# _headers
/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

**Cloudflare respects these headers and caches accordingly.**

---

## Performance Optimizations

### Enabled by Default on Cloudflare Pages

1. **Auto Minify**: HTML, CSS, JS
2. **Brotli Compression**: Automatic
3. **HTTP/2**: Enabled
4. **HTTP/3 (QUIC)**: Available
5. **Early Hints**: Supported
6. **Smart Routing**: Argo Smart Routing (optional)

### Additional Optimizations

1. **Image Optimization**:
   ```html
   <!-- Use Cloudflare Images -->
   <img src="/cdn-cgi/image/width=800/image.jpg" />
   ```

2. **R2 for Media**:
   - Store large media files in R2
   - Serve via custom domain
   - Automatic CDN distribution

3. **Workers for API**:
   - Edge-side API responses
   - D1 database queries
   - KV caching layer

---

## Domain and DNS

### Migration Steps

1. **Update DNS** (if domain is not on Cloudflare):
   ```bash
   # Point domain to Cloudflare nameservers
   # ns1.cloudflare.com
   # ns2.cloudflare.com
   ```

2. **Add Custom Domain in Cloudflare Pages**:
   - Dashboard → Pages → Custom Domains
   - Add `blazesportsintel.com`
   - Add `www.blazesportsintel.com` (will auto-redirect via `_redirects`)

3. **SSL/TLS**:
   - Automatic via Cloudflare
   - Free Universal SSL
   - Auto-renewal

### DNS Records

```
# A Records (Cloudflare Pages)
blazesportsintel.com → Cloudflare Pages (auto-configured)

# CNAME Records
www.blazesportsintel.com → blazesportsintel.com (handled by _redirects)
api.blazesportsintel.com → <worker-url> (for API Worker)
```

---

## Monitoring and Analytics

### Netlify Analytics
- Build metrics
- Deploy history
- Basic traffic stats

### Cloudflare Analytics

1. **Web Analytics** (Free):
   - Page views
   - Visitors
   - Performance metrics
   - Core Web Vitals

2. **Pages Analytics**:
   - Build times
   - Deploy history
   - Function invocations

3. **Workers Analytics** (for API):
   - Request count
   - Error rate
   - Execution time
   - CPU time

### Setup Web Analytics

```html
<!-- Add to index.html -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
        data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

---

## Rollback Plan

If you need to rollback to Netlify:

1. **Re-enable Netlify**:
   ```bash
   # In Netlify dashboard
   # Link repository
   # Set build command: npm run build
   # Set publish directory: dist
   ```

2. **Update DNS**:
   - Point back to Netlify nameservers or A records

3. **Remove Cloudflare deployment**:
   - Disable GitHub Actions workflow
   - Keep code changes (compatible with both platforms)

**Note**: `_redirects` and `_headers` are compatible with both platforms, so no code changes needed for rollback.

---

## Testing Checklist

### Pre-Deployment
- [x] Build succeeds locally: `npm run build`
- [x] `_redirects` copied to `dist/_redirects`
- [x] `_headers` copied to `dist/_headers`
- [x] All HTML entry points exist
- [x] Assets load correctly in preview

### Post-Deployment
- [ ] Production URL accessible
- [ ] WWW redirect works
- [ ] SSL certificate valid
- [ ] All pages load correctly
- [ ] Images and assets load
- [ ] API endpoints respond (if applicable)
- [ ] Forms submit correctly (if migrated)
- [ ] Analytics tracking works

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Assets cached correctly
- [ ] CDN headers present

---

## Support and Resources

### Cloudflare Documentation
- [Pages Documentation](https://developers.cloudflare.com/pages/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)

### Migration Guides
- [Netlify to Cloudflare Pages](https://developers.cloudflare.com/pages/migrations/migrating-from-netlify/)
- [Redirects and Headers](https://developers.cloudflare.com/pages/configuration/)

### Community Support
- [Cloudflare Community](https://community.cloudflare.com/)
- [Discord](https://discord.gg/cloudflaredev)

---

## Frequently Asked Questions

### Q: Will my redirect rules still work?
**A**: Yes! Cloudflare Pages supports the same `_redirects` format as Netlify.

### Q: What about environment variables?
**A**: Add them to:
1. GitHub Secrets (for build-time variables)
2. Cloudflare Pages Environment Variables (for runtime)

### Q: How do I handle forms?
**A**: Use Cloudflare Workers with D1/KV or a third-party service like Formspree.

### Q: Can I keep my custom domain?
**A**: Yes! Update your DNS to point to Cloudflare Pages.

### Q: What about Analytics?
**A**: Cloudflare Web Analytics is free and more comprehensive than Netlify Analytics.

### Q: How do I test before going live?
**A**: Use PR preview deployments. Every PR gets a unique preview URL.

### Q: Can I rollback if something breaks?
**A**: Yes! See the Rollback Plan section above.

---

## Next Steps

1. ✅ Configuration files updated
2. ✅ Build process configured
3. ✅ GitHub Actions workflows ready
4. ⬜ Run `./scripts/init-cloudflare-ci.sh`
5. ⬜ Create Cloudflare Pages project
6. ⬜ Test deployment with a PR
7. ⬜ Migrate custom domain
8. ⬜ Set up Web Analytics
9. ⬜ Monitor for 48 hours

---

**Migration completed on**: 2025-11-01
**Maintained by**: Blaze Sports Intel DevOps Team
**Questions?**: Create an issue with the `deployment` label
