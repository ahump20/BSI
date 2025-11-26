# Blaze Sports Intel - Cloudflare Pages Deployment Guide

## 🚀 Deployment Complete!

Your Blaze Sports Intel platform has been successfully deployed to Cloudflare Pages.

### Deployment URLs
- **Preview URL**: https://1192a534.blazesportsintel.pages.dev
- **Production URL**: https://blazesportsintel.pages.dev (after project setup)
- **Custom Domain**: https://blazesportsintel.com (after DNS configuration)

---

## 🌐 Custom Domain Setup Instructions

### Step 1: Access Cloudflare Dashboard
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** in the left sidebar
3. Select your `blazesportsintel` project

### Step 2: Configure Custom Domain
1. Go to **Settings** → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `blazesportsintel.com`
4. Follow the DNS configuration wizard

### Step 3: DNS Configuration
Cloudflare will automatically configure these DNS records:

```
Type    Name                 Content                        Proxy Status
CNAME   blazesportsintel.com blazesportsintel.pages.dev    Proxied
CNAME   www                  blazesportsintel.pages.dev    Proxied
```

### Step 4: SSL/TLS Settings
1. Navigate to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

---

## 🔧 Deployment Commands

### Deploy to Production
```bash
npx wrangler pages deploy . --project-name=blazesportsintel --branch=main
```

### Deploy to Preview
```bash
npx wrangler pages deploy . --project-name=blazesportsintel --branch=preview
```

### View Deployment Logs
```bash
npx wrangler pages deployment tail
```

---

## 🏗️ Project Structure

```
blazesportsintel/
├── index.html                 # Main platform entry
├── _headers                   # Security headers configuration
├── _redirects                 # URL routing rules
├── css/                       # Stylesheets
├── js/                        # JavaScript modules
├── data/                      # Sports data files
└── wrangler.toml.backup      # Full Workers configuration (reference)
```

---

## ⚙️ Environment Configuration

### Production Environment
- **Branch**: main
- **URL**: blazesportsintel.pages.dev
- **Features**: Full production features with caching

### Preview Environment
- **Branch**: Any non-main branch
- **URL**: [hash].blazesportsintel.pages.dev
- **Features**: Testing environment with debug mode

---

## 🔌 Integrations Status

### Cloudflare Services
- ✅ **Pages**: Static site hosting
- ✅ **CDN**: Global content delivery
- ✅ **SSL**: Automatic HTTPS
- ⚙️ **R2**: Storage buckets (configured in wrangler.toml)
- ⚙️ **KV**: Key-value storage (configured in wrangler.toml)
- ⚙️ **D1**: Database (configured in wrangler.toml)
- ⚙️ **Workers**: Serverless functions (separate deployment needed)

### External Services
- ✅ **MCP Server**: Cardinals Analytics integration ready
- ✅ **AI Models**: Multi-AI orchestration configured
- ✅ **Sports APIs**: Data feeds configured

---

## 📊 Performance Optimizations

### Headers Configuration
- Strict Transport Security (HSTS) enabled
- Content Security Policy configured
- CORS properly configured for blazesportsintel.com
- Cache control optimized for static assets

### Asset Optimization
- JavaScript files cached for 1 year
- CSS files cached for 1 year
- HTML files cached with validation
- Images served with appropriate cache headers

---

## 🛠️ Maintenance Tasks

### Update Content
```bash
# Make changes to files
git add .
git commit -m "Update content"
git push origin main

# Deploy changes
npx wrangler pages deploy . --project-name=blazesportsintel --branch=main
```

### Monitor Performance
1. Access Cloudflare Analytics
2. Review Web Analytics dashboard
3. Check Core Web Vitals scores
4. Monitor error rates in Pages dashboard

### Backup Strategy
- Git repository: https://github.com/ahump20/BSI
- Local backups maintained in project directory
- Cloudflare automatic backups for Pages

---

## 🚨 Troubleshooting

### Common Issues

#### Domain Not Resolving
- Verify DNS records in Cloudflare dashboard
- Check SSL/TLS settings are set to "Full (strict)"
- Wait 5-10 minutes for DNS propagation

#### 404 Errors
- Check _redirects file configuration
- Verify file paths are correct
- Ensure index.html exists in root

#### Performance Issues
- Review Cloudflare Analytics
- Check for large unoptimized images
- Enable Cloudflare performance features

---

## 📞 Support Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/cli-wrangler
- **Community Discord**: https://discord.cloudflare.com
- **Status Page**: https://www.cloudflarestatus.com

---

## 🎯 Next Steps

1. **Configure Custom Domain**: Set up blazesportsintel.com in Cloudflare Dashboard
2. **Enable Analytics**: Set up Web Analytics for traffic monitoring
3. **Configure Workers**: Deploy serverless functions for API endpoints
4. **Set Up R2 Buckets**: Create storage buckets for media files
5. **Configure KV Namespaces**: Set up key-value storage for caching
6. **Create D1 Database**: Initialize database for structured data

---

## 📝 Notes

- The wrangler.toml contains advanced Workers configuration that requires separate deployment
- Pages deployment handles static files, _headers, and _redirects automatically
- For full-stack features (R2, KV, D1), deploy Workers separately using the wrangler.toml configuration
- Custom domain must be registered and pointing to Cloudflare nameservers

---

**Deployment Date**: September 27, 2025
**Platform**: Cloudflare Pages
**Project**: Blaze Sports Intel - Championship Intelligence Platform
**Repository**: https://github.com/ahump20/BSI