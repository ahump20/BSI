# Anti-Patterns

## Contents
- Context Bloat (Explainer, Hedger, Narrator, Over-Explainer)
- Trigger Failures (Ghost, Overreacher, Self-Referencer, Positive-Only)
- Structure Problems (Monolith, Maze, Orphan, Too-Many-Options)
- Script Problems (Reimplementer, Punter, Voodoo Constant)
- Content Problems (Duplicator, TODOer, Time-Bomber, Path Breaker)
- Audit Checklist

Common mistakes that make skills ineffective, bloated, or fragile.

## Context Bloat

### The Explainer
**Problem:** Explaining concepts Claude already knows.
```markdown
# Bad: "JSON (JavaScript Object Notation) is a lightweight data format..."
# Good: "Use JSON for the config file. Schema:"
```
**Fix:** Assume Claude knows general concepts. Only explain domain-specific details.

### The Hedger
**Problem:** Qualifying every statement with caveats.
```markdown
# Bad: "You might want to consider potentially using pdfplumber..."
# Good: "Use pdfplumber for text extraction:"
```

### The Narrator
**Problem:** Describing the skill instead of providing instructions.
```markdown
# Bad: "This skill was created to help with PDF processing. We designed it to be..."
# Good: "## PDF Processing\nExtract text: `scripts/extract_text.py <input.pdf>`"
```

### The Over-Explainer (from official docs)
**Problem:** 150 tokens where 50 would do.
```markdown
# Bad (150 tokens): "PDF files are a common file format... There are many libraries..."
# Good (50 tokens): "Use pdfplumber: `import pdfplumber`"
```
**Test:** Read each paragraph and ask "Does Claude really need this?"

## Trigger Failures

### The Ghost
**Problem:** Description doesn't contain words users actually say.
```markdown
# Bad: "Document lifecycle management solution."
# Good: "Creates and edits Word documents (.docx). Use for reports, letters, proposals."
```

### The Overreacher
**Problem:** Triggers on too many unrelated requests.
```markdown
# Bad: "Help with files and documents of any type."
# Good: "Processes PDF files: extract text, merge, split, fill forms."
```

### The Self-Referencer (from official docs)
**Problem:** Using first or second person in descriptions.
```markdown
# Bad: "I can help you process Excel files"
# Bad: "You can use this to process Excel files"
# Good: "Processes Excel files and generates reports"
```

### The Positive-Only
**Problem:** No negative triggers, so adjacent tasks cause false activation.
```markdown
# Bad: "Handles documents and files."
# Good: "Handles PDF documents. Not for: Word docs (use docx skill), spreadsheets (use xlsx skill)."
```

## Structure Problems

### The Monolith
**Problem:** Everything in SKILL.md, nothing in references.
**Fix:** Keep SKILL.md under 500 lines. Move detailed procedures to references/.

### The Maze
**Problem:** Deeply nested references (reference → reference → reference).
**Fix:** All references one hop from SKILL.md. Flatten the structure. Official docs confirm Claude may only partially read nested files.

### The Orphan
**Problem:** Resources exist but aren't referenced from SKILL.md.
**Fix:** Every file in references/ and scripts/ must have a clear pointer in SKILL.md.

### The Too-Many-Options
**Problem:** Presenting multiple approaches without a default.
```markdown
# Bad: "You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image..."
# Good: "Use pdfplumber for text extraction. For scanned PDFs requiring OCR, use pdf2image with pytesseract."
```

## Script Problems

### The Reimplementer
**Problem:** Instructions for writing code that should be a script.
**Fix:** If Claude writes the same code pattern repeatedly, make it a script.

### The Punter (from official docs)
**Problem:** Scripts that fail and defer to Claude instead of handling errors.
```python
# Bad: return open(path).read()  # Just fail and let Claude figure it out
# Good: Handle FileNotFoundError, PermissionError with explicit recovery
```

### The Voodoo Constant
**Problem:** Magic numbers without justification.
```python
# Bad: TIMEOUT = 47  # Why 47?
# Good: REQUEST_TIMEOUT = 30  # HTTP requests typically complete within 30 seconds
```

## Content Problems

### The Duplicator
Same information in SKILL.md and references. Information lives in ONE place.

### The TODOer
Shipping skills with TODO comments. Delete or complete before packaging.

### The Time-Bomber (from official docs)
**Problem:** Time-sensitive information that will become wrong.
```markdown
# Bad: "If you're doing this before August 2025, use the old API."
# Good: Use an "Old patterns" collapsed section for deprecated approaches.
```

### The Path Breaker
**Problem:** Windows-style paths that break on Unix.
```markdown
# Bad: scripts\helper.py
# Good: scripts/helper.py
```

## Audit Checklist

Before packaging, verify:
- [ ] SKILL.md under 500 lines
- [ ] Description in third person with negative triggers
- [ ] No explanations of concepts Claude already knows
- [ ] No meta-content about the skill creation process
- [ ] No TODO comments
- [ ] All scripts tested with representative inputs
- [ ] All references/ files pointed to from SKILL.md
- [ ] No duplicate content between SKILL.md and references
- [ ] No deeply nested references (one hop max)
- [ ] Reference files >100 lines have table of contents
- [ ] Forward slashes only in file paths
- [ ] MCP tools use fully qualified names (ServerName:tool_name)
- [ ] No time-sensitive information (or in "old patterns" section)
