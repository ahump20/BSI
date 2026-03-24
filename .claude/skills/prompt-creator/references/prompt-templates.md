# Prompt Templates by Task Type

Copy-paste-ready templates. Each includes the prompt, recommended mode, flags, and verification.

## Contents
- Feature Implementation
- Bug Fix
- Refactor
- Code Review
- Research / Exploration
- CI / Automation (Headless)
- Migration
- Deploy
- CLAUDE.md Writing
- Cowork Task
- Dispatch Task
- Scheduled Task

---

## Feature Implementation

**Mode:** `plan` first, then `acceptEdits`
**Flags:** `--permission-mode plan --effort high`

```
I need to implement [FEATURE DESCRIPTION].

<context>
[Why this feature exists. What user problem it solves. Any constraints
from the existing architecture.]
</context>

<constraints>
- Only modify files in [DIRECTORIES]
- Preserve existing test coverage
- Follow the project's existing patterns for [RELEVANT PATTERN]
- Do not add new dependencies without checking package.json first
</constraints>

<instructions>
1. Read the existing implementation in [KEY FILES]
2. [STEP 2]
3. [STEP 3]
4. Write tests covering the new behavior
5. Run the test suite to confirm nothing broke
</instructions>

<verification>
- Run `[TEST COMMAND]` — all tests pass
- [VISUAL CHECK if applicable]
- [API CHECK if applicable]
</verification>
```

---

## Bug Fix

**Mode:** `acceptEdits`
**Flags:** default

```
Fix: [ONE-SENTENCE DESCRIPTION OF THE BUG]

<context>
Reproduction: [EXACT STEPS OR COMMAND]
Expected: [WHAT SHOULD HAPPEN]
Actual: [WHAT HAPPENS INSTEAD]
Error: [ERROR MESSAGE OR STACK TRACE if available]
</context>

<instructions>
1. Read the relevant code in [FILE/AREA]
2. Identify the root cause
3. Write a failing test that reproduces the bug
4. Fix the bug with the smallest viable change
5. Confirm the test now passes
6. Run the full test suite to check for regressions
</instructions>

<verification>
- The reproducing test passes
- `[TEST COMMAND]` — all tests pass
- [MANUAL CHECK if applicable]
</verification>
```

---

## Refactor

**Mode:** `plan` first, then `acceptEdits`
**Flags:** `--permission-mode plan --name refactor-[SCOPE]`

```
Refactor [WHAT] to [WHY — new pattern, performance, readability].

<constraints>
- Behavior must remain identical — no functional changes
- Only touch files in [SCOPE]
- All existing tests must continue to pass without modification
- If a test needs updating, the refactor changed behavior — stop and flag it
</constraints>

<instructions>
1. Read all files in [SCOPE] to understand current patterns
2. [SPECIFIC REFACTORING STEPS]
3. Run tests after each file change to catch regressions early
</instructions>

<verification>
- `[TEST COMMAND]` — all tests pass
- `[TYPECHECK COMMAND]` — zero errors
- No functional changes — same inputs produce same outputs
</verification>
```

---

## Code Review

**Mode:** `plan`
**Flags:** `--permission-mode plan`

```
Review the changes in [BRANCH/PR/FILES] for:
1. Correctness — does the logic do what it claims?
2. Security — any injection, auth bypass, or data exposure risks?
3. Performance — any unnecessary allocations, N+1 queries, or blocking calls?
4. Style — does it follow the project's conventions?
5. Tests — is the new behavior adequately tested?

For each issue found, provide:
- File and line number
- Severity (critical / major / minor / suggestion)
- What's wrong and why
- Recommended fix

Also note 2-3 things done well.
```

---

## Research / Exploration

**Mode:** `plan`
**Flags:** `--permission-mode plan --effort high`

```
Research: [QUESTION OR AREA TO EXPLORE]

<context>
[Why this research matters. What decision it will inform.]
</context>

<instructions>
1. Search the codebase for [RELEVANT PATTERNS]
2. Read the key files: [FILES if known]
3. Trace the execution path from [ENTRY POINT] to [ENDPOINT]
4. Document what you find in a structured format
</instructions>

Produce:
- Architecture summary (how the pieces connect)
- Key files and their roles
- Current behavior vs. desired behavior (if applicable)
- Recommended approach with tradeoffs
```

---

## CI / Automation (Headless)

**Mode:** `bypassPermissions` (containers only) or `dontAsk`
**Flags:** `-p --output-format text`

