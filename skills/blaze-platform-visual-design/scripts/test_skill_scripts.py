#!/usr/bin/env python3
"""Regression tests for blaze-platform-visual-design skill scripts."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import audit_design_spec
import score_eval_outputs
import validate_skill_bundle


class SkillScriptTests(unittest.TestCase):
    def create_skill_root(self) -> Path:
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        root = Path(temp_dir.name)
        (root / "references").mkdir()
        (root / "scripts").mkdir()
        (root / "evals").mkdir()
        (root / "SKILL.md").write_text(
            "---\n"
            "name: blaze-platform-visual-design\n"
            "description: Deliver Blaze Sports Intel visual direction across BSI surfaces with strict brand fidelity for Next.js, Tailwind, Recharts, and Framer Motion while preserving operator-first hierarchy and implementation discipline.\n"
            "---\n",
            encoding="utf-8",
        )
        for rel in (
            "references/brand-tokens.md",
            "references/surface-playbooks.md",
            "references/implementation-rules.md",
            "references/quality-rubric.md",
            "scripts/audit_design_spec.py",
            "scripts/score_eval_outputs.py",
        ):
            (root / rel).write_text("placeholder\n", encoding="utf-8")
        return root

    def test_validate_reports_invalid_evals_json(self) -> None:
        root = self.create_skill_root()
        (root / "evals/evals.json").write_text('{"skill_name":', encoding="utf-8")

        result = validate_skill_bundle.validate(root)

        self.assertFalse(result["passed"])
        self.assertTrue(any(error.startswith("evals_json_invalid:") for error in result["errors"]))

    def test_audit_requires_explicit_brand_hex(self) -> None:
        required = audit_design_spec.check_required(
            "Use burnt orange with Oswald, Cormorant Garamond, hierarchy, contrast, and keyboard parity."
        )
        self.assertFalse(required["brand_color"])

        required = audit_design_spec.check_required(
            "Use primary accent #BF5700 (burnt orange) with Oswald, Cormorant Garamond, hierarchy, contrast, and keyboard parity."
        )
        self.assertTrue(required["brand_color"])

    def test_audit_ignores_banned_terms_in_rejection_context(self) -> None:
        self.assertEqual(audit_design_spec.check_banned("Avoid glassmorphism and generic saas styling."), [])
        self.assertEqual(audit_design_spec.check_banned("Glassmorphism is not allowed here."), [])
        self.assertEqual(audit_design_spec.check_banned("Use glassmorphism panels."), ["glassmorphism"])

    def test_score_text_does_not_credit_generic_motion_wording(self) -> None:
        scores = score_eval_outputs.score_text("Avoid motion-only state communication and preserve keyboard parity.")
        self.assertEqual(scores["stack_realism"], 0)

    def test_score_script_exits_non_zero_on_failed_inputs(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            failing_input = temp_path / "failing.md"
            out_file = temp_path / "scores.json"
            failing_input.write_text("burnt orange only", encoding="utf-8")

            result = subprocess.run(
                [
                    sys.executable,
                    str(Path(__file__).with_name("score_eval_outputs.py")),
                    "--inputs",
                    str(failing_input),
                    "--out",
                    str(out_file),
                ],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertNotEqual(result.returncode, 0)
            payload = json.loads(out_file.read_text(encoding="utf-8"))
            self.assertFalse(payload["results"][0]["passed"])


if __name__ == "__main__":
    unittest.main()
