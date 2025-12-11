# /bsi-debug — systematic debugging

When debugging an issue:

## Step 1: Reproduce
- What are the exact steps to reproduce?
- Is it consistent or intermittent?
- What environment (local, staging, production)?

## Step 2: Isolate
- Which system is involved (Worker, D1, KV, R2, external API)?
- Can we narrow to a specific file or function?
- What changed recently that might be related?

## Step 3: Investigate
- Check logs (Cloudflare dashboard, console)
- Review recent commits
- Test with minimal reproduction

## Step 4: Fix
- Propose smallest possible fix
- Explain why this fixes the root cause (not just symptoms)
- Include verification steps

## Step 5: Prevent
- Should we add a test?
- Should we add monitoring/alerting?
- Is there a pattern to avoid?

## Output format
```
## Issue Summary
[One sentence]

## Root Cause
[Explanation]

## Fix
[Code or config change]

## Verification
[How to confirm it's fixed]

## Prevention
[How to avoid recurrence]
```
