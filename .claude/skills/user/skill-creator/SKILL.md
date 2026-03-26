---
name: skill-creator
description: |
  Creates, audits, tests, and iterates on Claude skills with eval-driven development
  and environment-aware workflows. Use when: (1) Creating a skill from scratch,
  (2) Auditing or improving an existing skill, (3) Debugging trigger failures,
  (4) Running evaluations to measure skill performance, (5) Optimizing description
  for better triggering, (6) Reducing context bloat, (7) Packaging for distribution.
  Includes scripts for initialization, validation, auditing, eval, scoring, packaging.
  Triggers: "create a skill", "build a skill", "audit this skill", "improve skill",
  "skill not triggering", "test skill", "optimize description", "package skill",
  "turn this into a skill", "skill creator", "skill eval".
  Not for: MCP server creation (use mcp-builder), general code review.
---

# Skill Creator v3

Skills are onboarding guides that transform Claude from general-purpose to specialist. They provide what no model has: procedural knowledge for specific domains, tested against real usage.

## Core Constraint

**The context window is a public good.** Every token competes with conversation history, other skills, and the user's actual request. Default assumption: Claude is already smart. Only add what Claude doesn't have. Challenge every sentence: "Does this justify its token cost?"

### Token Budgets

| Component | Target | Hard Limit |
|-----------|--------|------------|
| Description (frontmatter) | <150 words | 1024 chars |
| SKILL.md body | <2000 words | 500 lines |
| Any single reference file | <5000 words | — |
| Total skill (all files) | <10000 words | — |

Approaching limits? Split into references that load on-demand.

## Skill Anatomy

```
skill-name/
├── SKILL.md              # Required: frontmatter + instructions
├── scripts/              # Optional: executable code (Python/Bash)
├── references/           # Optional: docs loaded into context when needed
├── agents/               # Optional: subagent instructions (grading, comparison, analysis)
├── eval-viewer/          # Optional: HTML review UI for eval results
└── assets/               # Optional: files used in output (templates, images)
```

### Frontmatter (Required)

```yaml
---
name: kebab-case-name
description: |
  [Third-person, present tense] Processes X files and generates Y.
  Use when user mentions Z or asks for W.
  Triggers: "phrase 1", "phrase 2", "phrase 3".
  Not for: [adjacent task this skill shouldn't handle].
---
```

**Critical rules from official docs:**
- Write descriptions in **third person** ("Processes files" not "I help process files")
- Include both **what** the skill does and **when** to use it
- Include **negative triggers** to prevent false activation
- Name must be lowercase letters, numbers, hyphens only (max 64 chars)
- Name cannot contain "anthropic" or "claude"

See `references/trigger-engineering.md` for patterns and testing methodology.

### Naming Conventions

Anthropic recommends **gerund form** for clarity:
- `processing-pdfs` (preferred) over `pdf-processor`
- `analyzing-spreadsheets` over `spreadsheet-analyzer`
- `managing-databases` over `db-manager`

Noun phrases (`pdf-processing`) and action verbs (`process-pdfs`) are acceptable alternatives. Avoid vague names: `helper`, `utils`, `tools`.

### Degrees of Freedom

Match specificity to task fragility:

| Freedom | When | Style |
|---------|------|-------|
| High | Multiple valid approaches, context-dependent | Prose instructions |
| Medium | Preferred pattern exists, some variation OK | Pseudocode/scripts with params |
| Low | Fragile operations, consistency critical | Specific scripts, few params |

Anthropic's analogy: narrow bridge with cliffs (low freedom) vs. open field (high freedom).

## Creation Process

### 1. Gather Concrete Examples

Before writing anything, collect 3-5 specific examples:
- What would a user say? (include casual, formal, indirect phrasings)
- What files would they provide?
- What output do they expect?

If you can't articulate examples, the skill isn't ready to build.

### 2. Choose an Archetype

Initialize with the right structure for your skill type:

```bash
python scripts/init_skill.py <skill-name> --path <dir> --type <archetype>
```

