# /bsi-test — run and analyze tests

## Test commands
```bash
npm run test              # All unit tests
npm run test:api          # API tests
npm run test:a11y         # Accessibility tests
npm run test:integration  # Integration tests
npm run test:coverage     # With coverage report
```

## When analyzing test results
1. Identify failing tests
2. Categorize: flaky vs. real failures
3. For real failures:
   - Show the exact assertion that failed
   - Explain likely cause
   - Propose a fix

## Coverage analysis
If coverage report available:
- Highlight uncovered critical paths
- Suggest high-value tests to add

## Output format
- Summary: X passed, Y failed, Z skipped
- Details on any failures
- Recommendations for improvement
