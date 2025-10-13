# Deployment History

This document consolidates historical deployment information from various deployment reports.

## Current Active Deployment

**Production URL**: https://blazesportsintel.com
**Project**: Blaze Sports Intel - College Baseball Tracker
**Platform**: Cloudflare Pages
**Status**: ✅ Live

### Active Configuration
- **Wrangler Config**: `wrangler.toml`
- **Deployment Guide**: `DEPLOYMENT-GUIDE.md`
- **Production API**: `PRODUCTION-API-DEPLOYMENT-COMPLETE.md`

## Key Deployments

### Latest: College Baseball Tracker (Oct 2025)
- Mobile-first college baseball live tracker
- React + Vite build system
- Cloudflare Pages deployment
- See: `CLOUDFLARE-PAGES-DEPLOYMENT.md`

### Production API (Sep 2025)
- Multi-sport API endpoints (NFL, MLB, CFB, CBB)
- Cloudflare Workers + D1 + KV
- See: `PRODUCTION-API-DEPLOYMENT-COMPLETE.md`

### Next-Gen Analytics (Oct 2025)
- Advanced visualization features with feature flags
- Plotly.js and deck.gl integration
- See: `IMPLEMENTATION_COMPLETE.md`

### Championship Dashboard (Sep 2025)
- Real championship data integration
- MCP data integration
- See: `PRODUCTION-DEPLOYMENT-COMPLETE.md`

## Deployment Commands

### Deploy to Production
```bash
npm run build && wrangler pages deploy dist
```

### Local Development
```bash
npm run dev
```

### API Deployment
```bash
wrangler deploy
```

## Historical Notes

Multiple deployment iterations have been completed for various features:
- 3D visualizations (Babylon.js, Three.js)
- Monte Carlo simulations
- Multi-sport dashboards
- Biomechanics analysis
- Youth sports platform

For detailed historical deployment information, see archived documentation in `BSI-archive/deprecated-deploys/`.

## Support

- **Live Site**: https://blazesportsintel.com
- **Documentation**: `/docs/`
- **Repository**: https://github.com/ahump20/BSI

---

*Last Updated: October 2025*
*Consolidates information from 40+ deployment-related documents*
