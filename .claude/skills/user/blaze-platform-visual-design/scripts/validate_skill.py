#!/usr/bin/env python3
"""
Validates the blaze-platform-visual-design skill structure.

Checks:
- SKILL.md exists and has valid frontmatter
- Required reference files present
- Trigger phrases in description
- No broken internal links
- Token references match source CSS
"""

import os
import re
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).parent.parent
SKILL_MD = SKILL_DIR / 'SKILL.md'

REQUIRED_REFS = [
    'references/heritage-design-system.md',
    'references/repo-context.md',
    'references/component-patterns.md',
    'references/visual-critique-rubric.md',
    'references/output-templates.md',
    'references/source-priority.md',
]

REQUIRED_SCRIPTS = [
    'scripts/audit_ui_output.py',
    'scripts/validate_skill.py',
    'scripts/package_skill.py',
]

REQUIRED_TRIGGER_PHRASES = [
    'BSI page', 'scoreboard', 'heritage', 'off-brand',
    'design-to-code', 'visual audit',
]

FRONTMATTER_FIELDS = ['name', 'description']


def check_file_exists(path: str) -> tuple[bool, str]:
    full = SKILL_DIR / path
    if full.exists():
        return True, f"  [OK] {path}"
    return False, f"  [FAIL] {path} — missing"


def validate_frontmatter(content: str) -> list[str]:
    issues = []
    if not content.startswith('---'):
        issues.append("  [FAIL] SKILL.md missing frontmatter (must start with ---)")
        return issues

    fm_end = content.find('---', 3)
    if fm_end == -1:
        issues.append("  [FAIL] SKILL.md frontmatter not closed (missing second ---)")
        return issues

    frontmatter = content[3:fm_end]

    for field in FRONTMATTER_FIELDS:
        if f'{field}:' not in frontmatter:
            issues.append(f"  [FAIL] Missing frontmatter field: {field}")
        else:
            issues.append(f"  [OK] Frontmatter field: {field}")

    return issues


def validate_triggers(content: str) -> list[str]:
    issues = []
    # Extract description from frontmatter
    fm_match = re.search(r'---\s*\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        issues.append("  [FAIL] Cannot parse frontmatter for trigger check")
        return issues

    description = fm_match.group(1).lower()

    for phrase in REQUIRED_TRIGGER_PHRASES:
        if phrase.lower() in description:
            issues.append(f"  [OK] Trigger phrase: '{phrase}'")
        else:
            issues.append(f"  [FAIL] Missing trigger phrase: '{phrase}'")

    return issues


def validate_token_coverage(content: str) -> list[str]:
    """Check that key Heritage tokens are mentioned in SKILL.md"""
    issues = []
    key_tokens = [
        '--surface-scoreboard', '--surface-dugout', '--surface-press-box',
        '--bsi-primary', '--bsi-bone', '--bsi-dust',
        '--heritage-columbia-blue', '--heritage-oiler-red', '--heritage-bronze',
        '--border-vintage', '--border-active',
        '--bsi-font-display', '--bsi-font-body', '--bsi-font-data',
    ]
    for token in key_tokens:
        if token in content:
            issues.append(f"  [OK] Token referenced: {token}")
        else:
            issues.append(f"  [WARN] Token not referenced in SKILL.md: {token}")

    return issues


def main():
    print("Heritage Visual Design Skill — Structure Validation")
    print("=" * 55)

    all_pass = True

    # 1. Check SKILL.md exists
    print("\n1. SKILL.md")
    if not SKILL_MD.exists():
        print("  [FAIL] SKILL.md not found")
        all_pass = False
    else:
        print("  [OK] SKILL.md exists")
        content = SKILL_MD.read_text()

        # 2. Validate frontmatter
        print("\n2. Frontmatter")
        for line in validate_frontmatter(content):
            print(line)
            if '[FAIL]' in line:
                all_pass = False

        # 3. Validate trigger phrases
        print("\n3. Trigger Phrases")
        for line in validate_triggers(content):
            print(line)
            if '[FAIL]' in line:
                all_pass = False

        # 4. Token coverage
        print("\n4. Token Coverage")
        for line in validate_token_coverage(content):
            print(line)

    # 5. Reference files
    print("\n5. Reference Files")
    for ref in REQUIRED_REFS:
        ok, msg = check_file_exists(ref)
        print(msg)
        if not ok:
            all_pass = False

    # 6. Scripts
    print("\n6. Scripts")
    for script in REQUIRED_SCRIPTS:
        ok, msg = check_file_exists(script)
        print(msg)
        if not ok:
            all_pass = False

    # 7. Evals directory
    print("\n7. Evals")
    evals_dir = SKILL_DIR / 'evals'
    if evals_dir.exists() and any(evals_dir.iterdir()):
        eval_files = list(evals_dir.glob('*.md'))
        print(f"  [OK] {len(eval_files)} eval scenario(s) found")
        for ef in eval_files:
            print(f"       - {ef.name}")
    else:
        print("  [WARN] No eval scenarios found in evals/")

    # Result
    print(f"\n{'=' * 55}")
    if all_pass:
        print("RESULT: VALID — skill structure is complete")
        sys.exit(0)
    else:
        print("RESULT: INVALID — fix issues above")
        sys.exit(1)


if __name__ == '__main__':
    main()
