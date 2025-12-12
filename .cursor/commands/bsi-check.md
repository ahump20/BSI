# /bsi-check — health check and validation

Run this to verify project health before major work:

## Quick checks
```bash
# Type checking
npm run build

# Lint
npm run lint

# Tests
npm run test

# Check for outdated deps
npm outdated
```

## Data health
```bash
# Data freshness
node scripts/check-data-freshness.js

# API health
node scripts/health_check.py
```

## Production readiness
```bash
./scripts/production-readiness-check.sh
```

## Common issues to check

### Code quality
- [ ] No TypeScript errors
- [ ] No ESLint errors/warnings
- [ ] Tests passing
- [ ] No console.log in production code

### Data integrity
- [ ] Live data endpoints responding
- [ ] Cache not stale
- [ ] D1 database accessible
- [ ] KV namespaces working

### Security
- [ ] No secrets in code
- [ ] .env files gitignored
- [ ] API keys in Wrangler secrets

### Performance
- [ ] Bundle size reasonable
- [ ] No memory leaks in Workers
- [ ] Caching headers correct

## Output
Return a health report with:
- Pass/fail for each category
- Specific issues found
- Recommended fixes
