# GitHub Issues to Create

Based on the codebase audit performed on March 13, 2026, the following issues should be created in the BSI repository.

---

## Issue 1: P1 - Resolve Unmet npm Dependencies

**Title:** P1: Resolve unmet npm dependencies

**Labels:** P1, dependencies, build

**Body:**

```markdown
## Problem

Running `npm list` shows 20+ UNMET DEPENDENCY warnings including:

- @axe-core/playwright@^4.11.0
- @playwright/test@^1.58.1
- @stripe/react-stripe-js@^3.10.0
- @stripe/stripe-js@^5.10.0
- @tanstack/react-query@^5.90.20
- @types/d3@^7.4.3
- @types/node@^24.10.9
- @types/react@^19.2.10
- @typescript-eslint/eslint-plugin@^8.54.0
- @typescript-eslint/parser@^8.54.0
- And 10+ more

## Impact

- ❌ CI/CD pipelines may fail
- ❌ Development environment incomplete
- ❌ Type checking may be unreliable
- ❌ Testing tools unavailable (Playwright, Vitest)
- ❌ Linting disabled (ESLint not found)

## Solution

```bash
# From repository root
npm install
npm audit fix

# Verify resolution
npm list | grep "UNMET"  # Should return nothing
```

After running, verify:
- [ ] All dependencies installed
- [ ] `package-lock.json` updated
- [ ] No UNMET warnings in `npm list`
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` succeeds
- [ ] `npm run lint` succeeds

## Reference

- Identified in: `docs/audits/codebase-audit-2026-03-13.md`
- Related to PR that fixed archive creation patterns
```

---

## Issue 2: P1 - Install and Configure ESLint

**Title:** P1: Install ESLint to enable code linting

**Labels:** P1, tooling, linting

**Body:**

```markdown
## Problem

Running `npm run lint` fails with:
```
sh: 1: eslint: not found
```

ESLint is configured in `package.json` scripts but the dependency is not installed/available.

## Impact

- ❌ Cannot run linting checks
- ❌ Code quality not enforced
- ❌ CI lint step may fail
- ❌ TypeScript ESLint plugin unavailable

## Solution

After resolving npm dependencies (see related issue), ESLint should be available. If not:

```bash
npm install --save-dev \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin

# Verify
npm run lint
```

## Verification

- [ ] `npm run lint` executes successfully
- [ ] No errors in linted files (or expected errors shown)
- [ ] ESLint config files present (`.eslintrc.*`)
- [ ] CI pipeline lint step passes

## Reference

- Identified in: `docs/audits/codebase-audit-2026-03-13.md`
- May be resolved by Issue #1 (npm install)
```

---

## Issue 3: P2 - Complete Worker Implementation TODOs

**Title:** P2: Complete HubSpot and email notification integrations

**Labels:** P2, feature, integrations

**Body:**

```markdown
## Problem

Found incomplete TODO items in `app/worker-implementation.ts`:

```typescript
// TODO: Send to HubSpot
// TODO: Send email notification
```

These represent incomplete integration features.

## Impact

- ⚠️ Missing tracking/analytics integration
- ⚠️ Notification system incomplete
- ⚠️ Code contains placeholder comments

## Solution

### HubSpot Integration
1. Review BSI's HubSpot account and API access
2. Implement tracking events for worker operations
3. Test integration in development
4. Deploy to production

### Email Notifications
1. Use Resend API (already configured per CLAUDE.md)
2. Implement email templates for notifications
3. Add error handling and retry logic
4. Test email delivery

### Cleanup
- Remove TODO comments
- Add integration tests
- Document configuration in README or docs/

## Reference

- File: `app/worker-implementation.ts`
- Environment vars needed: `HUBSPOT_API_KEY`, `RESEND_API_KEY` (latter exists)
- Identified in: `docs/audits/codebase-audit-2026-03-13.md`
```

---

## Issue 4: P2 - Standardize Package Manager (npm vs pnpm)

**Title:** P2: Standardize on pnpm for package management

**Labels:** P2, tooling, dependencies

**Body:**

```markdown
## Problem

The codebase uses inconsistent package managers:

- **Root:** Uses npm (`package-lock.json` present)
- **GitHub Workflows:** Use pnpm (`.github/workflows/deploy.yml` line 104-105)
- **Mixed signals:** Both package managers referenced

Example from `.github/workflows/deploy.yml`:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v3
  with:
    version: 9
