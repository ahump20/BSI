# Claude Code Operational Modes & Flags

## Contents
- Permission Modes
- Key CLI Flags
- Cowork & Dispatch
- Decision Matrix

## Permission Modes

### Interactive (default)
Standard session. Claude reads files freely, prompts before edits and commands.

```bash
claude
```

**When to use:** Getting started, sensitive work, learning a codebase, first pass at any task.

### Accept Edits (`acceptEdits`)
Auto-approves file edits. Still prompts for shell commands.

```bash
claude --permission-mode acceptEdits
```

**When to use:** Iterating on code you're actively reviewing. You trust the edits but want to approve commands.

### Plan Mode (`plan`)
Read-only exploration and planning. Claude reads files, runs read-only shell commands, asks clarifying questions, writes a plan file — but never edits source code.

```bash
claude --permission-mode plan
```

**When to use:**
- Multi-step features requiring edits across many files
- Exploring unfamiliar codebases before making changes
- Interactive back-and-forth on approach before committing to implementation
- Complex refactors where you want to review the plan first

**Key interactions:**
- `Shift+Tab` cycles through modes during a session
- `Ctrl+G` opens the plan in your default editor for direct editing
- When plan is ready, Claude presents options: approve into auto mode, acceptEdits, or manual review
- `/plan` prefix runs a single request in plan mode without switching the session

### Auto Mode (`auto`)
All actions execute without permission prompts. A background classifier reviews each action for safety before execution.

```bash
claude --enable-auto-mode
```

**Requirements:** Team plan, Claude Sonnet 4.6 or Opus 4.6.

**What the classifier blocks by default:**
- `curl | bash` and executing downloaded scripts
- Sending sensitive data to external endpoints
- Production deploys and migrations
- Mass deletion on cloud storage
- Force push and pushing to main/master
- Granting IAM or repo permissions

**What it allows by default:**
- Local file operations in working directory
- Installing dependencies from existing lock files
- Reading `.env` and sending credentials to matching APIs
- Read-only HTTP requests
- Pushing to current branch or branches Claude created

**Fallback:** If blocked 3 times in a row or 20 total, auto mode pauses and resumes prompting. Approving an action resets counters.

**When to use:** Long-running trusted tasks where prompt fatigue is the bottleneck.

### Bypass Permissions (`bypassPermissions`)
All permission prompts and safety checks disabled. Every tool call executes immediately.

```bash
claude --permission-mode bypassPermissions
# or equivalently:
claude --dangerously-skip-permissions
```

**When to use:** ONLY in isolated containers, VMs, or devcontainers without internet access. No protection against prompt injection or unintended actions.

**CI/script pattern:**
```bash
claude -p "refactor the auth module" --dangerously-skip-permissions
```

### Don't Ask (`dontAsk`)
Auto-denies every tool not explicitly allowed. Only actions matching your `permissions.allow` rules execute. Fully non-interactive.

```bash
claude --permission-mode dontAsk
```

**When to use:** CI pipelines, restricted environments where you pre-define exactly what Claude can do.

## Key CLI Flags

### Execution Mode
| Flag | Purpose | Example |
|------|---------|---------|
| `-p "prompt"` | Headless/print mode — non-interactive, exits after completion | `claude -p "explain auth.ts"` |
| `--output-format text\|json\|stream-json` | Control output format for piping | `claude -p "..." --output-format json` |
| `--permission-mode MODE` | Set permission mode | `claude --permission-mode plan` |
| `--dangerously-skip-permissions` | Alias for `--permission-mode bypassPermissions` | CI/containers only |
| `--enable-auto-mode` | Enable auto mode in the Shift+Tab cycle | Adds auto to mode rotation |
| `--allow-dangerously-skip-permissions` | Adds bypassPermissions to mode cycle without activating it | Compose with other starting modes |

### Model & Thinking
| Flag | Purpose | Example |
|------|---------|---------|
| `--model MODEL` | Override model | `--model claude-opus-4-6` |
| `--effort low\|medium\|high` | Control thinking depth (Opus/Sonnet 4.6) | `--effort high` |
| `ultrathink` | Include in prompt to set effort=high for that turn | Natural language, not a flag |

### Session Management
| Flag | Purpose | Example |
|------|---------|---------|
| `--continue` | Resume most recent session in current directory | `claude --continue` |
| `--resume NAME` | Resume named session or open picker | `claude --resume auth-refactor` |
| `--name NAME` / `-n NAME` | Name the session | `claude -n feature-oauth` |
| `--from-pr NUMBER` | Resume session linked to a PR | `claude --from-pr 123` |
| `--worktree NAME` / `-w NAME` | Create isolated git worktree | `claude -w feature-auth` |

