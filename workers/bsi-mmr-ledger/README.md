# BSI MMR Ledger

Append-only Merkle Mountain Range (MMR) audit log running on Cloudflare Workers + D1. Provides tamper-evident storage for scouting notes, model outputs, "instinct → metric" events, and any data requiring verifiable integrity.

## Key Features

- **Append-only**: Events can only be added, never modified or deleted
- **Tamper-evident**: SHA-256 hashes with domain separation detect any modification
- **Stable proofs**: Historical proofs remain valid even after new appends
- **Versioned roots**: Every state is preserved for time-travel verification
- **Query support**: Search by actor, type, tag, and time range
- **Batch operations**: Bulk import up to 100 events atomically

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Worker                        │
├─────────────────────────────────────────────────────────────────┤
│  index.ts      → HTTP routing, auth, request handling           │
│  service.ts    → Business logic, event construction             │
│  storage.ts    → D1 operations, atomic transactions             │
│  crypto.ts     → SHA-256 hashing, proof verification            │
│  types.ts      → TypeScript definitions, error classes          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                         ┌───────┴───────┐
                         │  Cloudflare D1 │
                         │   (SQLite)     │
                         └───────────────┘
```

## API Reference

### Health Check
```
GET /health
```

### Current State
```
GET /v1/mmr/head
```
Returns version (leaf count), root hash, and current peaks.

### Append Event (Admin)
```
POST /v1/mmr/append
Authorization: Bearer <token>

{
  "type": "scout_note",
  "actor": "austin",
  "tags": ["CF", "instinct"],
  "data": { "player": "X", "note": "late barrel but fearless" }
}
```

### Batch Append (Admin)
```
POST /v1/mmr/batch
Authorization: Bearer <token>

{
  "events": [
    { "type": "...", "actor": "...", "data": "..." },
    { "type": "...", "actor": "...", "data": "..." }
  ],
  "stop_on_error": false
}
```

### Get Leaf
```
GET /v1/mmr/leaf/:index
```

### List/Search Leaves
```
GET /v1/mmr/leaves?actor=austin&tag=CF&type=scout_note&limit=20&offset=0&since_ms=1700000000000
```

### Get Inclusion Proof
```
GET /v1/mmr/proof/:leaf_index?version=N
```
Version is optional—defaults to latest. Specifying a version gives you a stable proof against that historical state.

### Verify Proof (Public)
```
POST /v1/mmr/verify
{
  "proof": { ... }
}
```
Returns `{ "ok": true, "valid": true }` or `{ "ok": true, "valid": false, "reason": "..." }`.

## Setup

### 1. Create D1 Database
```bash
wrangler d1 create bsi-mmr-db
# Copy the database_id into wrangler.toml
```

### 2. Run Migrations
```bash
wrangler d1 migrations apply bsi-mmr-db
```

### 3. Set Admin Token
```bash
wrangler secret put ADMIN_TOKEN
```

### 4. Deploy
```bash
npm run deploy
```

## Local Development

```bash
npm install
npm run db:migrate:dev
npm run dev
```

The CLI tool makes testing easy:
```bash
export MMR_URL=http://localhost:8787
export MMR_ADMIN_TOKEN=your-token

./cli/mmr.mjs health
./cli/mmr.mjs append --type test --actor cli --data '{"msg":"hello"}'
./cli/mmr.mjs head
./cli/mmr.mjs proof 1
```

## MMR Structure

The Merkle Mountain Range is an append-only structure where:

1. **Leaves** are hashed event payloads
2. **Internal nodes** are SHA-256(left || right) with domain separation
3. **Peaks** are the current "mountain tops" that haven't merged yet
4. **Root** is the hash-bag of all peaks (folded right-to-left)

```
After appending 7 leaves:

        [6]           Peak 0 (height 2)
       /   \
     [2]   [5]
    / \   / \
   1   2 3   4       Peak 1: [7] (height 0)

Root = bag(peak0, peak1)
```

Proofs walk from leaf → peak with siblings, then verify the peak bags to root.

## Domain Separation

All hashes use single-byte prefixes to prevent type confusion attacks:

- `0x00` — Leaf nodes
- `0x01` — Parent (internal) nodes  
- `0x02` — Peak bagging

## BSI Integration

This follows BSI naming conventions:
- Worker: `bsi-mmr-ledger`
- D1: `bsi-mmr-db`
- KV (optional): `BSI_MMR_RATELIMIT`

Designed to integrate with the broader BSI analytics pipeline for tracking:
- Scout evaluations and notes
- Model predictions and confidence scores
- "Instinct → metric" validation events
- Data lineage and audit trails
