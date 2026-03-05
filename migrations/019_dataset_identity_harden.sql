-- Dataset Identity Hardening (Phase 2)
-- Adds versioning, canonical identity storage, and collision tracking.
-- Additive-only — safe to run on existing data.

ALTER TABLE dataset_identity ADD COLUMN identity_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE dataset_identity ADD COLUMN canonical_identity TEXT;
ALTER TABLE dataset_identity ADD COLUMN last_good_snapshot_version INTEGER;
ALTER TABLE dataset_identity ADD COLUMN last_collision_at TEXT;

-- Recreate UNIQUE index to include identity_version
DROP INDEX IF EXISTS idx_identity_tuple;
CREATE UNIQUE INDEX idx_identity_tuple
  ON dataset_identity(identity_version, sport, competition_level, season, dataset_type, qualifier);
