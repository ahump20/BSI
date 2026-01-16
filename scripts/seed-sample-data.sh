#!/usr/bin/env bash

# ============================================================================
# Scouting Intel Copilot - Sample Data Seeder
# ============================================================================
# Inserts sample game data for testing semantic search and RAG features.
#
# Usage:
#   chmod +x scripts/seed-sample-data.sh
#   ./scripts/seed-sample-data.sh
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

WRANGLER_CMD="${WRANGLER:-/Users/AustinHumphrey/.npm-global/bin/wrangler}"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🌱 Blaze Sports Intel - Sample Data Seeder                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Sample team and game data SQL
# Using separate commands to avoid foreign key issues
SQL="
INSERT OR IGNORE INTO teams (sport, team_id, key, name, city, conference, division)
VALUES
  ('NFL', 1001, 'KC', 'Kansas City Chiefs', 'Kansas City', 'AFC', 'West'),
  ('NFL', 1002, 'MIN', 'Minnesota Vikings', 'Minnesota', 'NFC', 'North'),
  ('NFL', 1003, 'BAL', 'Baltimore Ravens', 'Baltimore', 'AFC', 'North'),
  ('NFL', 1004, 'CIN', 'Cincinnati Bengals', 'Cincinnati', 'AFC', 'North'),
  ('MLB', 2001, 'STL', 'St. Louis Cardinals', 'St. Louis', 'NL', 'Central'),
  ('MLB', 2002, 'CHC', 'Chicago Cubs', 'Chicago', 'NL', 'Central'),
  ('MLB', 2003, 'LAD', 'Los Angeles Dodgers', 'Los Angeles', 'NL', 'West'),
  ('MLB', 2004, 'COL', 'Colorado Rockies', 'Colorado', 'NL', 'West'),
  ('CFB', 3001, 'TEX', 'Texas Longhorns', 'Austin', 'SEC', NULL),
  ('CFB', 3002, 'OU', 'Oklahoma Sooners', 'Norman', 'SEC', NULL),
  ('CFB', 3003, 'ALA', 'Alabama Crimson Tide', 'Tuscaloosa', 'SEC', 'West'),
  ('CFB', 3004, 'MISS', 'Ole Miss Rebels', 'Oxford', 'SEC', 'West'),
  ('CBB', 4001, 'UK', 'Kentucky Wildcats', 'Lexington', 'SEC', NULL),
  ('CBB', 4002, 'LOU', 'Louisville Cardinals', 'Louisville', 'ACC', NULL),
  ('CBB', 4003, 'DUKE', 'Duke Blue Devils', 'Durham', 'ACC', NULL),
  ('CBB', 4004, 'UNC', 'North Carolina Tar Heels', 'Chapel Hill', 'ACC', NULL);
"

echo -e "${YELLOW}Inserting teams...${NC}"
if $WRANGLER_CMD d1 execute blazesports-db --remote --command="$SQL"; then
  echo -e "${GREEN}✓ Teams inserted${NC}"
else
  echo -e "${RED}✗ Team insertion failed${NC}"
  exit 1
fi

echo ""

# Now insert games
SQL2="
INSERT INTO games (sport, game_id, season, season_type, week, game_date, game_time, status,
  home_team_id, home_team_key, home_team_name, home_score,
  away_team_id, away_team_key, away_team_name, away_score,
  stadium_name, winning_team_id)
VALUES
  ('NFL', 10001, 2025, 'REG', 5, '2025-10-05', '13:00', 'Final',
   1001, 'KC', 'Kansas City Chiefs', 28,
   1002, 'MIN', 'Minnesota Vikings', 24,
   'Arrowhead Stadium', 1001),

  ('NFL', 10002, 2025, 'REG', 5, '2025-10-06', '16:25', 'Final',
   1003, 'BAL', 'Baltimore Ravens', 31,
   1004, 'CIN', 'Cincinnati Bengals', 27,
   'M&T Bank Stadium', 1003),

  ('MLB', 20001, 2025, 'REG', NULL, '2025-09-28', '19:10', 'Final',
   2001, 'STL', 'St. Louis Cardinals', 4,
   2002, 'CHC', 'Chicago Cubs', 2,
   'Busch Stadium', 2001),

  ('MLB', 20002, 2025, 'REG', NULL, '2025-09-29', '13:15', 'Final',
   2003, 'LAD', 'Los Angeles Dodgers', 5,
   2004, 'COL', 'Colorado Rockies', 3,
   'Dodger Stadium', 2003),

  ('CFB', 30001, 2025, 'REG', 7, '2025-10-12', '15:30', 'Final',
   3001, 'TEX', 'Texas Longhorns', 34,
   3002, 'OU', 'Oklahoma Sooners', 24,
   'Darrell K Royal-Texas Memorial Stadium', 3001),

  ('CFB', 30002, 2025, 'REG', 7, '2025-10-12', '19:00', 'Final',
   3003, 'ALA', 'Alabama Crimson Tide', 42,
   3004, 'MISS', 'Ole Miss Rebels', 28,
   'Bryant-Denny Stadium', 3003),

  ('CBB', 40001, 2025, 'REG', NULL, '2025-11-15', '20:00', 'Final',
   4001, 'UK', 'Kentucky Wildcats', 78,
   4002, 'LOU', 'Louisville Cardinals', 72,
   'Rupp Arena', 4001),

  ('CBB', 40002, 2025, 'REG', NULL, '2025-11-16', '18:00', 'Final',
   4003, 'DUKE', 'Duke Blue Devils', 85,
   4004, 'UNC', 'North Carolina Tar Heels', 81,
   'Cameron Indoor Stadium', 4003);
"

echo -e "${YELLOW}Inserting games...${NC}"

if $WRANGLER_CMD d1 execute blazesports-db --remote --command="$SQL2"; then
  echo ""
  echo -e "${GREEN}✓ Sample data inserted successfully${NC}"
  echo ""

  # Verify insertion
  echo -e "${YELLOW}Verifying data...${NC}"
  $WRANGLER_CMD d1 execute blazesports-db --remote --command="SELECT sport, COUNT(*) as count FROM games GROUP BY sport;"

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✓ Sample Data Ready!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "📋 Next Steps:"
  echo ""
  echo "  1. Generate embeddings:"
  echo "     curl -X POST https://blazesportsintel.com/api/copilot/embed \\"
  echo "       -H 'Content-Type: application/json' \\"
  echo "       -d '{\"all\": true}'"
  echo ""
  echo "  2. Test semantic search:"
  echo "     curl -X POST https://blazesportsintel.com/api/copilot/search \\"
  echo "       -H 'Content-Type: application/json' \\"
  echo "       -d '{\"query\": \"Cardinals recent games\"}'"
  echo ""
  echo "  3. Run comprehensive tests:"
  echo "     ./scripts/test-copilot-week2.sh"
  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
else
  echo ""
  echo -e "${RED}✗ Failed to insert sample data${NC}"
  exit 1
fi
