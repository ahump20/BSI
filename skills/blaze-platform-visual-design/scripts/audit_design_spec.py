#!/usr/bin/env python3
"""Audit a design spec for Blaze Sports Intel brand + execution compliance."""

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

REQUIRED_SECTIONS = [
    r"purpose\s*\+\s*audience",
    r"layout\s+blueprint",
    r"typography\s+ladder",
    r"color/token\s+mapping",
    r"component\s+state\s+matrix",
    r"responsive\s+behavior",
    r"implementation\s+notes",
]

BANNED = [
    r"glassmorphism",
    r"neumorphism",
    r"purple gradient",
    r"generic saas",
]


def any_match(text: str, patterns: list[str]) -> bool:
    return any(re.search(p, text, flags=re.IGNORECASE) for p in patterns)


def check_required(text: str) -> dict[str, bool]:
    return {k: any_match(text, p) for k, p in REQUIRED.items()}


def check_required_sections(text: str) -> dict[str, bool]:
    return {p: bool(re.search(p, text, flags=re.IGNORECASE)) for p in REQUIRED_SECTIONS}


def check_banned(text: str) -> list[str]:
    return [p for p in BANNED if re.search(p, text, flags=re.IGNORECASE)]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", help="Path to design spec markdown/text file")
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    parser.add_argument(
        "--require-sections",
        action="store_true",
        help="Also require protocol section headings from SKILL.md",
    )
    args = parser.parse_args()

    text = Path(args.path).read_text(encoding="utf-8")
    required = check_required(text)
    banned_hits = check_banned(text)

    missing_sections: list[str] = []
    sections_ok: dict[str, bool] = {}
    if args.require_sections:
        sections_ok = check_required_sections(text)
        missing_sections = [k for k, ok in sections_ok.items() if not ok]

    passed = all(required.values()) and not banned_hits and not missing_sections
    payload = {
        "file": args.path,
        "passed": passed,
        "required": required,
        "banned_hits": banned_hits,
        "require_sections": args.require_sections,
        "sections": sections_ok,
        "missing_sections": missing_sections,
    }

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"PASS={passed}")
        for key, ok in required.items():
            print(f"required:{key}={ok}")
        if args.require_sections:
            for section, ok in sections_ok.items():
                print(f"section:{section}={ok}")
        if banned_hits:
            print("banned=" + ",".join(banned_hits))
        if missing_sections:
            print("missing_sections=" + ",".join(missing_sections))

    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
