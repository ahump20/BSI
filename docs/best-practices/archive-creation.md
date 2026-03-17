# Archive Creation Best Practices

## Issue Context

When creating zip archives programmatically, the default behavior of the `zip` command can lead to stale content in archives if files are deleted from the source tree between runs.

## Problem

The `zip` command's default mode is "add or replace zipfile entries" (`zip -h`). This means:
- New files are added
- Modified files are updated
- **Deleted files remain in the archive**

If a script creates an archive and is re-run after files are deleted from the source (`references/`, `scripts/`, `evals/`, etc.), the archive will silently retain the old content, producing incorrect bundles.

## Solutions

### Option 1: Delete Archive Before Creating (Recommended)

Always remove the archive before creating it:

```bash
#!/usr/bin/env bash
rm -f output.zip
zip -r output.zip source_directory/
```

### Option 2: Use the -FS (Filesync) Flag

The `-FS` flag makes zip delete entries for files that no longer exist:

```bash
#!/usr/bin/env bash
zip -FS -r output.zip source_directory/
```

Note: `-FS` has edge cases and may not work correctly with all zip implementations.

### Option 3: Use a Temporary Archive

Create in a temp location and move to final location:

```bash
#!/usr/bin/env bash
TEMP_ARCHIVE=$(mktemp).zip
zip -r "$TEMP_ARCHIVE" source_directory/
mv "$TEMP_ARCHIVE" output.zip
```

## Example: Correct Archive Creation Script

```bash
#!/usr/bin/env bash
set -euo pipefail

OUTPUT="dist/bundle.zip"
SOURCE_DIRS=("references/" "scripts/" "evals/")

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT")"

# Remove existing archive to prevent stale content
rm -f "$OUTPUT"

# Create fresh archive
zip -r "$OUTPUT" "${SOURCE_DIRS[@]}"

echo "✓ Created fresh archive: $OUTPUT"
```

## Anti-Pattern

❌ **Do not do this:**

```bash
#!/usr/bin/env bash
# This will accumulate stale files!
zip -r output.zip references/ scripts/ evals/
```

If you delete a file from `references/` and re-run this script, the deleted file will still be in `output.zip`.

## References

- Issue: Fix recreate bundle archives instead of updating in place
- Originally identified in PR #661 code review
- Related to AI context bundling and deployment artifacts

## When This Matters

- **CI/CD pipelines**: Archives created in build steps that may run multiple times
- **Development scripts**: Local scripts that package code for deployment or sharing
- **AI context bundles**: Scripts that package codebase context for AI tools
- **Deployment artifacts**: Any build artifact that must accurately reflect current source state

## Verification

To verify an archive doesn't contain stale content:

```bash
# List archive contents with timestamps
unzip -l output.zip

# Compare against source tree
diff <(cd source/ && find . -type f | sort) \
     <(unzip -l output.zip | awk 'NR>3 {print $4}' | grep -v '^$' | sort)
```
