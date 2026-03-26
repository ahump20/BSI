---
name: warn-anti-sprawl
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(ts|tsx|js|jsx)$
  - field: new_text
    operator: regex_match
    pattern: .+
---

**Anti-sprawl check.** You're creating or editing a file. Before proceeding:

- If this file **replaces** an existing file, delete the old one in the same operation.
- Search before creating — does equivalent logic already exist elsewhere?
- Replace rather than add. Delete the old in the same commit as the new.

BSI convention: the codebase should be better after every session — not bigger, better.
