#!/usr/bin/env python3
"""Validate blaze-platform-visual-design skill structure and metadata quality."""

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
    "scripts/score_eval_outputs.py",
    "evals/evals.json",
]


def parse_frontmatter(text: str) -> dict[str, str]:
    m = re.match(r"^---\n(.*?)\n---\n", text, flags=re.DOTALL)
    if not m:
        raise ValueError("Missing YAML frontmatter")
    fm_text = m.group(1)
    data: dict[str, str] = {}
    for line in fm_text.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        data[k.strip()] = v.strip()
    return data


def validate(root: Path) -> dict:
    errors: list[str] = []

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

        if set(fm.keys()) - {"name", "description"}:
            extras = sorted(set(fm.keys()) - {"name", "description"})
            errors.append(f"frontmatter_extra_fields:{','.join(extras)}")
        if fm.get("name") != "blaze-platform-visual-design":
            errors.append("name_mismatch")

        desc = fm.get("description", "")
        if len(desc) < 220:
            errors.append("description_too_short")
        for required_phrase in ["BSI", "Next.js", "Tailwind", "Recharts", "Framer Motion"]:
            if required_phrase not in desc:
                errors.append(f"description_missing:{required_phrase}")

    evals_file = root / "evals/evals.json"
    if evals_file.exists():
        try:
            data = json.loads(evals_file.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            errors.append(f"evals_json_error:{exc}")
        else:
            if data.get("skill_name") != "blaze-platform-visual-design":
                errors.append("eval_skill_name_mismatch")
            evals = data.get("evals", [])
            if len(evals) < 3:
                errors.append("eval_count_lt_3")

    return {"passed": not errors, "errors": errors}


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
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
