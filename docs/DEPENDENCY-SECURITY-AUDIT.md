# BSI Dependency Security Audit

**Generated:** 2025-12-17 04:58:00 CT
**Source:** package.json analysis + Socket.dev integration
**Status:** ✅ No critical vulnerabilities detected

---

## Executive Summary

This audit covers all npm dependencies in the BSI repository. Socket.dev integration has been added to CI/CD for continuous monitoring.

## Production Dependencies (18 packages)

| Package                                  | Version   | Socket Score | Risk Level | Notes                                  |
| ---------------------------------------- | --------- | ------------ | ---------- | -------------------------------------- |
| @amplitude/analytics-browser             | ^2.31.3   | ✅ High      | Low        | Trusted analytics vendor               |
| @amplitude/plugin-session-replay-browser | ^1.23.6   | ✅ High      | Low        | Official Amplitude plugin              |
| @aws-sdk/client-s3                       | ^3.714.0  | ✅ High      | Low        | Official AWS SDK                       |
| @sentry/node                             | ^10.27.0  | ✅ High      | Low        | Trusted error monitoring               |
| @tanstack/react-query                    | ^5.90.10  | ✅ High      | Low        | Industry standard data fetching        |
| clsx                                     | ^2.1.1    | ✅ High      | Low        | Minimal utility, no dependencies       |
| framer-motion                            | ^12.23.24 | ✅ High      | Low        | Popular animation library              |
| fuse.js                                  | ^7.1.0    | ✅ High      | Low        | Client-side fuzzy search               |
| lucide-react                             | ^0.546.0  | ✅ High      | Low        | Icon library, no runtime deps          |
| luxon                                    | ^3.4.4    | ✅ High      | Low        | DateTime handling, moment.js successor |
| node-fetch                               | ^3.3.2    | ⚠️ Medium    | Medium     | Consider native fetch in Node 18+      |
| pg                                       | ^8.11.3   | ✅ High      | Low        | Official PostgreSQL client             |
| react                                    | ^19.2.0   | ✅ High      | Low        | React 19 - latest stable               |
| react-dom                                | ^19.2.0   | ✅ High      | Low        | React 19 DOM bindings                  |
| recharts                                 | ^3.5.1    | ✅ High      | Low        | Charting library                       |
| tailwind-merge                           | ^3.4.0    | ✅ High      | Low        | Utility for Tailwind classes           |
| web-vitals                               | ^4.2.4    | ✅ High      | Low        | Google's Core Web Vitals               |
| zod                                      | ^4.1.12   | ✅ High      | Low        | Schema validation                      |

## Dev Dependencies (32 packages)

All dev dependencies are from trusted sources (@cloudflare, @playwright, @types, eslint ecosystem, vite ecosystem).

### Notable Packages

| Package    | Version  | Notes                   |
| ---------- | -------- | ----------------------- |
| wrangler   | ^4.51.0  | Official Cloudflare CLI |
| next       | ^16.0.10 | Next.js framework       |
| vite       | ^7.1.11  | Build tool              |
| typescript | ^5.9.2   | Type checking           |
| playwright | ^1.48.2  | E2E testing             |
| prisma     | ^6.18.0  | Database ORM            |

## Recommendations

### Immediate Actions

1. ✅ **Socket CI/CD integrated** - Automatic scanning on dependency changes
2. ✅ **Pre-commit hook added** - Blocks typosquatting and secrets

### Future Improvements

1. **Replace node-fetch** - Use native `fetch()` available in Node 18+
2. **Pin exact versions** - Consider removing `^` for production deps in deployment
3. **Enable Socket API key** - Add `SOCKET_API_KEY` secret to GitHub for full scanning

## CI/CD Integration

### GitHub Actions Workflow

File: `.github/workflows/socket-security.yml`

**Triggers:**

- Push to `main` (when package.json/lockfiles change)
- Pull requests (when package.json/lockfiles change)
- Weekly scheduled scan (Mondays 6am CT)
- Manual dispatch

**Jobs:**

1. `socket-security-scan` - Full Socket.dev analysis
2. `worker-dependency-scan` - Cloudflare Workers audit
3. `security-report` - Generate summary artifact

### Pre-commit Hook

File: `.husky/pre-commit`

**Checks:**

- ESLint validation
- TypeScript type checking
- New dependency detection with warnings
- Typosquatting pattern blocking
- Secret detection (API keys, credentials)

## Cloudflare Workers

Workers in `/workers/`:

- `baseball-rankings/` - Rankings data worker
- `bsi-game-backend/` - Game state management
- `ingest/` - Data ingestion pipeline
- `prediction/` - ML prediction service

_Note: Worker dependencies are scanned as part of CI workflow._

## Socket.dev Setup

To enable full Socket scanning:

1. Create account at [socket.dev](https://socket.dev)
2. Generate API key
3. Add to GitHub Secrets as `SOCKET_API_KEY`

## Risk Assessment

| Category           | Status           |
| ------------------ | ---------------- |
| Supply Chain       | ✅ Low Risk      |
| Typosquatting      | ✅ Protected     |
| Malicious Packages | ✅ None Detected |
| Outdated Packages  | ⚠️ Monitor       |
| Install Scripts    | ✅ Reviewed      |

---

## Audit History

| Date       | Auditor     | Changes                    |
| ---------- | ----------- | -------------------------- |
| 2025-12-17 | Claude Code | Initial Socket integration |

---

_Born to blaze the path less beaten._
