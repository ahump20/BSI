-- Migration 057: Add missing components column to mmi_snapshots
-- direction, magnitude, event_description were added previously.
-- Only components (JSON blob) is missing.

ALTER TABLE mmi_snapshots ADD COLUMN components TEXT;