```bash
# Lint check
claude -p "Review all TypeScript files in src/ for unused imports. \
List each file and the unused imports found." \
  --permission-mode dontAsk \
  --output-format text

# Security audit
claude -p "Scan the codebase for hardcoded secrets, API keys, or \
credentials in non-.env files. Report file, line, and the pattern found." \
  --permission-mode dontAsk \
  --output-format json

# Dependency check
claude -p "Check package.json for outdated dependencies with known \
security vulnerabilities. List each with severity and recommended version." \
  --permission-mode dontAsk \
  --output-format text
```

---

## Migration

**Mode:** `plan` first, then `acceptEdits` with `--worktree`
**Flags:** `--permission-mode plan --effort high --worktree migration-[NAME]`

```
Migrate [WHAT] from [OLD] to [NEW].

<context>
[Why the migration is happening. Deadline or driver if relevant.]
</context>

<constraints>
- Backward compatibility required for [DURATION]
- Database schema changes must be additive (no drops until cutover)
- Feature flag: [FLAG NAME] controls old vs. new path
- Do not modify [PROTECTED FILES/AREAS]
</constraints>

<instructions>
1. Audit all usages of [OLD PATTERN] across the codebase
2. Implement [NEW PATTERN] alongside existing code
3. Wire feature flag to toggle between paths
4. Update tests to cover both paths
5. Document rollback procedure
</instructions>

<verification>
- All tests pass with flag ON and flag OFF
- `[TYPECHECK]` — zero errors
- Manual test: [SPECIFIC SCENARIO] works under both flags
</verification>
```

---

## Deploy

**Mode:** `acceptEdits`
**Flags:** default

```
Deploy the latest changes to production.

<instructions>
1. Run `[BUILD COMMAND]` — confirm clean build
2. Run `[TEST COMMAND]` — confirm all pass
3. Deploy: `[DEPLOY COMMAND]`
4. Post-deploy verification (see below)
</instructions>

<verification>
- `curl [HEALTH ENDPOINT]` returns 200
- Load [KEY PAGE URL] — real data renders
- Check [MONITORING DASHBOARD] for error spikes
- If errors detected: rollback with `[ROLLBACK COMMAND]`
</verification>
```

---

## CLAUDE.md Writing

**Mode:** `default`
**Flags:** none

```
Write CLAUDE.md instructions for [SCOPE: project / user / specific rule].

<context>
[What the project does. Key architectural decisions. Why these
instructions matter.]
</context>

Target: [./CLAUDE.md | ~/.claude/CLAUDE.md | .claude/rules/FILENAME.md]

Requirements:
- Under 200 lines
- Specific and verifiable (not "format code nicely" — "use 2-space indentation")
- No contradictions with existing instructions
- Include: build commands, test commands, coding conventions, architecture notes
- Exclude: things derivable from reading the code
```

---

## Cowork Task

**Mode:** autonomous (Cowork session)

```
[CLEAR TASK STATEMENT — one sentence]

<context>
Repository: [REPO]
Branch: [BRANCH]
Key files: [LIST]
[Any background needed to understand the task]
</context>

<scope>
Modify: [SPECIFIC FILES/DIRECTORIES]
Do NOT modify: [PROTECTED FILES/DIRECTORIES]
</scope>

<instructions>
1. [STEP 1 with specific file paths]
2. [STEP 2]
3. [STEP 3]
</instructions>

<verification>
Run these commands to confirm success:
- `[COMMAND 1]` — expected: [RESULT]
- `[COMMAND 2]` — expected: [RESULT]
</verification>

<completion>
When done: [commit with message "TYPE(SCOPE): DESCRIPTION" / create PR / save to file]
If blocked: [save progress, document the blocker in a comment]
</completion>
```

---

## Dispatch Task

**Mode:** autonomous (Dispatch — fire and forget, cold start)

```
Task: [ONE-SENTENCE DESCRIPTION]

Repository: [OWNER/REPO], branch: [BRANCH]
Working directory: [PATH if not root]

<context>
[ALL context needed — Claude starts cold with no prior conversation.
Include architectural notes, file locations, API patterns.]
</context>

<instructions>
[NUMBERED STEPS — be exhaustive. Claude cannot ask questions.]
</instructions>

<verification>
[CONCRETE COMMANDS with expected output]
</verification>

<completion>
On success: [commit / PR / save file / push]
On failure: [save partial progress / document blocker]
Budget limit: $[AMOUNT] (optional)
</completion>
```

---

## Scheduled Task

**Mode:** autonomous (cron schedule)

```
[TASK DESCRIPTION — fully self-contained, no clarification possible]

Schedule: [CRON EXPRESSION or natural language]

<instructions>
[WHAT TO DO — every step explicit]
</instructions>

<output>
[WHAT TO DO WITH RESULTS — post to PR, save to file, send notification]
</output>

<failure>
[WHAT TO DO IF SOMETHING GOES WRONG — retry once, then log and stop]
</failure>
```
