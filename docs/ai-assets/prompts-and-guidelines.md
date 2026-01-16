# AI-Generated Asset Guidelines

## Overview

This document provides guidelines and best practices for generating game assets using AI tools while ensuring legal compliance and avoiding intellectual property infringement.

## Approved AI Tools

BSI permits AI-generated assets from the following categories of tools:

### Image Generation

- **Midjourney** (Commercial plan required)
- **DALL-E 3** (via OpenAI API or ChatGPT Plus)
- **Stable Diffusion** (with commercial-friendly models)
- **Adobe Firefly** (included with Creative Cloud)
- **Leonardo.ai** (with commercial license)

### Audio Generation

- **ElevenLabs** (Creator+ plan or higher for commercial use)
- **Soundful** (Creator plan or higher)
- **AIVA** (Pro plan for full commercial rights)
- **Suno** (with commercial license)

### Music Composition

- **AIVA** (Pro plan)
- **Soundful** (Creator plan)
- **Amper Music** (with license)

**Important**: Always verify the current terms of service for commercial usage rights before generating assets.

## General Principles

### 1. Prompt Design for Originality

**DO:**

- ✅ Use generic, descriptive terms ("kid-friendly baseball character")
- ✅ Specify style in broad terms ("90s arcade aesthetic", "cartoon style")
- ✅ Request original content explicitly ("original design, not based on existing characters")
- ✅ Describe functional elements ("character wearing blue uniform, holding bat")

**DON'T:**

- ❌ Name specific characters ("Pablo Sanchez", "Mickey Mouse")
- ❌ Reference copyrighted franchises ("Backyard Baseball style", "Disney-like")
- ❌ Request trademarked imagery ("Yankees logo", "MLB official")
- ❌ Mimic specific artists without permission ("in the style of [Artist Name]")

### 2. Output Verification

After generating an asset, verify:

1. **Visual Similarity**: Asset doesn't closely resemble copyrighted characters
2. **Trademark Check**: No accidental inclusion of logos, brands, or team names
3. **Distinctive Elements**: Avoid copying unique visual identifiers from existing IP
4. **Commercial Safety**: Asset appropriate for commercial use

If uncertain, generate 3-5 variations and choose the most generic/original.

## Asset-Specific Guidelines

### Character Sprites

#### Baseball Player Characters

**Good Prompts:**

```
"Original cartoon baseball player character, kid-friendly, simple geometric shapes,
wearing generic red uniform with white stripes, holding wooden bat, friendly expression,
no real-person resemblance, 2D sprite style, transparent background"
```

```
"Child baseball batter, simple anime-inspired style, wearing blue cap and jersey with
no logos, determined pose, colorful but not mimicking any specific franchise, sprite art"
```

**Bad Prompts:**

```
❌ "Pablo Sanchez from Backyard Baseball"
❌ "Character similar to Backyard Baseball but different enough"
❌ "Kid baseball player in Humongous Entertainment art style"
```

#### Important Character Guidelines

- **Avoid real-person likenesses**: Don't request characters resembling real athletes
- **No distinctive hairstyles**: Avoid copying unique hairstyles from copyrighted characters
- **Generic uniforms**: Solid colors, simple stripes, no team logos or identifiers
- **Diverse representation**: Vary skin tones, builds, and features across characters

### UI Elements

**Good Prompts:**

```
"Simple baseball scoreboard UI, clean modern design, shows score, innings, outs,
balls/strikes, blue and white color scheme, no team branding, digital style"
```

```
"Baseball diamond background, grass and dirt infield, simple style, no specific stadium
features, suitable for mobile game, top-down view"
```

### Sound Effects

**Good Prompts:**

```
"Bat hitting baseball sound effect, crisp crack sound, retro arcade game style,
short duration (under 1 second)"
```

```
"Crowd cheering sound, generic sports crowd, no specific chants or songs,
medium intensity, loopable"
```

**Avoid:**

- ❌ Copyrighted music or jingles
- ❌ Celebrity or announcer voices
- ❌ Trademarked sound effects (e.g., specific TV show sounds)

## Prompt Templates

### Template: Baseball Character

```
[Character Role: batter/pitcher/fielder]
[Age: child/teen/adult]
[Style: cartoon/realistic/pixel art/anime-inspired]
[Uniform Color: primary color]
[Pose: batting/pitching/fielding/running]
[Expression: happy/focused/determined/excited]
Additional: original design, no copyrighted references, [specific details]
Format: 2D sprite, transparent background, [dimensions]
```

