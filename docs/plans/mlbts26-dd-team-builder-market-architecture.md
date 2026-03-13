# MLB The Show 26 Diamond Dynasty Team Builder + Marketplace Tracker (Cloudflare-first)

## Known

Verified facts and verified data-source posture as of this run:

1. `https://theshow.com/` is reachable at edge but currently responds with `403 Forbidden` for this environment.
2. `https://theshow.com/games/mlb-the-show-26/` also returns `403 Forbidden` from this environment.
3. `https://theshow.com/api/` returns `403 Forbidden` from this environment.
4. `https://mlb26.theshow.com/` responds `503 Service Unavailable` from this environment.
5. No public MLB The Show 26 API documentation is currently discoverable from repository-local references.
6. In this Blaze repository, there is no existing MLB The Show-specific ingestion/client module to extend; implementation should be introduced as a new bounded domain, but with existing Blaze naming and component primitives reused where possible.

Given those verified constraints, a production-ready architecture can be defined now, but live-market behavior must be explicitly gated by source verification.

## Unknown

Critical unknowns that cannot be guessed without verifiable access:

1. Whether MLB The Show 26 exposes a stable public card catalog endpoint.
2. Whether MLBTS26 marketplace listings/transactions are available via official web JSON endpoints, authenticated companion-app APIs, or not publicly exposed at all.
3. Whether WBC card metadata is first-party structured (e.g., explicit `program`, `series`, `event`) or only inferable from card names/art.
4. Whether Red Diamond rarity is first-party enumerated in API payloads or represented as a display-only client transform.
5. Whether upgraded PXP and Parallel Mods have server-side canonical fields retrievable in bulk, or only per-user in authenticated inventory contexts.
6. Whether spread, completed sales, order-book depth, and transaction history are exposed in official/public feeds.
7. Official rate limits, anti-bot controls, and legal terms governing automated polling.

Verification required:

- Official MLBTS26 API/docs publication.
- Confirmed endpoint behavior with authenticated and unauthenticated sessions.
- Written terms permitting ingestion frequency and storage of historical market data.

## Must validate before build

Hard blockers for shipping live marketplace claims:

1. A legally permitted, technically stable source for MLBTS26 card and listing data.
2. Contract-level field validation for card identity, rarity, position eligibility, and marketplace pricing fields.
3. Explicit proof of whether intraday polling is allowed; if disallowed, system must ship in snapshot-only mode.
4. Clarification on user-authenticated inventory access before exposing personalized collection status automation.
5. Data rights for storing and replaying historical price points.

Without these, the page can launch as a "verified-source status + architecture-ready shell" with non-live placeholders removed (no fake data, no speculative endpoints).

## Design

### Product definition + user jobs

This product exists to answer three user jobs that Diamond Dynasty players run repeatedly: first, "build the best legal lineup for my roster constraints and theme goals"; second, "decide whether to buy, sell, hold, or flip a card right now"; third, "understand unlock paths and collection dependencies so stubs and time are spent intentionally." The page should feel native to Blaze by prioritizing decision support, source freshness, and confidence labeling over raw card browsing.

### Route map + page UX layout

Use a standalone route namespace that can later mount under Blaze with unchanged contracts:

- `/dd26` (overview dashboard): source status, market movers, watchlist summary, collection progress summary.
- `/dd26/cards` (search/index): faceted search for team, series, rarity including Red Diamond, positions/secondary positions, handedness, nationality/WBC eligibility, collection state, acquisition path, market state.
- `/dd26/cards/:cardId` (card detail): attributes, PXP/parallel state (when sourceable), mod state (when sourceable), market summary, history charts, acquisition and collection relationships, roster-fit surfaces.
- `/dd26/team-builder` (lineup lab): lineup, bench, rotation, bullpen, captain slots, theme-team effects when supported by source data.
- `/dd26/collections` (progression map): collection trees, completion state, unlock dependencies, reward card pivots.
- `/dd26/watchlist` (market operations): watched cards, alerts, spread/liquidity monitor where supported.
- `/dd26/data-status` (trust center): live source availability, freshness windows, degraded-mode explanation.

### Component architecture

Keep UI as composable Blaze primitives plus DD26 domain modules:

