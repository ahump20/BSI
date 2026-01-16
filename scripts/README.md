# BSI Dependency Security Scripts

Socket.dev integration for supply chain security auditing in the BSI (Blaze Sports Intel) project.

## Overview

These scripts help ensure the security and quality of npm dependencies used in BSI's Cloudflare Workers infrastructure. They integrate with Socket.dev via the Socket MCP tool to evaluate packages across five security dimensions.

## Scripts

### 1. `audit-deps.js` - Full Dependency Audit

Scans all dependencies in `package.json` and generates a Socket.dev-compatible payload.

**Usage:**

```bash
# Standard audit with full output
node scripts/audit-deps.js

# CI mode (minimal output)
node scripts/audit-deps.js --ci

# JSON output only
node scripts/audit-deps.js --json
```

**What it does:**

- Reads package.json dependencies (production, dev, and optional)
- Formats data for Socket MCP tool
- Displays dependency summary and Socket payload
- Outputs 40+ dependencies from BSI's stack

**Output includes:**

- Dependency count by type (production/dev/optional)
- Complete list of packages with versions
- Ready-to-use Socket:depscore() payload

### 2. `check-new-dep.js` - Single Package Checker

Checks a package before adding it to your dependencies.

**Usage:**

```bash
# Check latest version
node scripts/check-new-dep.js <package-name>

# Check specific version
node scripts/check-new-dep.js <package-name> <version>

# Examples
node scripts/check-new-dep.js hono
node scripts/check-new-dep.js itty-router 5.0.0
```

**What it does:**

- Fetches package metadata from npm registry
- Displays package information (description, license, maintainers)
- Generates Socket MCP payload for the single package
- Provides decision criteria and next steps

**Pre-install workflow:**

1. Run this script
2. Copy Socket:depscore() payload
3. Run through Socket MCP tool
4. Only install if weighted score ≥70

## Socket.dev Scoring

Socket evaluates packages across **5 dimensions** with weighted scores:

| Dimension         | Weight | What it measures                                   |
| ----------------- | ------ | -------------------------------------------------- |
| **Vulnerability** | 35%    | Known CVEs, security vulnerabilities               |
| **Supply Chain**  | 25%    | Typosquatting, hijacking risk, suspicious patterns |
| **Maintenance**   | 20%    | Active development, regular updates                |
| **Quality**       | 15%    | Code quality, documentation, testing               |
| **License**       | 5%     | OSS compliance, license clarity                    |

### Score Thresholds

- ✅ **Healthy**: ≥85 weighted average - Safe to use
- ⚠️ **Warning**: 70-84 weighted average - Use with caution
- ❌ **Critical**: <70 weighted average - **Block deployment**

### Interpreting Results

**Good package example:**

```
pkg:npm/hono@4.11.1:
  license: 100, maintenance: 96, quality: 97,
  supplyChain: 99, vulnerability: 100
Weighted: 98.1 ✅
```

**Concerning package example:**

```
pkg:npm/sketchy-lib@1.0.0:
  license: 50, maintenance: 30, quality: 45,
  supplyChain: 60, vulnerability: 80
Weighted: 54.5 ❌
```

## Workflow Integration

### Manual Workflow

1. **Before adding any new dependency:**

   ```bash
   node scripts/check-new-dep.js <package-name>
   # Review Socket scores
   # Install only if score ≥70
   ```

2. **Regular audit (weekly/monthly):**
   ```bash
   node scripts/audit-deps.js
   # Run Socket check
   # Review any flagged packages
   ```

### CI/CD Integration (Optional)

Add to GitHub Actions (`.github/workflows/security-audit.yml`):

```yaml
name: Dependency Security Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run dependency audit
        run: node scripts/audit-deps.js --ci
      # Socket API integration would go here with API key
```

Or add to Wrangler pre-deploy hook:

```json
{
  "scripts": {
    "predeploy": "node scripts/audit-deps.js --ci && npm run build"
  }
}
```

## Using Socket MCP Tool

After running either script, you'll get a payload like:

```javascript
Socket: depscore({
  packages: [
    { depname: 'hono', ecosystem: 'npm', version: '4.11.1' },
    { depname: 'zod', ecosystem: 'npm', version: '3.22.0' },
    // ... more packages
  ],
});
```

**To evaluate:**

1. Copy the entire payload
2. Use the Socket MCP tool in your environment
3. Review the returned scores
4. Flag any packages with weighted score <70

## BSI-Specific Considerations

Per BSI project rules (see `/CLAUDE.md`):

- ✅ **DO**: Run these scripts locally or in CI
- ✅ **DO**: Delete obsolete audit files in the same commit
- ❌ **DON'T**: Create new Cloudflare Workers/KV for this feature
- ❌ **DON'T**: Run these at edge (Workers runtime)
- ❌ **DON'T**: Duplicate with alternative audit tools

These scripts are for **build-time** and **pre-deploy** checks only, not runtime dependency management.

## Current BSI Dependencies

As of the initial audit, BSI uses:

**Production packages:** ~19 including:

- `hono`, `zod`, `react`, `react-dom`, `lucide-react`
- `@tanstack/react-query`, `framer-motion`, `recharts`
- `@amplitude/analytics-browser`, `@sentry/node`
- `luxon`, `fuse.js`, `clsx`, `tailwind-merge`

**Dev packages:** ~29 including:

- `@cloudflare/workers-types`, `wrangler`
- `next`, `vite`, `vitest`, `playwright`
- `typescript`, `eslint`, `prettier`
- Testing and build tooling

**Total:** 50+ dependencies to audit

## Troubleshooting

**"Cannot find module" error:**

- Ensure you're running from BSI root directory
- Verify package.json exists at `../package.json` relative to scripts/

**"Error fetching latest version":**

- Check network connectivity
- Verify package name is correct on npm registry
- Use specific version flag if package lookup fails

**Socket MCP tool not available:**

- These scripts generate payloads; Socket evaluation is manual
- Contact your MCP server administrator for Socket tool access
- Alternatively, use Socket.dev web interface or CLI

## Contributing

When modifying these scripts:

1. Follow BSI conventions (see `/CLAUDE.md`)
2. Test with `node scripts/audit-deps.js`
3. Validate output format matches Socket MCP requirements
4. Update this README if adding features

## References

- Socket.dev: https://socket.dev
- BSI Project Guidelines: `/CLAUDE.md`
- BSI Workers: `/workers/` directory
- Package.json: `/package.json`

---

**BSI Project**: Blaze Sports Intel  
**Owner**: Austin Humphrey (ahump20@outlook.com)  
**Repository**: github.com/ahump20/BSI  
**Last Updated**: December 2024
