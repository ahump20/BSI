# Claude Plugins Research

## Goal
Identify and recommend Claude plugins that optimize BSI development workflow.

## Recommended Plugins (Priority Order)

### Tier 1 — Install Now

| Plugin | Why | BSI Alignment |
|--------|-----|---------------|
| **TypeScript LSP** (Anthropic verified, 40K installs) | Enhanced code intelligence, type checking, go-to-definition | Core to our TS-only codebase |
| **Context7** (Upstash, 83K installs) | Live documentation lookup from source repos | Cloudflare Workers API docs stay current; no stale references |
| **GitHub** (Official, 57K installs) | PR management, issue creation, code review from CLI | Streamlines git workflow |
| **Code Review** (Anthropic verified, 57K installs) | AI code review with confidence-based filtering | Enforces anti-sprawl, catches `any` types, dead code |
| **Frontend Design** (Anthropic verified, 120K installs) | Production-grade frontend output, avoids generic AI aesthetics | BSI design tokens (burnt orange, film grain, charcoal palette) need non-generic output |

### Tier 2 — Install If Needed

| Plugin | Why | When |
|--------|-----|------|
| **Feature Dev** (Anthropic verified, 55K installs) | Exploration/design/review agents for multi-file features | When building features touching >3 files (aligns with plan mode rule) |
| **Code Simplifier** (Anthropic verified, 39K installs) | Simplifies and refines recently modified code | Post-implementation cleanup passes |
| **Playwright** (Microsoft, 36K installs) | Browser automation and E2E testing | When BSI needs integration tests for score pages |

### Tier 3 — Skip

| Plugin | Why Skip |
|--------|----------|
| **Supabase** | BSI is Cloudflare-only (D1/KV/R2). No Supabase. |
| **Figma** | Only useful if design files exist in Figma. Evaluate later. |

## Installation

Plugins are installed at **claude.com** via the web interface, not from CLI. Navigate to:
`https://claude.com/plugins` → Click "Install" on each plugin above.

## Notes
- All Tier 1 plugins are either Anthropic-verified or from major vendors
- Context7 is particularly valuable because Cloudflare Workers documentation changes frequently and Claude's training data may lag behind
- Code Review plugin directly supports the checklist in CLAUDE.md (no `any`, no `console.log`, no dead code)
