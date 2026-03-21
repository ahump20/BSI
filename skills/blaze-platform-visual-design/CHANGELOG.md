# Changelog

## 2026-03-12 (Iteration 2)

- Reworked SKILL.md into a stricter operator protocol with explicit fix-loop after design-spec audit failures.
- Added `references/quality-rubric.md` for acceptance scoring.
- Added `scripts/validate_skill_bundle.py` for structure/frontmatter/description/eval checks.
- Added `scripts/package_skill_bundle.sh` to package both `.skill` and `.zip` artifacts after validation.
- Expanded eval scenarios from 3 to 5 and added trigger-eval set for description sensitivity checks.

- Hardened `audit_design_spec.py` with optional section-level protocol checks (`--require-sections`).
- Hardened `validate_skill_bundle.py` with stronger frontmatter parsing, trigger-eval balance checks, and duplicate eval-ID detection.
