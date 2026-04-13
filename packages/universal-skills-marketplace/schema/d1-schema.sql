-- Universal Skills Marketplace — D1 Schema
-- 5 tables + 1 FTS5 virtual table + triggers + indexes
-- Compatible with Cloudflare D1 (SQLite)

-- ============================================================
-- 1. skills — one row per unique skill
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  source_ecosystem TEXT NOT NULL CHECK (source_ecosystem IN ('claude', 'codex', 'standalone', 'unknown')),
  source_url       TEXT NOT NULL,
  source_repo      TEXT NOT NULL,
  source_commit    TEXT,
  source_path      TEXT NOT NULL,
  manifest_format  TEXT NOT NULL CHECK (manifest_format IN ('claude-plugin', 'codex-plugin', 'standalone-skill', 'unknown')),
  quality_score    INTEGER NOT NULL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  install_count    INTEGER NOT NULL DEFAULT 0,
  star_count       INTEGER NOT NULL DEFAULT 0,
  content_hash     TEXT,
  compat_claude    INTEGER NOT NULL DEFAULT 0,
  compat_codex     INTEGER NOT NULL DEFAULT 0,
  tags             TEXT DEFAULT '[]',       -- JSON array of strings
  category         TEXT,
  last_verified    TEXT,                     -- ISO 8601
  indexed_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  tombstoned       INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 2. skill_versions — version history per skill
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_versions (
  skill_id      TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  version       TEXT NOT NULL,
  content_hash  TEXT NOT NULL,
  source_commit TEXT,
  indexed_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (skill_id, version)
);

-- ============================================================
-- 3. skill_references — progressive-disclosure files per version
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_references (
  skill_id   TEXT NOT NULL,
  version    TEXT NOT NULL,
  ref_path   TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'reference' CHECK (kind IN ('reference', 'script', 'asset', 'template', 'fixture', 'unknown')),
  sha256     TEXT,
  size_bytes INTEGER,
  mime       TEXT,
  PRIMARY KEY (skill_id, version, ref_path),
  FOREIGN KEY (skill_id, version) REFERENCES skill_versions(skill_id, version) ON DELETE CASCADE
);

-- ============================================================
-- 4. sources — upstream repos we index
-- ============================================================
CREATE TABLE IF NOT EXISTS sources (
  name                 TEXT PRIMARY KEY,
  repo_url             TEXT NOT NULL,
  default_branch       TEXT NOT NULL DEFAULT 'main',
  last_sync_sha        TEXT,
  last_sync_at         TEXT,
  last_check_at        TEXT,
  last_result          TEXT CHECK (last_result IN ('success', 'partial', 'error', NULL)),
  error_message        TEXT,
  priority_tier        TEXT NOT NULL DEFAULT 'C' CHECK (priority_tier IN ('A', 'B', 'C')),
  poll_interval_seconds INTEGER NOT NULL DEFAULT 21600  -- 6 hours
);

-- ============================================================
-- 5. skills_fts — FTS5 full-text search over skills
-- ============================================================
CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  id UNINDEXED,
  name,
  description,
  tags,
  category,
  content='skills',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- ============================================================
-- FTS sync triggers (keep skills_fts in sync with skills)
-- ============================================================
CREATE TRIGGER IF NOT EXISTS skills_ai AFTER INSERT ON skills BEGIN
  INSERT INTO skills_fts(rowid, id, name, description, tags, category)
  VALUES (new.rowid, new.id, new.name, new.description, new.tags, new.category);
END;

CREATE TRIGGER IF NOT EXISTS skills_ad AFTER DELETE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, id, name, description, tags, category)
  VALUES ('delete', old.rowid, old.id, old.name, old.description, old.tags, old.category);
END;

CREATE TRIGGER IF NOT EXISTS skills_au AFTER UPDATE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, id, name, description, tags, category)
  VALUES ('delete', old.rowid, old.id, old.name, old.description, old.tags, old.category);
  INSERT INTO skills_fts(rowid, id, name, description, tags, category)
  VALUES (new.rowid, new.id, new.name, new.description, new.tags, new.category);
END;

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_skills_ecosystem ON skills(source_ecosystem);
CREATE INDEX IF NOT EXISTS idx_skills_quality ON skills(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_repo ON skills(source_repo);
CREATE INDEX IF NOT EXISTS idx_skills_hash ON skills(content_hash);
CREATE INDEX IF NOT EXISTS idx_skills_tombstoned ON skills(tombstoned);
CREATE INDEX IF NOT EXISTS idx_versions_skill ON skill_versions(skill_id);

-- ============================================================
-- Seed upstream sources (the 9 repos we index)
-- ============================================================
INSERT OR IGNORE INTO sources (name, repo_url, default_branch, priority_tier, poll_interval_seconds) VALUES
  ('anthropic-plugins-official', 'https://github.com/anthropics/claude-plugins-official', 'main', 'A', 21600),
  ('anthropic-skills',           'https://github.com/anthropics/skills',                  'main', 'A', 21600),
  ('anthropic-knowledge-work',   'https://github.com/anthropics/knowledge-work-plugins',  'main', 'A', 21600),
  ('openai-codex',               'https://github.com/openai/codex',                       'main', 'A', 21600),
  ('openai-codex-plugin-cc',     'https://github.com/openai/codex-plugin-cc',             'main', 'B', 21600),
  ('openai-plugins',             'https://github.com/openai/plugins',                     'main', 'B', 43200),
  ('openai-skills',              'https://github.com/openai/skills',                      'main', 'B', 43200),
  ('openai-swarm',               'https://github.com/openai/swarm',                       'main', 'C', 86400),
  ('openai-agents-python',       'https://github.com/openai/openai-agents-python',        'main', 'C', 86400);
