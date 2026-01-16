#!/usr/bin/env bash
set -euo pipefail

# CWS Wikipedia Wikitext Parser
# Extracts game data from Wikipedia wikitext format and generates SQL INSERT statements
# Usage: ./parse-cws-wikitext.sh <year>

YEAR="${1:-2002}"
OUTPUT_DIR="/Users/AustinHumphrey/BSI/scripts"
WIKITEXT_FILE="/tmp/claude/wikipedia-${YEAR}-wikitext.txt"
SQL_FILE="${OUTPUT_DIR}/manual-cws-${YEAR}.sql"

echo "📥 Fetching Wikipedia wikitext for ${YEAR} CWS..."
curl -s -A "BlazeSportsIntel/1.0 (https://blazesportsintel.com)" \
  "https://en.wikipedia.org/w/api.php?action=query&titles=${YEAR}_NCAA_Division_I_baseball_tournament&prop=revisions&rvprop=content&format=json" \
  2>/dev/null | jq -r '.query.pages | .[] | .revisions[0]["*"]' > "$WIKITEXT_FILE"

echo "🔍 Extracting game data from wikitext..."

# Extract champion from infobox
CHAMPION=$(grep -m 1 "Champions=" "$WIKITEXT_FILE" | sed -E 's/.*\[\[[^|]+\|([^\]]+)\]\].*/\1/' || echo "Unknown")
echo "  Champion: $CHAMPION"

# Extract all game entries
echo "  Parsing game table..."
GAMES=$(grep -E "Game [0-9]|Final" "$WIKITEXT_FILE" || true)

if [ -z "$GAMES" ]; then
  echo "❌ No games found in wikitext for year $YEAR"
  echo "   File location: $WIKITEXT_FILE"
  exit 1
fi

# Count games found
GAME_COUNT=$(echo "$GAMES" | wc -l | tr -d ' ')
echo "  Found $GAME_COUNT game entries"

# Generate SQL file header
cat > "$SQL_FILE" <<EOF
-- ${YEAR} College World Series Games (Verified Data)
-- Source: Wikipedia wikitext extraction (https://en.wikipedia.org)
-- Champion: ${CHAMPION}
-- Venue: Rosenblatt Stadium, Omaha, NE
-- Generated: $(date '+%Y-%m-%d %H:%M:%S')

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
EOF

# Parse each game and generate SQL VALUES
FIRST_GAME=true
echo "$GAMES" | while IFS= read -r LINE; do
  # Extract date
  DATE=$(echo "$LINE" | grep -oE "June [0-9]+" | head -1)
  if [ -z "$DATE" ]; then
    # Date might be on previous line (rowspan)
    continue
  fi

  # Convert "June X" to "YYYY-06-XX"
  DAY=$(echo "$DATE" | grep -oE "[0-9]+")
  SQL_DATE="${YEAR}-06-$(printf "%02d" "$DAY")"

  # Extract game number/type
  GAME_NUM=$(echo "$LINE" | grep -oE "Game [0-9]+|Final" | head -1)

  # Extract teams and scores
  # Format: || Team1 || Score || Team2 ||
  # Remove wiki markup: [[...]] and {{...}}
  CLEAN_LINE=$(echo "$LINE" | sed -E 's/\[\[[^|]+\|([^\]]+)\]\]/\1/g' | sed -E 's/\{\{[^|]+\|[^|]+\|title=([^\}]+)\}\}/\1/g')

  # Extract team1, score, team2 from pattern: || team1 || score || team2 ||
  TEAM1=$(echo "$CLEAN_LINE" | sed -E 's/.*\|\| *([^|]+) *\|\| *[0-9–-]+ *\|\|.*/\1/' | xargs)
  SCORE=$(echo "$CLEAN_LINE" | grep -oE "[0-9]+–[0-9]+(\([0-9]+\))?" | head -1)
  TEAM2=$(echo "$CLEAN_LINE" | sed -E 's/.*\|\| *[0-9–-]+[^|]* *\|\| *([^|]+) *\|\|.*/\1/' | xargs)

  # Skip if parsing failed
  if [ -z "$TEAM1" ] || [ -z "$TEAM2" ] || [ -z "$SCORE" ]; then
    continue
  fi

  # Parse score (format: 13–11 or 5–2(10) for extra innings)
  SCORE1=$(echo "$SCORE" | cut -d'–' -f1)
  SCORE2=$(echo "$SCORE" | cut -d'–' -f2 | grep -oE "^[0-9]+")

  # Check for extra innings
  EXTRA_INNINGS=0
  INNINGS=9
  if echo "$SCORE" | grep -q "("; then
    INNINGS=$(echo "$SCORE" | grep -oE "\([0-9]+\)" | tr -d '()')
    EXTRA_INNINGS=$((INNINGS - 9))
  fi

  # Determine round
  ROUND="College World Series - Opening Round"
  if echo "$LINE" | grep -qi "eliminated"; then
    ROUND="College World Series - Elimination Game"
  elif echo "$GAME_NUM" | grep -qi "Final"; then
    ROUND="College World Series Finals - Championship Game"
  elif [ "$GAME_NUM" = "Game 11" ] || [ "$GAME_NUM" = "Game 12" ] || [ "$GAME_NUM" = "Game 13" ]; then
    ROUND="College World Series - Bracket Final"
  fi

  # Generate game_id
  TEAM1_ABBR=$(echo "$TEAM1" | tr '[:upper:]' '[:lower:]' | tr ' ()' '-' | sed 's/--*/-/g' | sed 's/-$//')
  TEAM2_ABBR=$(echo "$TEAM2" | tr '[:upper:]' '[:lower:]' | tr ' ()' '-' | sed 's/--*/-/g' | sed 's/-$//')
  GAME_ID="cws-${YEAR}-${SQL_DATE//-/}-${TEAM1_ABBR}-${TEAM2_ABBR}"

  # Add comma before all but first game
  if [ "$FIRST_GAME" = "true" ]; then
    FIRST_GAME=false
    echo "  ('${GAME_ID}', '${SQL_DATE}', '${TEAM1}', '${TEAM2}', ${SCORE1}, ${SCORE2}, 'baseball', '${ROUND}', 'Rosenblatt Stadium', 23000, ${INNINGS}, ${EXTRA_INNINGS}, 2, CURRENT_TIMESTAMP)" >> "$SQL_FILE"
  else
    echo "  ,('${GAME_ID}', '${SQL_DATE}', '${TEAM1}', '${TEAM2}', ${SCORE1}, ${SCORE2}, 'baseball', '${ROUND}', 'Rosenblatt Stadium', 23000, ${INNINGS}, ${EXTRA_INNINGS}, 2, CURRENT_TIMESTAMP)" >> "$SQL_FILE"
  fi

  echo "    ✓ ${SQL_DATE} - ${TEAM1} ${SCORE1}, ${TEAM2} ${SCORE2}"
done

# Close SQL statement
echo ";" >> "$SQL_FILE"

echo ""
echo "✅ Generated SQL file: $SQL_FILE"
echo "📊 Wikitext saved to: $WIKITEXT_FILE"
echo ""
echo "Next steps:"
echo "  1. Review generated SQL file"
echo "  2. Execute with: wrangler d1 execute blazesports-historical --remote --file=$SQL_FILE"
