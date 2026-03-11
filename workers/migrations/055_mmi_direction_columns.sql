-- Migration 055: Add direction, magnitude, event_description to mmi_snapshots
-- Fixes schema-code mismatch causing ~20 errors/day on MMI analytics endpoint
-- Referenced by: workers/handlers/analytics.ts:346, workers/handlers/cron.ts:743

ALTER TABLE mmi_snapshots ADD COLUMN direction TEXT;
ALTER TABLE mmi_snapshots ADD COLUMN magnitude REAL;
ALTER TABLE mmi_snapshots ADD COLUMN event_description TEXT;
