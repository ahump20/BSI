#!/bin/bash

# Simulate a live game by replaying sample events
# Usage: ./test-data/simulate-game.sh [worker-url] [delay-seconds]

WORKER_URL=${1:-"http://localhost:8788"}
DELAY=${2:-3}
SECRET=${INGEST_SECRET:-"test-secret"}

echo "🔥 Simulating live game..."
echo "Worker: $WORKER_URL"
echo "Delay: ${DELAY}s between events"
echo ""

# Read sample game data
GAME_FILE="test-data/sample-game.json"

if [ ! -f "$GAME_FILE" ]; then
  echo "❌ Error: $GAME_FILE not found"
  exit 1
fi

GAME_ID=$(jq -r '.gameId' "$GAME_FILE")
HOME_TEAM=$(jq -r '.homeTeam' "$GAME_FILE")
AWAY_TEAM=$(jq -r '.awayTeam' "$GAME_FILE")

echo "📊 Game: $AWAY_TEAM @ $HOME_TEAM"
echo "🆔 Game ID: $GAME_ID"
echo ""
echo "📺 Watch live at: $WORKER_URL/dashboard.html?gameId=$GAME_ID"
echo ""
echo "Press Ctrl+C to stop"
echo ""
sleep 2

# Iterate through events
NUM_EVENTS=$(jq '.events | length' "$GAME_FILE")

for i in $(seq 0 $((NUM_EVENTS - 1))); do
  EVENT=$(jq -c ".events[$i]" "$GAME_FILE")

  # Extract key fields for display
  INNING=$(echo "$EVENT" | jq -r '.inning')
  HALF=$(echo "$EVENT" | jq -r '.inningHalf')
  OUTS=$(echo "$EVENT" | jq -r '.outs')
  EVENT_TYPE=$(echo "$EVENT" | jq -r '.eventType')
  DESC=$(echo "$EVENT" | jq -r '.description')
  HOME_SCORE=$(echo "$EVENT" | jq -r '.homeScore')
  AWAY_SCORE=$(echo "$EVENT" | jq -r '.awayScore')

  # Add gameId and sport to event
  FULL_EVENT=$(echo "$EVENT" | jq -c ". + {gameId: \"$GAME_ID\", sport: \"baseball\"}")

  echo "▶️  Inning ${INNING} ${HALF}, ${OUTS} outs | ${AWAY_TEAM} $AWAY_SCORE - $HOME_SCORE ${HOME_TEAM}"
  echo "   ${EVENT_TYPE}: ${DESC}"

  # Send event to worker
  RESPONSE=$(curl -s -X POST "$WORKER_URL/ingest" \
    -H "Content-Type: application/json" \
    -H "X-Ingest-Secret: $SECRET" \
    -d "$FULL_EVENT")

  # Display win probability if available
  WIN_PROB=$(echo "$RESPONSE" | jq -r '.winProb.home // "N/A"')
  if [ "$WIN_PROB" != "N/A" ]; then
    WIN_PCT=$(echo "$WIN_PROB * 100" | bc -l | xargs printf "%.1f")
    echo "   📈 ${HOME_TEAM} Win Prob: ${WIN_PCT}%"
  fi

  echo ""

  # Delay before next event
  sleep "$DELAY"
done

echo "✅ Game simulation complete!"
echo ""
echo "📊 View final state: $WORKER_URL/snapshot/$GAME_ID"
