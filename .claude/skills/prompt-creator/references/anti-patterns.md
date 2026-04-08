# Prompt Anti-Patterns

Common failures when writing prompts for Claude Code, and how to fix them.

## Contents
- The Vague Prompt
- The Missing Verification
- The Kitchen Sink Session
- The Over-Specified CLAUDE.md
- The Wrong Mode
- The Missing Context
- The Over-Prompter
- The Assumption Gap
- The Copy-Paste Trap

## The Vague Prompt

**Failure:** "Fix the bugs" / "Make it better" / "Add some tests"

**Why it fails:** Claude has to guess what you mean. It might fix the wrong bugs, improve the wrong thing, or write tests for code that doesn't need them.

**Fix:** Name the specific outcome.
```
# Bad
Fix the auth bugs

# Good
Fix: login endpoint returns 500 when email contains a plus sign.
Reproduce: POST /api/auth/login with body {"email": "user+tag@example.com"}
Expected: 200 with JWT token
Actual: 500 "invalid email format"
```

## The Missing Verification

**Failure:** Prompt ends with instructions but no way to confirm success.

**Why it fails:** Claude declares victory at "build passed" or "deploy succeeded" without checking if the user-visible result is correct. This is Root Cause #2 and #3 from the BSI accountability audit.

**Fix:** Every prompt ends with a `<verification>` block containing concrete, automatable checks.
```
# Bad
Implement the standings page.

# Good
Implement the standings page.
<verification>
- Run `npm run build` — zero errors
- Load http://localhost:3000/standings — table renders with real team names
- No skeleton/loading UI visible after 3 seconds
- Source attribution shows "Last updated: [timestamp]"
</verification>
```

## The Kitchen Sink Session

**Failure:** One session tries to fix bugs, add features, refactor, and deploy.

**Why it fails:** Context accumulates, Claude loses track of what's done vs. what's next, and regressions sneak in as unrelated changes interfere.

**Fix:** One task per session. Use `/clear` between tasks, or start new sessions. Name sessions (`-n`) for easy resumption.

## The Over-Specified CLAUDE.md

**Failure:** CLAUDE.md is 500+ lines with every possible instruction.

**Why it fails:** Token bloat reduces adherence. Instructions compete with each other. Claude picks favorites and ignores the rest.

**Fix:** Keep CLAUDE.md under 200 lines. Move detailed content to `.claude/rules/` with path-specific frontmatter so rules only load when relevant.

## The Wrong Mode

**Failure:** Using `bypassPermissions` for interactive work, or `default` mode for a 2-hour refactor.

**Why it fails:**
- `bypassPermissions` in interactive sessions = no safety net
- `default` mode for long tasks = constant prompt fatigue interrupting flow
- `plan` mode when you want edits = frustration

**Fix:** Use the decision matrix from `references/claude-code-modes.md`:
- Exploring? → `plan`
- Iterating on code? → `acceptEdits`
- Long trusted task? → `auto`
- CI pipeline? → `bypassPermissions` or `dontAsk`

## The Missing Context

**Failure:** "Update the API handler" without saying which one or why.

**Why it fails:** Claude reads the wrong file, makes changes that conflict with the project's patterns, or solves the wrong problem.

**Fix:** Include `@file` references, paste error output, or provide architectural context.
```
# Bad
Update the standings handler

# Good
Update the MLB standings handler at @workers/handlers/mlb-standings.ts.
Currently it fetches from ESPN but we need to switch to SportsDataIO
because ESPN's endpoint is rate-limited. The SportsDataIO pattern is
already implemented in @workers/handlers/nfl-standings.ts — follow
that same approach.
```

## The Over-Prompter

**Failure:** "You MUST ALWAYS use this tool EVERY TIME without exception. CRITICAL: NEVER skip this step."

**Why it fails:** Claude 4.6 is significantly more proactive than older models. Aggressive language that was needed for Claude 3.5 now causes over-triggering — Claude uses tools excessively, spawns unnecessary subagents, or over-investigates simple questions.

**Fix:** Use normal, clear language. Trust Claude to follow reasonable instructions.
```
# Bad (Claude 3.5 era)
CRITICAL: You MUST ALWAYS read the file before editing. NEVER skip this step.
If in doubt, ALWAYS use the search tool.

# Good (Claude 4.6 era)
Read files before editing them. Use search when you need to find something.
```

## The Assumption Gap

**Failure:** Prompt assumes Claude knows project-specific context it doesn't have.

**Why it fails:** Each session starts fresh. Claude doesn't remember that "the widget" means the score ticker, or that "the usual deploy" means `npm run deploy:all`.

**Fix:** For persistent context, put it in CLAUDE.md. For one-off context, include it in the prompt. For Cowork/Dispatch, include everything — Claude starts completely cold.

## The Copy-Paste Trap

**Failure:** Reusing the same prompt template for every task without adapting it.

**Why it fails:** A feature implementation prompt doesn't work for a bug fix. A deploy prompt doesn't work for research. The structure shapes Claude's approach.

**Fix:** Match the template to the task type. Use the templates in `references/prompt-templates.md` as starting points, then customize for your specific situation.

## Quick Diagnostic

| Symptom | Likely Anti-Pattern | Fix |
|---------|-------------------|-----|
| Claude does the wrong thing | Vague Prompt or Missing Context | Be specific, include file paths |
| Claude says "done" but it's not working | Missing Verification | Add `<verification>` block |
| Session gets confused | Kitchen Sink | One task per session |
| Claude ignores CLAUDE.md rules | Over-Specified CLAUDE.md | Prune to <200 lines |
| Too many permission prompts | Wrong Mode | Switch to `acceptEdits` or `auto` |
| Claude over-investigates simple questions | Over-Prompter | Dial back aggressive language |
| Claude misunderstands project patterns | Assumption Gap | Add context or update CLAUDE.md |
| All prompts produce similar results | Copy-Paste Trap | Use task-specific templates |
