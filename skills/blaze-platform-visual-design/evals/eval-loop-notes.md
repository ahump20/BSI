# Eval loop notes

Iteration 1 found weak enforcement in three areas: explicit Cormorant Garamond mention, keyboard/focus accessibility language, and anti-generic guardrails.

Iteration 2 updates:
- Tightened SKILL.md protocol so spec sections are mandatory before implementation advice.
- Added quality rubric reference to make acceptance criteria explicit.
- Expanded eval set from 3 to 5 realistic prompts to improve surface coverage.
- Added trigger-evals.json (10 mixed prompts) to pressure-test under/over-trigger behavior.
- Added quantitative scoring via `scripts/score_eval_outputs.py` with persisted results in `evals/scored-results.json`.

Verification result:
- `audit_design_spec.py` fails intentionally weak sample.
- `audit_design_spec.py` passes revised sample.
- `validate_skill_bundle.py` passes full bundle structure + metadata checks.
- `score_eval_outputs.py` reports iteration-1 total 3 (fail) and iteration-2 total 10 (pass).
