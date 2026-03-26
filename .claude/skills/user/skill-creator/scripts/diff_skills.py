#!/usr/bin/env python3
"""
Skill Diff v3 - Compare two skill versions side-by-side

Usage:
    diff_skills.py <old-skill-path> <new-skill-path>

Shows: description changes, structural changes, token budget impact,
new/removed files, and content diffs for SKILL.md.
"""

import sys
import re
import yaml
import difflib
from pathlib import Path


def extract_frontmatter(content: str):
    if not content.startswith('---'):
        return {}, content
    match = re.match(r'^---\n(.*?)\n---\n?(.*)', content, re.DOTALL)
    if not match:
        return {}, content
    try:
        return yaml.safe_load(match.group(1)) or {}, match.group(2)
    except yaml.YAMLError:
        return {}, content


def count_words(text: str) -> int:
    text = re.sub(r'```[\s\S]*?```', '', text)
    return len(text.split())


def get_files(skill_path: Path) -> dict:
    files = {}
    for f in skill_path.rglob('*'):
        if f.is_file() and not f.name.startswith('.') and f.suffix != '.pyc':
            rel = str(f.relative_to(skill_path))
            files[rel] = f.read_text(errors='replace')
    return files


def diff_skills(old_path: Path, new_path: Path):
    old_files = get_files(old_path)
    new_files = get_files(new_path)

    print(f"Comparing: {old_path.name} -> {new_path.name}\n")

    # Description diff
    old_fm, old_body = extract_frontmatter(old_files.get('SKILL.md', ''))
    new_fm, new_body = extract_frontmatter(new_files.get('SKILL.md', ''))

    old_desc = old_fm.get('description', '')
    new_desc = new_fm.get('description', '')

    if old_desc != new_desc:
        print("DESCRIPTION CHANGED:")
        for line in difflib.unified_diff(
            old_desc.splitlines(), new_desc.splitlines(),
            fromfile='old', tofile='new', lineterm=''
        ):
            print(f"  {line}")
        print()

    # Token budget comparison
    old_words = count_words(old_body)
    new_words = count_words(new_body)
    delta = new_words - old_words
    sign = "+" if delta > 0 else ""
    print(f"TOKEN BUDGET:")
    print(f"  SKILL.md body: {old_words} -> {new_words} words ({sign}{delta})")
    print(f"  Description: {count_words(old_desc)} -> {count_words(new_desc)} words")
    print()

    # File changes
    old_set = set(old_files.keys())
    new_set = set(new_files.keys())

    added = new_set - old_set
    removed = old_set - new_set
    common = old_set & new_set

    if added:
        print(f"FILES ADDED ({len(added)}):")
        for f in sorted(added):
            print(f"  + {f}")
        print()

    if removed:
        print(f"FILES REMOVED ({len(removed)}):")
        for f in sorted(removed):
            print(f"  - {f}")
        print()

    # Content changes in common files
    changed = []
    for f in sorted(common):
        if old_files[f] != new_files[f]:
            changed.append(f)

    if changed:
        print(f"FILES MODIFIED ({len(changed)}):")
        for f in changed:
            old_lines = old_files[f].splitlines()
            new_lines = new_files[f].splitlines()
            diff = list(difflib.unified_diff(old_lines, new_lines,
                        fromfile=f'old/{f}', tofile=f'new/{f}', lineterm='', n=2))
            adds = sum(1 for l in diff if l.startswith('+') and not l.startswith('+++'))
            subs = sum(1 for l in diff if l.startswith('-') and not l.startswith('---'))
            print(f"  ~ {f} (+{adds} -{subs} lines)")
        print()

    if not added and not removed and not changed:
        print("No differences found.")


def main():
    if len(sys.argv) != 3:
        print("Usage: diff_skills.py <old-skill-path> <new-skill-path>")
        sys.exit(1)

    old_path = Path(sys.argv[1]).resolve()
    new_path = Path(sys.argv[2]).resolve()

    for p in [old_path, new_path]:
        if not p.exists() or not p.is_dir():
            print(f"Error: Invalid path: {p}")
            sys.exit(1)

    diff_skills(old_path, new_path)


if __name__ == "__main__":
    main()
