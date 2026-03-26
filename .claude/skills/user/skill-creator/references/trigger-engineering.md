# Trigger Engineering

The `description` field is the **only thing Claude sees** before deciding whether to load a skill. If the description doesn't trigger, the skill doesn't run.

## Anatomy of an Effective Description

```yaml
description: |
  [Third-person, present tense statement of capability.]
  Use when: (1) [trigger], (2) [trigger], (3) [trigger].
  Triggers: "phrase 1", "phrase 2", "phrase 3".
  Not for: [what this skill should NOT handle].
```

**Official requirement:** Always write in third person. The description is injected into the system prompt — inconsistent point-of-view causes discovery problems.

- Good: "Processes Excel files and generates reports"
- Bad: "I can help you process Excel files"
- Bad: "You can use this to process Excel files"

## Trigger Types

### File-Type Triggers
```yaml
# Good — includes extension
description: "Processes Word documents (.docx files) for creating, editing, or analyzing content."

# Weak — missing extension
description: "Helps with documents."
```

### Task-Pattern Triggers
```yaml
# Good — names operations
description: "Creates, rotates, merges, splits, and fills PDF files. Extracts text and form data."

# Weak — vague capability
description: "PDF processing capabilities."
```

### Phrase Triggers
Include phrases users actually say — casual, formal, indirect:
```yaml
# Good
description: |
  Queries BigQuery databases. Use when user asks about data, metrics,
  or says "how many users", "revenue by month", "query the database".

# Weak
description: "BigQuery integration."
```

### Negative Triggers
Prevent false activation on adjacent tasks:
```yaml
description: |
  Edits existing DOCX files with tracked changes.
  Not for: creating new documents from scratch (use docx-creator instead).
```

### MCP-Enhanced Triggers
For skills that wrap MCP tools, reference the server:
```yaml
description: |
  Enhances Sentry error monitoring with automated PR analysis.
  Use when user mentions Sentry errors, bug fixes, or error tracking in PRs.
  Requires: Sentry MCP server connected.
```

## Common Failures

| Failure | Example | Fix |
|---------|---------|-----|
| Too broad | "Help with code and development tasks." | Narrow to specific operations |
| Too narrow | "Rotate PDF pages 90 degrees clockwise." | Expand to all PDF operations |
| Abstract | "Comprehensive document lifecycle management solution." | Use concrete file types and verbs |
| Missing file types | "Edit Microsoft Word documents." | Add "(.docx files)" |
| Wrong person | "I help you process files" | "Processes files for..." |
| No negatives | (omitted) | Add "Not for: ..." |

## Testing Triggers

Before packaging, test against four scenario types:

| Scenario | Example | Expected |
|----------|---------|----------|
| Direct match | "Merge these PDFs" | Triggers |
| Indirect match | "Combine these documents into one" | Triggers |
| File-based | "I have invoice.pdf, extract the total" | Triggers |
| Negative | "Edit this Word document" | Does NOT trigger |

Minimum: 5 test cases. Include at least 2 negative cases.

**Near-miss negatives are most valuable.** "Write a fibonacci function" as a negative test for a PDF skill is too easy. Test adjacent domains: "Convert this Word doc to PDF" tests whether a PDF skill correctly defers to a conversion tool.

## Description Length

Target: 100-200 words. Under 50 usually means missing trigger cases. Over 250 usually means trying to do too much in one skill.

Hard limit: 1024 characters.

## Template

```yaml
description: |
  [1-2 sentences: What the skill enables, third-person present tense.]
  
  Use when: (1) [trigger condition], (2) [trigger condition], (3) [trigger condition].
  
  Triggers: "[phrase 1]", "[phrase 2]", "[phrase 3]".
  
  Not for: [adjacent task 1], [adjacent task 2].
```
