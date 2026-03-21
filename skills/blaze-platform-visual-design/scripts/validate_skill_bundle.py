#!/usr/bin/env python3
"""Validate blaze-platform-visual-design skill structure, metadata, and eval quality."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REQUIRED_FILES = [
    "SKILL.md",
    "references/brand-tokens.md",
    "references/surface-playbooks.md",
    "references/implementation-rules.md",
    "references/quality-rubric.md",
    "scripts/audit_design_spec.py",
    "scripts/package_skill_bundle.sh",
    "evals/evals.json",
    "evals/trigger-evals.json",
]


def parse_frontmatter(text: str) -> dict[str, str]:
    match = re.match(r"^---\n(?P<fm>.*?)\n---\n", text, flags=re.DOTALL)
    if not match:
        raise ValueError("Missing YAML frontmatter")

    lines = [line for line in match.group("fm").splitlines() if line.strip()]
    data: dict[str, str] = {}
    for line in lines:
        if ":" not in line:
            raise ValueError(f"Invalid frontmatter line: {line}")
        key, value = line.split(":", 1)
        k = key.strip()
        v = value.strip()
        if v.startswith(("'", '"')) and v.endswith(("'", '"')) and len(v) >= 2:
            v = v[1:-1]
        data[k] = v
    return data


def validate(root: Path) -> dict:
    errors: list[str] = []
    warnings: list[str] = []

    for rel in REQUIRED_FILES:
        if not (root / rel).exists():
            errors.append(f"missing:{rel}")

    skill_file = root / "SKILL.md"
    if skill_file.exists():
        text = skill_file.read_text(encoding="utf-8")
        try:
            fm = parse_frontmatter(text)
        except ValueError as exc:
            errors.append(str(exc))
            fm = {}

        extra = set(fm.keys()) - {"name", "description"}
        if extra:
            errors.append("frontmatter_extra_fields:" + ",".join(sorted(extra)))

        if fm.get("name") != "blaze-platform-visual-design":
            errors.append("name_mismatch")

        desc = fm.get("description", "")
        if len(desc) < 240:
            errors.append("description_too_short")
        for required_phrase in ["BSI", "Next.js", "Tailwind", "Recharts", "Framer Motion"]:
            if required_phrase not in desc:
                errors.append(f"description_missing:{required_phrase}")

        if "generic SaaS" not in text and "anti-generic" not in text:
            warnings.append("body_missing_anti_generic_guardrail")

    evals_file = root / "evals/evals.json"
    if evals_file.exists():
        data = json.loads(evals_file.read_text(encoding="utf-8"))
        if data.get("skill_name") != "blaze-platform-visual-design":
            errors.append("eval_skill_name_mismatch")

        evals = data.get("evals", [])
        if len(evals) < 5:
            errors.append("eval_count_lt_5")

        ids = [item.get("id") for item in evals]
        if len(set(ids)) != len(ids):
            errors.append("duplicate_eval_ids")
        if any(not item.get("prompt") for item in evals):
            errors.append("empty_eval_prompt")

    trigger_file = root / "evals/trigger-evals.json"
    if trigger_file.exists():
        trigger_data = json.loads(trigger_file.read_text(encoding="utf-8"))
        if not isinstance(trigger_data, list) or len(trigger_data) < 10:
            errors.append("trigger_eval_set_too_small")
        else:
            true_count = sum(1 for item in trigger_data if item.get("should_trigger") is True)
            false_count = sum(1 for item in trigger_data if item.get("should_trigger") is False)
            if true_count < 4 or false_count < 4:
                errors.append("trigger_eval_imbalance")

    return {"passed": not errors, "errors": errors, "warnings": warnings}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("skill_root", nargs="?", default=".")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    result = validate(Path(args.skill_root))
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("PASS=" + str(result["passed"]))
        for err in result["errors"]:
            print("ERROR=" + err)
        for warn in result["warnings"]:
            print("WARN=" + warn)

    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