**Example Use:**

```
batter, child, cartoon, blue uniform, batting pose, focused expression,
original design, no copyrighted references, simple geometric shapes
Format: 2D sprite, transparent background, 256x256px
```

### Template: Background/Environment

```
[Scene Type: baseball field/stadium/dugout]
[Perspective: top-down/side-view/isometric]
[Style: realistic/cartoon/pixel art]
[Lighting: day/night/sunset]
[Details: specific elements needed]
Additional: no team branding, no stadium-specific features, generic design
Format: [dimensions], suitable for [mobile/web/both]
```

### Template: Sound Effect

```
[Sound Type: bat hit/crowd cheer/umpire call]
[Style: realistic/arcade/retro]
[Duration: X seconds]
[Characteristics: crisp/muffled/loud/soft]
Additional: no copyrighted content, original sound
Format: [WAV/MP3], [sample rate]
```

## Asset Generation Workflow

### Step-by-Step Process

1. **Plan Asset Needs**
   - List required assets for game feature
   - Define specifications (dimensions, format, style)
   - Review existing assets for style consistency

2. **Write Prompts**
   - Use templates above
   - Include "original", "generic", "no copyrighted content"
   - Save prompts to `docs/ai-assets/generated/[asset-name]_prompt.txt`

3. **Generate Multiple Variations**
   - Generate 3-5 variations per asset
   - Compare for originality and quality
   - Select best option or iterate prompts

4. **Verify Commercial Safety**
   - Review for resemblance to existing IP
   - Check for accidental logos, text, or brands
   - Reverse image search (for visual assets)
   - Compare to blocklist terms

5. **Document and Store**
   - Save prompt text to `docs/ai-assets/generated/`
   - Save final asset to appropriate game directory
   - Update `assets/LICENSES.md` with entry
   - Note AI tool and plan used

6. **Code Integration**
   - Integrate asset into game
   - Test across devices/screens
   - Ensure proper attribution (if required by AI tool terms)

## Red Flags - When to Stop

If generated asset contains:

- ❌ Recognizable characters from existing media
- ❌ Trademarked logos, even partially
- ❌ Text with real team names or brands
- ❌ Specific stadium features (e.g., Green Monster, ivy walls)
- ❌ Real celebrity or athlete likenesses
- ❌ Copyrighted music melodies

**Action**: Discard and regenerate with more generic prompt.

## Documentation Requirements

For each AI-generated asset, create a file:

**Filename**: `docs/ai-assets/generated/[asset-name]_prompt.txt`

**Contents**:

```
ASSET: player_batter_01.png
TOOL: Midjourney v6
DATE: 2025-11-15
PROMPT: "Original cartoon baseball batter character, kid-friendly, simple geometric
shapes, wearing generic red uniform with white stripes, holding wooden bat, friendly
expression, no real-person resemblance, 2D sprite style, transparent background"
VARIATIONS GENERATED: 5
SELECTED: Variation 3
REASON: Most generic appearance, no resemblance to existing characters
REVIEWED BY: [Your Name]
COMMERCIAL CLEARANCE: Verified Midjourney commercial plan active
LICENSE TERMS: https://docs.midjourney.com/docs/terms-of-service
```

## Iterative Refinement

If first generation isn't suitable:

### Prompt Refinement Strategies

1. **More Specificity**: Add details to avoid ambiguity

   ```
   Before: "baseball player"
   After: "baseball player character, child, cartoon style, wearing solid blue uniform
   with no logos, holding wooden bat, smiling, front view, simple design"
   ```

2. **Style Constraints**: Lock down style to prevent IP similarity

   ```
   Add: "geometric shapes only, no realistic features, limited color palette:
   red, blue, white, black"
   ```

3. **Negative Prompts**: Explicitly exclude unwanted elements

   ```
   Add: "no resemblance to existing franchises, no copyrighted characters,
   no specific team branding, avoid realistic faces"
   ```

4. **Simplification**: Reduce complexity to minimize IP risk
   ```
   Before: "detailed baseball character with unique uniform and accessories"
   After: "simple baseball character, minimal details, solid color uniform,
   basic shapes"
   ```

## Testing & Validation

Before finalizing an AI-generated asset:

### Visual Assets Checklist

