---
name: fullstack-engineer
description: |
  Use when the work crosses two or more layers — UI, API routes, Workers, data
  stores, caches, or infrastructure bindings — or when a symptom appears in one
  layer but the cause likely lives in another. Especially at boundaries where
  contract drift, null handling, or timing assumptions break silently.
  Triggers: "build", "fix", "debug", "implement", "wire up", "not working",
  "500 error", "add a feature", "trace this through", "end to end",
  "frontend to backend", "cross-stack bug", "refactor", "style this page",
  "explain this code", "walk me through", "how does this work", "review this
  change across layers", "API and UI", "request to database".
  Not for: isolated visual redesign (frontend-design), diff-only review
  (code-review), deploy-only tasks (deploy-all), editorial content
  (bsi-editorial-voice), game development (game-dev-master), skill creation
  (skill-creator).
---

# /fullstack-engineer — Own the Seams

Use this skill when the work materially crosses layers or when the symptom shows up in one layer and the cause likely lives in another. Two or more of these in play: browser state, API route, service logic, cache, SQL, external provider, deployment binding.

Defer to narrower skills when the task collapses to one lane (isolated visual polish, diff-only PR review, single-subsystem feature work, platform lookup).

## Default Workflow

```text
- [ ] Identify the user-visible entry point and the last trusted layer
- [ ] List every boundary the request crosses
- [ ] Confirm the contract at each boundary
- [ ] Choose the smallest end-to-end slice that leaves the system working
- [ ] Verify from trigger to render, not just by reading code
```

## 1. Map the Stack

Build a boundary map before editing:

1. User action or caller
2. Client state and request construction
3. Route or Worker entry point
4. Service or transformation layer
5. Data access, cache, or upstream service
6. Response contract
7. Final render or downstream consumer

For each layer, record: the source of truth, the input shape, the output shape, and the first place the observed behavior diverges from the expected behavior.

If the symptom is vague, start where the user sees it and walk upstream one boundary at a time. Load `references/cross-stack-tracing.md` when the handoff points are unclear or the failure can hide in multiple layers.

## 2. Pick the Lane

### Feature lane

Use when shipping new behavior across layers.

- Read `references/architecture-patterns.md` first.
- Decide placement, contract changes, migration path, and rollback shape before writing code.
- If UI work is part of the same change, load `references/frontend-patterns.md` after the architecture pass, not before.

### Bug Workflow

When Austin reports a bug: write a failing test that reproduces it FIRST. Then fix. Passing test = proof of resolution. No test = no fix.

### Debug lane

Use when behavior is broken or inconsistent across environments.

- Reproduce before changing code.
- Trace one boundary at a time.
- Log actual payloads, response shapes, and timing — not assumptions.
- Load `references/debug-patterns.md` for symptom-specific suspects.
- Check recent changes: the bug exists because something changed.
- For analytics issues, check the dual cron overlap (see `references/bsi-context.md`).

### Review lane

Use when the question is whether a cross-layer change is safe to merge.

- Focus on contract drift, null handling, stale cache paths, auth boundaries, and failure propagation.
- Load `references/review-checklists.md` only for risks that matter to the layers touched by the change.

### Explain lane

Use when the user needs understanding more than code. Follow the cognition lens from global CLAUDE.md — lead with intent before mechanism.

## 3. Gather Context

Before dispatching the agent, pull relevant context based on the detected lane. This pre-flight saves the agent from cold-starting.

### For Feature / Design work:

1. **Search for existing patterns** — Grep the codebase for related files, components, handlers, routes. The agent replaces, not adds — it needs to know what exists.
2. **Check the route map** — If the work touches a page or API endpoint, verify current routing structure.
3. **Load Heritage tokens** — If UI work is involved, load `references/bsi-context.md` for Heritage v2.1 surfaces, colors, typography, and utility classes.
4. **Identify data dependencies** — Which APIs, KV namespaces, D1 tables does this touch? Check existing types and helpers.
5. **Check recent git changes** — `git log --oneline -10` for the affected area.