| Archetype | When to Use | Creates |
|-----------|-------------|---------|
| `workflow` | Sequential processes with clear steps | SKILL.md + scripts/ |
| `reference` | Standards, specifications, domain knowledge | SKILL.md + references/ |
| `capability` | Integrated system with multiple features | SKILL.md + scripts/ + references/ |
| `mcp-enhanced` | Skill that wraps/enhances MCP server tools | SKILL.md + references/ |

### 3. Build Resources First

**Start with scripts and references, not SKILL.md.** SKILL.md should orchestrate what already exists.

**Writing rules:**
- Imperative form ("Extract the text" not "The text is extracted")
- Prefer examples over explanations
- One level of reference depth max (SKILL.md → reference file, never reference → reference)
- For reference files >100 lines, include a table of contents
- No README.md, CHANGELOG.md, or auxiliary docs

**For skills with MCP tools**, use fully qualified tool names:
```markdown
Use the BigQuery:bigquery_schema tool to retrieve table schemas.
```

**For skills with scripts**, be explicit about intent:
```markdown
Execute: `python scripts/analyze.py input.pdf`        # Run it
Reference: See `scripts/analyze.py` for the algorithm  # Read it
```

### 4. Write SKILL.md

See `references/writing-patterns.md` for templates, examples, and output format patterns.

### 5. Create Evaluations

**Build evaluations BEFORE writing extensive documentation.** This is the single most important practice — it ensures your skill solves real problems rather than documenting imagined ones.

Minimum: 3 eval scenarios per skill. Complex skills need 5-10. See `references/schemas.md` for the full JSON schema (including assertions).

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "Realistic user prompt with specific details",
      "expected_behavior": [
        "Verifiable outcome 1",
        "Verifiable outcome 2"
      ],
      "files": []
    }
  ]
}
```

**Eval quality matters more than quantity.** Prompts should be realistic — include file paths, personal context, casual speech, abbreviations. Not: "Extract text from PDF". Instead: "hey can you pull the text out of ~/Downloads/Q4-report-final-v2.pdf and clean up the formatting?"

See `references/eval-workflow.md` for the full test → review → improve loop.

### 5b. Run and Review Evals

For each test case, spawn two subagent runs — one with the skill, one baseline (no skill or previous version). Launch all runs in parallel.

**Grading:** Use `agents/grader.md` to evaluate assertions against outputs. For programmatic assertions, write scripts — faster and reusable across iterations.

**Benchmarking:**
```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
```
Produces `benchmark.json` and `benchmark.md` with pass rates, timing, and token usage.

**Review UI:** Launch the eval viewer to show results to the user:
```bash
python eval-viewer/generate_review.py <workspace>/iteration-N \
  --skill-name "my-skill" \
  --benchmark <workspace>/iteration-N/benchmark.json
```
For iteration 2+, pass `--previous-workspace <workspace>/iteration-<N-1>`. In headless environments, use `--static <output_path>` for a standalone HTML file.

**Advanced comparison:** For rigorous A/B testing between skill versions, see `agents/comparator.md` (blind comparison) and `agents/analyzer.md` (pattern analysis).

### 6. Audit

```bash
python scripts/audit_skill.py <path/to/skill>
```

Checks: token budgets, description quality (trigger coverage, third-person, negative triggers), progressive disclosure, dead references, anti-patterns, official best practices compliance.

See `references/anti-patterns.md` for what the auditor catches.

### 7. Score Description

```bash
python scripts/score_description.py <path/to/skill>
```

Evaluates your description against trigger effectiveness heuristics:
- Contains file types, action verbs, trigger phrases
- Written in third person
- Includes negative triggers
- Appropriate length (50-200 words)
- No vague/abstract language

### 8. Test

Run the eval workflow before packaging. See `references/eval-workflow.md`.

**Environment-aware testing:**

| Environment | Approach |
|-------------|----------|
| Claude Code | Spawn subagents for parallel test runs + baselines |
| Claude.ai | Run tests sequentially, present results inline. Skip baseline runs. |
| Cowork | Subagents available. Use `--static` for eval viewer (no display). |

### 8b. Optimize Description

After skill is stable, optimize the description for trigger accuracy:

```bash
python -m scripts.run_loop \
  --eval-set <trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <current-model-id> \
  --max-iterations 5 --verbose
