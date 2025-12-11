# /bsi-data — debug sports data issues

When diagnosing sports data problems:

## Check order
1. **Source availability** — Is the upstream API responding?
2. **Cache state** — Is stale data being served?
3. **Adapter health** — Is the adapter parsing correctly?
4. **Validation** — Is the data passing schema validation?

## Diagnostic questions
- Which sport/league?
- Which endpoint or component?
- What's the expected vs. actual data?
- When did it last work correctly?

## Common issues
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Stale data | Cache TTL too long | Clear KV, adjust TTL |
| Missing fields | API schema changed | Update adapter |
| 500 errors | Rate limited | Check provider status |
| Wrong timezone | Hardcoded UTC | Use America/Chicago |

## Validation commands
```bash
# Test specific adapter
npx vitest tests/api/{sport}.test.ts

# Check cache state
wrangler kv:key get --namespace-id=XXX "cache-key"
```

Return:
- Root cause analysis
- Recommended fix
- Verification steps
