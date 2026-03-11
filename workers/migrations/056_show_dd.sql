CREATE TABLE IF NOT EXISTS show_cards (
  card_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  overall INTEGER NOT NULL,
  rarity TEXT NOT NULL,
  team TEXT NOT NULL,
  team_short_name TEXT NOT NULL,
  series TEXT NOT NULL,
  series_year INTEGER,
  set_name TEXT,
  is_live_set INTEGER NOT NULL DEFAULT 0,
  primary_position TEXT NOT NULL,
  secondary_positions_json TEXT NOT NULL,
  bats TEXT NOT NULL,
  throws TEXT NOT NULL,
  born TEXT,
  image_url TEXT NOT NULL,
  baked_image_url TEXT,
  locations_json TEXT NOT NULL,
  is_sellable INTEGER NOT NULL DEFAULT 1,
  has_augment INTEGER NOT NULL DEFAULT 0,
  augment_text TEXT,
  is_hitter INTEGER NOT NULL DEFAULT 1,
  attributes_json TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_show_cards_name ON show_cards(name);
CREATE INDEX IF NOT EXISTS idx_show_cards_team ON show_cards(team);
CREATE INDEX IF NOT EXISTS idx_show_cards_series ON show_cards(series);
CREATE INDEX IF NOT EXISTS idx_show_cards_rarity ON show_cards(rarity);
CREATE INDEX IF NOT EXISTS idx_show_cards_primary_position ON show_cards(primary_position);
CREATE INDEX IF NOT EXISTS idx_show_cards_overall ON show_cards(overall DESC);

CREATE TABLE IF NOT EXISTS show_card_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  overall INTEGER NOT NULL,
  attributes_json TEXT NOT NULL,
  source_name TEXT NOT NULL,
  UNIQUE(card_id, captured_at, source_name),
  FOREIGN KEY (card_id) REFERENCES show_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_show_card_attributes_card_time
  ON show_card_attributes(card_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS show_market_current (
  card_id TEXT PRIMARY KEY,
  best_buy_now INTEGER,
  best_sell_now INTEGER,
  last_sale_price INTEGER,
  mid_price INTEGER,
  spread INTEGER,
  listing_count INTEGER,
  source_kind TEXT NOT NULL,
  source_name TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  FOREIGN KEY (card_id) REFERENCES show_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_show_market_current_sell
  ON show_market_current(best_sell_now DESC);
CREATE INDEX IF NOT EXISTS idx_show_market_current_spread
  ON show_market_current(spread DESC);
CREATE INDEX IF NOT EXISTS idx_show_market_current_captured
  ON show_market_current(captured_at DESC);

CREATE TABLE IF NOT EXISTS show_market_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  best_buy_now INTEGER,
  best_sell_now INTEGER,
  last_sale_price INTEGER,
  mid_price INTEGER,
  spread INTEGER,
  listing_count INTEGER,
  source_kind TEXT NOT NULL,
  source_name TEXT NOT NULL,
  payload_r2_key TEXT,
  UNIQUE(card_id, captured_at, source_name),
  FOREIGN KEY (card_id) REFERENCES show_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_show_market_snapshots_card_time
  ON show_market_snapshots(card_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS show_market_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  label TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  best_buy_now INTEGER,
  best_sell_now INTEGER,
  last_sale_price INTEGER,
  spread INTEGER,
  listing_count INTEGER,
  series_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  UNIQUE(card_id, captured_at, series_type, source_name),
  FOREIGN KEY (card_id) REFERENCES show_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_show_market_daily_card_time
  ON show_market_daily(card_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS show_captains (
  card_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  overall INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  baked_image_url TEXT,
  position TEXT NOT NULL,
  ability_name TEXT NOT NULL,
  ability_description TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  boosts_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_show_captains_team ON show_captains(team);

CREATE TABLE IF NOT EXISTS show_collections (
  collection_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  card_count INTEGER NOT NULL DEFAULT 0,
  low_stub_cost INTEGER,
  high_stub_cost INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_show_collections_type ON show_collections(type);

CREATE TABLE IF NOT EXISTS show_collection_cards (
  collection_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  PRIMARY KEY (collection_id, card_id),
  FOREIGN KEY (collection_id) REFERENCES show_collections(collection_id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES show_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_show_collection_cards_card
  ON show_collection_cards(card_id);

CREATE TABLE IF NOT EXISTS show_acquisition_paths (
  card_id TEXT NOT NULL,
  label TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  confidence TEXT NOT NULL,
  PRIMARY KEY (card_id, label),
  FOREIGN KEY (card_id) REFERENCES show_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_show_acquisition_paths_label
  ON show_acquisition_paths(label);

CREATE TABLE IF NOT EXISTS show_builds (
  build_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  season_label TEXT NOT NULL,
  captain_card_id TEXT,
  cards_json TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS show_watch_events (
  event_id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_label TEXT NOT NULL,
  previous_value INTEGER,
  current_value INTEGER,
  delta_value INTEGER,
  triggered_at TEXT NOT NULL,
  details_json TEXT NOT NULL,
  FOREIGN KEY (card_id) REFERENCES show_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_show_watch_events_card_time
  ON show_watch_events(card_id, triggered_at DESC);

CREATE TABLE IF NOT EXISTS show_ingest_runs (
  run_id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  records_written INTEGER NOT NULL DEFAULT 0,
  degraded INTEGER NOT NULL DEFAULT 0,
  error_text TEXT,
  payload_manifest_r2_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_show_ingest_runs_job_time
  ON show_ingest_runs(job_type, started_at DESC);
