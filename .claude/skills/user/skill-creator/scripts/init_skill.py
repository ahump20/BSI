#!/usr/bin/env python3
"""
Skill Initializer v3 - Creates a new skill from archetype template

Usage:
    init_skill.py <skill-name> --path <path> [--type <archetype>]

Archetypes: workflow, reference, capability, mcp-enhanced
Default: capability
"""

import sys
import re
from pathlib import Path

ARCHETYPES = {
    "workflow": {
        "desc": "Sequential processes with clear steps",
        "dirs": ["scripts"],
        "template": '''---
name: {name}
description: |
  [Third-person capability statement.]
  Use when: (1) [trigger], (2) [trigger], (3) [trigger].
  Triggers: "[phrase]", "[phrase]", "[phrase]".
  Not for: [adjacent task].
---

# {title}

[1-2 sentences: what this skill enables]

## Workflow

Copy this checklist and track progress:

```
Task Progress:
- [ ] Step 1: [operation]
- [ ] Step 2: [operation]
- [ ] Step 3: [operation]
- [ ] Step 4: Verify output
```

### Step 1: [Operation]

Run: `python scripts/step1.py <input>`

Output: [describe expected output]

If this fails: [recovery path]

### Step 2: [Operation]

[Instructions]

### Step 3: [Operation]

[Instructions]

### Step 4: Verify

Run: `python scripts/verify.py <output>`

If verification fails, return to Step 2.

## Resources

- `scripts/` — Executable scripts for each workflow step
'''
    },
    "reference": {
        "desc": "Standards, specifications, domain knowledge",
        "dirs": ["references"],
        "template": '''---
name: {name}
description: |
  [Third-person capability statement.]
  Use when: (1) [trigger], (2) [trigger], (3) [trigger].
  Triggers: "[phrase]", "[phrase]", "[phrase]".
  Not for: [adjacent task].
---

# {title}

[1-2 sentences: what domain knowledge this provides]

## Quick Reference

[Most-used information, immediately accessible]

## Detailed References

**[Domain A]**: See [references/domain-a.md](references/domain-a.md)
**[Domain B]**: See [references/domain-b.md](references/domain-b.md)

## Resources

- `references/` — Detailed documentation loaded on demand
'''
    },
    "capability": {
        "desc": "Integrated system with multiple features",
        "dirs": ["scripts", "references"],
        "template": '''---
name: {name}
description: |
  [Third-person capability statement.]
  Use when: (1) [trigger], (2) [trigger], (3) [trigger].
  Triggers: "[phrase]", "[phrase]", "[phrase]".
  Not for: [adjacent task].
---

# {title}

[1-2 sentences: what this skill enables]

## Quick Start

[Most common operation with example]

```bash
python scripts/main.py <input>
```

## Operations

### [Operation 1]

[Instructions — when to use, how to execute, expected output]

### [Operation 2]

[Instructions]

## Advanced

For detailed procedures: See [references/advanced.md](references/advanced.md)

## Resources

- `scripts/` — Executable scripts for common operations
- `references/` — Detailed documentation loaded on demand
'''
    },
    "mcp-enhanced": {
        "desc": "Skill that wraps/enhances MCP server tools",
        "dirs": ["references"],
        "template": '''---
name: {name}
description: |
  Enhances [MCP Server] with [specific workflow capability].
  Use when: (1) [trigger], (2) [trigger], (3) [trigger].
  Triggers: "[phrase]", "[phrase]", "[phrase]".
  Requires: [MCP Server Name] connected.
  Not for: [adjacent task].
---

# {title}

Enhances [MCP Server] tools with [domain-specific workflow].

## Prerequisites

Requires the **[ServerName]** MCP server to be connected.

## Workflow

### Step 1: [Setup]

Use the `ServerName:setup_tool` to initialize.

### Step 2: [Core Operation]

Use the `ServerName:core_tool` with these parameters:
- `param1`: [guidance]
- `param2`: [guidance]

### Step 3: [Verify]

[Verification instructions]

## Tool Reference

| Tool | When to Use |
|------|-------------|
| `ServerName:tool_a` | [context] |
| `ServerName:tool_b` | [context] |

## Advanced

For edge cases: See [references/edge-cases.md](references/edge-cases.md)
'''
    }
}


