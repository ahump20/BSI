-- Leads table for storing form submissions
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    sport TEXT,
    message TEXT,
    source TEXT DEFAULT 'Website',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_processed ON leads(processed);

-- Analytics events table (optional)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_data TEXT,
    user_id TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create a view for lead analytics
CREATE VIEW IF NOT EXISTS lead_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_leads,
    COUNT(DISTINCT sport) as unique_sports,
    COUNT(CASE WHEN processed = TRUE THEN 1 END) as processed_leads
FROM leads
GROUP BY DATE(created_at);