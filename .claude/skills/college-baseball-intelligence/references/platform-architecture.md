# Platform Architecture — BSI

Stack: Cloudflare only (Workers/Hono, D1, KV, R2). No AWS. No Vercel.
Repo: github.com/ahump20/BSI (main branch)

Naming:
  Workers: bsi-{domain}-{function}
  KV: BSI_{DOMAIN}_{PURPOSE}
  D1: bsi-{domain}-db

Anti-Sprawl: REPLACE don't add. SEARCH before create. DELETE obsolete same commit. One repo.

Design System (Heritage v2.1):
  Type: Oswald (headings), Cormorant Garamond (body), IBM Plex Mono (data), Bebas Neue (display)
  Colors: Burnt orange (#BF5700), Texas soil (#8B4513), Charcoal (#1A1A1A), Midnight (#0D0D0D), Ember (#FF6B35 accent only)
  Rule: Data density beats atmosphere. Trust layer: every surface shows source + freshness.

Pipeline:
  Highlightly API -> bsi-savant-ingest (Worker) -> D1 -> bsi-savant-compute (Worker) -> D1 -> bsi-savant-api (Worker) -> KV cache -> MCP Server -> Claude/Frontend

Feature workflow: Spec -> Schema -> Worker -> Frontend -> Test -> Deploy (wrangler)
