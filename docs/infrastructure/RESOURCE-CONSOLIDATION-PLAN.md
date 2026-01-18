# Resource Consolidation Plan

> **Created:** January 7, 2026
> **Purpose:** Standardize naming conventions and consolidate redundant resources

---

## Current State Analysis

### KV Namespaces (14 total)

| Current Name                          | ID        | Convention       | Used By                | Recommended Name               |
| ------------------------------------- | --------- | ---------------- | ---------------------- | ------------------------------ |
| `CACHE`                               | `a53c...` | UPPERCASE        | Root, Ingest, Rankings | `BSI_MAIN_CACHE`               |
| `PREDICTION_CACHE`                    | `eebf...` | UPPERCASE        | Prediction API         | `BSI_PREDICTION_CACHE`         |
| `SPORTS_CACHE`                        | `c912...` | UPPERCASE        | Prediction API         | `BSI_SPORTS_CACHE`             |
| `blazesports-cache`                   | `b03e...` | lowercase-hyphen | bsi-home (SESSIONS)    | `BSI_HOME_SESSIONS`            |
| `BSI_CHATGPT_CACHE`                   | `9752...` | BSI_PREFIX ✓     | ChatGPT App            | _(keep as-is)_                 |
| `bsi-ticker-cache`                    | `5d01...` | lowercase-hyphen | News Ticker            | `BSI_TICKER_CACHE`             |
| `blaze-backyard-baseball-BLITZ_CACHE` | `49ef...` | mixed            | Blitz game             | `BSI_BLITZ_CACHE`              |
| `BSI_PORTAL_CACHE`                    | `edab...` | BSI_PREFIX ✓     | Portal Agent           | _(keep as-is)_                 |
| `CFB_CACHE`                           | `9635...` | UPPERCASE        | bsi-cfb-ai             | `BSI_CFB_CACHE`                |
| `BLAZE_KV`                            | `1b4e...` | UPPERCASE        | Legacy?                | **DELETE**                     |
| `BSI_PREVIEW_CACHE`                   | `3815...` | BSI_PREFIX ✓     | Preview env            | _(keep as-is)_                 |
| `READING_COMPASS_CACHE`               | `84c0...` | UPPERCASE        | Non-BSI                | **ARCHIVE**                    |
| `satx-nightlife-cache`                | `bb9c...` | lowercase-hyphen | Non-BSI                | **ARCHIVE**                    |
| `worker-BACKYARD_CACHE`               | `6c2a...` | mixed            | Game cache             | **MERGE** into BSI_BLITZ_CACHE |

### D1 Databases (7 total)

| Current Name            | UUID      | Size   | Status                |
| ----------------------- | --------- | ------ | --------------------- |
| `bsi-historical-db`     | `9cec...` | 3.0 MB | ✓ Primary             |
| `bsi-game-db`           | `88eb...` | 311 KB | ✓ Active              |
| `bsi-portal-db`         | `d48f...` | 78 KB  | ✓ Active              |
| `bsi-models-db`         | `5760...` | 438 KB | ✓ Active              |
| `bsi-mmr-db`            | `4405...` | 74 KB  | ✓ Active              |
| `satx-nightlife-db`     | `c9a4...` | 147 KB | **ARCHIVE** (non-BSI) |
| `blaze-reading-compass` | `7216...` | 49 KB  | **ARCHIVE** (non-BSI) |

### R2 Buckets (11 total)

All R2 buckets follow reasonable naming. No consolidation needed:

- `blaze-sports-data-lake` - Main sports data ✓
- `blazesports-assets` - Static assets ✓
- `blaze-nil-archive` - NIL data ✓
- `bsi-embeddings` - Vector embeddings ✓
- `blazesports-archives` - Ingest archives ✓ (newly created)
- Media/video buckets - ✓

---

## Consolidation Actions

### Phase 1: Immediate (Low Risk)

**1. Delete Legacy KV:**

```bash
# Verify BLAZE_KV is unused
wrangler kv key list --namespace-id=1b4e56b25c1442029c5eb3215f9ff636

# If empty or unused, delete
wrangler kv namespace delete --namespace-id=1b4e56b25c1442029c5eb3215f9ff636
```

**2. Archive Non-BSI Resources:**

