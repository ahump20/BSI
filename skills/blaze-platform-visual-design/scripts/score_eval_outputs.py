#!/usr/bin/env python3
"""Score sample eval outputs using the quality rubric heuristics."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

CATEGORIES = {
    "brand_fidelity": [r"#BF5700|burnt orange", r"Oswald", r"Cormorant Garamond", r"midnight|charcoal"],
    "hierarchy_density": [r"hierarchy|priority", r"scan|first", r"data|score|metrics"],
    "system_reusability": [r"reusable|tokens|pattern|component"],
    "stack_realism": [r"\bNext\.js\b", r"\bTailwind\b", r"\bRecharts\b", r"\bFramer Motion\b"],
    "accessibility": [r"focus", r"keyboard", r"contrast"],
    "spec_before_code": [r"spec|blueprint", r"before code|before implementation|implementation notes"],
}


def score_text(text: str) -> dict[str, int]:
    scores: dict[str, int] = {}
    for key, patterns in CATEGORIES.items():
        hits = sum(1 for p in patterns if re.search(p, text, flags=re.IGNORECASE))
        if key in {"system_reusability"}:
            scores[key] = 2 if hits >= 1 else 0
        else:
            scores[key] = 2 if hits >= 2 else (1 if hits >= 1 else 0)
    return scores


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputs", nargs="+", required=True, help="Input markdown/text files")
    parser.add_argument("--out", required=True, help="Output JSON path")
    parser.add_argument(
        "--allow-failures",
        action="store_true",
        help="Exit zero even when one or more scored inputs fail the rubric",
    )
    args = parser.parse_args()

    results = []
    for path_str in args.inputs:
        path = Path(path_str)
        text = path.read_text(encoding="utf-8")
        by_cat = score_text(text)
        total = sum(by_cat.values())
        passed = total >= 9 and by_cat["brand_fidelity"] > 0
        results.append({"file": str(path), "scores": by_cat, "total": total, "passed": passed})

    payload = {"results": results}
    out = Path(args.out)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))

    any_failed = any(not result["passed"] for result in results)
    return 0 if args.allow_failures or not any_failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
