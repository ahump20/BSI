---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
---

# Web Interface Guidelines

Use this skill to review UI work against the latest Web Interface Guidelines instead of relying on stale memory.

## Workflow

1. Fetch the latest guideline source from the URL below.
2. Read the target files or inspect the relevant UI surface in scope.
3. Compare the implementation against the fetched guidance.
4. Lead with concrete findings, ordered by severity and backed by file references when code is involved.

## Guidelines Source

Fetch the current guidance before auditing:

```text
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

## Usage

- When the user names files or a route, fetch the guideline source first and then audit that scope.
- If the user asks for a general UI review, focus on the changed or relevant UI files rather than trying to scan the entire repo blindly.
- If the scope is unclear, ask which files, route, or changed UI surface should be reviewed.
