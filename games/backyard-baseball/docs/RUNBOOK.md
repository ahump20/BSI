# Backyard Baseball - Operations Runbook

## Quick Reference

| Task | Command |
|------|---------|
| Start local dev server | `make serve` |
| Build Unity WebGL | `make build-unity` |
| Deploy to staging | `make deploy-staging` |
| Deploy to production | `make deploy-prod` |
| Deploy telemetry worker | `make deploy-worker` |
| Run asset validation | `make test` |
| View logs | `npx wrangler tail backyard-baseball-api` |

## Environments

| Environment | URL | Cloudflare Project |
|-------------|-----|-------------------|
| Staging | staging-game.blazesportsintel.com | backyard-baseball-staging |
| Production | game.blazesportsintel.com | backyard-baseball |

## Deployment Pipeline

```
Code Push → GitHub Actions → Unity Build → Staging Deploy → Manual Approval → Production Deploy
```

### Manual Deployment

1. Build Unity WebGL:
   ```bash
   make build-unity
   ```

2. Deploy to staging:
   ```bash
   make deploy-staging
   ```

3. Verify at staging URL

4. Deploy to production:
   ```bash
   make deploy-prod
   ```

## Monitoring

### Telemetry Dashboard

Query D1 for analytics:

```bash
cd infra/cloudflare
npx wrangler d1 execute bsi-game-telemetry --remote --command "SELECT * FROM daily_stats ORDER BY date DESC LIMIT 7"
```

### Worker Logs

```bash
npx wrangler tail backyard-baseball-api
```

### Error Investigation

```bash
npx wrangler d1 execute bsi-game-telemetry --remote --command "SELECT * FROM events WHERE event_type = 'error' ORDER BY created_at DESC LIMIT 20"
```

## Rollback Procedures

### Web Build Rollback

1. List recent deployments:
   ```bash
   npx wrangler pages deployment list --project-name=backyard-baseball
   ```

2. Rollback to specific deployment:
   ```bash
   npx wrangler pages deployment rollback --project-name=backyard-baseball --deployment-id=<ID>
   ```

### Worker Rollback

Workers auto-deploy from main branch. To rollback:

1. Revert the commit in git
2. Push to main
3. CI/CD will redeploy previous version

## Common Issues

### Unity Build Fails

1. Check Unity license is valid
2. Verify Unity version matches (2022.3.20f1)
3. Check build logs: `unity/Logs/build.log`

### WebGL Won't Load

1. Check browser console for errors
2. Verify CORS headers in `_headers` file
3. Check if SharedArrayBuffer is enabled (requires COOP/COEP headers)
4. Test in Chrome DevTools with cache disabled

### Telemetry Not Recording

1. Check worker is deployed: `npx wrangler tail`
2. Verify D1 database exists and has tables
3. Check browser network tab for `/api/telemetry` calls

### Performance Issues

1. Check telemetry for fps drops: Query `performance` events
2. Verify asset sizes are within budget
3. Check draw calls in Unity profiler

## Maintenance

### Database Cleanup

Remove old events (keep 30 days):

```sql
DELETE FROM events WHERE created_at < datetime('now', '-30 days');
```

### Cache Purge

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Contacts

- Infrastructure: Cloudflare Dashboard
- CI/CD: GitHub Actions
- Domain: blazesportsintel.com (Cloudflare DNS)
