# BlazeSportsIntel Legal Compliance Playbook

## Backyard Blaze Ball Requirements

- **Zero IP reuse**: No Backyard Baseball assets, names, likenesses, fonts, or sound beds may appear anywhere in source or media.
- **Original creations**: All characters, uniforms, stadium art, and audio cues must be original or generated via internal/AI tools under permissive terms.
- **Human review**: Every asset change requires review for trademark, likeness, and collegiate compliance.

## Asset Intake Workflow

1. Draft or generate assets using the prompts in `docs/ai-assets/prompts-and-guidelines.md`.
2. Document provenance in `assets/LICENSES.md` (tool, creator, date, license).
3. Verify there are no real-person likenesses, branded marks, or conference logos.
4. Include accessibility metadata (alt text, captions) when surfacing media in UI.
5. Secure approvals from product + legal before merging.

## Code Guardrails

- New CI blocklist prevents banned IP names from entering the repo.
- Game iframe routes link to `/games/bbp/legal` for public-facing disclosures.
- Analytics respect privacy controls (no tracking when `Do Not Track` is enabled).

## Incident Response

- If a potential IP conflict is detected, immediately pull the offending asset and ship a hotfix removing `/games/bbp` entry point.
- Maintain a rollback branch that removes the `public/games/bbp-web` bundle and navigation link.
- Document findings in `MIGRATION_LOG.md` and notify legal partners.
