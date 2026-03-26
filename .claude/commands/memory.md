Read and report Austin's persistent memory files. Target: $ARGUMENTS

## If $ARGUMENTS is provided

Find and read that specific memory file. Check these locations:
- `~/.claude/memory/$ARGUMENTS`
- `~/.claude/memory/$ARGUMENTS.md`
- Any file in `~/.claude/memory/` whose name contains "$ARGUMENTS"

Read the full file and present its contents. If the file doesn't exist, list what's available.

## If no arguments provided

1. List all files in `~/.claude/memory/`
2. Read each file
3. For each file, report:
   - Filename
   - One-line summary of what it contains
4. At the end, report total count: "X memory files loaded"

## Memory file locations

Primary: `~/.claude/memory/`
Project-level: `~/.claude/projects/*/memory/`

Check both locations. Project-level memory files are contextual to specific repos.
