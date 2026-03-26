# Workflow Patterns

## Sequential Workflows

Break complex tasks into clear steps with an overview early in SKILL.md:

```markdown
## PDF Form Filling Workflow
1. Analyze the form → `scripts/analyze_form.py`
2. Create field mapping → edit `fields.json`
3. Validate mapping → `scripts/validate_fields.py`
4. Fill the form → `scripts/fill_form.py`
5. Verify output → `scripts/verify_output.py`
```

After the overview, detail each step with expected output and failure modes.

## Conditional Workflows

Use decision trees for branching logic:

```markdown
## Document Processing
**Determine the document type:**
- **Scanned PDF (images)?** → OCR workflow
- **Native PDF (selectable text)?** → Text extraction workflow
- **Word document (.docx)?** → DOCX workflow
```

## Error Handling

Include recovery paths:

```markdown
**If extraction fails:**
1. PDF encrypted → Run `scripts/decrypt.py` first
2. PDF scanned → Use OCR workflow instead
3. PDF corrupted → Ask user for a new copy

**If text is garbled:**
- Try: `scripts/extract_text.py input.pdf --encoding=latin1`
```

## Feedback Loops (from official docs)

The "run validator → fix errors → repeat" pattern greatly improves output quality:

```markdown
1. Make your edits
2. **Validate immediately**: `python scripts/validate.py`
3. If validation fails → fix → validate again
4. **Only proceed when validation passes**
```

## Checklist Workflows (from official docs)

For complex tasks, provide a copiable checklist for progress tracking:

```markdown
Copy this checklist:
- [ ] Step 1: Analyze the form
- [ ] Step 2: Create field mapping
- [ ] Step 3: Validate mapping
- [ ] Step 4: Fill the form
- [ ] Step 5: Verify output
```

## Parallel Workflows

When steps are independent:

```markdown
These steps can run in any order:
- **Text extraction:** `scripts/extract_text.py`
- **Image extraction:** `scripts/extract_images.py`
- **Metadata extraction:** `scripts/extract_metadata.py`
After all complete: `scripts/compile_report.py`
```

## Iterative Workflows

For tasks requiring refinement:

```markdown
1. Initial analysis
2. Draft revision
3. Review against criteria
4. Refine remaining issues
5. Repeat steps 3-4 until criteria met or max 3 iterations

Stop conditions:
- All criteria pass
- 3 iterations reached (ask user for direction)
- User signals satisfaction
```
