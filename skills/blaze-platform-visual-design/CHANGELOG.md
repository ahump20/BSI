# Changelog

## 2026-03-13 (Iteration 4)

- Hardened `scripts/validate_skill_bundle.py` so invalid or unreadable `evals/evals.json` files return validation errors instead of crashing bundle packaging.
- Tightened `scripts/audit_design_spec.py` to require explicit `#BF5700` token usage and ignore banned-term mentions when they appear in rejection/avoidance phrasing.
- Refined `scripts/score_eval_outputs.py` so `stack_realism` only credits explicit `Framer Motion` mentions and returns a non-zero exit unless `--allow-failures` is set.
- Switched `scripts/package_skill_bundle.sh` to `python3` and refreshed persisted eval scoring totals (`iteration-2` now scores 9 instead of 10).

## 2026-03-12 (Iteration 3)

- Added `scripts/score_eval_outputs.py` to provide a repeatable quantitative eval pass/fail score from rubric-aligned heuristics.
- Added persisted `evals/scored-results.json` so iteration quality is visible without rerunning scripts.
- Extended bundle validation to require the new scoring script.
- Updated packaging to include `CHANGELOG.md` in both `.skill` and `.zip` artifacts.
- Updated eval-loop notes with measured fail→pass deltas (3 to 10).

## 2026-03-12 (Iteration 2)

- Reworked SKILL.md into a stricter operator protocol with explicit fix-loop after design-spec audit failures.
- Added `references/quality-rubric.md` for acceptance scoring.
- Added `scripts/validate_skill_bundle.py` for structure/frontmatter/description/eval checks.
- Added `scripts/package_skill_bundle.sh` to package both `.skill` and `.zip` artifacts after validation.
- Expanded eval scenarios from 3 to 5 and added trigger-eval set for description sensitivity checks.
