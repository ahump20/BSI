#!/bin/bash

# Create D1 Database for Blaze Intelligence Leads

echo "🗄️ Setting up D1 Database for lead storage..."

# Create the database
wrangler d1 create blaze-leads 2>&1 | tee d1-output.txt

# Extract the database ID
DB_ID=$(grep "database_id" d1-output.txt | sed 's/.*database_id = "\([^"]*\)".*/\1/')

if [ -z "$DB_ID" ]; then
    echo "⚠️ Database might already exist. Checking..."
    DB_ID=$(wrangler d1 list | grep "blaze-leads" | awk '{print $2}')
fi

echo "📝 Database ID: $DB_ID"

# Create the schema
cat > leads-schema.sql << 'EOF'
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
EOF

# Execute the schema
echo "📊 Creating database schema..."
wrangler d1 execute blaze-leads --file=leads-schema.sql

# Add some test data (optional)
cat > test-data.sql << 'EOF'
-- Insert test lead (optional)
INSERT INTO leads (name, email, organization, sport, message, source)
VALUES ('Test User', 'test@example.com', 'Test Org', 'MLB', 'This is a test lead', 'Setup Script');
EOF

echo "🧪 Adding test data..."
wrangler d1 execute blaze-leads --file=test-data.sql

# Update wrangler.toml with the database binding
echo "
📝 Add this to your wrangler.toml file:

[[d1_databases]]
binding = \"DB\"
database_name = \"blaze-leads\"
database_id = \"$DB_ID\"

Or for production environment:

[env.production.d1_databases]
[[env.production.d1_databases]]
binding = \"DB\"
database_name = \"blaze-leads\"
database_id = \"$DB_ID\"
"

# Query the database to verify
echo "✅ Verifying database setup..."
wrangler d1 execute blaze-leads --command="SELECT * FROM leads;"

# Clean up
rm -f d1-output.txt leads-schema.sql test-data.sql

echo "
🎉 D1 Database setup complete!
Database Name: blaze-leads
Database ID: $DB_ID

Next steps:
1. Update your wrangler.toml with the database binding
2. Deploy the worker: wrangler deploy --env production
3. Test the lead endpoint
"