```

But root has `package-lock.json` not `pnpm-lock.yaml`.

## Impact

- ⚠️ Inconsistent dependency resolution
- ⚠️ Slower installs (npm vs pnpm)
- ⚠️ Confusion for contributors
- ⚠️ Potential lockfile conflicts

## Recommendation

Standardize on **pnpm** (already used in workflows):

### Migration Steps

1. Install pnpm globally:
   ```bash
   npm install -g pnpm@9
   ```

2. Remove npm artifacts:
   ```bash
   rm package-lock.json
   ```

3. Install with pnpm:
   ```bash
   pnpm install
   ```

4. Create `pnpm-workspace.yaml` if needed:
   ```yaml
   packages:
     - '.'
     - 'workers/*'
     - 'games/*'
     - 'external/*'
   ```

5. Update all local scripts to use `pnpm` instead of `npm`

6. Add `.npmrc` with pnpm config:
   ```
   shamefully-hoist=true
   strict-peer-dependencies=false
   ```

7. Update CLAUDE.md and README with new commands

## Benefits of pnpm

- ⚡ Faster installs (hard-links packages)
- 💾 Less disk space (deduplicated node_modules)
- 🔒 Stricter dependency resolution
- ✅ Already used in CI/CD

## Reference

- Workflows: `.github/workflows/deploy.yml`
- Identified in: `docs/audits/codebase-audit-2026-03-13.md`
```

---

## Issue 5: P2 - Tune MMI Breakpoints with Real Data

**Title:** P2: Tune MMI momentum breakpoints based on empirical data

**Labels:** P2, analytics, data-science

**Body:**

```markdown
## Problem

In `lib/analytics/mmi.ts`, there's a TODO comment:

```typescript
// TODO: User contribution point — tune these breakpoints based on observed
```

The MMI (Momentum Magnitude Index) uses hardcoded breakpoints that should be empirically validated with real game data.

## Background

MMI computes in-game momentum for baseball games using:
- **Formula:** `MMI = SD × 0.40 + RS × 0.30 + GP × 0.15 + BS × 0.15`
- **Range:** -100 (away dominant) to +100 (home dominant)
- **Components:** Score Differential, Recent Scoring, Game Phase, Base Situation

## Impact

- ⚠️ Breakpoints may not reflect realistic momentum shifts
- ⚠️ Could misclassify game excitement levels
- ⚠️ Missing opportunity for data-driven optimization

## Solution

### Phase 1: Data Collection
1. Run MMI on historical games (use ESPN or SportsDataIO data)
2. Collect MMI snapshots across 100+ games
3. Store in `bsi-analytics-db` or R2 bucket

### Phase 2: Analysis
1. Plot MMI distribution
2. Identify natural clusters for magnitude thresholds
3. Correlate with actual game outcomes
4. Compare to "Sandlot-Sluggers" mmi-live module

### Phase 3: Tuning
1. Adjust magnitude breakpoints:
   - Current: `low` | `medium` | `high` | `extreme`
   - Tune based on percentiles (e.g., 25th, 50th, 75th, 95th)
2. Adjust excitement rating thresholds
3. Update constants in `lib/analytics/mmi.ts`
4. Remove TODO comment

### Phase 4: Validation
1. Re-run on validation set
2. Compare old vs new classifications
3. Document findings in `docs/analytics/mmi-tuning.md`

## Related Work

Per code comments:
> Related work: Sandlot-Sluggers repo (github.com/ahump20/Sandlot-Sluggers) has `mmi-live/` with a pitch-level "Moment Mentality Index"

Consider cross-validation with pitch-level momentum data.

## Reference

- File: `lib/analytics/mmi.ts`
- Identified in: `docs/audits/codebase-audit-2026-03-13.md`
- Data sources: ESPN Site API, SportsDataIO, Highlightly Pro
```

---

## How to Create These Issues

### Option 1: Via GitHub Web UI
1. Go to https://github.com/ahump20/BSI/issues/new
2. Copy/paste title and body from above
3. Add labels
4. Submit

### Option 2: Via gh CLI
```bash
gh issue create --title "P1: Resolve unmet npm dependencies" \
  --body-file <(cat docs/issues-to-create.md | sed -n '/Issue 1:/,/---/p') \
  --label "P1,dependencies,build"

# Repeat for issues 2-5
```

### Option 3: Bulk Create Script
```bash
# Create all 5 issues at once
for issue in {1..5}; do
  # Extract title, body, labels from this file
  # Create issue
  echo "Created issue $issue"
done
```

---

## Summary

- **2 P1 issues** (dependencies, ESLint) - fix immediately
- **3 P2 issues** (TODOs, pnpm, MMI) - schedule for upcoming sprint

All issues reference the comprehensive audit in `docs/audits/codebase-audit-2026-03-13.md`.
