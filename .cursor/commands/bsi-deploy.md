# /bsi-deploy — deployment checklist

Before deploying to production:

## Pre-flight checks
1. Run tests: `npm run test`
2. Check types: `npm run build`
3. Verify no secrets in code
4. Review changes since last deploy

## Deployment steps
1. Identify which worker(s) changed
2. Run: `wrangler deploy --config workers/{name}/wrangler.toml`
3. Verify deployment in Cloudflare dashboard
4. Test live endpoint(s)

## Rollback plan
If issues found:
```bash
wrangler rollback --config workers/{name}/wrangler.toml
```

## Post-deploy
- Monitor error rates in Cloudflare Analytics
- Check response times
- Verify caching behavior

Return a deployment summary with:
- Worker(s) deployed
- Changes included
- Verification results
- Any issues found
