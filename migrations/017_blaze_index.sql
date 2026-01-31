-- Add blaze_index column to transfer_portal
ALTER TABLE transfer_portal ADD COLUMN blaze_index INTEGER DEFAULT NULL;

-- Index for sorting by blaze_index
CREATE INDEX IF NOT EXISTS idx_transfer_portal_blaze ON transfer_portal(blaze_index DESC);