```bash
# Export data before deletion
wrangler d1 export satx-nightlife-db --output=exports/satx-nightlife-backup.sql
wrangler d1 export blaze-reading-compass --output=exports/reading-compass-backup.sql

# Export KV data
wrangler kv key list --namespace-id=84c09267475740c3a068860d31111f89 > exports/reading-compass-kv.json
wrangler kv key list --namespace-id=bb9c6f58b7e045ac81260b22f1fb755c > exports/satx-nightlife-kv.json
```

### Phase 2: Rename KV Namespaces (Medium Risk)

KV namespaces cannot be renamed directly. The process is:

1. Create new namespace with correct name
2. Copy all keys to new namespace
3. Update wrangler.toml bindings
4. Deploy workers
5. Delete old namespace

**Priority Order:**

1. `CFB_CACHE` → `BSI_CFB_CACHE` (newly created, low data)
2. `bsi-ticker-cache` → `BSI_TICKER_CACHE`
3. `CACHE` → `BSI_MAIN_CACHE`
4. `blazesports-cache` → `BSI_HOME_SESSIONS`

**Migration Script Template:**

```bash
#!/bin/bash
# migrate-kv-namespace.sh

OLD_ID="source_namespace_id"
NEW_NAME="BSI_NEW_NAME"

# Create new namespace
NEW_ID=$(wrangler kv namespace create "$NEW_NAME" --json | jq -r '.id')
echo "Created $NEW_NAME with ID: $NEW_ID"

# List all keys from old namespace
wrangler kv key list --namespace-id=$OLD_ID > /tmp/keys.json

# Copy each key (requires manual iteration for large namespaces)
# For production, use the Cloudflare API bulk operations
```

### Phase 3: Database Consolidation (Low Priority)

Current D1 structure is appropriate:

- `bsi-historical-db` - Time-series sports data
- `bsi-game-db` - Real-time game state
- `bsi-portal-db` - Portal tracking
- `bsi-models-db` - ML model storage
- `bsi-mmr-db` - Rating calculations

No consolidation recommended. Keeping separate databases improves:

- Query isolation
- Backup granularity
- Rate limit management

---

## Binding Standardization

### Current Binding Names (Inconsistent)

| Worker     | Binding            | Actual Resource      |
| ---------- | ------------------ | -------------------- |
| Root       | `CACHE`            | CACHE KV             |
| Prediction | `PREDICTION_CACHE` | PREDICTION_CACHE KV  |
| Prediction | `SPORTS_CACHE`     | SPORTS_CACHE KV      |
| bsi-home   | `SESSIONS`         | blazesports-cache KV |
| ChatGPT    | `CHATGPT_CACHE`    | BSI_CHATGPT_CACHE KV |
| Ticker     | `TICKER_CACHE`     | bsi-ticker-cache KV  |
| CFB-AI     | `CFB_CACHE`        | CFB_CACHE KV         |
| Portal     | `PORTAL_CACHE`     | BSI_PORTAL_CACHE KV  |

### Recommended Binding Standard

**Pattern:** `{PURPOSE}_CACHE` or `{PURPOSE}_DB`

Keep bindings short and consistent:

- `CACHE` → Generic cache
- `SESSIONS` → Session storage
- `DB` → Primary database
- `ARCHIVE` → R2 archive bucket

**No change needed** - current bindings are reasonable. The namespace names should be standardized, but bindings can remain short.

---

## Implementation Checklist

- [ ] Export non-BSI database backups
- [ ] Delete BLAZE_KV if unused
- [ ] Merge worker-BACKYARD_CACHE into BSI_BLITZ_CACHE
- [ ] Create BSI_CFB_CACHE (replace CFB_CACHE)
- [ ] Update docs/CLOUDFLARE_BINDINGS_SETUP.md with correct IDs
- [ ] Archive satx-nightlife and reading-compass resources
- [ ] Update all wrangler.toml files with new namespace IDs

---

## Risk Assessment

| Action              | Risk   | Mitigation                        |
| ------------------- | ------ | --------------------------------- |
| Delete BLAZE_KV     | Low    | Verify empty first                |
| Rename CFB_CACHE    | Low    | Low data, newly created           |
| Rename CACHE        | Medium | Core namespace, extensive testing |
| Archive non-BSI DBs | Low    | Export backups first              |

---

## Timeline

| Week   | Actions                         |
| ------ | ------------------------------- |
| Week 1 | Phase 1 - Delete/archive unused |
| Week 2 | Phase 2 - Rename low-risk KV    |
| Week 3 | Phase 2 cont. - Rename core KV  |
| Week 4 | Validation and documentation    |

---

_Generated during Cloudflare Infrastructure Audit - January 7, 2026_
