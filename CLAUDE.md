# CLAUDE.md

Austin Humphrey. BSI (Blaze Sports Intel). Cloudflare-only architecture.

## Core Philosophy

**WHY first, always.** Before acting, understand the ground. Before coding, understand the architecture. Before suggesting, understand what I'm actually trying to do. Ask if unclear.

**Anti-sprawl is non-negotiable.** Every file added is technical debt. Every abstraction is complexity. Default to less.

## Anti-Sprawl Rules

1. **Replace, don't add** — New code replaces obsolete code in the same commit
2. **Search before create** — Check existing files/functions/bindings first. Use `grep -r`, check the repo
3. **Delete obsolete** — Remove dead code in the same PR that adds replacement
4. **One way to do things** — If two patterns exist, consolidate to one

Why: I've watched repos balloon from 10 files to 200 with the same functionality. Every duplicate is a future bug.

## Cloudflare Architecture

All BSI infrastructure runs on Cloudflare. No exceptions.

| Resource | Pattern | Example |
|----------|---------|---------|
| Worker | `bsi-{domain}-{function}` | `bsi-scores-live` |
| KV | `BSI_{DOMAIN}_{PURPOSE}` | `BSI_SCORES_CACHE` |
| D1 | `bsi-{domain}-db` | `bsi-analytics-db` |
| R2 | `bsi-{domain}-assets` | `bsi-media-assets` |

Why: Naming discipline prevents the "what does this binding do?" problem six months later.

## TypeScript Conventions

```typescript
// ✓ Explicit return types on exports
export function parseScore(raw: string): GameScore { }

// ✓ Early returns over nested conditionals
if (!id) return null;
if (!isValid(id)) return null;
return fetchData(id);

// ✓ Typed errors with context
throw new APIError(`Failed: ${response.statusText}`, response.status, url);

// ✗ Never: any, nested ternaries, magic numbers, console.log
```

## Communication

- **Lead with answer.** No preamble. No "Great question!" No "I'll help you with that."
- **Production-ready code.** Zero placeholders. Zero `// TODO`. If it's not done, say what's missing.
- **Define terms.** If using a technical term, define it in plain English first.
- **Friction over validation.** Challenge with evidence, not cheerleading.

Why: I'm building production systems. Every placeholder is a lie about what's done.

## Response Format

- No emojis unless I use them first
- No markdown headers in conversational responses
- Code blocks for code, prose for explanation
- Short. If it can be said in 2 sentences, don't use 5.

## BSI-Specific

- **Sports API**: Use Highlightly API (pro subscription) for baseball and football data
- **Timezone**: Always America/Chicago for timestamps
- **Citations**: Every data point needs source + timestamp
- **Design tokens**: Burnt orange (#BF5700), Texas soil (#8B4513), charcoal (#1A1A1A), midnight (#0D0D0D), ember (#FF6B35 accent only)
- **Film grain**: Enabled globally at 3.5% opacity via SVG turbulence filter. Respects prefers-reduced-motion. Users can toggle via BSIGrain.disable()

## Git

```bash
# Commit format
feat(scores): add live score polling for MLB
fix(api): handle null response from endpoint
refactor(utils): consolidate date formatting

# Never
"updated stuff" / "fixed bug" / "WIP"
```

## When Stuck

If I say "WHY FIRST" or "stop optimizing" — stop. Return to understanding what I actually need before suggesting solutions.

## Quick Checklist Before Committing

- [ ] No `any` types
- [ ] No `console.log` (use proper logging)
- [ ] No magic numbers
- [ ] No commented-out code
- [ ] Deleted obsolete code this change replaces
- [ ] Tested the actual behavior, not just the types

---

*Update this file with `#` when patterns emerge. This is living documentation.*
