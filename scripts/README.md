# BSI Scripts Documentation

This directory contains automation scripts for the Blaze Sports Intel (BSI) project.

## Dependency Auditing with Socket.dev

BSI uses Socket.dev for supply chain security auditing of npm dependencies across all workers and applications.

### Quick Start

```bash
# Full dependency audit
node scripts/audit-deps.cjs

# Check before installing a new package
node scripts/check-new-dep.cjs <package-name> [version]

# CI mode (for GitHub Actions)
node scripts/audit-deps.cjs --ci

# JSON output only
node scripts/audit-deps.cjs --json
```

---

## Scripts

### `audit-deps.cjs` - Full Dependency Audit

Scans all `package.json` files across the BSI monorepo and generates a Socket.dev compatible payload for security analysis.

**Scanned Locations:**
- Root: `./package.json`
- App: `./app/package.json`
- Production: `./bsi-production/package.json`
- Blaze Blitz: `./bsi-production/blaze-blitz/package.json`
- Workers: `./workers/*/package.json`
- Games: `./games/*/package.json`, `./src/games/*/package.json`
- MCP: `./mcp/*/package.json`
- Tools: `./bsi-production/src/tools/package.json`

**Usage:**

```bash
# Interactive mode with full statistics
node scripts/audit-deps.cjs

# CI mode (for GitHub Actions)
node scripts/audit-deps.cjs --ci

# JSON output only (for piping to other tools)
node scripts/audit-deps.cjs --json
```

**Output:**
- Lists all package.json files found
- Shows unique dependency count
- Displays top dependencies by usage across packages
- Generates Socket.dev API payload with all dependencies

---

### `check-new-dep.cjs` - Single Package Checker

Check a single package before installation to evaluate its security and quality scores.

**Usage:**

```bash
# Check latest version
node scripts/check-new-dep.cjs express

# Check specific version
node scripts/check-new-dep.cjs express 4.18.2

# Check scoped package
node scripts/check-new-dep.cjs @types/node latest

# Check with version range
node scripts/check-new-dep.cjs zod ^3.22.0
```

**Output:**
- Scoring formula and weights
- Decision matrix (Approve/Review/Block)
- Socket.dev API payload for the package
- Next steps for API integration
- Example response format

---

## Scoring System

BSI uses a weighted scoring system to evaluate dependency security and quality:

### Weights

| Category      | Weight | Description                                    |
|---------------|--------|------------------------------------------------|
| Vulnerability | 35%    | Known security vulnerabilities                 |
| Supply Chain  | 25%    | Package integrity & trustworthiness            |
| Maintenance   | 20%    | Update frequency & maintenance quality         |
| Quality       | 15%    | Code quality & best practices                  |
| License       | 5%     | License compatibility & compliance             |

### Formula

```
weighted_avg = (vuln × 0.35) + (supply × 0.25) + (maint × 0.20) + (qual × 0.15) + (lic × 0.05)
```

### Thresholds

| Status | Score Range | Action                                    |
|--------|-------------|-------------------------------------------|
| ✅ Healthy  | ≥ 85        | Install without restrictions              |
| ⚠️ Warning  | 70-84       | Manual review required                    |
| ❌ Critical | < 70        | **Block deployment** - find alternatives  |

---

## CI Integration

### GitHub Actions Workflow

Add dependency auditing to your CI pipeline:

```yaml
name: Dependency Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Run Dependency Audit
        run: node scripts/audit-deps.cjs --ci
      
      # Optional: Send to Socket.dev API
      - name: Check with Socket.dev
        if: env.SOCKET_API_KEY
        run: |
          PAYLOAD=$(node scripts/audit-deps.cjs --json)
          curl -X POST https://api.socket.dev/v0/depscore \
            -H "Authorization: Bearer ${{ secrets.SOCKET_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD"
```

### Pre-Install Hook

Check new dependencies before installation:

```bash
# Before running npm install
node scripts/check-new-dep.cjs <package-name> <version>

# Review the output, then install if approved
npm install <package-name>@<version>
```

---

## Key BSI Dependencies

### Core Infrastructure (8 Active Workers)

**Workers:**
- `bsi-home` - Home page worker
- `bsi-prediction-api` - Prediction engine
- `bsi-mmr-ledger` - MMR ranking system
- `espn-data-cache` - ESPN data layer
- `bsi-mcp-server` - MCP interface
- `bsi-baseball-rankings` - College baseball rankings
- `blazesports-ingest` - Data ingestion
- `blaze-sports-api` - Primary REST API

