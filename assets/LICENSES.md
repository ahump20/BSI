# Asset Licenses & Attribution

This document catalogs all assets used in Blaze Sports Intel games, their sources, and license information.

## Purpose

Every asset (visual, audio, code) used in BSI games must be documented here with:
- **Asset Name**: Filename or identifier
- **Type**: Image, audio, font, code library, etc.
- **Source**: Origin of the asset
- **License**: License type and terms
- **Attribution**: Required attribution (if any)
- **Date Added**: When asset was added to project
- **Added By**: Person/team who added it

## Current Game: Baseball Batting (Phaser Web)

### Visual Assets

#### Geometric Placeholders (Original)

| Asset | Type | Source | License | Attribution | Date Added |
|-------|------|--------|---------|-------------|------------|
| Player sprites (rectangles) | 2D Graphics | In-house (code-generated) | Proprietary | N/A | 2025-11-02 |
| Ball sprite (circle) | 2D Graphics | In-house (code-generated) | Proprietary | N/A | 2025-11-02 |
| Field backgrounds | 2D Graphics | In-house (CSS gradients) | Proprietary | N/A | 2025-11-02 |
| UI elements | 2D Graphics | In-house (HTML/CSS) | Proprietary | N/A | 2025-11-02 |

**Notes**: Current version uses no image files. All visuals are code-generated geometric shapes and CSS styling.

### Audio Assets

| Asset | Type | Source | License | Attribution | Date Added |
|-------|------|--------|---------|-------------|------------|
| *(None)* | - | - | - | - | - |

**Notes**: Current version has no audio. Audio system is a placeholder only.

### Fonts

| Asset | Type | Source | License | Attribution | Date Added |
|-------|------|--------|---------|-------------|------------|
| System UI fonts | Font | User's operating system | N/A (system default) | N/A | 2025-11-02 |
| Arial (fallback) | Font | System default | N/A | N/A | 2025-11-02 |

**Notes**: Game uses system fonts only. No custom fonts loaded.

### Code Libraries

| Library | Version | License | Purpose | Date Added |
|---------|---------|---------|---------|------------|
| Phaser | 3.90.0 | MIT | Game engine | 2025-11-02 |
| Vite | 5.4.21 | MIT | Build tool | 2025-11-02 |
| TypeScript | 5.9.3 | Apache 2.0 | Type system | 2025-11-02 |

**Full dependency list**: See `apps/games/phaser-bbp-web/package.json`

## Future Asset Addition Template

When adding new assets, copy this template and fill it out:

```markdown
### [Asset Category]

| Asset | Type | Source | License | Attribution | Date Added |
|-------|------|--------|---------|-------------|------------|
| [filename.ext] | [image/audio/font] | [source URL or "In-house"] | [license type] | [attribution text or N/A] | [YYYY-MM-DD] |
```

**Example for AI-generated asset:**

| Asset | Type | Source | License | Attribution | Date Added |
|-------|------|--------|---------|-------------|------------|
| player_batter.png | 2D Sprite | AI-generated (Midjourney) | Commercial use permitted | N/A | 2025-11-15 |

**Prompt used**: "Original cartoon baseball batter character, kid-friendly, no copyrighted characters, blue uniform, simple style"
**Prompt saved to**: `docs/ai-assets/generated/player_batter_prompt.txt`

## License Types Reference

Common licenses and their terms:

### Proprietary (BSI Original)
- **Usage**: Full rights, BSI-owned
- **Distribution**: May not be redistributed
- **Attribution**: Not required

### MIT License
- **Usage**: Free for any use, including commercial
- **Distribution**: May redistribute with license text
- **Attribution**: Include license and copyright notice

### Apache 2.0
- **Usage**: Free for any use, including commercial
- **Distribution**: May redistribute with license text
- **Attribution**: Include license, copyright notice, and NOTICE file

### Creative Commons CC0
- **Usage**: Public domain, no restrictions
- **Distribution**: Unlimited
- **Attribution**: Not required (but appreciated)

### Creative Commons CC-BY
- **Usage**: Free for any use, including commercial
- **Distribution**: Unlimited
- **Attribution**: **Required** - must credit creator

### Royalty-Free Stock (e.g., Shutterstock, Adobe Stock)
- **Usage**: Depends on plan (typically unlimited for licensed projects)
- **Distribution**: Embedded in projects only, not as standalone files
- **Attribution**: Check specific license terms

## Verification Checklist

Before adding an asset:

- [ ] Asset provenance verified (original, AI-generated, or licensed)
- [ ] Commercial use rights confirmed
- [ ] License terms reviewed
- [ ] Attribution requirements identified
- [ ] Entry added to this document
- [ ] Asset file saved to appropriate directory
- [ ] CI blocklist check passed
- [ ] Legal page updated (if needed)

## Asset Removal Process

If an asset must be removed (license expiration, infringement claim, etc.):

1. Remove asset file from repository
2. Mark entry in this document as **[REMOVED - YYYY-MM-DD]**
3. Update game code to remove references
4. Note reason for removal
5. Update legal pages

**Example:**

| Asset | Type | Source | License | Attribution | Date Added | Status |
|-------|------|--------|---------|-------------|------------|--------|
| ~~old_sprite.png~~ | 2D Sprite | Third-party | CC-BY | "Artist Name" | 2025-10-01 | **[REMOVED - 2025-11-02]** - License expired |

## Questions?

If you're unsure about an asset's license or whether it can be used:

1. **Don't add it yet**
2. Contact: legal@blazesportsintel.com (placeholder)
3. Document the inquiry in `docs/legal/asset-reviews/`
4. Wait for clearance before proceeding

## Audit History

| Date | Auditor | Findings | Actions Taken |
|------|---------|----------|---------------|
| 2025-11-02 | Initial Setup | All assets original or system defaults | Documented baseline |

Next audit: 2026-02-01

---

**Last Updated**: 2025-11-02
**Document Owner**: Legal & Compliance Team
