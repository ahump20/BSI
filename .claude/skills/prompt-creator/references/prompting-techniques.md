# Prompting Techniques for Claude Code

Distilled from Anthropic's official prompting best practices (Claude 4.6 era).

## Contents
- Core Principles
- Structure with XML Tags
- Examples and Few-Shot
- Role and System Prompts
- Output Control
- Thinking and Effort
- Agentic Patterns
- Ready-to-Use Prompt Blocks

## Core Principles

### Be Clear and Direct
Claude responds well to explicit instructions. Specificity beats cleverness.

**Golden rule:** Show your prompt to a colleague with minimal context. If they'd be confused, Claude will be too.

- Specify desired output format and constraints
- Use numbered lists when order matters
- Add modifiers for quality: "Include as many relevant features as possible. Go beyond the basics."

### Add Context (Why, Not Just What)
Explaining motivation helps Claude make better judgment calls.

```
# Weak
NEVER use ellipses

# Strong
Your response will be read aloud by a text-to-speech engine, so never use
ellipses since the engine won't know how to pronounce them.
```

Claude generalizes from the explanation — one motivated instruction covers more cases than ten unmotivated rules.

### Positive Over Negative Framing
Tell Claude what TO do, not what NOT to do.

```
# Weak
Do not use markdown in your response

# Strong
Your response should be composed of smoothly flowing prose paragraphs.
```

## Structure with XML Tags

XML tags help Claude parse complex prompts unambiguously. Use when mixing instructions, context, examples, and variable inputs.

```xml
<context>
Background information Claude needs to understand the task.
</context>

<instructions>
Step-by-step instructions for what to do.
</instructions>

<constraints>
Boundaries, scope limits, things to avoid.
</constraints>

<examples>
<example>
Input: ...
Output: ...
</example>
</examples>

<verification>
How to confirm the task was done correctly.
</verification>
```

**Best practices:**
- Consistent, descriptive tag names across prompts
- Nest tags for natural hierarchy (`<documents>` → `<document index="1">`)
- Long documents at the top, query at the bottom (up to 30% quality improvement)

## Examples and Few-Shot

3-5 examples dramatically improve accuracy and consistency. Wrap in `<example>` tags.

```xml
<examples>
<example>
Input: Added user login with JWT
Output: feat(auth): implement JWT authentication
</example>
<example>
Input: Fixed date display bug in reports
Output: fix(reports): correct timezone handling in date display
</example>
</examples>
```

**Make examples:**
- **Relevant** — mirror actual use cases
- **Diverse** — cover edge cases, vary enough to avoid unintended patterns
- **Structured** — in `<example>` tags so Claude distinguishes them from instructions

## Role and System Prompts

A single role sentence focuses Claude's behavior:

```
You are a senior backend engineer specializing in Cloudflare Workers and Hono.
```

For `--append-system-prompt` in scripts:
```bash
claude -p "..." --append-system-prompt "You are a security auditor. Flag any credential handling issues."
```

## Output Control

### Format Steering
Match your prompt style to desired output. Removing markdown from the prompt reduces markdown in output.

### Minimize Markdown
```xml
<avoid_excessive_markdown_and_bullet_points>
Write in clear, flowing prose using complete paragraphs. Reserve markdown
for inline code, code blocks, and simple headings. Do not use ordered or
unordered lists unless presenting truly discrete items or user explicitly
requests a list. Incorporate items naturally into sentences.
</avoid_excessive_markdown_and_bullet_points>
```

### XML Format Indicators
```
Write the prose sections in <smoothly_flowing_prose_paragraphs> tags.
```

## Thinking and Effort

### Adaptive Thinking (Claude 4.6)
Claude dynamically allocates thinking based on effort level and query complexity.

| Effort | When to Use |
|--------|-------------|
| `low` | Simple tasks, high-volume, latency-sensitive |
| `medium` | Most applications (Sonnet 4.6 default = high) |
| `high` | Complex reasoning, multi-step planning |
| `ultrathink` | Include word in prompt for one-turn high effort |

