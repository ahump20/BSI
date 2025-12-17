# BSI Dependency Audit Results
**Date:** December 17, 2025  
**Project:** college-baseball-tracker v1.0.0  
**Total Dependencies:** 51

## Summary

This document contains the initial dependency audit for BSI. The audit scripts have been successfully installed and tested. Socket.dev evaluation is pending as it requires the Socket MCP tool to be available.

## Dependency Breakdown

- **Production:** 18 packages
- **Development:** 32 packages
- **Optional:** 1 package

## Socket.dev Evaluation Required

To complete the security audit, run the following payload through the Socket MCP tool:

```javascript
Socket:depscore({
  packages: [
    { depname: "@amplitude/analytics-browser", ecosystem: "npm", version: "2.31.3" },
    { depname: "@amplitude/plugin-session-replay-browser", ecosystem: "npm", version: "1.23.6" },
    { depname: "@aws-sdk/client-s3", ecosystem: "npm", version: "3.714.0" },
    { depname: "@sentry/node", ecosystem: "npm", version: "10.27.0" },
    { depname: "@tanstack/react-query", ecosystem: "npm", version: "5.90.10" },
    { depname: "clsx", ecosystem: "npm", version: "2.1.1" },
    { depname: "framer-motion", ecosystem: "npm", version: "12.23.24" },
    { depname: "fuse.js", ecosystem: "npm", version: "7.1.0" },
    { depname: "lucide-react", ecosystem: "npm", version: "0.546.0" },
    { depname: "luxon", ecosystem: "npm", version: "3.4.4" },
    { depname: "node-fetch", ecosystem: "npm", version: "3.3.2" },
    { depname: "pg", ecosystem: "npm", version: "8.11.3" },
    { depname: "react", ecosystem: "npm", version: "19.2.0" },
    { depname: "react-dom", ecosystem: "npm", version: "19.2.0" },
    { depname: "recharts", ecosystem: "npm", version: "3.5.1" },
    { depname: "tailwind-merge", ecosystem: "npm", version: "3.4.0" },
    { depname: "web-vitals", ecosystem: "npm", version: "4.2.4" },
    { depname: "zod", ecosystem: "npm", version: "4.1.12" },
    { depname: "@axe-core/playwright", ecosystem: "npm", version: "4.10.2" },
    { depname: "@cloudflare/workers-types", ecosystem: "npm", version: "4.20251128.0" },
    { depname: "@playwright/test", ecosystem: "npm", version: "1.56.1" },
    { depname: "@prisma/client", ecosystem: "npm", version: "6.18.0" },
    { depname: "@types/luxon", ecosystem: "npm", version: "3.4.2" },
    { depname: "@types/node", ecosystem: "npm", version: "24.9.1" },
    { depname: "@types/pg", ecosystem: "npm", version: "8.10.9" },
    { depname: "@types/react", ecosystem: "npm", version: "19.2.7" },
    { depname: "@types/react-dom", ecosystem: "npm", version: "19.2.2" },
    { depname: "@typescript-eslint/eslint-plugin", ecosystem: "npm", version: "6.21.0" },
    { depname: "@typescript-eslint/parser", ecosystem: "npm", version: "6.21.0" },
    { depname: "@vitejs/plugin-react", ecosystem: "npm", version: "4.7.0" },
    { depname: "@vitest/coverage-v8", ecosystem: "npm", version: "4.0.1" },
    { depname: "@vitest/ui", ecosystem: "npm", version: "4.0.1" },
    { depname: "autoprefixer", ecosystem: "npm", version: "10.4.22" },
    { depname: "axe-core", ecosystem: "npm", version: "4.10.2" },
    { depname: "eslint", ecosystem: "npm", version: "8.57.0" },
    { depname: "eslint-config-prettier", ecosystem: "npm", version: "9.1.0" },
    { depname: "eslint-plugin-react", ecosystem: "npm", version: "7.34.0" },
    { depname: "eslint-plugin-react-hooks", ecosystem: "npm", version: "4.6.0" },
    { depname: "husky", ecosystem: "npm", version: "8.0.0" },
    { depname: "jsdom", ecosystem: "npm", version: "24.0.0" },
    { depname: "next", ecosystem: "npm", version: "16.0.10" },
    { depname: "playwright", ecosystem: "npm", version: "1.48.2" },
    { depname: "postcss", ecosystem: "npm", version: "8.5.6" },
    { depname: "prettier", ecosystem: "npm", version: "3.2.5" },
    { depname: "prisma", ecosystem: "npm", version: "6.18.0" },
    { depname: "tailwindcss", ecosystem: "npm", version: "3.4.18" },
    { depname: "typescript", ecosystem: "npm", version: "5.9.2" },
    { depname: "vite", ecosystem: "npm", version: "7.1.11" },
    { depname: "vitest", ecosystem: "npm", version: "4.0.1" },
    { depname: "wrangler", ecosystem: "npm", version: "4.51.0" },
    { depname: "@cloudflare/workerd-darwin-arm64", ecosystem: "npm", version: "1.20251128.0" }
  ]
})
```

