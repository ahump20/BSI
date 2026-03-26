#!/usr/bin/env python3
"""
Packages the blaze-platform-visual-design skill for distribution.

Creates a zip archive containing:
- SKILL.md
- references/
- scripts/
- evals/

Usage:
    python3 package_skill.py
    python3 package_skill.py --output /path/to/output.zip
"""

import os
import sys
import zipfile
from pathlib import Path
from datetime import datetime

SKILL_DIR = Path(__file__).parent.parent
SKILL_NAME = 'blaze-platform-visual-design'

INCLUDE_DIRS = ['references', 'scripts', 'evals']
INCLUDE_FILES = ['SKILL.md']
EXCLUDE_PATTERNS = ['__pycache__', '.pyc', '.DS_Store']


def should_include(path: str) -> bool:
    return not any(pat in path for pat in EXCLUDE_PATTERNS)


def package(output_path: str | None = None):
    if output_path is None:
        timestamp = datetime.now().strftime('%Y%m%d')
        output_path = str(SKILL_DIR / f'{SKILL_NAME}-{timestamp}.zip')

    file_count = 0

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add top-level files
        for fname in INCLUDE_FILES:
            fpath = SKILL_DIR / fname
            if fpath.exists():
                arcname = f'{SKILL_NAME}/{fname}'
                zf.write(fpath, arcname)
                file_count += 1
                print(f"  + {arcname}")

        # Add directories
        for dirname in INCLUDE_DIRS:
            dirpath = SKILL_DIR / dirname
            if not dirpath.exists():
                continue
            for root, dirs, files in os.walk(dirpath):
                # Filter directories
                dirs[:] = [d for d in dirs if should_include(d)]
                for f in files:
                    if not should_include(f):
                        continue
                    fpath = os.path.join(root, f)
                    arcname = f'{SKILL_NAME}/{os.path.relpath(fpath, SKILL_DIR)}'
                    zf.write(fpath, arcname)
                    file_count += 1
                    print(f"  + {arcname}")

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\nPackaged {file_count} files → {output_path} ({size_kb:.1f} KB)")
    return output_path


def main():
    output = None
    if len(sys.argv) > 2 and sys.argv[1] == '--output':
        output = sys.argv[2]

    print(f"Packaging {SKILL_NAME}")
    print("=" * 40)
    package(output)


if __name__ == '__main__':
    main()