### For Debug work:

1. **Capture the error** — Stack trace, status code, observed vs expected behavior.
2. **Identify the layer** — Frontend (component/state), API (handler/response), data (KV/D1/external API), or infrastructure (bindings/env)?
3. **Check recent changes** — The bug exists because something changed.
4. **Check dual cron overlap** — If analytics-related, both savant-compute and cbb-analytics write advanced metrics.

### For Review work:

1. **Identify the diff** — Unstaged, staged, or PR.
2. **Map the blast radius** — Which layers does the change touch?
3. **Load conventions** — BSI naming conventions, commit format, Heritage tokens, TypeScript standards.

### For Explain work:

Minimal pre-flight. Read the files in question. Trace execution paths and name mechanisms.

## 4. Implement Contract-First

- Change both sides of a contract in the same pass whenever possible.
- Prefer shared types or a single documented schema at each boundary.
- Preserve a graceful fallback if a migration cannot be atomic.
- Fix the visible symptom and the underlying contract break together.
- Delete replaced code in the same change.
- Avoid backend-only fixes that leave UI state, cache invalidation, or error handling broken.

For BSI repos: follow project CLAUDE.md constraints (static export, Heritage tokens, data attribution).

## 5. Verify End to End

Match verification to the boundary you changed:

- **Feature:** exercise the happy path and one failure path through the real caller.
- **Bug fix:** reproduce before, prove after, run the narrowest useful regression checks.
- **Contract change:** inspect the produced request or response shape and the rendered or downstream consumer.
- **Environment issue:** compare local and production bindings, secrets, timeouts, and permissions.

Do not treat compilation or a single unit test as proof of a cross-stack fix. If only one side was verified, say so explicitly.

## 6. Dispatch

Launch the `fullstack-engineer` agent via the Agent tool with:

1. The detected lane(s) — so the agent knows which protocol to follow
2. The gathered context — file paths, patterns found, data dependencies, error details
3. The user's original request — verbatim
4. Any relevant constraints — static export, Heritage tokens, data source hierarchy, KV TTL rules

The agent operates autonomously from here. It will:
- Make architecture decisions without asking (unless genuinely ambiguous product/UX choices)
- Write production code with explicit types, no placeholders, no `any`
- Delete what it replaces in the same commit
- Apply Heritage v2.1 tokens for all UI work
- Follow the debug crime-scene protocol for bugs
- Run the five-pass review for code review requests
- Report outcomes in plain language — what shipped, what changed, what the visitor sees

## Peer Skill Routing

| Request | Use Instead |
|---------|-------------|
| "Deploy to production" | `/deploy-all` |
| "Build a browser game" | `game-dev-master` |
| "Write a recap" / editorial content | `/bsi-editorial-voice` or `/bsi-weekly-recap` |
| "Create a skill" / "build a plugin" | `skill-creator` or `plugin-dev` |
| "Check Cloudflare health" | `/cloudflare-ops-health` |
| Frontend-only design work (no backend) | `/frontend-design` |
| Diff-only PR review (single layer) | `/code-review` or `review-pr` |

## Resources

- `references/architecture-patterns.md` — placement, module splits, contract ownership, cache strategy
- `references/cross-stack-tracing.md` — boundary checklist, common boundary bugs, tracing methodology
- `references/debug-patterns.md` — language-specific bug tables, domain-specific suspects
- `references/frontend-patterns.md` — typography, color, layout, animation, accessibility
- `references/review-checklists.md` — multi-language correctness, security, performance checklists
- `references/bsi-context.md` — Heritage v2.1 tokens, BSI infra map, data sources, deploy gotchas, naming conventions

## Reporting

Lead with the shipped outcome or the confirmed failure. Then state the root cause, the boundary that broke, and the proof that the system now behaves as expected. Report in product terms — what the visitor sees, not what files changed. Mention file paths only when asked.
