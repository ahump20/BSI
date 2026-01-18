# BSI Dependency Security Auditing

Supply chain security for BSI dependencies using Socket.dev depscore.

## Quick Start

```bash
# Full audit of all dependencies
node scripts/audit-deps.js

# Check a single package before installing
node scripts/check-new-dep.js <package-name> [version]
```

## Scripts

### audit-deps.js

Scans all dependencies in `package.json` and outputs a payload for Socket depscore.

```bash
# Basic audit
node scripts/audit-deps.js

# CI mode (exits non-zero on critical issues)
node scripts/audit-deps.js --ci

# Custom threshold (default: 70)
node scripts/audit-deps.js --threshold=80

# JSON output only
node scripts/audit-deps.js --json
```

### check-new-dep.js

Pre-install validation for new packages.

```bash
# Check before adding a new dependency
node scripts/check-new-dep.js hono 4.0.0
node scripts/check-new-dep.js @tanstack/react-query
```

## Score Dimensions

Socket evaluates packages across 5 dimensions:

| Dimension     | Weight | Description                               |
| ------------- | ------ | ----------------------------------------- |
| vulnerability | 35%    | Known CVEs and security issues            |
| supplyChain   | 25%    | Typosquatting, hijacking, maintainer risk |
| maintenance   | 20%    | Active development, release frequency     |
| quality       | 15%    | Code quality indicators                   |
| license       | 5%     | OSS license compliance                    |

## Thresholds

- **Healthy (85+)**: No action needed
- **Warning (70-84)**: Review recommended
- **Critical (<70)**: Block deployment, investigate

## Claude Code Integration

After running `audit-deps.js`, use the Socket MCP tool:

```
Socket:depscore({
  packages: [
    { depname: "react", ecosystem: "npm", version: "19.2.0" },
    { depname: "next", ecosystem: "npm", version: "16.0.10" },
    // ... from deps-to-scan.json
  ]
})
```

## Output Files

- `scripts/deps-to-scan.json` - Generated payload for Socket API

## Pre-Install Workflow

1. Run `node scripts/check-new-dep.js <package>`
2. Call Socket:depscore with the output
3. Only proceed if weighted score >= 70

## CI Integration

Add to GitHub Actions:

```yaml
- name: Dependency Audit
  run: node scripts/audit-deps.js --ci --threshold=70
```