### Guide Thinking
```
After receiving tool results, carefully reflect on their quality and
determine optimal next steps before proceeding.
```

### Reduce Overthinking
Claude 4.6 does significantly more upfront exploration than previous models. If excessive:
```
Choose an approach and commit to it. Avoid revisiting decisions unless
you encounter new information that directly contradicts your reasoning.
```

### Self-Check
```
Before you finish, verify your answer against [specific test criteria].
```

## Agentic Patterns

### Proactive Action (Default to Doing)
```xml
<default_to_action>
By default, implement changes rather than only suggesting them. If the user's
intent is unclear, infer the most useful likely action and proceed, using tools
to discover any missing details instead of guessing.
</default_to_action>
```

### Conservative Action (Research First)
```xml
<do_not_act_before_instructions>
Do not jump into implementation unless clearly instructed. Default to providing
information, research, and recommendations rather than taking action. Only proceed
with edits when the user explicitly requests them.
</do_not_act_before_instructions>
```

### Anti-Hallucination
```xml
<investigate_before_answering>
Never speculate about code you have not opened. If the user references a specific
file, you MUST read the file before answering. Investigate and read relevant files
BEFORE answering questions about the codebase. Never make claims about code before
investigating — give grounded, hallucination-free answers.
</investigate_before_answering>
```

### Anti-Overengineering
```xml
<minimal_changes>
Only make changes directly requested or clearly necessary. Keep solutions simple:
- Don't add features, refactor code, or make improvements beyond what was asked
- Don't add docstrings, comments, or type annotations to unchanged code
- Don't add error handling for scenarios that can't happen
- Don't create helpers or abstractions for one-time operations
- Don't design for hypothetical future requirements
</minimal_changes>
```

### Anti-Hard-Coding
```xml
<general_solutions>
Write general-purpose solutions using standard tools. Do not hard-code values
or create solutions that only work for specific test inputs. Implement the actual
logic that solves the problem generally. If the task is unreasonable or tests are
incorrect, inform the user rather than working around them.
</general_solutions>
```

### Parallel Tool Calling
```xml
<use_parallel_tool_calls>
If you intend to call multiple tools and there are no dependencies between them,
make all independent calls in parallel. Prioritize simultaneous execution. However,
if some calls depend on previous results, call them sequentially. Never use
placeholders or guess missing parameters.
</use_parallel_tool_calls>
```

### Context Window Management
```xml
<context_management>
Your context window will be automatically compacted as it approaches its limit,
allowing you to continue working indefinitely. Do not stop tasks early due to
token budget concerns. Save progress and state before context refreshes. Be as
persistent and autonomous as possible — complete tasks fully.
</context_management>
```

### Subagent Guidance
```xml
<subagent_usage>
Use subagents when tasks can run in parallel, require isolated context, or involve
independent workstreams. For simple tasks, sequential operations, single-file edits,
or tasks needing shared context across steps, work directly rather than delegating.
</subagent_usage>
```

### Balancing Autonomy and Safety
```xml
<action_safety>
Consider the reversibility and impact of your actions. Take local, reversible
actions freely (editing files, running tests). For actions that are hard to reverse,
affect shared systems, or could be destructive, ask before proceeding.

Warrant confirmation: deleting files/branches, force-push, git reset --hard,
commenting on PRs/issues, sending messages, modifying shared infrastructure.
</action_safety>
```

## Ready-to-Use Prompt Blocks

### For CLAUDE.md (Persistent Instructions)
```markdown
## Code Standards
- Run `npm test` before committing
- API handlers live in `src/api/handlers/`
- Use 2-space indentation
- Commit format: `type(scope): description`
```

### For Headless (-p) Scripts
```bash
claude -p "Review all TypeScript files in src/ for unused imports. List each file and the unused imports found. Output as JSON." \
  --output-format json \
  --permission-mode acceptEdits
```

### For Verification Blocks
```xml
<verification>
1. Run `npm test` — all tests pass
2. Run `npm run typecheck` — zero errors
3. Load http://localhost:3000/scores — real data renders
4. Check browser console — no errors
</verification>
```
