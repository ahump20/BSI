# Migration Log — BlazeSportsIntel Pivot

## Purpose
Track removals, ports, refactors, and deprecations as we pivot to Diamond Insights.

## Definitions
KEEP: no changes
PORT: move into new design system w/ minimal refactor
REFACTOR: rewrite to meet new IA/perf/a11y
DELETE: archive only, add 301 if user-facing

## Entries
- 2025-10-13: Archived legacy site (routes.json, screenshots); decision log captured.
- 2025-10-13: Removed soccer and non-college content (DELETE).
- 2025-10-13: Legacy Card & Tabs components (PORT → packages/ui).
