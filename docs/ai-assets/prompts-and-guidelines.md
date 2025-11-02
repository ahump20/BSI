# AI Asset Generation Prompts & Guardrails

## Core Requirements

- All artwork must be original. Do **not** reference or imitate Backyard Baseball characters, names, uniforms, or audio.
- Style target: "kid-friendly, cartoony baseball" with a late-90s / early-2000s color palette.
- No professional team logos, trademarks, or real-person likenesses.
- Export assets as vector (SVG) or lightweight PNG with transparent backgrounds.

## Suggested Prompts

1. **Player Sprite Sheet**
   - "Create an original, kid-friendly, cartoony baseball batter in a generic uniform. Bright colors, simple shading, no logos, no specific team names. Character should look energetic and friendly."
2. **Pitcher Sprite Sheet**
   - "Design an original youth pitcher throwing a fastball. Use a clean, vibrant palette, avoid real players, no numbers or trademarks."
3. **UI Badges**
   - "Generate flat, vector-style icons representing strikes, balls, and outs. Use abstract baseball motifs, no text, no copyrighted marks."

## Review Checklist

- [ ] Confirm the prompt avoided banned IP references.
- [ ] Inspect output for hidden logos, player names, or real likenesses.
- [ ] Document file provenance (tool, date, prompt) in `assets/LICENSES.md`.
- [ ] Store layered source files in a secure bucket (not committed).
- [ ] Optimize raster exports to ≤ 100KB per asset at 2x scale.

## Replacement Workflow

1. Generate assets locally with the prompts above (or derivatives that maintain IP safety).
2. Record metadata and license notes in `assets/LICENSES.md`.
3. Drop exported files into `apps/games/phaser-bbp-web/assets/` and update `BootScene` to load them.
4. Re-run `pnpm -w run build:games` and Lighthouse CI before submitting a PR.
