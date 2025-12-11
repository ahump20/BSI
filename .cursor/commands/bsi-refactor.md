# /bsi-refactor — safe refactoring workflow

When refactoring code:

## Ground rules
- Behavior must remain identical (unless explicitly changing it)
- Tests must pass before AND after
- Small commits, each independently working

## Refactoring checklist
1. [ ] Identify all callers of the code being changed
2. [ ] Write tests for current behavior (if missing)
3. [ ] Make the change
4. [ ] Run tests
5. [ ] Update any callers
6. [ ] Run tests again
7. [ ] Remove dead code in same commit

## Types of refactors

### Rename
- Use IDE rename (not find-replace)
- Update imports, exports, and tests
- Check for string references (API routes, etc.)

### Extract
- Keep the original working until new version is validated
- Wire up new version
- Delete old code

### Inline
- Verify no external callers
- Replace all usages
- Delete the extracted code

## Output
- What changed (high level)
- Files touched
- Tests run
- Any callers that need manual review
