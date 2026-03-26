# CIVIC Prompting Framework

Every Claude Code / Cowork prompt should follow this structure. Adapt density to complexity.

## C — Context
What exists now. Current state, files, architecture, prior decisions.

## I — Intent
What you want to achieve and WHY. The visitor-visible outcome.

## V — Verification
How to prove it worked. Specific test commands, URLs, expected output, screenshots.
This is the single highest-leverage element in any prompt.

## I — Imperative
The action. Direct, verb-first instructions. No asking — instructing.

## C — Constraints
What NOT to do. Boundaries, forbidden patterns, scope limits.

## Mode Selection Guide
- Plan mode: architecture decisions, multi-file refactors, migration planning
- Auto mode: routine BSI work (build, deploy, lint, test, commit)
- Normal mode: D1 migrations, production deploys with risk, new Worker creation
- dangerously-skip-permissions: CI/CD headless runs only, never interactive

## Key Prompt Patterns
- "Ultrathink" at the start activates deep reasoning
- Phase gates with commits prevent runaway sessions
- Verification checklists catch false completion claims
- "Save progress to memory before context window compaction" preserves state
