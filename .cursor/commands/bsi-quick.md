# /bsi-quick — quick reference for common operations

## Development
```bash
npm run dev          # Start dev server
npm run build        # Build project
npm run test         # Run tests
```

## Deployment
```bash
wrangler deploy                                    # Deploy main worker
wrangler deploy --config workers/{name}/wrangler.toml  # Specific worker
npm run deploy                                     # Cloudflare Pages
```

## Database
```bash
node scripts/setup-database.js              # Setup D1 schema
wrangler d1 execute bsi-db --local --command "SELECT * FROM games LIMIT 5"
./scripts/backup-database.sh                # Backup
```

## Data ingestion
```bash
node scripts/ingest-live-data.js            # Live scores
node scripts/ingest-college-baseball.js     # NCAA baseball
node scripts/check-data-freshness.js        # Verify freshness
```

## Testing
```bash
npm run test                    # All tests
npm run test:api                # API tests
npm run test:a11y               # Accessibility
npx vitest tests/{file}.test.ts # Specific file
```

## Cloudflare
```bash
wrangler whoami                 # Check auth
wrangler kv:key list --namespace-id=XXX  # List KV keys
wrangler d1 execute bsi-db --command "..."  # D1 query
wrangler tail bsi-worker        # Live logs
```

## Git
```bash
git status                      # Check state
git diff                        # See changes
git log --oneline -10           # Recent commits
```

Return the relevant commands based on what the user needs.
