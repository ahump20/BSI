# Writing Patterns

## Contents
- SKILL.md Structure Patterns
- Template Pattern (Strict and Flexible)
- Examples Pattern
- Constraint Pattern
- Checklist Pattern
- Multi-Format Pattern
- Tone Pattern
- Combining Patterns
- Conditional Workflow Pattern
- Feedback Loop Pattern
- Plan-Validate-Execute Pattern

## SKILL.md Structure Patterns

| Pattern | When to Use |
|---------|-------------|
| Workflow-based | Sequential processes with clear steps |
| Task-based | Collection of discrete operations |
| Reference/Guidelines | Standards, specifications, policies |
| Capabilities-based | Integrated system with multiple features |

## Template Pattern

Match strictness to requirements.

### Strict (data formats, API responses)
```markdown
## API Response Format
ALWAYS use this exact structure:
{
  "status": "success" | "error",
  "data": { ... },
  "metadata": { "timestamp": "ISO 8601", "version": "1.0" }
}
Never add fields. Never omit required fields.
```

### Flexible (reports, documents)
```markdown
## Report Structure
Default format (adapt as needed):
# [Title]
## Summary — 1-2 paragraph overview
## Findings — Adapt sections to what you discover
## Recommendations — Specific, actionable items
Adjust sections based on content.
```

## Examples Pattern

For style-dependent output, show input/output pairs:

```markdown
## Commit Message Format

**Example 1:**
Input: Added user login with JWT
Output:
  feat(auth): implement JWT authentication
  Add login endpoint with token validation middleware.

**Example 2:**
Input: Fixed date display bug in reports
Output:
  fix(reports): correct timezone handling in date display
  Use UTC internally, convert to local time only for display.

Pattern: type(scope): brief description, then detailed explanation.
```

Examples communicate style better than descriptions.

## Constraint Pattern

```markdown
## Summary Generation
Constraints:
- Maximum 3 sentences
- No jargon (explain technical terms)
- Lead with the most important finding
- End with actionable implication
```

## Checklist Pattern

For quality-critical output with verification:

```markdown
## Code Review Output
Before submitting review, verify:
- [ ] Every issue has a specific file and line reference
- [ ] Severity marked (critical/major/minor/suggestion)
- [ ] Each issue includes a fix recommendation
- [ ] Positive observations included (at least 2)
- [ ] Summary under 100 words
```

## Multi-Format Pattern

```markdown
## Data Export
Format based on destination:
**Spreadsheet users:** CSV, header row, ISO dates
**Developers:** JSON, metadata object, Unix timestamps
**Reports:** Markdown table, formatted numbers, relative dates
```

## Tone Pattern

Match tone to context severity:

```markdown
**Critical issues:** Direct, no hedging, immediate action steps
**Standard issues:** Conversational but professional, timeline expectations
**Minor issues:** Friendly, appreciative, no promises on timeline
```

## Combining Patterns

Most real outputs combine multiple patterns. Example:

```markdown
## Incident Report
**Template** (strict): # Incident: [Title] → Timeline → Impact → Root Cause → Resolution → Prevention
**Constraints:** Timeline uses UTC. Impact quantified. Root cause technical, not blame.
**Tone:** Direct, factual.
**Checklist:** All sections complete? Timeline verified? Impact confirmed? Prevention assigned?
```

## Conditional Workflow Pattern (from official docs)

```markdown
## Document Processing
1. Determine the modification type:
   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below
```

## Feedback Loop Pattern (from official docs)

Build validation into multi-step workflows:

```markdown
## Document Editing
1. Make edits to document.xml
2. **Validate immediately**: `python scripts/validate.py unpacked_dir/`
3. If validation fails → fix issues → validate again
4. **Only proceed when validation passes**
5. Rebuild: `python scripts/pack.py unpacked_dir/ output.docx`
```

## Plan-Validate-Execute Pattern (from official docs)

For complex, open-ended tasks:
1. Create a plan in structured format (e.g., `changes.json`)
2. Validate the plan with a script
3. Execute only after validation passes

This catches errors before changes are applied and makes debugging clear.