## Production Dependencies (18)

1. **@amplitude/analytics-browser** v2.31.3 - Analytics tracking
2. **@amplitude/plugin-session-replay-browser** v1.23.6 - Session replay plugin
3. **@aws-sdk/client-s3** v3.714.0 - AWS S3 client
4. **@sentry/node** v10.27.0 - Error monitoring
5. **@tanstack/react-query** v5.90.10 - Data fetching/state management
6. **clsx** v2.1.1 - Conditional CSS classes
7. **framer-motion** v12.23.24 - Animation library
8. **fuse.js** v7.1.0 - Fuzzy search
9. **lucide-react** v0.546.0 - Icon library
10. **luxon** v3.4.4 - Date/time manipulation
11. **node-fetch** v3.3.2 - HTTP client
12. **pg** v8.11.3 - PostgreSQL client
13. **react** v19.2.0 - UI framework
14. **react-dom** v19.2.0 - React DOM renderer
15. **recharts** v3.5.1 - Charting library
16. **tailwind-merge** v3.4.0 - Tailwind class merging
17. **web-vitals** v4.2.4 - Performance metrics
18. **zod** v4.1.12 - Schema validation

## Development Dependencies (32)

Key dev dependencies include:
- Testing: Vitest, Playwright, @vitest/ui, @vitest/coverage-v8
- Type definitions: @types/node, @types/react, @types/pg, @types/luxon
- Build tools: Vite, Next.js, TypeScript, Wrangler
- Code quality: ESLint, Prettier, Husky
- CSS: Tailwind CSS, PostCSS, Autoprefixer
- Cloudflare: @cloudflare/workers-types, wrangler
- Database: Prisma, @prisma/client
- Accessibility: @axe-core/playwright, axe-core

## Optional Dependencies (1)

- **@cloudflare/workerd-darwin-arm64** v1.20251128.0 - Cloudflare Workers runtime (macOS ARM64)

## Security Evaluation Criteria

When Socket.dev scores are available, packages will be evaluated against:

### Score Thresholds
- ✅ **Healthy**: ≥85 weighted average
- ⚠️ **Warning**: 70-84 weighted average
- ❌ **Critical**: <70 weighted average (requires action)

### Score Dimensions (Weighted)
1. **Vulnerability** (35%) - Known CVEs, security issues
2. **Supply Chain** (25%) - Typosquatting, hijacking risk
3. **Maintenance** (20%) - Active development, updates
4. **Quality** (15%) - Code quality indicators
5. **License** (5%) - OSS compliance

## Known Considerations

### High-Profile Packages (Expected to Score Well)
- **React ecosystem** (react, react-dom) - Industry standard, well-maintained
- **TypeScript** - Microsoft-backed, excellent security track record
- **Cloudflare tools** (wrangler, workers-types) - Official tooling
- **Testing frameworks** (vitest, playwright) - Well-established

### Packages to Monitor
Any package not from a major organization or with recent version jumps should be carefully reviewed when scores become available.

## Next Steps

1. ✅ Install audit scripts (`scripts/audit-deps.js`, `scripts/check-new-dep.js`)
2. ✅ Document usage in `scripts/README.md`
3. ⏳ Run Socket.dev evaluation (requires Socket MCP tool)
4. ⏳ Review scores and flag any packages <70
5. ⏳ Investigate and remediate flagged packages
6. ⏳ Document findings in this file
7. ⏳ Add package.json script for regular audits

## Usage

To regenerate this audit:
```bash
node scripts/audit-deps.js
```

To check a new package before installing:
```bash
node scripts/check-new-dep.js <package-name>
```

---

**Note:** Socket.dev evaluation requires the Socket MCP tool. Once available, run the payload above and document results here.