- Shell: reuse `components/layout-ds/*` and `components/ui/*` patterns.
- Domain components:
  - `components/dd26/CardFilters`
  - `components/dd26/CardTable`
  - `components/dd26/CardDetailHeader`
  - `components/dd26/MarketSparkline`
  - `components/dd26/CollectionGraph`
  - `components/dd26/LineupCanvas`
  - `components/dd26/CaptainBoostPanel`
  - `components/dd26/ThemeTeamInspector`
  - `components/dd26/DataSourceStatus`
- Worker API boundary:
  - `workers/dd26-api` exposes normalized read APIs.
  - `workers/dd26-ingest` performs scheduled ingestion/polling.

### D1 schema

Use explicit, non-invented modeling with nullable feature fields until verified.

```sql
CREATE TABLE dd26_cards (
  card_id TEXT PRIMARY KEY,
  source_card_key TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team_code TEXT,
  series_code TEXT,
  rarity_code TEXT,
  is_red_diamond INTEGER NOT NULL DEFAULT 0,
  primary_position TEXT,
  secondary_positions_json TEXT,
  bats_hand TEXT,
  throws_hand TEXT,
  nationality_code TEXT,
  wbc_eligible INTEGER,
  wbc_program_code TEXT,
  ovr INTEGER,
  attributes_json TEXT,
  acquisition_json TEXT,
  collection_links_json TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  source_confidence TEXT NOT NULL
);

CREATE TABLE dd26_market_listings (
  listing_id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  listing_type TEXT NOT NULL,
  price INTEGER,
  quantity INTEGER,
  observed_at TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_payload_hash TEXT,
  FOREIGN KEY(card_id) REFERENCES dd26_cards(card_id)
);

CREATE TABLE dd26_market_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  interval_type TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  best_buy_price INTEGER,
  best_sell_price INTEGER,
  spread INTEGER,
  liquidity_score REAL,
  volatility_24h REAL,
  volume_24h INTEGER,
  source_name TEXT NOT NULL,
  source_class TEXT NOT NULL,
  FOREIGN KEY(card_id) REFERENCES dd26_cards(card_id)
);

CREATE TABLE dd26_price_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  bucket TEXT NOT NULL,
  value_buy INTEGER,
  value_sell INTEGER,
  spread INTEGER,
  volume INTEGER,
  source_class TEXT NOT NULL,
  UNIQUE(card_id, ts, bucket, source_class),
  FOREIGN KEY(card_id) REFERENCES dd26_cards(card_id)
);

CREATE TABLE dd26_watchlists (
  watchlist_id TEXT PRIMARY KEY,
  owner_subject TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE dd26_watchlist_items (
  watchlist_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  alert_rules_json TEXT,
  added_at TEXT NOT NULL,
  PRIMARY KEY (watchlist_id, card_id),
  FOREIGN KEY(watchlist_id) REFERENCES dd26_watchlists(watchlist_id),
  FOREIGN KEY(card_id) REFERENCES dd26_cards(card_id)
);

CREATE TABLE dd26_event_annotations (
  event_id TEXT PRIMARY KEY,
  card_id TEXT,
  event_ts TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_verified INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(card_id) REFERENCES dd26_cards(card_id)
);

CREATE TABLE dd26_collection_progress (
  subject_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  status_code TEXT NOT NULL,
  completed_count INTEGER,
  required_count INTEGER,
  reward_card_id TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(subject_id, collection_id)
);
```

### KV and R2 usage plan

KV is for fast-read, short TTL materialized views:

- `dd26:cards:index:{filterHash}` TTL 60-180s
- `dd26:card:{cardId}:summary` TTL 30-120s
- `dd26:market:movers:{window}` TTL 15-60s
- `dd26:watchlist:{subject}:digest` TTL 30-90s
- `dd26:source:health` TTL 15-30s

R2 is for immutable or large artifacts:

- Raw source payload archives (`source=<name>/date=YYYY-MM-DD/hour=HH/...json.gz`)
- Daily full snapshot parquet/json exports for replay
- Ingestion error dumps requiring forensic retention

### Ingestion pipeline design

Pipeline phases in `workers/dd26-ingest`:

1. Source discovery/health check: probe verified official endpoints, classify status (`up`, `auth_required`, `blocked`, `schema_changed`).
2. Fetch stage: use per-source adapter implementing a strict interface (`fetchCards`, `fetchMarket`, `fetchCollections`) and emit raw payload to R2 before transform.
3. Validate stage: JSON schema checks per adapter version; reject unknown required-field deletions.
4. Normalize stage: map source payloads into D1 canonical tables with field-level provenance.
5. Publish stage: update KV materializations and emit ingestion metrics.

