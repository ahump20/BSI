-- Migration 038: Add position and conference to havf_scores
-- These columns were referenced in handlers/analytics.ts but absent from
-- the original 034_havf_metric.sql schema. Added retroactively via ALTER TABLE
-- against bsi-prod-db on 2026-02-17.

ALTER TABLE havf_scores ADD COLUMN position TEXT;
ALTER TABLE havf_scores ADD COLUMN conference TEXT;
