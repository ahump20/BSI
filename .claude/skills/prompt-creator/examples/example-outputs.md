# Example Outputs

What the prompt-creator skill produces for different scenarios.

---

## Example 1: Interactive Session — Feature Implementation

**User request:** "Write me a prompt to add WebSocket support to the live scores page"

**Generated output:**

---

**Prompt:**
```
Add WebSocket support to the live scores page so scores update in real-time
without polling.

<context>
The current live scores page at app/scores/page.tsx polls the
/api/college-baseball/scores endpoint every 30 seconds using setInterval.
The bsi-live-scores Worker already supports WebSocket connections via
Durable Objects — the frontend just needs to connect to it instead of polling.
</context>

<constraints>
- Keep the polling fallback for browsers that don't support WebSocket
- Only modify app/scores/ and components/sports/GameScoreCard.tsx
- Use the existing WebSocket URL pattern from the bsi-live-scores Worker
- Do not modify the Worker — only the frontend
</constraints>

<instructions>
1. Read the current polling implementation in app/scores/page.tsx
2. Read the WebSocket connection pattern in workers/bsi-live-scores/
3. Create a useWebSocket hook in lib/hooks/ that connects and falls back to polling
4. Update the scores page to use the hook
5. Update GameScoreCard to accept real-time score updates
</instructions>

<verification>
- Run `npm run typecheck` — zero errors
- Run `npm run dev` and load /scores — scores display correctly
- Open browser DevTools Network tab — WebSocket connection established
- Scores update without full page refresh when data changes
</verification>
```

**Recommended setup:**
- Mode: `plan` first (explore WebSocket patterns), then `acceptEdits`
- Effort: high
- Prerequisites: none

---

## Example 2: Headless (-p) — CI Linter

**User request:** "Write me a headless prompt that checks for hardcoded mock data"

**Generated output:**

---

**Command:**
```bash
claude -p "Scan all TypeScript files in app/, components/, and lib/ for \
hardcoded mock data patterns: mockGames, mockScores, mockStandings, \
mockTeams, sampleData, Math.random() in data context, faker., and \
hardcoded game objects matching 'const.*=.*\[.*{.*home:.*away:'. \
Report each violation with file path, line number, and the matching \
pattern. Output as JSON array of objects with keys: file, line, pattern, \
snippet." \
  --permission-mode dontAsk \
  --output-format json \
  --allowedTools "Read,Glob,Grep"
```

**Notes:** Uses `dontAsk` mode with restricted tools — Claude can only read files, not modify them. Pipe output to `jq` for further processing: `| jq '.[] | select(.pattern == "mockGames")'`

---

## Example 3: Cowork Task — Error Handling

**User request:** "Write a Cowork prompt for adding structured error responses to all API handlers"

**Generated output:**

---

**Task prompt:**
```
Add structured error handling to all API route handlers in workers/handlers/.

<context>
BSI's Hono-based Worker serves 40+ API routes. Currently, errors return
inconsistent formats — some return plain text, some return partial JSON.
All handlers should return the same error structure.
</context>

<scope>
Modify: workers/handlers/*.ts (all handler files)
Do NOT modify: workers/shared/, workers/index.ts, tests/, app/, components/
</scope>

<instructions>
1. Read workers/shared/types.ts for existing type definitions
2. Create an ApiError type and errorResponse() helper in workers/shared/errors.ts:
   { error: string, status: number, meta: { source: string, fetched_at: string, timezone: "America/Chicago" } }
3. For each handler in workers/handlers/:
   a. Wrap the main logic in try/catch
   b. Use errorResponse() for all error returns
   c. Log errors with: console.error(`[HandlerName] ${error.message}`)
   d. Preserve existing success response format
4. Run typecheck after each handler to catch issues early
</instructions>

<verification>
Run these commands to confirm:
- `npm run typecheck:workers` — zero errors
- `npx vitest run tests/workers/` — all worker tests pass
</verification>

<completion>
When done: commit with message "feat(workers): add structured error responses to all handlers"
If blocked: save progress, document the blocker as a code comment
</completion>
```

**Mode:** Cowork (autonomous)
**Estimated scope:** medium (15-25 files)
**Prerequisites:** none

---

## Example 4: CLAUDE.md Rule — Path-Specific

**User request:** "Write a CLAUDE.md rule that enforces Heritage design tokens in components"

**Generated output:**

---

**Add to:** `.claude/rules/heritage-tokens.md`

```markdown
---
paths:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
---

# Heritage Design System Enforcement

All React components must use Heritage Design System v2.1 tokens. Never use raw hex colors, pixel values for spacing, or inline font declarations.

## Required Tokens
- Surfaces: `--surface-dugout`, `--surface-scoreboard`, `--surface-press-box`
- Colors: `--bsi-primary`, `--bsi-bone`, `--bsi-dust`, `--heritage-columbia-blue`, `--border-vintage`
- Typography: Bebas Neue (hero), Oswald (section headings), Cormorant Garamond (body), JetBrains Mono (code)

## Banned Patterns
- Raw hex colors in className or style props (use CSS variables)
- `text-white`, `text-gray-*`, `bg-black` (use heritage token equivalents)
- `px-4`, `py-2` without mapping to heritage spacing scale
```

**Scope:** path-specific rule — only loads when Claude works with `.tsx` files in `components/` or `app/`
