---
name: prompt-creator
description: |
  Generates optimized, copy-paste-ready prompts for Claude Code, Cowork, and Dispatch.
  Analyzes the user's task, selects the optimal operational mode and CLI flags, structures
  the prompt using Anthropic's official best practices, and outputs verbatim text ready
  to paste into the target destination.

  Use when: (1) user asks to create, write, or craft a prompt for Claude Code, (2) user
  needs a prompt for Cowork, Dispatch, or headless (-p) mode, (3) user wants to optimize
  an existing prompt, (4) user asks what flags or mode to use for a task, (5) user needs
  to write CLAUDE.md instructions, skill descriptions, or agent system prompts.

  Triggers: "create a prompt", "write a prompt", "craft a prompt", "optimize my prompt",
  "prompt for dispatch", "prompt for cowork", "write instructions for Claude",
  "build a system prompt", "what flags should I use", "plan mode prompt",
  "dangerously-skip-permissions", "headless prompt", "write a -p command",
  "CLAUDE.md instructions", "skill description", "agent prompt".

  Not for: general conversation with Claude (just talk), editing existing code (use
  appropriate coding skills), running prompts (this skill writes them, not executes them).
---

# Prompt Creator

Generate optimized, verbatim prompts for any Claude Code destination.

## Intake Protocol

Before generating any prompt, gather these five inputs. Use AskUserQuestion for anything unclear.

### 1. Task Definition
What does the prompt need to accomplish? Get the specific outcome, not a category.
- Bad: "a coding prompt" — Good: "refactor the auth module to use OAuth2"
- Bad: "fix bugs" — Good: "find and fix the null pointer in UserService.getProfile()"

### 2. Destination
Where will this prompt be used?

| Destination | Output Format |
|-------------|---------------|
| **Interactive session** | Plain text to paste into Claude Code |
| **Headless (`-p`)** | Full `claude -p "..." --flags` CLI command |
| **Cowork** | Task description optimized for autonomous execution |
| **Dispatch** | Self-contained task with explicit success criteria |
| **CLAUDE.md** | Markdown with headers, scoped to project/user/org |
| **Skill** | YAML frontmatter + markdown body |
| **Agent** | Frontmatter + system prompt |
| **Hook** | Command or prompt-based hook configuration |
| **Scheduled task** | Autonomous prompt with no clarification opportunity |

### 3. Permission Level
What level of autonomy?

Consult `references/claude-code-modes.md` for the decision matrix. Default recommendation:
- Exploring/planning → `plan`
- Iterating on code with review → `acceptEdits`
- Long-running trusted tasks → `auto` (Team plan required)
- CI/scripts/containers → `bypassPermissions`
- Locked-down environments → `dontAsk`

### 4. Verification Criteria
How will success be confirmed? Every prompt MUST include verification. Examples:
- "Run `npm test` and confirm all pass"
- "Load the page at /scores and confirm real data renders"
- "curl the endpoint and verify JSON response includes `meta.source`"

### 5. Persistence
Is this a one-shot prompt or a persistent instruction?
- One-shot → interactive/headless/cowork/dispatch
- Persistent → CLAUDE.md, skill, agent, hook, or `.claude/rules/`

## Prompt Architecture

Every generated prompt follows this four-block structure. Blocks can be implicit for simple prompts but must be explicit for complex ones.

### Block 1: Context (What + Why)
State the task and its motivation. Provide enough background that Claude can make good judgment calls without asking.

```
<context>
We're migrating the auth system from session-based to OAuth2 because
the current approach doesn't support SSO, which enterprise customers require.
The migration must be backward-compatible for 30 days.
</context>
```

### Block 2: Constraints (Scope + Don'ts)
Define boundaries. What's in scope, what's explicitly out.

```
<constraints>
- Only modify files in src/auth/ and src/middleware/
- Do not change the database schema — use the existing sessions table
- Preserve all existing test coverage
- Do not add new dependencies without checking package.json first
</constraints>
```

### Block 3: Instructions (Steps + Approach)
The actual work to be done. Use numbered steps for sequential work, bullets for parallel.

```
<instructions>
1. Read the current auth middleware in src/middleware/auth.ts
2. Implement OAuth2 authorization code flow alongside existing session auth
3. Add feature flag to toggle between auth methods
4. Update all route handlers that check authentication
5. Write integration tests for the new OAuth2 flow
</instructions>
```

### Block 4: Verification (How to Confirm)
Concrete, automatable checks. Never "make sure it works" — always specific commands or observations.

```
<verification>
- Run `npm test` — all tests pass including new OAuth2 tests
- Start dev server, navigate to /login — OAuth2 option appears
- Complete OAuth2 flow — redirects to dashboard with valid session
- Existing session-based login still works when feature flag is off
</verification>
```

## Destination-Specific Formatting

### Interactive Session
Output plain text. Include the prompt and a "Recommended setup" block:

~~~
**Prompt:**
```
[verbatim prompt text here]
```

**Recommended setup:**
- Mode: `plan` (explore first, then switch to `acceptEdits`)
- Effort: default
- Prerequisites: none
~~~

### Headless (`-p`)
Output the full CLI command:

~~~
**Command:**
```bash
claude -p "[prompt text]" \
  --permission-mode acceptEdits \
  --model claude-opus-4-6 \
  --output-format text
```

**Notes:** [any caveats about the command]
~~~

### Cowork / Dispatch
Optimize for autonomous execution. The prompt must be entirely self-contained — Claude cannot ask clarifying questions.

~~~
**Task prompt:**
```
[Self-contained task description with all context inline.
Explicit success criteria. No ambiguity.
Include file paths, expected behaviors, and verification steps.]
```

**Mode:** Cowork (or Dispatch)
**Estimated scope:** [small/medium/large]
**Prerequisites:** [MCP servers, env vars, etc.]
~~~

### CLAUDE.md
Output markdown ready to paste into the appropriate CLAUDE.md file:

~~~
**Add to:** `[./CLAUDE.md | ~/.claude/CLAUDE.md | .claude/rules/filename.md]`

```markdown
[markdown content with headers and bullets]
```

**Scope:** [project | user | org | path-specific rule]
~~~

### Skill / Agent
Output the complete file content:

~~~
**File:** `.claude/skills/[name]/SKILL.md` (or `.claude/agents/[name].md`)

```markdown
---
[frontmatter]
---

[body content]
```
~~~

## Prompt Optimization Checklist

Before outputting any prompt, verify against these criteria (from Anthropic's official guidance):

- [ ] **Clear and direct** — would a colleague understand this without extra context?
- [ ] **Context included** — motivation/why provided, not just instructions
- [ ] **Specific over vague** — concrete file paths, commands, outcomes instead of generalities
- [ ] **Positive framing** — tells what TO do, not just what NOT to do
- [ ] **Verification included** — concrete way to confirm success
- [ ] **Right mode selected** — matches the task's autonomy needs (see decision matrix)
- [ ] **No over-prompting** — Claude 4.6 is proactive; avoid aggressive "MUST use" language
- [ ] **XML tags for structure** — used when mixing instructions, context, and examples
- [ ] **Examples included** — if the output format matters, show 1-2 examples
- [ ] **Self-contained** — for async destinations (Cowork/Dispatch/scheduled), no clarification possible

## References

- `references/claude-code-modes.md` — All operational modes, flags, and decision matrix
- `references/prompting-techniques.md` — Anthropic's official best practices distilled
- `references/prompt-templates.md` — Ready-to-use templates by task type
- `references/anti-patterns.md` — Common prompt failures and how to fix them
- `examples/example-outputs.md` — Sample generated prompts
