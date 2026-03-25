# Skill Sync Audit — 2026-03-20

> Skills in `~/.claude/skills/` are read-only in Cowork. These edits need to be applied locally via Claude Code or manual edit.

---

## austin-super-memory

**Last synced:** 2026-03-04 → should be 2026-03-20

### §8 Active Workers (LINE 173) — STALE

**Currently says:**
```
blazesportsintel-worker-prod, bsi-savant-compute, bsi-live-scores, cbb-api, cbb-api-sync, bsi-cbb-analytics, college-baseball-mcp, blaze-field-site
```

**Should say (18 satellite + 1 apex):**
```
Apex: blazesportsintel-worker-prod (Hono, main entry point)
Satellites (each has own wrangler.toml):
blaze-field-do, blaze-field-site, bsi-analytics-events, bsi-baseball-agent,
bsi-cbb-analytics, bsi-cbb-ingest, bsi-college-baseball-daily, bsi-intelligence-stream,
bsi-live-scores, bsi-portal-sync, bsi-savant-compute, bsi-show-dd-sync,
bsi-social-intel, college-baseball-mcp, error-tracker, mini-games-api,
sportradar-ingest, synthetic-monitor
```

**Key changes:**
- `cbb-api` and `cbb-api-sync` no longer exist → replaced by `bsi-cbb-ingest`
- 10 new workers added since last sync: `blaze-field-do`, `bsi-analytics-events`, `bsi-baseball-agent`, `bsi-college-baseball-daily`, `bsi-intelligence-stream`, `bsi-portal-sync`, `bsi-show-dd-sync`, `bsi-social-intel`, `sportradar-ingest`, `synthetic-monitor`
- Worker count: "14+ Workers" → "19 Workers" (1 apex + 18 satellite)

### §8 Scale line (LINE 138) — STALE

**Currently:** `14+ Workers. 5+ databases. 18+ buckets.`
**Should be:** `19 Workers. 5+ databases. 18+ buckets.`

### §8 Deploy command (LINE 143) — CHECK

References `cd BSI-local` — should this be `cd ~/bsi-repo`? The canonical root is `/Users/AustinHumphrey/bsi-repo`.

---

## cloudflare-ops-health

### Workers list (LINE 28-29) — STALE

Same 8-worker list as austin-super-memory. Needs the same update to 19 workers. This skill says "sync with austin-super-memory §8" so updating super-memory first is the right move.

---

## blaze-platform-visual-design

### No conflicts found.
Heritage Design System v2.1 references are current. Stack references (Next.js 16, React 19, Tailwind CSS 3) match CLAUDE.md.

---

## code-engine

### No conflicts found.
Anti-sprawl rules, naming conventions, and Cloudflare-first constraints align with CLAUDE.md.

---

## fullstack-engineer

### No conflicts found.
Operating principles align with current CLAUDE.md doctrine.

---

## college-baseball-intelligence

### No conflicts found.
MCP tool routing and analytical architecture are current.

---

## ship-auditor

### No conflicts found.
Session count reference (3,131) may be slightly stale but the accountability protocol is current.

---

## Summary of Required Edits

| Skill | File | What to Change |
|-------|------|---------------|
| austin-super-memory | SKILL.md line 7 | Sync date → 2026-03-20 |
| austin-super-memory | SKILL.md line 138 | Worker count 14+ → 19 |
| austin-super-memory | SKILL.md line 173 | Replace 8-worker list with 19-worker list |
| austin-super-memory | SKILL.md line 143 | Verify deploy path (`BSI-local` vs `bsi-repo`) |
| cloudflare-ops-health | SKILL.md lines 28-29 | Replace 8-worker list with 19-worker list (or reference super-memory) |

All other audited skills (code-engine, fullstack-engineer, blaze-platform-visual-design, college-baseball-intelligence, ship-auditor) are current with CLAUDE.md.
