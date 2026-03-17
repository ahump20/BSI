# BSI Codebase Audit - March 13, 2026

## Executive Summary

This audit identifies issues and areas for improvement in the Blaze Sports Intel codebase. The primary trigger was addressing a preventative issue about archive creation patterns.

## Issues Found

### 1. Archive Creation Pattern (Original Issue)

**Severity:** P2 (Medium-High)
**Status:** Documented

The use of `zip` command without proper handling can lead to stale content in archives when files are deleted from source directories.

**Resolution:**
- Created best practices documentation at `docs/best-practices/archive-creation.md`
- Provides three solutions: delete before creating (recommended), use `-FS` flag, or use temporary archives

**Impact:** Low currently (no scripts found using this pattern), but prevents future issues

---

### 2. Unmet npm Dependencies

**Severity:** P1 (High)
**Status:** Identified

Running `npm list` shows numerous UNMET DEPENDENCY warnings:

```
UNMET DEPENDENCY @axe-core/playwright@^4.11.0
UNMET DEPENDENCY @playwright/test@^1.58.1
UNMET DEPENDENCY @stripe/react-stripe-js@^3.10.0
UNMET DEPENDENCY @types/node@^24.10.9
UNMET DEPENDENCY @typescript-eslint/eslint-plugin@^8.54.0
... (20+ total)
```

**Recommendation:**
1. Run `npm install` to resolve dependencies
2. Verify `package-lock.json` is committed
3. Consider using `pnpm` as suggested in workflows (`pnpm/action-setup@v3`)

**Commands to fix:**
```bash
npm install
npm audit fix
```

---

### 3. Incomplete Implementation TODOs

**Severity:** P2 (Medium)
**Status:** Documented

Found TODO comments indicating incomplete features:

#### app/worker-implementation.ts (lines identified)
```typescript
// TODO: Send to HubSpot
// TODO: Send email notification
```

**Context:** Worker implementation guide has placeholder integrations

**Recommendation:**
- Complete HubSpot integration for tracking
- Implement email notification system (likely using Resend per CLAUDE.md)

#### lib/analytics/mmi.ts
```typescript
// TODO: User contribution point — tune these breakpoints based on observed
```

**Context:** MMI (Momentum Magnitude Index) has breakpoints that need empirical tuning

**Recommendation:**
- Collect game data samples
- Analyze momentum distribution
- Adjust breakpoints based on observed patterns

---

### 4. Inconsistent Dependency Management

**Severity:** P2 (Medium)
**Status:** Identified

The codebase uses multiple package managers:
- Root uses `npm` (package-lock.json)
- Workflows reference `pnpm` (pnpm/action-setup@v3)
- Some subdirectories may have their own package managers

**Evidence:**
- `.github/workflows/deploy.yml` line 104-105: Uses pnpm
- Root has `package-lock.json` suggesting npm

**Recommendation:**
1. Standardize on one package manager (pnpm is faster for monorepos)
2. Update all workflows consistently
3. Add `.npmrc` or `pnpm-workspace.yaml` for configuration

---

### 5. ESLint Not Available

**Severity:** P2 (Medium)
**Status:** Identified

Running `npm run lint` fails:
```
sh: 1: eslint: not found
```

This despite eslint being configured in package.json scripts.

**Recommendation:**
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm run lint
```

---

## Positive Findings

### ✅ Good Practices Observed

1. **Zero TypeScript Suppression Comments**
   - No `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` found
   - Shows strong type discipline

2. **Comprehensive Test Coverage**
   - 68 test files found
   - Tests cover workers, routes, analytics, flows, and a11y
   - Test structure follows conventions

3. **Console Logging Discipline**
   - Console statements mostly in error handlers (appropriate)
   - Workers use structured logging
   - No stray debug logs in production code

4. **Heritage Design System**
   - Site-wide design tokens properly namespaced
   - CSS custom properties follow conventions
   - Zero legacy glass-card tokens (clean migration)

---

## Recommendations Summary

### Immediate Actions (P1)
1. ✅ **DONE:** Create archive creation best practices doc
2. 🔴 **Run `npm install`** to resolve dependencies
3. 🔴 **Install ESLint** to enable linting

### Short-term Actions (P2)
4. Complete TODO items in worker-implementation.ts
5. Standardize on pnpm for package management
6. Tune MMI breakpoints with real data

### Long-term Improvements (P3)
7. Add pre-commit hooks to catch dependency issues
8. Set up automated dependency updates (Dependabot is configured)
9. Create integration tests for email/HubSpot when implemented

---

## Next Steps

This audit was performed as part of addressing issue: "Fix recreate bundle archives instead of updating in place"

**Files Modified:**
- `docs/best-practices/archive-creation.md` (created)
- `docs/audits/codebase-audit-2026-03-13.md` (this file)

**Recommended Follow-up:**
- Create GitHub issues for P1 items
- Schedule review of TODO items
- Run full CI pipeline after npm install
