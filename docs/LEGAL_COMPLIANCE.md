# Legal Compliance - Blaze Sports Intel Games

## Overview

This document outlines the legal compliance requirements for all games developed and published by Blaze Sports Intel. Our commitment is to create 100% original content that respects intellectual property rights and complies with all applicable laws.

## Core Principles

### 1. Original Content Only

All Blaze Sports Intel games must contain **only original content** or properly licensed third-party assets. This includes:

- **Game mechanics**: Original game design and systems
- **Visual assets**: Original sprites, animations, UI elements, backgrounds
- **Audio assets**: Original music, sound effects, voice acting
- **Code**: Original programming and algorithms
- **Narrative**: Original stories, characters, dialogue

### 2. Prohibited Content

The following is **strictly prohibited** in all BSI games:

#### A. Third-Party Intellectual Property

- ❌ **Backyard Baseball** or any Humongous Entertainment properties
  - No character names (Pablo Sanchez, Pete Wheeler, etc.)
  - No distinctive character designs or likenesses
  - No gameplay mechanics unique to Backyard Baseball
  - No audio, fonts, or visual styles from the franchise

- ❌ **Licensed Sports Games**
  - No content from MLB The Show, R.B.I. Baseball, Out of the Park Baseball
  - No content from Madden NFL, FIFA, NBA 2K series
  - No proprietary mechanics or UI patterns

- ❌ **Real-World Entities**
  - No MLB, NFL, NBA, NCAA team names, logos, or trademarks
  - No real player names or likenesses without explicit licensing
  - No venue names or stadium designs
  - No league branding or official imagery

#### B. Copyrighted Media

- ❌ Music from commercial artists or composers
- ❌ Fonts with restrictive licenses
- ❌ Stock photos or illustrations without proper licenses
- ❌ Third-party code without compatible licenses

### 3. Asset Provenance Requirements

Every asset in a BSI game must have **documented provenance**:

1. **In-House Creation**
   - Created by BSI employees or contractors
   - Work-for-hire agreements in place
   - Source files retained for verification

2. **AI-Generated Assets**
   - Generated using tools with commercial usage rights
   - Prompts documented and stored
   - Verification that output doesn't resemble copyrighted content
   - See `docs/ai-assets/prompts-and-guidelines.md` for detailed guidelines

3. **Licensed Third-Party Assets**
   - Explicit license granting commercial use
   - License terms documented in `assets/LICENSES.md`
   - Attribution provided as required by license
   - Regular license renewal where applicable

## Asset Addition Process

### Required Steps

Before adding any asset to a BSI game:

1. **✓ Verify Provenance**
   - Confirm asset is original, AI-generated, or properly licensed
   - Review license terms for commercial use rights
   - Check for attribution requirements

2. **✓ Document in License Manifest**
   - Add entry to `assets/LICENSES.md`
   - Include: asset name, source, license type, date added, creator
   - Link to license text or provide full text

3. **✓ Run CI Blocklist Check**
   - Automated check prevents disallowed IP terms
   - See `.github/workflows/content-blocklist.yml`
   - Fails build if prohibited terms detected

4. **✓ Update Legal Pages**
   - Update game-specific legal page (e.g., `/games/bbp/legal`)
   - Add attribution if required by license
   - Note any changes to asset sources

5. **✓ Legal Review (if required)**
   - For assets with complex licensing: legal review
   - For assets resembling existing IP: legal clearance
   - For celebrity/athlete likenesses: explicit permission

### Prohibited Terms Blocklist

The following terms trigger CI failures if found in game code or assets:

- Character names from Backyard Baseball (Pablo Sanchez, Pete Wheeler, Achmed Khan, etc.)
- Franchise-specific terms (Backyard, Humongous Entertainment in game context)
- MLB team names and abbreviations (when used for teams, not general references)
- Real player names (unless explicitly licensed)
- Trademarked slogans or catchphrases

**Note**: This list is maintained in `.github/content-blocklist.txt` and updated as needed.

## AI-Generated Asset Guidelines

