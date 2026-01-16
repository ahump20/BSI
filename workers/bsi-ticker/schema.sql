-- BSI Ticker D1 Schema
-- Stores ticker history for analytics and replay

CREATE TABLE IF NOT EXISTS ticker_history (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('score', 'news', 'injury', 'trade', 'weather')),
    league TEXT NOT NULL CHECK (league IN ('MLB', 'NFL', 'NCAAF', 'NBA', 'NCAABB')),
    headline TEXT NOT NULL,
    priority INTEGER NOT NULL CHECK (priority IN (1, 2, 3)),
    metadata TEXT, -- JSON string
    timestamp INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ticker_league ON ticker_history(league);
CREATE INDEX IF NOT EXISTS idx_ticker_type ON ticker_history(type);
CREATE INDEX IF NOT EXISTS idx_ticker_timestamp ON ticker_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ticker_priority ON ticker_history(priority);

-- Compound index for filtered queries
CREATE INDEX IF NOT EXISTS idx_ticker_league_timestamp ON ticker_history(league, timestamp DESC);
