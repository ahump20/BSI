#!/usr/bin/env python3
"""
Skill Validator v3 - Structural validation (required for packaging)

Usage:
    validate_skill.py <path/to/skill>
"""

import sys
import re
import yaml
from pathlib import Path
from typing import Tuple, List, Optional


def validate_frontmatter(content: str) -> Tuple[bool, str, Optional[dict]]:
    if not content.startswith('---'):
        return False, "No YAML frontmatter found", None
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter (missing closing ---)", None
    try:
        fm = yaml.safe_load(match.group(1))
        if not isinstance(fm, dict):
            return False, "Frontmatter must be a YAML dictionary", None
    except yaml.YAMLError as e:
        return False, f"Invalid YAML: {e}", None

    allowed = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}
    unexpected = set(fm.keys()) - allowed
    if unexpected:
        return False, f"Unexpected frontmatter keys: {', '.join(sorted(unexpected))}", None
    if 'name' not in fm:
        return False, "Missing 'name' in frontmatter", None
    if 'description' not in fm:
        return False, "Missing 'description' in frontmatter", None
    return True, "Frontmatter valid", fm


def validate_name(name: str) -> Tuple[bool, str]:
    if not isinstance(name, str) or not name.strip():
        return False, "Name must be a non-empty string"
    name = name.strip()
    if not re.match(r'^[a-z0-9-]+$', name):
        return False, f"Name '{name}' must be kebab-case"
    if name.startswith('-') or name.endswith('-') or '--' in name:
        return False, f"Name '{name}' has invalid hyphen usage"
    if len(name) > 64:
        return False, f"Name too long ({len(name)} chars, max 64)"
    for reserved in ['anthropic', 'claude']:
        if reserved in name:
            return False, f"Name contains reserved word '{reserved}'"
    return True, "Name valid"


def validate_description(desc: str) -> Tuple[bool, str, List[str]]:
    warnings = []
    if not isinstance(desc, str) or not desc.strip():
        return False, "Description must be non-empty", []
    if '<' in desc or '>' in desc:
        return False, "Description cannot contain XML tags", []
    if len(desc) > 1024:
        return False, f"Description too long ({len(desc)} chars, max 1024)", []
    if 'TODO' in desc.upper():
        return False, "Description contains TODO", []
    if len(desc.split()) < 20:
        warnings.append(f"Description is brief ({len(desc.split())} words)")
    return True, "Description valid", warnings


def validate_skill(skill_path: Path) -> Tuple[bool, str, List[str]]:
    skill_path = Path(skill_path)
    warnings = []

    if not (skill_path / 'SKILL.md').exists():
        return False, "SKILL.md not found", []

    for bad in ['README.md', 'CHANGELOG.md']:
        if (skill_path / bad).exists():
            warnings.append(f"{bad} found — skills should not include auxiliary docs")

    content = (skill_path / 'SKILL.md').read_text()
    valid, msg, fm = validate_frontmatter(content)
    if not valid:
        return False, msg, warnings

    valid, msg = validate_name(fm.get('name', ''))
    if not valid:
        return False, msg, warnings

    if fm.get('name') != skill_path.name:
        return False, f"Name '{fm.get('name')}' doesn't match directory '{skill_path.name}'", warnings

    valid, msg, desc_warnings = validate_description(fm.get('description', ''))
    warnings.extend(desc_warnings)
    if not valid:
        return False, msg, warnings

    return True, "Skill is valid", warnings


def main():
    if len(sys.argv) != 2:
        print("Usage: validate_skill.py <skill_directory>")
        sys.exit(1)

    skill_path = Path(sys.argv[1]).resolve()
    if not skill_path.exists():
        print(f"Error: Path not found: {skill_path}")
        sys.exit(1)

    print(f"Validating: {skill_path.name}")
    valid, message, warnings = validate_skill(skill_path)

    if warnings:
        print(f"\nWarnings:")
        for w in warnings:
            print(f"  - {w}")

    if valid:
        print(f"\n{message}")
    else:
        print(f"\n{message}")

    sys.exit(0 if valid else 1)


if __name__ == "__main__":
    main()
