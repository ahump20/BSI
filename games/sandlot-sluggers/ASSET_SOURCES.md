# Asset Sources - Sandlot Sluggers

This document tracks all assets used in Sandlot Sluggers and their origins for IP compliance.

## 3D Assets

### Field (sandlot-field.glb)

- **Source**: Original creation in Blender
- **Creator**: BSI / Claude Code
- **License**: Proprietary
- **Notes**: Youth 60ft field dimensions, Z-up axis convention

### Ball Mesh

- **Source**: Procedurally generated (Three.js SphereGeometry)
- **Creator**: Runtime generation
- **License**: N/A (code-generated)

### Fallback Scene

- **Source**: Procedurally generated primitives
- **Creator**: Runtime generation
- **License**: N/A (code-generated)

## Fonts

### System Fonts Only

- Segoe UI (Windows)
- system-ui (cross-platform fallback)
- -apple-system (macOS)
- sans-serif (final fallback)

No custom fonts are bundled.

## Colors

All colors are original selections:

- Sky blue background: `#87ceeb`
- Grass green: `#3d9140`
- Dirt brown: `#c4a77d`
- Fence green: `#2e5a1f`
- UI dark: `rgba(0, 0, 0, 0.75)`
- Gold accent: `#ffd700`
- Strike red: `#ff4444`
- Out orange: `#ff6600`
- Base occupied: `#4CAF50`

## Audio

No audio assets currently. Future audio will be:

- Original compositions, OR
- CC0/Public Domain sources with documented attribution

## Third-Party Libraries

| Library    | Version  | License      | Purpose       |
| ---------- | -------- | ------------ | ------------- |
| Three.js   | ^0.160.0 | MIT          | 3D rendering  |
| Vite       | ^5.4.10  | MIT          | Build tool    |
| TypeScript | ^5.6.3   | Apache-2.0   | Type checking |
| Terser     | ^5.27.0  | BSD-2-Clause | Minification  |

## Character Names

See `08_SAFE_NAMING_PACK.md` for approved fictional names.

**NOT PERMITTED:**

- Any MLB player, team, or stadium names
- Any NCAA program names or mascots
- Any names from Backyard Baseball franchise
- Any copyrighted character likenesses

## Verification Checklist

Before deployment, verify:

- [ ] No MLB logos or wordmarks
- [ ] No NCAA logos or wordmarks
- [ ] No Backyard Baseball character names
- [ ] No real player likenesses
- [ ] No trademarked team names
- [ ] All fonts are system fonts or properly licensed
- [ ] All 3D assets are original or properly licensed
- [ ] All colors are original selections
- [ ] Audio (if added) is original or CC0

## Updates

When adding new assets:

1. Document source and license in this file
2. Verify IP compliance against guardrails
3. Add to verification checklist if new category
4. Get review before deployment
