#!/usr/bin/env python3
"""Audit a design-spec markdown/text file for BSI skill compliance."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REQUIRED = {
    "brand_color": [r"#BF5700"],
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
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            sentence_start = max(
                text.rfind(".", 0, match.start()),
                text.rfind("!", 0, match.start()),
                text.rfind("?", 0, match.start()),
                text.rfind("\n", 0, match.start()),
            )
            sentence_end_candidates = [
                pos
                for pos in (
                    text.find(".", match.end()),
                    text.find("!", match.end()),
                    text.find("?", match.end()),
                    text.find("\n", match.end()),
                )
                if pos != -1
            ]
            sentence_end = min(sentence_end_candidates) if sentence_end_candidates else len(text)
            sentence = text[sentence_start + 1 : sentence_end].strip()
            sentence_prefix = text[sentence_start + 1 : match.start()].strip()
            negation_patterns = [
                rf"(avoid|reject|ban|banned|forbid|forbidden|no|not|never|without|don't|do not)\s+{pattern}",
                rf"{pattern}\s+(is|are|should be)?\s*(avoided|rejected|banned|forbidden|not allowed|disallowed)",
            ]
            if re.search(
                r"(avoid|reject|ban|banned|forbid|forbidden|never|without|don't|do not)\b",
                sentence_prefix,
                flags=re.IGNORECASE,
            ) or any(re.search(negation, sentence, flags=re.IGNORECASE) for negation in negation_patterns):
                continue
            hits.append(pattern)
            break
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