def title_case(name: str) -> str:
    return ' '.join(w.capitalize() for w in name.split('-'))


def init_skill(skill_name: str, path: str, archetype: str = "capability") -> Path:
    skill_dir = Path(path).resolve() / skill_name

    if skill_dir.exists():
        print(f"Error: Directory already exists: {skill_dir}")
        return None

    arch = ARCHETYPES.get(archetype)
    if not arch:
        print(f"Error: Unknown archetype '{archetype}'. Options: {', '.join(ARCHETYPES.keys())}")
        return None

    try:
        skill_dir.mkdir(parents=True)
    except Exception as e:
        print(f"Error creating directory: {e}")
        return None

    title = title_case(skill_name)

    # Create SKILL.md
    content = arch["template"].format(name=skill_name, title=title)
    (skill_dir / 'SKILL.md').write_text(content)
    print(f"  Created: SKILL.md ({archetype} archetype)")

    # Create directories
    for d in arch["dirs"]:
        (skill_dir / d).mkdir(exist_ok=True)
        (skill_dir / d / '.gitkeep').write_text('')
        print(f"  Created: {d}/")

    # Create assets/ always
    (skill_dir / 'assets').mkdir(exist_ok=True)
    (skill_dir / 'assets' / '.gitkeep').write_text('')

    # Create starter reference if reference-based
    if "references" in arch["dirs"]:
        ref_path = skill_dir / 'references' / 'reference.md'
        ref_path.write_text(f'# {title} Reference\n\n[Detailed documentation loaded on-demand.]\n')
        print(f"  Created: references/reference.md")

    print(f"\nSkill '{skill_name}' initialized at {skill_dir}")
    print(f"Archetype: {archetype} — {arch['desc']}")
    print("\nNext steps:")
    print("1. Write the description (trigger engineering)")
    print("2. Build resources (scripts/, references/) before SKILL.md body")
    print("3. Create 3-5 evaluation scenarios")
    print("4. Run audit_skill.py to check quality")
    print("5. Run score_description.py to check trigger effectiveness")
    print("6. Run package_skill.py when ready")

    return skill_dir


def main():
    args = sys.argv[1:]
    if len(args) < 3 or '--path' not in args:
        print("Usage: init_skill.py <skill-name> --path <path> [--type <archetype>]")
        print(f"\nArchetypes: {', '.join(ARCHETYPES.keys())} (default: capability)")
        for k, v in ARCHETYPES.items():
            print(f"  {k}: {v['desc']}")
        sys.exit(1)

    skill_name = args[0]
    path_idx = args.index('--path') + 1
    path = args[path_idx]

    archetype = "capability"
    if '--type' in args:
        type_idx = args.index('--type') + 1
        if type_idx < len(args):
            archetype = args[type_idx]

    # Validate name
    if not re.match(r'^[a-z0-9-]+$', skill_name):
        print("Error: Name must be kebab-case (lowercase, digits, hyphens)")
        sys.exit(1)
    if skill_name.startswith('-') or skill_name.endswith('-') or '--' in skill_name:
        print("Error: Name cannot start/end with hyphen or contain '--'")
        sys.exit(1)
    if len(skill_name) > 64:
        print(f"Error: Name too long ({len(skill_name)} chars, max 64)")
        sys.exit(1)
    for reserved in ['anthropic', 'claude']:
        if reserved in skill_name:
            print(f"Error: Name cannot contain reserved word '{reserved}'")
            sys.exit(1)

    print(f"Initializing skill: {skill_name}")
    result = init_skill(skill_name, path, archetype)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