Retries and limits:

- Exponential backoff with jitter (e.g., 1s, 2s, 4s, 8s max 5 tries).
- Per-source concurrency caps.
- Circuit breaker opens when repeated 4xx/5xx or schema validation failures exceed threshold.

### Market snapshot strategy

Source classes and merge logic:

- `official_live`: near-live listing/order-book state (if available).
- `official_daily`: sanctioned daily exports/snapshots (if available).
- `blaze_intraday`: Blaze-captured polling derived from official endpoints.

Freshness and precedence:

1. Use `official_live` when fresh within 2 minutes.
2. Else fall back to latest `blaze_intraday` within configured SLA.
3. Else display `official_daily` as stale-safe baseline.
4. If none fresh, show explicit data-unavailable state and suppress derived signals.

Merge rule is deterministic by `(card_id, timestamp, source_class_priority)`; never average conflicting price points across source classes.

### Historical tracking model

Store both raw points and rolled windows:

- Intraday points in `dd26_price_series` at source cadence.
- Rollups computed for 24h/7d/30d/all-time.
- Volatility score uses rolling standard deviation on log returns when point count threshold is met; otherwise unavailable.
- Event annotations linked only when source URL is verifiable (official post, patch notes, content drop notice).

### Source-of-truth hierarchy

1. Official MLBTS26 structured endpoints/docs (if available).
2. Official MLBTS26 web payloads captured from publicly served responses.
3. Blaze normalized historical derivatives computed from (1) or (2).
4. User-specific watchlist metadata (Blaze-owned).

Any field outside this hierarchy is marked unsupported, not inferred.

### API contract design for BlazeSportsIntel.com integration

Namespace all API under `/api/dd26/v1`.

Core reads:

- `GET /cards?filters=...&page=...`
- `GET /cards/{cardId}`
- `GET /cards/{cardId}/market?window=24h|7d|30d|all`
- `GET /team-builder/context` (positions, roster rules, captain/theme metadata when sourceable)
- `GET /collections`
- `GET /watchlists/{subject}`
- `GET /data-status`

Writes:

- `POST /watchlists/{subject}`
- `POST /watchlists/{subject}/items`
- `DELETE /watchlists/{subject}/items/{cardId}`

All responses include:

- `sourceClass`
- `sourceObservedAt`
- `freshnessSeconds`
- `confidence`
- `degradedReason` (nullable)

### Integration plan (adapter layer + naming)

Implement a thin adapter package so standalone page and Blaze core share contracts:

- `lib/dd26/contracts.ts` (types and zod/json schemas)
- `lib/dd26/adapters/source-*.ts` (per-source fetch/normalize)
- `lib/dd26/services/*.ts` (query orchestration)
- `app/dd26/*` for UI routes

Naming conventions:

- Prefix all domain tables, KV keys, metrics with `dd26_` or `dd26:`.
- Keep API versioned from day one (`v1`) to avoid migration churn.
- Isolate source-specific transforms from UI-facing DTOs.

### Error and degraded-mode states

The user should never see silent failure. Define explicit states:

- `LIVE`: official live source fresh and complete.
- `DELAYED`: live unavailable; intraday snapshot fallback.
- `SNAPSHOT_ONLY`: only daily official snapshots available.
- `SOURCE_BLOCKED`: no permitted source access; browsing disabled except explanatory data-status panel.
- `SCHEMA_MISMATCH`: source changed; ingestion paused; last-known-good timestamp shown.

In delayed or blocked modes, suppress alerts that imply real-time certainty.

## Risks

Primary risks are operational and legal, not UI complexity:

1. Anti-bot protections (403/503 patterns already observed) may prevent reliable unattended ingestion.
2. Rate limits may force lower polling cadence, weakening intraday precision.
3. Schema drift in undocumented endpoints can break transforms without warning.
4. Auth-gated data may make key features (inventory-aware collection state, personalized PXP/mod state) infeasible without user token flow and compliance review.
5. Terms-of-service constraints may prohibit historical warehousing or redistribution of marketplace data.
6. WBC/Red Diamond/PXP/mod semantics may be present in game UX but absent in public payloads; these must remain unavailable until source-backed.
