# Provider keys and endpoint wiring (BSI)

This runbook defines the integration surface needed in Blaze Sports Intel without exposing vendor secrets in code.

## 1) Required secrets

Set these secrets in Cloudflare (for **both** Pages and Worker targets that need provider access):

- `SPORTRADAR_API_KEY`
- `SKILLCORNER_API_KEY`
- `BIOMECHANICS_API_KEY`

Use the helper script:

```bash
# Pages project secrets (used by Pages Functions)
./scripts/configure-provider-secrets.sh --target pages --env production

# Worker secrets (used by workers/wrangler.toml service)
./scripts/configure-provider-secrets.sh --target worker --env production
```

## 2) Vendor endpoint map

Use these base URLs in server-side adapter clients (keep provider paths in config, not UI code):

- Sportradar REST base: `https://api.sportradar.com`
- SkillCorner REST base: `https://api.skillcorner.com`
- Biomechanics ingress gateway (recommended internal abstraction): `https://api.blazesportsintel.com/v1/biomechanics`

KinaTrax, Rapsodo, and PitcherNet are contract/product specific. Keep vendor-specific auth and routes behind a BSI server gateway.

## 3) Recommended auth headers

- Sportradar: `x-api-key: $SPORTRADAR_API_KEY`
- SkillCorner: `Authorization: Bearer $SKILLCORNER_API_KEY`
- Internal biomechanics gateway: `Authorization: Bearer $BIOMECHANICS_API_KEY`

## 4) Health checks before deploy

```bash
curl -i https://blazesportsintel.com/api/agent-health
curl -i https://blazesportsintel.com/api/semantic-health
```

If provider adapters are added, expose connectivity checks from authenticated server endpoints only.

## 5) Deployment sequence

1. Authenticate Wrangler: `wrangler login`
2. Configure Pages secrets and Worker secrets with `configure-provider-secrets.sh`
3. Deploy Pages: `npm run deploy:production`
4. Deploy Worker (if changed): `npm run deploy:worker:production`
5. Smoke test API routes

## Security guardrails

- Never commit API keys to git.
- Never call paid/vendor APIs directly from browser JS.
- Rotate keys immediately if leaked.
