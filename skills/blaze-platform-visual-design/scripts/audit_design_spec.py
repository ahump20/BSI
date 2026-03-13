#!/usr/bin/env python3
"""Audit a design-spec markdown/text file for BSI skill compliance."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REQUIRED = {
    "brand_color": [r"#BF5700", r"burnt orange"],
    "heading_font": [r"Oswald"],
    "body_font": [r"Cormorant Garamond"],
    "hierarchy": [r"hierarchy", r"priority"],
    "accessibility": [r"contrast", r"focus", r"keyboard"],
}

BANNED = [
    r"glassmorphism",
    r"neumorphism",
    r"purple gradient",
    r"generic saas",
]


def check_required(text: str) -> dict[str, bool]:
    out: dict[str, bool] = {}
    for key, patterns in REQUIRED.items():
        out[key] = any(re.search(p, text, flags=re.IGNORECASE) for p in patterns)
    return out


def check_banned(text: str) -> list[str]:
    hits = []
    for pattern in BANNED:
        if re.search(pattern, text, flags=re.IGNORECASE):
            hits.append(pattern)
    return hits


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", help="Path to design spec markdown/text file")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args()

    text = Path(args.path).read_text(encoding="utf-8")
    required = check_required(text)
    banned_hits = check_banned(text)

    passed = all(required.values()) and not banned_hits
    payload = {
        "file": args.path,
        "passed": passed,
        "required": required,
        "banned_hits": banned_hits,
    }

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"PASS={passed}")
        for key, ok in required.items():
            print(f"required:{key}={ok}")
        if banned_hits:
            print("banned=" + ",".join(banned_hits))

    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
