---
name: continue
description: >
  Pick up where we left off. Reads the current plan (if any), checks git status
  for uncommitted work, reviews recent context, and autonomously executes the next
  logical batch of work. Honors the "batch of 5" rule. Use when Austin says "continue",
  "keep going", "next", "what's left", "continue with all", "next logical steps",
  or any variant of resuming work in progress.
---

# Continue

## What This Does

Autonomously picks up the next batch of work without Austin having to re-explain context or type instructions. One word — "continue" — and the session resumes.

## Sequence

### 1. Orient (what's the state of things?)

- Read any active plan file in `~/.claude/plans/` or the conversation history
- Run `git status` to see uncommitted changes, staged work, current branch
- Check `git log --oneline -5` for recent commits (what just shipped?)
- Read MEMORY.md for any relevant stored context about current work

### 2. Assess (what needs doing?)

- If a plan exists with numbered steps, identify which steps are complete (via git log, file existence) and which remain
- If no plan exists, infer the next logical work from:
  - Uncommitted changes that need finishing
  - Recent conversation context
  - Known issues or TODOs from the last session
- If truly nothing is pending, say so plainly: "Everything from the last session is shipped. What's next?"

### 3. Execute (batch of 5)

- Select the next 5 highest-impact items from the remaining work
- Execute all 5 autonomously
- Make technical decisions without asking — only surface genuine product/UX choices
- Deploy if the work is deploy-ready (invoke the deploy-all skill)

### 4. Report

- Summarize what shipped in plain English
- What does the visitor/user see now that's different?
- What's the next batch after this one?
- No file paths, function names, or engineering jargon

## Rules

- **Batch of 5.** Always. Not 1, not 3, not 12. Five items, then report.
- **Autonomous technical decisions.** Don't ask Austin which approach to use. Pick the best one.
- **Product language only.** Report what changed for the user, not what changed in the code.
- **Deploy when ready.** If the batch produces deployable work, deploy it before reporting.
- **If stuck:** State what's blocking and what decision is needed from Austin. Don't spin.

## Edge Cases

- **Multiple plans exist:** Pick the most recently modified one. If ambiguous, ask which to continue.
- **Work is half-done from a crashed session:** Check git stash and uncommitted changes. Resume from there.
- **Nothing to continue:** Say so. Don't manufacture work.
