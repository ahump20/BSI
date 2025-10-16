#!/usr/bin/env bash
# ============================================================================
# Blaze Sports Intel - D1 Database Schema Deployment Script
# ============================================================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="blazesports-historical"
SCHEMA_FILE="db/schema.sql"
SEED_FILE="db/seed.sql"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Blaze Sports Intel - D1 Database Deployment${NC}"
echo -e "${BLUE}============================================================================${NC}\n"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI not found${NC}"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✓ wrangler CLI found${NC}\n"

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Error: Schema file not found at $SCHEMA_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Schema file found${NC}\n"

# Step 1: Check if database exists
echo -e "${YELLOW}📊 Checking if database exists...${NC}"
if wrangler d1 list | grep -q "$DB_NAME"; then
    echo -e "${GREEN}✓ Database '$DB_NAME' exists${NC}\n"

    # Ask for confirmation before applying schema
    read -p "Apply schema to existing database? This will DROP and recreate all tables. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠ Deployment cancelled${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}⚠ Database '$DB_NAME' not found${NC}"
    echo -e "${BLUE}Creating new database...${NC}\n"

    # Create the database
    wrangler d1 create "$DB_NAME"

    echo -e "\n${GREEN}✓ Database created successfully${NC}"
    echo -e "${YELLOW}⚠ Important: Copy the database_id from above and add to wrangler.toml${NC}\n"

    read -p "Press Enter once you've updated wrangler.toml..."
fi

# Step 2: Apply schema
echo -e "\n${BLUE}📝 Applying database schema...${NC}\n"

if wrangler d1 execute "$DB_NAME" --file="$SCHEMA_FILE" --remote; then
    echo -e "\n${GREEN}✓ Schema applied successfully${NC}\n"
else
    echo -e "\n${RED}❌ Error applying schema${NC}"
    exit 1
fi

# Step 3: Verify schema
echo -e "${BLUE}🔍 Verifying schema...${NC}\n"

TABLE_COUNT=$(wrangler d1 execute "$DB_NAME" --remote --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" --json | jq -r '.[0].results[0].count')

echo -e "Tables created: ${GREEN}$TABLE_COUNT${NC}"

if [ "$TABLE_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No tables created. Schema deployment may have failed.${NC}"
    exit 1
fi

# List all tables
echo -e "\n${BLUE}Tables:${NC}"
wrangler d1 execute "$DB_NAME" --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;" --json | jq -r '.[0].results[].name' | sed 's/^/  - /'

# Step 4: Seed data (optional)
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "Do you want to insert sample seed data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "$SEED_FILE" ]; then
        echo -e "\n${BLUE}🌱 Inserting seed data...${NC}\n"

        if wrangler d1 execute "$DB_NAME" --file="$SEED_FILE" --remote; then
            echo -e "\n${GREEN}✓ Seed data inserted successfully${NC}\n"

            # Show some stats
            echo -e "${BLUE}Database Statistics:${NC}"
            wrangler d1 execute "$DB_NAME" --remote --command="
                SELECT
                    (SELECT COUNT(*) FROM teams) as teams,
                    (SELECT COUNT(*) FROM players) as players,
                    (SELECT COUNT(*) FROM games) as games,
                    (SELECT COUNT(*) FROM conferences) as conferences
            " --json | jq -r '.[0].results[0] | to_entries | .[] | "  - \(.key): \(.value)"'
        else
            echo -e "\n${RED}❌ Error inserting seed data${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Seed file not found at $SEED_FILE${NC}"
    fi
fi

# Step 5: Test query
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Running test query...${NC}\n"

wrangler d1 execute "$DB_NAME" --remote --command="
    SELECT
        name AS team_name,
        school,
        abbreviation,
        city || ', ' || state AS location
    FROM teams
    WHERE is_active = 1
    LIMIT 5
" --json | jq -r '.[0].results[] | "\(.team_name) (\(.abbreviation)) - \(.school) - \(.location)"' | sed 's/^/  /'

# Success message
echo -e "\n${GREEN}============================================================================${NC}"
echo -e "${GREEN}✓ D1 Database Deployment Complete!${NC}"
echo -e "${GREEN}============================================================================${NC}\n"

echo -e "${BLUE}Database Name:${NC} $DB_NAME"
echo -e "${BLUE}Schema Version:${NC} 1.0.0"
echo -e "${BLUE}Total Tables:${NC} $TABLE_COUNT\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Verify wrangler.toml has the correct database binding"
echo -e "  2. Test the database from a Worker function"
echo -e "  3. Set up data ingestion pipeline"
echo -e "  4. Configure automated backups\n"

echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  • List databases:        ${GREEN}wrangler d1 list${NC}"
echo -e "  • Query database:        ${GREEN}wrangler d1 execute $DB_NAME --remote --command=\"SELECT * FROM teams LIMIT 5\"${NC}"
echo -e "  • Backup database:       ${GREEN}wrangler d1 export $DB_NAME > backup.sql${NC}"
echo -e "  • View schema:           ${GREEN}wrangler d1 execute $DB_NAME --remote --command=\"SELECT sql FROM sqlite_master WHERE type='table'\"${NC}\n"

echo -e "${GREEN}Deployment complete! 🎉${NC}\n"