### Acceptable AI Usage

BSI permits AI-generated assets under these conditions:

1. **Commercial License**: Tool/service allows commercial use
2. **No Training on Copyrighted Content**: Avoid models explicitly trained on specific copyrighted works
3. **Prompt Verification**: Prompts must not request copyrighted characters, styles, or content
4. **Output Review**: Manual review to ensure output doesn't resemble existing IP
5. **Documentation**: All prompts saved to `docs/ai-assets/generated/`

### Sample Acceptable Prompts

**✓ Good Prompts:**

- "Original cartoon baseball character, kid-friendly, generic style, primary colors"
- "Simple baseball stadium background, 90s arcade game aesthetic, no specific team branding"
- "Cheerful sound effect for hitting a ball, retro game style"

**❌ Bad Prompts:**

- "Character like Pablo Sanchez from Backyard Baseball"
- "Yankee Stadium background"
- "Music in the style of MLB The Show"

See `docs/ai-assets/prompts-and-guidelines.md` for detailed examples.

## Privacy & Data Collection

### Minimalist Approach

BSI games collect **only essential analytics**:

- ✅ Session start/end times
- ✅ Session duration
- ✅ Game completion status (win/loss/quit)
- ✅ Error logs (anonymized)

### Prohibited Data Collection

- ❌ Personal identifying information (names, emails)
- ❌ Location data
- ❌ Detailed gameplay telemetry (unless user opts in)
- ❌ Persistent unique identifiers

### User Rights

- **Do-Not-Track**: Respect browser DNT settings
- **GDPR/CCPA**: Provide data deletion on request
- **Transparency**: Clear privacy policy linked from games

See main BSI Privacy Policy at `/privacy`.

## License Grant

### BSI Game License

All BSI games are licensed as:

**UNLICENSED - Proprietary Software**

- ✅ **Free personal use**: Users may play games free of charge
- ❌ **No redistribution**: Users may not redistribute game files
- ❌ **No modification**: Users may not modify or reverse-engineer games
- ❌ **No commercial use**: Users may not use games for commercial purposes without permission

### Open-Source Dependencies

BSI games may use open-source libraries (e.g., Phaser, React). These remain under their original licenses. See individual game `package.json` for full dependency list.

## Compliance Verification

### Continuous Integration Checks

All game code is subject to:

1. **Content Blocklist**: Automated term detection
2. **License Scan**: Dependency license verification
3. **Asset Manifest Validation**: Ensures all assets documented
4. **Legal Page Sync**: Verifies legal pages up-to-date

### Manual Review

Before major releases:

1. Legal team review (if available)
2. Asset audit against manifest
3. License renewal check
4. Privacy policy compliance verification

## Reporting Infringement

If you believe BSI game content infringes on your intellectual property:

1. **DMCA Notice**: Submit via `/dmca`
2. **Email**: legal@blazesportsintel.com (placeholder)
3. **Response Time**: We aim to respond within 48 hours

We take IP compliance seriously and will promptly remove infringing content upon verification.

## Developer Responsibilities

All BSI game developers must:

- ✅ Read and acknowledge this compliance document
- ✅ Follow asset addition process for all contributions
- ✅ Never use copyrighted content without explicit permission
- ✅ Report suspected infringement immediately
- ✅ Document all asset sources thoroughly

Violations may result in:

- Code rejection and reversion
- Removal from project
- Legal liability if company is harmed

## Updates to This Document

This document is reviewed and updated:

- Quarterly (minimum)
- Upon significant legal/regulatory changes
- When new game projects launch
- In response to compliance issues

**Last Updated**: 2025-11-02
**Next Review**: 2026-02-01
**Document Owner**: Legal & Compliance Team (placeholder)

## Contact

Questions about legal compliance?

- **Email**: legal@blazesportsintel.com (placeholder)
- **Internal**: #legal channel on Slack (placeholder)
- **Documentation**: `docs/legal/` directory

---

**Acknowledgment**: By contributing to BSI games, you acknowledge that you have read, understood, and will comply with this Legal Compliance document.
