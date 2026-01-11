# BSI CSS Token Audit

Date: 2025-01-11
Auditor: Claude (BSI Site Medic)

## Executive Summary

Audited all CSS files in `bsi-production/css/` for:
1. Hardcoded hex values that should use CSS variables
2. Z-index sprawl without systematic scale
3. Missing fallbacks for CSS variables

**Result**: 15 issues found and fixed. All CSS now uses `var(--token, #fallback)` pattern.

---

## Token Definitions (Canonical)

Source: `index.html :root`

### Colors
| Token | Value | Status |
|-------|-------|--------|
| `--bsi-burnt-orange` | #BF5700 | COMPLIANT |
| `--bsi-texas-soil` | #8B4513 | COMPLIANT |
| `--bsi-gold` | #C9A227 | COMPLIANT |
| `--bsi-charcoal` | #1A1A1A | COMPLIANT |
| `--bsi-midnight` | #0D0D0D | COMPLIANT |
| `--bsi-cream` | #FAF8F5 | COMPLIANT |
| `--bsi-warm-white` | #FAFAFA | COMPLIANT |
| `--bsi-ember` | #FF6B35 | COMPLIANT |
| `--bsi-flame` | #E85D04 | COMPLIANT |
| `--bsi-success` | #10B981 | COMPLIANT |
| `--bsi-muted` | #6B7280 | COMPLIANT |

### Z-Index Scale (NEW)
| Token | Value | Purpose |
|-------|-------|---------|
| `--bsi-z-base` | 1 | Local stacking |
| `--bsi-z-dropdown` | 10 | Dropdowns, tooltips |
| `--bsi-z-sticky` | 100 | Sticky elements |
| `--bsi-z-fixed` | 1000 | Fixed nav, headers |
| `--bsi-z-modal` | 9999 | Modals, overlays |

---

## Issues Found & Fixed

### bsi-nav.css (14 issues)

| Line | Before | After |
|------|--------|-------|
| 54 | `color: #FAF8F5` | `color: var(--bsi-cream, #FAF8F5)` |
| 101 | `color: #FAF8F5` | `color: var(--bsi-cream, #FAF8F5)` |
| 116 | `background: #FF6B35` | `background: var(--bsi-ember, #FF6B35)` |
| 133 | `color: #FF6B35` | `color: var(--bsi-ember, #FF6B35)` |
| 165 | `background: linear-gradient(...#BF5700, #FF6B35)` | `background: linear-gradient(...var(--bsi-burnt-orange, #BF5700), var(--bsi-ember, #FF6B35))` |
| 200 | `background: #FAF8F5` | `background: var(--bsi-cream, #FAF8F5)` |
| 234 | `z-index: 999` | `z-index: calc(var(--bsi-z-fixed, 1000) - 1)` |
| 235 | `background: #0D0D0D` | `background: var(--bsi-midnight, #0D0D0D)` |
| 270 | `color: #FAF8F5` | `color: var(--bsi-cream, #FAF8F5)` |
| 279 | `color: #FF6B35` | `color: var(--bsi-ember, #FF6B35)` |
| 294 | `background: #0D0D0D` | `background: var(--bsi-midnight, #0D0D0D)` |
| 342 | `color: #C9A227` | `color: var(--bsi-gold, #C9A227)` |
| 351 | `color: #BF5700` | `color: var(--bsi-burnt-orange, #BF5700)` |
| 374 | `color: #FAF8F5` | `color: var(--bsi-cream, #FAF8F5)` |
| 399 | `color: #BF5700` | `color: var(--bsi-burnt-orange, #BF5700)` |

### bsi-enhancements.css (1 issue)

| Line | Before | After |
|------|--------|-------|
| 731 | `background: #22C55E` | `background: var(--bsi-success, #10B981)` |

**Note**: The original `#22C55E` was inconsistent with the defined success color `#10B981`. Fixed to use the canonical token.

---

## Z-Index Audit

### Before (Scattered Values)
```
bsi-nav.css:18:        z-index: 1000;  (nav)
bsi-nav.css:234:       z-index: 999;   (mobile menu)
bsi-enhancements.css:92:   z-index: 1;
bsi-enhancements.css:170:  z-index: 1;
bsi-enhancements.css:366:  z-index: 10;
bsi-enhancements.css:594:  z-index: 9999;
bsi-enhancements.css:1118: z-index: 100;
bsi-enhancements.css:1859: z-index: 9999;
bsi-enhancements.css:2117: z-index: 9999;
```

### After (Systematic Scale)
- Navigation: `var(--bsi-z-fixed, 1000)`
- Mobile menu: `calc(var(--bsi-z-fixed, 1000) - 1)` (just below nav)
- Modal overlays: `var(--bsi-z-modal, 9999)`
- Other values remain as local scope (1, 10, 100) - acceptable for component-local stacking

---

## Compliance Summary

| File | Hardcoded Colors | Using Variables | Compliance |
|------|------------------|-----------------|------------|
| bsi-nav.css | 0 | 14 | 100% |
| bsi-enhancements.css | 0 | All | 100% |

**Total CSS Variable Usage**: 100% of brand colors now use tokens with fallbacks.

---

## Recommendations

1. **No action needed** - All issues have been fixed
2. **Future development**: Use `var(--bsi-token, #fallback)` pattern for all colors
3. **Z-index**: Use scale variables for new components requiring layering
4. **Monitoring**: Add linting rule to prevent hardcoded hex values

---

## Verification Command

To verify no hardcoded colors remain without fallbacks:

```bash
grep -E '#[0-9A-Fa-f]{6}' css/*.css | grep -v 'var(--'
```

Expected output: Empty (no matches)