- [ ] Generated with commercial-licensed AI tool
- [ ] Prompt saved to `docs/ai-assets/generated/`
- [ ] No resemblance to copyrighted characters (manual review)
- [ ] No trademarked elements visible
- [ ] Reverse image search performed (no matches to existing IP)
- [ ] Multiple team members reviewed and approved
- [ ] Entry added to `assets/LICENSES.md`
- [ ] CI blocklist check passed
- [ ] File optimized (WebP for images, compressed audio)

### Audio Assets Checklist

- [ ] Generated with commercial-licensed AI tool
- [ ] Prompt saved to `docs/ai-assets/generated/`
- [ ] No copyrighted melodies or sounds
- [ ] No celebrity voices or identifiable people
- [ ] Suitable length and format
- [ ] Entry added to `assets/LICENSES.md`
- [ ] Tested in-game for quality

## Example: Complete Asset Generation

### Scenario: Need a pitcher character sprite

**1. Planning**

- Asset: Pitcher character for gameplay
- Specs: 256x256px, transparent PNG, cartoon style
- Style: Match existing batter character (simple, colorful)

**2. Prompt Writing**

```
"Original cartoon baseball pitcher character, child, simple geometric shapes,
wearing generic green uniform with yellow stripes, winding up to pitch,
focused expression, no real-person resemblance, side view, 2D sprite style,
transparent background, colorful, kid-friendly, no copyrighted references"
```

**3. Generation**

- Tool: Midjourney (Commercial plan)
- Generated: 5 variations
- Selected: Variation 2 (most generic, good pose)

**4. Verification**

- Manual review: ✅ No resemblance to known characters
- Reverse image search: ✅ No matches
- Team review: ✅ Approved by 2 developers
- Trademark check: ✅ No logos or brands visible

**5. Documentation**

Created `docs/ai-assets/generated/player_pitcher_01_prompt.txt`:

```
ASSET: player_pitcher_01.png
TOOL: Midjourney v6
DATE: 2025-11-20
PROMPT: "Original cartoon baseball pitcher character, child, simple geometric shapes,
wearing generic green uniform with yellow stripes, winding up to pitch, focused
expression, no real-person resemblance, side view, 2D sprite style, transparent
background, colorful, kid-friendly, no copyrighted references"
VARIATIONS GENERATED: 5
SELECTED: Variation 2
REASON: Clean pose, no IP resemblance, matches game style
REVIEWED BY: Dev Team
COMMERCIAL CLEARANCE: Midjourney commercial plan verified
LICENSE TERMS: https://docs.midjourney.com/docs/terms-of-service
```

Updated `assets/LICENSES.md`:

| Asset                 | Type      | Source                    | License                  | Attribution | Date Added |
| --------------------- | --------- | ------------------------- | ------------------------ | ----------- | ---------- |
| player_pitcher_01.png | 2D Sprite | AI-generated (Midjourney) | Commercial use permitted | N/A         | 2025-11-20 |

**6. Integration**

- File saved to `apps/games/phaser-bbp-web/assets/sprites/`
- Loaded in BootScene.ts
- Used in GameScene.ts
- Tested on mobile and desktop

## Resources

### AI Tool Documentation

- [Midjourney Terms of Service](https://docs.midjourney.com/docs/terms-of-service)
- [OpenAI Usage Policies](https://openai.com/policies/usage-policies)
- [Stable Diffusion Licensing](https://stability.ai/license)
- [Adobe Firefly Guidelines](https://www.adobe.com/products/firefly/legal.html)

### Copyright & Fair Use

- [U.S. Copyright Office](https://www.copyright.gov/)
- [Stanford Fair Use Guide](https://fairuse.stanford.edu/)
- [USPTO Trademark Search](https://www.uspto.gov/trademarks)

### Internal Resources

- `LEGAL_COMPLIANCE.md` - Overall legal requirements
- `assets/LICENSES.md` - Asset manifest
- `.github/content-blocklist.txt` - Prohibited terms
- `/games/bbp/legal` - Game-specific legal page

## Questions?

If you're unsure whether a prompt or generated asset is acceptable:

1. **Ask before generating**: legal@blazesportsintel.com (placeholder)
2. **Document your question**: `docs/legal/asset-reviews/YYYY-MM-DD_question.md`
3. **Wait for clearance**: Do not use asset until approved
4. **Iterate conservatively**: When in doubt, make it more generic

---

**Last Updated**: 2025-11-02
**Document Owner**: Legal & Development Teams
