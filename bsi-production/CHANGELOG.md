# Changelog

All notable changes to BSI (blazesportsintel.com) are documented here.

## [Unreleased] - 2025-01-11

### BSI Site Medic Remediation

**Summary**: Audit and remediation for brand consistency, error handling, and data attribution.

### Added

#### Error Boundary System (`src/js/error-boundary.js`)
- Global `window.onerror` and `unhandledrejection` handlers
- React hydration error detection via console intercept
- `BSIErrorBoundary.safeFetch()` wrapper with timeout (default 10s) and error handling
- Fallback UI for critical errors (prevents blank screens)
- Error deduplication and rate limiting (max 10/session)
- Automatic error reporting to BSI Analytics

#### Attribution Footer (`src/js/attribution-footer.js`)
- `BSIAttribution.append(container, { fetchedAt })` for data blocks
- "Last updated" timestamp with America/Chicago timezone
- "Powered by Highlightly" attribution link
- Auto-initialization via `data-bsi-attribution` attribute
- Compact and dark mode variants

#### Film Grain Overlay (`css/bsi-enhancements.css`)
- Subtle SVG noise overlay (3.5% opacity)
- Controlled via `data-bsi-grain="true"` on body
- Respects `prefers-reduced-motion`
- Enabled only for canary users initially

#### Canary Flag System (`index.html`, `worker.js`)
- Client-side: URL param `?canary=true` or localStorage
- Server-side: `X-BSI-Canary` header detection
- `window.BSICanary.enable()` / `.disable()` / `.isEnabled()` API
- Per-route feature gating capability

#### Diagnostics Endpoint (`worker.js`)
- `GET /api/diagnostics/data-flow` returns system health
- Tests: KV, D1, R2, SportsDataIO, ESPN
- Includes latency measurements and error details
- Respects canary flag for verbose output

#### Z-Index Scale (`index.html`, `css/bsi-nav.css`)
- `--bsi-z-base: 1` - Local stacking
- `--bsi-z-dropdown: 10` - Dropdowns, tooltips
- `--bsi-z-sticky: 100` - Sticky elements
- `--bsi-z-fixed: 1000` - Fixed nav, headers
- `--bsi-z-modal: 9999` - Modals, overlays

### Changed

#### CSS Token Remediation (`css/bsi-nav.css`)
- Replaced 14 hardcoded hex values with CSS variable references
- All colors now use `var(--bsi-token, #fallback)` pattern
- Z-index values now use scale variables with fallbacks

#### CSS Token Fix (`css/bsi-enhancements.css`)
- Changed `#22C55E` (green) to `var(--bsi-success, #10B981)`

### Documentation

- `docs/ROUTE_MAP.md` - Complete route inventory from live crawl
- `docs/TOKEN_AUDIT.md` - CSS token drift report
- `CHANGELOG.md` - This file

### Issues Found During Crawl

1. **React Hydration Error #418** on `/scores` - Likely server/client mismatch
2. **404 Resources** - `freshness-indicator.js`, `montserrat-latin-400-normal.woff2`
3. **Script MIME Type Blocking** - JS files served as `text/html`
4. **Placeholder Data** - Some components show "--" or "TBD" without hydration

### Canary Rollout Instructions

1. **Enable canary locally**: `localStorage.setItem('bsi-canary', 'true')` and reload
2. **Enable via URL**: Add `?canary=true` to any page
3. **Test features**: Film grain overlay, diagnostics endpoint, error boundaries
4. **Disable**: `localStorage.removeItem('bsi-canary')` or `window.BSICanary.disable()`

### Files Changed

| File | Type | Description |
|------|------|-------------|
| `index.html` | Modified | Canary system, z-index scale, script includes, grain div |
| `worker.js` | Modified | Canary detection, diagnostics endpoint, CORS headers |
| `css/bsi-nav.css` | Modified | CSS variable tokens, z-index scale |
| `css/bsi-enhancements.css` | Modified | Film grain, attribution footer, success color fix |
| `src/js/error-boundary.js` | New | Global error handling |
| `src/js/attribution-footer.js` | New | Data block attribution |
| `docs/ROUTE_MAP.md` | New | Route inventory |
| `docs/TOKEN_AUDIT.md` | New | Token drift report |
| `CHANGELOG.md` | New | This file |

### Breaking Changes

None. All changes are additive or use feature flags.

### Constraints Verified

- [x] No Worker/Binding name changes
- [x] No D1/KV/R2 schema changes
- [x] No global CSS resets
- [x] Route structure preserved
- [x] API contracts unchanged