```

This generates trigger eval queries (mix of should-trigger and should-not-trigger), splits 60/40 train/test, runs each query 3x for reliability, then iteratively improves the description using extended thinking. Use `assets/eval_review.html` to review eval queries with the user before running.

### 9. Package

```bash
python scripts/package_skill.py <path/to/skill> [output-directory]
```

Validates, then creates `.skill` file (zip format).

### 10. Iterate

Skills improve through use. After observing struggles:
1. Identify what's missing or unclear
2. Update resources or SKILL.md
3. Re-audit (`audit_skill.py`) and re-score (`score_description.py`)
4. Re-run affected evals
5. Re-package only after all checks pass

## Progressive Disclosure

Keep SKILL.md lean. Split content when approaching 500 lines.

**Pattern: High-level guide with references**
```markdown
## Form Filling
For basic forms, use fill_form.py directly.
For complex forms with conditional logic: See references/advanced-forms.md
```

**Pattern: Domain-specific organization**
```
bigquery-skill/
├── SKILL.md
└── references/
    ├── finance.md      # Only loaded for finance queries
    ├── sales.md        # Only loaded for sales queries
    └── product.md      # Only loaded for product queries
```

## Quick Reference: What Goes Where

| Content Type | Location | Loaded When |
|--------------|----------|-------------|
| Trigger info, "when to use" | Description (frontmatter) | Always (~100 tokens) |
| Core workflow, decision trees | SKILL.md body | When skill triggers |
| Detailed procedures, schemas | references/ | When Claude decides it's needed |
| Reusable code | scripts/ | Executed on demand (not loaded) |
| Templates, images, boilerplate | assets/ | Used in output, not loaded |

## Updating an Existing Skill

- **Preserve the original name.** Use the existing directory name and `name` frontmatter field unchanged.
- **Copy to a writeable location before editing.** Installed skill paths may be read-only. Copy to `/tmp/skill-name/`, edit there, package from the copy.
- **Run the diff reviewer** to understand what changed:
  ```bash
  python scripts/diff_skills.py <old-skill-path> <new-skill-path>
  ```

## Resources

### Scripts — Creation & Quality
- `scripts/init_skill.py` — Initialize new skill from archetype template
- `scripts/audit_skill.py` — Comprehensive quality audit (token budgets, anti-patterns, best practices)
- `scripts/score_description.py` — Score description trigger effectiveness
- `scripts/validate_skill.py` — Structural validation (called by package)
- `scripts/quick_validate.py` — Lightweight validation for rapid iteration
- `scripts/package_skill.py` — Package skill for distribution
- `scripts/diff_skills.py` — Compare two skill versions side-by-side

### Scripts — Evaluation & Benchmarking
- `scripts/run_eval.py` — Run evaluation scenarios with subagent spawning
- `scripts/run_loop.py` — Automated description optimization loop (train/test split, 3x reliability)
- `scripts/aggregate_benchmark.py` — Aggregate grading results into benchmark.json/md
- `scripts/generate_report.py` — Generate human-readable eval reports
- `scripts/improve_description.py` — Claude-powered description improvement with extended thinking

### Eval Viewer
- `eval-viewer/generate_review.py` — Launch HTML review UI for eval results
- `eval-viewer/viewer.html` — Review viewer template (outputs tab + benchmark tab)
- `assets/eval_review.html` — Trigger eval query review template

### Agents (subagent instructions)
- `agents/grader.md` — Evaluate assertions against outputs. Uses `text`, `passed`, `evidence` fields.
- `agents/comparator.md` — Blind A/B comparison between two skill versions
- `agents/analyzer.md` — Analyze benchmark results for patterns, non-discriminating assertions, flaky evals

### References
- `references/trigger-engineering.md` — Writing and testing effective descriptions
- `references/anti-patterns.md` — Common mistakes and how to avoid them
- `references/eval-workflow.md` — Full eval-driven development loop
- `references/writing-patterns.md` — Templates, examples, and output format patterns
- `references/workflows.md` — Sequential, conditional, and feedback loop patterns
- `references/schemas.md` — JSON schemas for evals.json, grading.json, benchmark.json, feedback.json
