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


def _is_negated_context(text: str, match_start: int) -> bool:
    """Return True if the banned term at match_start appears in a rejecting/avoidance context."""
    window_start = max(0, match_start - 100)
    context = text[window_start:match_start].lower()

    # Phrases that indicate the following term should *not* be used.
    negation_patterns = [
        r"\bavoid\b",
        r"\breject\b",
        r"\bno\b",
        r"\bwithout\b",
        r"\bdo not use\b",
        r"\bdon't use\b",
        r"\bshould not use\b",
        r"\bmust not use\b",
    ]

    return any(re.search(pat, context) for pat in negation_patterns)


def check_banned(text: str) -> list[str]:
    hits: list[str] = []
    for pattern in BANNED:
        # Look for all occurrences of the banned term.
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            # Skip occurrences that are clearly in an avoidance/negative context,
            # e.g., "avoid glassmorphism" or "do not use neumorphism".
            if _is_negated_context(text, match.start()):
                continue
            hits.append(pattern)
            # Only need to record each banned pattern once.
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
