#!/usr/bin/env python3
"""
Heritage Design System v2.1 — UI Output Auditor

Scans TSX/CSS files for Heritage violations:
- Non-token hex colors
- Glass card usage on content surfaces
- Wrong border-radius values
- Non-Heritage font families
- Missing trust cues on data surfaces
- Startup gradients (purple, teal, neon)

Usage:
    python3 audit_ui_output.py <file_or_directory>
    python3 audit_ui_output.py app/college-baseball/page.tsx
    python3 audit_ui_output.py components/
"""

import re
import sys
import os
from pathlib import Path

# Heritage-approved hex colors (lowercase for comparison)
HERITAGE_COLORS = {
    '#bf5700', '#d4722a', '#ff6b35', '#fdb913',
    '#fff5ed', '#ffead5', '#ffd0aa', '#ffad74', '#ff7d3c',
    '#9c4500', '#7d3700', '#5e2900', '#3f1c00',
    '#0d0d0d', '#0a0a0a', '#111111', '#161616', '#1a1a1a', '#242424',
    '#f5f0eb', '#f5f2eb', '#a89f95', '#c4b8a5',
    '#8b4513', '#ff4500', '#ff6600',
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#4b9cd3', '#c41e3a', '#00b2a9', '#8c6239', '#f0e6d3',
    '#c0392b', '#e74c3c', '#d4775c', '#aaaaaa', '#5b9bd5', '#2980b9', '#1a5276',
    '#6b8e23', '#355e3b', '#e25822',
    '#2d2d2d', '#2a2a2a',
    '#ffffff', '#000000', '#fff', '#000',
    '#ddd',  # print styles
}

# Additional approved partial matches (used in rgba, gradients, etc.)
HERITAGE_RGB_COMPONENTS = {
    '191, 87, 0', '255, 107, 53', '245, 240, 235',
    '140, 98, 57', '75, 156, 211', '16, 185, 129',
    '239, 68, 68', '245, 158, 11', '59, 130, 246',
    '196, 30, 58', '107, 142, 35', '53, 94, 59',
    '226, 88, 34', '139, 69, 19', '170, 170, 170',
    '91, 155, 213', '231, 76, 60', '192, 57, 43',
    '204, 102, 0',
}

# Non-Heritage colors that are common AI/startup tells
STARTUP_COLORS = re.compile(
    r'#(7c3aed|8b5cf6|a855f7|6366f1|818cf8|14b8a6|06b6d4|0ea5e9|'
    r'ec4899|f43f5e|d946ef|a78bfa|c084fc)',
    re.IGNORECASE
)

# Glass patterns that should NOT appear on content cards
GLASS_VIOLATIONS = [
    re.compile(r'backdrop-filter:\s*blur\(', re.IGNORECASE),
    re.compile(r'-webkit-backdrop-filter:\s*blur\(', re.IGNORECASE),
]

# Glass class usage (only okay in Labs atmospheric contexts)
GLASS_CLASS_PATTERN = re.compile(r'\bglass-(subtle|default|elevated)\b')

# Wrong border-radius for Heritage contexts
WRONG_RADIUS = re.compile(r'border-radius:\s*(0\.75rem|12px|16px|1rem|8px)')

# Non-Heritage font families
NON_HERITAGE_FONTS = re.compile(
    r"font-family:\s*['\"]?(Inter|Roboto|Arial|Helvetica|Montserrat|Poppins|"
    r"Nunito|Lato|Open Sans|Raleway|Source Sans)['\"]?",
    re.IGNORECASE
)

# Hex color extraction
HEX_COLOR = re.compile(r'#([0-9a-fA-F]{3,8})\b')

# Data surface indicators (suggest trust cues needed)
DATA_SURFACE_KEYWORDS = [
    'standings', 'scores', 'stats', 'rankings', 'leaderboard',
    'box-score', 'boxscore', 'linescore', 'roster',
    'schedule', 'results', 'record',
]


class Violation:
    def __init__(self, file: str, line: int, category: str, message: str, severity: str = 'error'):
        self.file = file
        self.line = line
        self.category = category
        self.message = message
        self.severity = severity

    def __str__(self):
        icon = '!!!' if self.severity == 'error' else '---'
        return f"  {icon} [{self.category}] Line {self.line}: {self.message}"


