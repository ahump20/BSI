Ultrathink.

Weekly BSI dream session. Explore the full product landscape and produce one actionable spec.

You are Austin's product intelligence engine. Before generating ideas, gather context. Then dream big — but dream from signal, not vacuum.

## PREFLIGHT

1. Create and switch to chore/weekly-dream-[YYYY-MM-DD] before any file writes
2. If the worktree is not clean, stop without committing

## GATHER CONTEXT (silent — do this before presenting anything)

1. **Prior dreams:** Read `~/.claude/projects/-Users-AustinHumphrey-bsi-repo/memory/dream-journal.md` — note themes, deferred ideas, outcomes. Don't repeat explored ideas unless context changed.
2. **Recent momentum:** Run `git log --oneline -20` to see what shipped recently
3. **Sports calendar:** Check today's date against seasons:
   - College Baseball: Feb–Jun (CWS mid-June)
   - MLB: Apr–Oct (postseason Oct)
   - NFL: Sep–Feb (Super Bowl early Feb)
   - NBA: Oct–Jun (playoffs Apr–Jun)
   - CFB: Sep–Jan (CFP Dec–Jan)
4. **Visitor signals (best-effort):** If PostHog MCP is available, query last 7 days — top 5 pages by views, top 3 by bounce rate. If unavailable, skip gracefully.
5. **Error state (best-effort):** If available, check active bugs. If unavailable, skip.
6. **Durable memory:** Read `~/.claude/memory/` for infrastructure, API routes, Heritage tokens, iOS app status
7. **Project memory:** Read `~/.claude/projects/-Users-AustinHumphrey-bsi-repo/memory/` for recent context

## PRESENT CURRENT SIGNAL (show this before ideas)

```
Recent ships: [from git log]
Active sports seasons: [from calendar check]
Visitor behavior: [from PostHog, or "unavailable"]
Open issues: [from error tracker, or "unavailable"]
Prior dream themes: [from journal]
Deferred ideas still relevant: [from journal]
```

## IDEATION

Generate 3-5 ideas across: coverage expansion, data moats, monetization, distribution, community.

For each:
- **What it is** — one sentence
- **Why now** — what signal makes this timely
- **What it takes** — Cloudflare primitives only
- **First step** — the single concrete action that starts it
- **Ships in:** ≤1 week? ≤1 day? ≤1 session?

Pick the winner based on: leverage for solo founder, builds on existing infrastructure, ships in < 1 week.

No hedging. Austin has Claude Code — that IS the team.

## SELECTION & SPEC

Write a CIVIC-framed spec to docs/superpowers/specs/YYYY-MM-DD-weekly-dream.md:
- **Context:** current codebase state
- **Intent:** what visitors will see
- **Verification:** specific commands/URLs
- **Imperative:** step-by-step
- **Constraints:** what NOT to do

## MEMORY (do this last, silently)

1. Save only the winning idea and durable lessons from evaluation to auto-memory. Do not store rejected brainstorm lists unless they reveal a reusable strategic pattern.
2. Append to dream journal:
```
## YYYY-MM-DD — Weekly Dream
**Signals:** [1-line summary]
**Ideas Generated:**
1. [idea 1]
2. [idea 2]
3. [idea 3]
**Recommended:** [winner]
**Rationale:** [why, 1 sentence]
**Status:** pending
```
3. Commit the spec with message: "dream(weekly): [one-line description of winning idea]"

## OUTPUT

Commit the spec file. Do not push. Do not start implementation.

## FAILURE

If blocked on codebase access or unclear project state, save partial notes to project memory and stop.

## RULES
- Cloudflare-only architecture
- Zero mock data
- Heritage Design System v2.1 for any UI
- Report in product language, not engineering vocabulary
- Data grounds the ideation — it doesn't constrain it
- Austin picks the ideas. You inform, you don't decide.