### Most Used Dependencies (Across All Packages)

1. **typescript** (^5.5.4) - Used by 11 packages
   - Type safety across all workers and apps
   
2. **vite** (^5.2.0) - Used by 9 packages
   - Build tool for games and frontend apps
   
3. **@cloudflare/workers-types** (^4.20240821.1) - Used by 8 packages
   - TypeScript definitions for Cloudflare Workers
   
4. **wrangler** (^4.32.0) - Used by 7 packages
   - Cloudflare deployment tool
   
5. **@babylonjs/core** (^7.0.0) - Used by 5 packages
   - 3D game engine for interactive games
   
6. **react** (^18.3.1) - Used by 5 packages
   - UI framework for web apps
   
7. **zod** (^4.1.12) - Root + workers
   - Runtime type validation

### Production Critical Dependencies

**Root Package (blazesportsintel.com):**
- `@tanstack/react-query` - Data fetching
- `framer-motion` - Animations
- `recharts` - Data visualization
- `lucide-react` - Icon system
- `@sentry/node` - Error tracking
- `@amplitude/analytics-browser` - Analytics
- `web-vitals` - Performance monitoring

---

## Socket.dev API Integration

### API Endpoint

```
POST https://api.socket.dev/v0/depscore
```

### Authentication

```bash
# Set your API key
export SOCKET_API_KEY="your-api-key-here"
```

### Example Request

```bash
# Generate payload
PAYLOAD=$(node scripts/audit-deps.cjs --json)

# Send to Socket.dev
curl -X POST https://api.socket.dev/v0/depscore \
  -H "Authorization: Bearer $SOCKET_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

### Example Response

```json
{
  "scores": [
    {
      "package": "express@4.18.2",
      "vulnerability": 98,
      "supplyChain": 95,
      "maintenance": 92,
      "quality": 88,
      "license": 100,
      "weightedAverage": 94.15,
      "decision": "APPROVE"
    }
  ],
  "summary": {
    "total": 63,
    "approved": 61,
    "review": 2,
    "blocked": 0
  }
}
```

---

## Workflow: Adding a New Dependency

1. **Check the package first:**
   ```bash
   node scripts/check-new-dep.cjs <package-name> <version>
   ```

2. **Review the output:**
   - Check weighted average score
   - Review individual category scores
   - Verify license compatibility

3. **Decision:**
   - ✅ **Score ≥ 85:** Install immediately
   - ⚠️ **Score 70-84:** Research further, check alternatives
   - ❌ **Score < 70:** Do not install, find alternative

4. **Install if approved:**
   ```bash
   npm install <package-name>@<version>
   ```

5. **Run full audit:**
   ```bash
   node scripts/audit-deps.cjs --ci
   ```

6. **Commit changes:**
   - Include package.json and package-lock.json
   - Note security score in commit message

---

## Best Practices

### Before Installation
- Always check new dependencies before installing
- Prefer packages with scores ≥ 85
- Research any warnings from Socket.dev
- Consider maintenance status and download count

### Regular Audits
- Run full audit weekly
- Check for new vulnerabilities in existing deps
- Update dependencies with security patches
- Remove unused dependencies

### CI/CD
- Run audit on every pull request
- Block merges if critical vulnerabilities found
- Set up automated alerts for new vulnerabilities
- Review audit results before deployment

### Version Management
- Pin versions for production workers
- Use ranges (^) for development only
- Test updates in staging first
- Document why specific versions are pinned

---

## Troubleshooting

### Script Not Finding Package.json Files

The script searches recursively but excludes:
- `node_modules/`
- `.git/`
- `dist/`, `out/`, `build/`
- `.next/`

If a package.json is in an unexpected location, verify it's not in an excluded directory.

### ES Module Errors

Scripts use `.cjs` extension to ensure CommonJS compatibility. The root package.json has `"type": "module"`, so `.js` files are treated as ES modules.

### Socket.dev API Rate Limits

Free tier limits:
- 100 requests/month
- Consider caching results
- Run full audits sparingly in CI

---

## Related Documentation

- [BSI Financial Model](../docs/BSI-FINANCIAL-MODEL.md)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Socket.dev API Documentation](https://docs.socket.dev/reference/depscore)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)

---

## Support

For issues or questions:
- **Owner:** Austin Humphrey
- **Email:** ahump20@outlook.com
- **Repository:** github.com/ahump20/BSI
- **Location:** Boerne, Texas (America/Chicago)

---

*Last updated: December 2025*