### Context & Tools
| Flag | Purpose | Example |
|------|---------|---------|
| `--add-dir PATH` | Give Claude access to additional directories | `--add-dir ../shared-lib` |
| `--allowedTools TOOLS` | Restrict available tools | `--allowedTools "Read,Glob,Grep"` |
| `--append-system-prompt TEXT` | Add to system prompt (every invocation) | Scripts/automation |
| `--system-prompt TEXT` | Replace system prompt entirely | Advanced use |

### Budget & Limits
| Flag | Purpose | Example |
|------|---------|---------|
| `--max-turns N` | Limit conversation turns | `--max-turns 10` |
| `--max-budget-usd N` | Set spending limit | `--max-budget-usd 5.00` |

## Cowork & Dispatch

### Cowork
Autonomous coding companion running alongside your work. Claude operates in its own session, executing tasks independently.

**Prompt requirements for Cowork:**
- Entirely self-contained — Claude cannot ask clarifying questions
- Explicit file paths and directories
- Clear success criteria (what "done" looks like)
- Scope boundaries (what NOT to touch)
- Verification commands Claude can run to confirm

**Example Cowork prompt:**
```
Add comprehensive error handling to all API route handlers in workers/handlers/.
For each handler:
1. Wrap the main logic in try/catch
2. Return structured error responses: { error: string, status: number, meta: { source, fetched_at } }
3. Log errors to console.error with handler name prefix
4. Preserve existing behavior for success paths

Do not modify: workers/shared/, tests/, or any non-handler files.
Verification: Run `npm run typecheck:workers` — zero errors.
```

### Dispatch
Fire-and-forget task from phone, browser, or CLI. Session created remotely on Anthropic infrastructure.

**Prompt requirements for Dispatch:**
- Even more self-contained than Cowork — Claude starts cold
- Include repository context (which repo, which branch)
- Include environment prerequisites
- Explicit completion criteria
- What to do with results (commit, PR, save to file)

**Example Dispatch prompt:**
```
In the BSI repo (main branch), update all satellite worker wrangler.toml
files to use compatibility_date = "2026-03-15". Files are in workers/*/wrangler.toml.
After updating, run `npm run typecheck:workers` to verify no type errors.
Commit with message "chore(workers): bump compatibility_date to 2026-03-15".
Do not push — leave the commit local.
```

### Scheduled Tasks
Prompts that run on a cron schedule. Must be fully autonomous.

**Key principle:** The task runs without human interaction. Be explicit about what success looks like and what to do with results.

```
Review open PRs labeled `needs-review`. Leave inline comments on any issues.
Post a summary of findings to the PR description. If no issues found, approve the PR.
```

## Decision Matrix

| Task Type | Recommended Mode | Key Flags | Notes |
|-----------|-----------------|-----------|-------|
| **Explore codebase** | `plan` | `--effort medium` | Read-only, safe to explore freely |
| **Plan a feature** | `plan` | `--effort high` | Deep reasoning, write plan first |
| **Implement feature** | `acceptEdits` | `--effort high` | Review edits, approve commands |
| **Bug fix (known)** | `acceptEdits` | — | Quick iteration cycle |
| **Bug fix (unknown)** | `plan` → `acceptEdits` | `--effort high` | Plan investigation, then fix |
| **Refactor** | `plan` → `acceptEdits` | `--name refactor-X` | Plan scope first, then execute |
| **Code review** | `plan` | — | Read-only analysis |
| **Long autonomous task** | `auto` | `--effort high` | Reduce prompt fatigue |
| **CI/automation** | `bypassPermissions` | `-p`, `--output-format` | Containers only |
| **Locked-down CI** | `dontAsk` | `--allowedTools` | Pre-approved tools only |
| **Deploy** | `acceptEdits` | — | Review each deploy command |
| **Write tests** | `acceptEdits` | — | Trust file edits, approve test runs |
| **CLAUDE.md updates** | `default` | — | Review each edit carefully |
| **Cowork task** | N/A (autonomous) | — | Self-contained prompt |
| **Dispatch task** | N/A (remote) | — | Fire-and-forget, cold start |
| **Scheduled task** | N/A (cron) | — | Fully autonomous, no interaction |