def audit_file(filepath: str) -> list[Violation]:
    violations = []
    path = Path(filepath)

    if path.suffix not in ('.tsx', '.ts', '.jsx', '.js', '.css'):
        return violations

    # Skip node_modules, .next, out directories
    if any(part in path.parts for part in ('node_modules', '.next', 'out', 'dist')):
        return violations

    try:
        content = path.read_text(encoding='utf-8')
    except (UnicodeDecodeError, FileNotFoundError):
        return violations

    lines = content.split('\n')

    for i, line in enumerate(lines, 1):
        line_lower = line.lower().strip()

        # Skip comments and imports
        if line_lower.startswith('//') or line_lower.startswith('/*') or line_lower.startswith('*'):
            continue
        if line_lower.startswith('import '):
            continue

        # 1. Check for non-Heritage hex colors
        for match in HEX_COLOR.finditer(line):
            hex_val = f"#{match.group(1).lower()}"
            # Normalize 3-char to 6-char
            if len(hex_val) == 4:
                hex_val = f"#{hex_val[1]*2}{hex_val[2]*2}{hex_val[3]*2}"
            if hex_val not in HERITAGE_COLORS:
                # Check if it's inside a CSS var definition (allowed in bsi-brand.css)
                if 'bsi-brand.css' not in str(filepath) and 'globals.css' not in str(filepath):
                    violations.append(Violation(
                        str(filepath), i, 'COLOR',
                        f"Non-Heritage hex color: {hex_val}",
                        'error'
                    ))

        # 2. Check for startup/AI-tell gradients
        if STARTUP_COLORS.search(line):
            violations.append(Violation(
                str(filepath), i, 'GRADIENT',
                "Startup/AI-tell color detected — not in Heritage palette",
                'error'
            ))

        # 3. Check for glass card violations on content
        for pattern in GLASS_VIOLATIONS:
            if pattern.search(line):
                # Allow in globals.css (where glass system is defined)
                if 'globals.css' not in str(filepath):
                    violations.append(Violation(
                        str(filepath), i, 'GLASS',
                        "backdrop-filter blur on content — Heritage uses solid surfaces",
                        'error'
                    ))

        # 4. Check for glass class usage
        if GLASS_CLASS_PATTERN.search(line):
            violations.append(Violation(
                str(filepath), i, 'GLASS',
                "Glass class on content element — use .heritage-card for solid surface",
                'warning'
            ))

        # 5. Check for wrong border-radius
        if WRONG_RADIUS.search(line):
            if 'globals.css' not in str(filepath):
                violations.append(Violation(
                    str(filepath), i, 'RADIUS',
                    "Non-Heritage border-radius — Heritage cards use 2px, stamps use 1px",
                    'warning'
                ))

        # 6. Check for non-Heritage fonts
        if NON_HERITAGE_FONTS.search(line):
            violations.append(Violation(
                str(filepath), i, 'FONT',
                "Non-Heritage font family — use Oswald, Cormorant Garamond, IBM Plex Mono, or JetBrains Mono",
                'error'
            ))

    # 7. Check for missing trust cues on data surfaces
    filename_lower = path.stem.lower()
    is_data_surface = any(kw in filename_lower for kw in DATA_SURFACE_KEYWORDS)
    if is_data_surface and path.suffix in ('.tsx', '.jsx'):
        has_source = bool(re.search(r'(source|Source|data-source|meta\.source)', content))
        has_freshness = bool(re.search(r'(updated|fetched_at|lastUpdated|Updated.*ago|freshness)', content, re.IGNORECASE))
        if not has_source:
            violations.append(Violation(
                str(filepath), 0, 'TRUST',
                "Data surface missing source attribution — add 'Source: ...' display",
                'warning'
            ))
        if not has_freshness:
            violations.append(Violation(
                str(filepath), 0, 'TRUST',
                "Data surface missing freshness timestamp — add 'Updated X ago' display",
                'warning'
            ))

    return violations


def audit_directory(dirpath: str) -> list[Violation]:
    all_violations = []
    for root, dirs, files in os.walk(dirpath):
        # Skip hidden dirs, node_modules, etc.
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', '.next', 'out', 'dist')]
        for f in files:
            filepath = os.path.join(root, f)
            all_violations.extend(audit_file(filepath))
    return all_violations


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 audit_ui_output.py <file_or_directory>")
        print("       python3 audit_ui_output.py app/college-baseball/page.tsx")
        print("       python3 audit_ui_output.py components/")
        sys.exit(1)

    target = sys.argv[1]

    if os.path.isfile(target):
        violations = audit_file(target)
    elif os.path.isdir(target):
        violations = audit_directory(target)
    else:
        print(f"Error: '{target}' not found")
        sys.exit(1)

    errors = [v for v in violations if v.severity == 'error']
    warnings = [v for v in violations if v.severity == 'warning']

    if not violations:
        print("Heritage compliance: PASS — no violations found")
        sys.exit(0)

    # Group by file
    by_file: dict[str, list[Violation]] = {}
    for v in violations:
        by_file.setdefault(v.file, []).append(v)

    print(f"\nHeritage Design System v2.1 — Audit Report")
    print(f"{'=' * 50}")
    print(f"Files scanned: {len(by_file)}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    print(f"{'=' * 50}\n")

    for filepath, file_violations in sorted(by_file.items()):
        print(f"{filepath}")
        for v in sorted(file_violations, key=lambda x: x.line):
            print(str(v))
        print()

    if errors:
        print(f"RESULT: BLOCK — {len(errors)} error(s) must be fixed before shipping")
        sys.exit(1)
    else:
        print(f"RESULT: SHIP WITH NOTES — {len(warnings)} warning(s) to review")
        sys.exit(0)


if __name__ == '__main__':
    main()
