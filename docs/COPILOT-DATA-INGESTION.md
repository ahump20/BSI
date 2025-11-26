# Scouting Intel Copilot - Data Ingestion Workflow

## Overview
This document describes how to add new game data to the Scouting Intel Copilot semantic search system.

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   D1 Database   │────▶│  Embedding API   │────▶│ Vectorize Index │
│   (Game Data)   │     │  (Workers AI)    │     │ (768-dim vectors)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                                   │
        │                                                   │
        ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Search API (/api/copilot/search)           │
│  1. Generate query embedding (bge-base-en-v1.5)                │
│  2. Search Vectorize for similar games                          │
│  3. Fetch full game records from D1                             │
│  4. Generate AI insights with LLaMA 3.1 8B                      │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Ingestion Process

### 1. Prepare Game Data

Create a SQL file with your game data following this schema:

```sql
-- teams table
INSERT OR REPLACE INTO teams (sport, team_id, key, name, city, conference, division)
VALUES
  ('NFL', 1001, 'KC', 'Kansas City Chiefs', 'Kansas City', 'AFC', 'West'),
  ('MLB', 2001, 'STL', 'St. Louis Cardinals', 'St. Louis', 'NL', 'Central');

-- games table
INSERT OR REPLACE INTO games (
  sport, game_id, season, season_type, week, game_date, game_time, status,
  home_team_id, home_team_key, home_team_name, home_score,
  away_team_id, away_team_key, away_team_name, away_score,
  stadium_name, winning_team_id
)
VALUES
  ('NFL', 10001, 2025, 'REG', 5, '2025-10-05', '13:00', 'Final',
   1001, 'KC', 'Kansas City Chiefs', 28,
   1002, 'MIN', 'Minnesota Vikings', 24,
   'Arrowhead Stadium', 1001);
```

**Important Notes:**
- Use `INSERT OR REPLACE` to handle updates to existing games
- Always include `PRAGMA foreign_keys = OFF;` at the start to avoid FK constraints
- Include `PRAGMA foreign_keys = ON;` at the end to re-enable constraints
- `sport` must be one of: 'NFL', 'MLB', 'CFB', 'CBB'
- `season_type` must be 'REG' or 'POST'
- `status` should be 'Scheduled', 'InProgress', 'Final', 'Postponed', or 'Canceled'

### 2. Insert Data into D1

**Method A: Via SQL File (Recommended)**

```bash
# Create SQL file (e.g., scripts/new-games.sql)
echo "PRAGMA foreign_keys = OFF;

INSERT OR REPLACE INTO teams ...

INSERT OR REPLACE INTO games ...

PRAGMA foreign_keys = ON;" > scripts/new-games.sql

# Execute the file
wrangler d1 execute blazesports-db --remote --file=scripts/new-games.sql
```

**Method B: Via Direct Command (Small datasets only)**

```bash
wrangler d1 execute blazesports-db --remote --command="
INSERT INTO games (sport, game_id, season, ...) VALUES (...);
"
```

### 3. Generate Embeddings

After inserting games into D1, generate embeddings for the new data:

**Option A: Generate embeddings for ALL games (safest)**

```bash
curl -X POST https://blazesportsintel.com/api/copilot/embed \
  -H 'Content-Type: application/json' \
  -d '{"all": true}'
```

**Option B: Generate embeddings for specific games**

```bash
curl -X POST https://blazesportsintel.com/api/copilot/embed \
  -H 'Content-Type: application/json' \
  -d '{"gameIds": [1, 2, 3, 4, 5]}'
```

**Expected Response:**

```json
{
  "success": true,
  "processed": 8,
  "games": 8,
  "timestamp": "2025-10-10T10:53:32.951Z",
  "timezone": "America/Chicago"
}
```

### 4. Test Semantic Search

Verify the new data is searchable:

```bash
curl -X POST https://blazesportsintel.com/api/copilot/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "Cardinals recent games", "limit": 5}' \
  | jq '.'
```

**Expected Response:**

```json
{
  "query": "Cardinals recent games",
  "results": [
    {
      "game": {
        "id": 3,
        "sport": "MLB",
        "home_team_name": "St. Louis Cardinals",
        "away_team_name": "Chicago Cubs",
        "home_score": 4,
        "away_score": 2,
        ...
      },
      "relevanceScore": 0.76
    }
  ],
  "insights": {
    "summary": "The St. Louis Cardinals recently played...",
    "confidence": 0.76,
    "sourceCount": 5
  }
}
```

## Troubleshooting

### Foreign Key Constraint Errors

**Error:** `foreign key mismatch - "depth_charts" referencing "teams"`

**Solution:** Always use `PRAGMA foreign_keys = OFF;` in your SQL file:

```sql
PRAGMA foreign_keys = OFF;

-- Your INSERT statements here

PRAGMA foreign_keys = ON;
```

### Empty Search Results

**Problem:** Search returns 0 results even after inserting data

**Checklist:**
1. ✅ Did you run the embed API after inserting games?
2. ✅ Did the embed API return `"success": true`?
3. ✅ Are the games actually in D1? Check with:
   ```bash
   wrangler d1 execute blazesports-db --remote --command="SELECT COUNT(*) FROM games;"
   ```

### Low Relevance Scores

**Problem:** Search returns results but relevance scores are low (<0.5)

**Explanation:** This is normal for semantic search. The system uses cosine similarity on 768-dimensional embeddings, so even "weak" matches will appear if there are no strong matches.

**Solutions:**
- Add more diverse game data to improve matching
- Use sport filters to narrow results: `{"query": "...", "sport": "MLB"}`
- Lower the limit: `{"query": "...", "limit": 3}` to get only top matches

## Database Schema Reference

### teams table

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| sport | TEXT | Yes | 'NFL', 'MLB', 'CFB', or 'CBB' |
| team_id | INTEGER | Yes | Unique team identifier |
| key | TEXT | No | Team abbreviation (e.g., 'KC', 'STL') |
| name | TEXT | Yes | Full team name |
| city | TEXT | No | City name |
| conference | TEXT | No | Conference (AFC/NFC, AL/NL, SEC, etc.) |
| division | TEXT | No | Division within conference |

### games table

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| sport | TEXT | Yes | 'NFL', 'MLB', 'CFB', or 'CBB' |
| game_id | INTEGER | Yes | Unique game identifier |
| season | INTEGER | Yes | Year (e.g., 2025) |
| season_type | TEXT | Yes | 'REG' or 'POST' |
| week | INTEGER | No | Week number (NFL/CFB only) |
| game_date | TEXT | Yes | Date in 'YYYY-MM-DD' format |
| game_time | TEXT | No | Time in 'HH:MM' format |
| status | TEXT | No | 'Scheduled', 'InProgress', 'Final', etc. |
| home_team_id | INTEGER | Yes | References teams(team_id) |
| home_team_key | TEXT | Yes | Home team abbreviation |
| home_team_name | TEXT | Yes | Home team full name |
| home_score | INTEGER | No | Home team final score |
| away_team_id | INTEGER | Yes | References teams(team_id) |
| away_team_key | TEXT | Yes | Away team abbreviation |
| away_team_name | TEXT | Yes | Away team full name |
| away_score | INTEGER | No | Away team final score |
| stadium_name | TEXT | No | Venue name |
| winning_team_id | INTEGER | No | Team ID of winner |

## Embedding Process Details

### How Embeddings Work

1. **Text Generation:** Each game is converted to a natural language description:
   ```
   "NFL game: Minnesota Vikings at Kansas City Chiefs on 2025-10-05. Score: 24-28. Status: Final. Stadium: Arrowhead Stadium."
   ```

2. **Embedding Generation:** The text is passed to Workers AI using the `@cf/baai/bge-base-en-v1.5` model, which outputs a 768-dimensional vector.

3. **Vectorize Storage:** The embedding is stored in Vectorize with metadata:
   ```json
   {
     "id": "game-1",
     "values": [0.123, -0.456, 0.789, ...],  // 768 numbers
     "metadata": {
       "game_id": 1,
       "sport": "NFL",
       "home_team": "Kansas City Chiefs",
       "away_team": "Minnesota Vikings",
       "game_date": "2025-10-05",
       "status": "Final"
     }
   }
   ```

### Search Process

1. **Query Embedding:** User query is converted to 768-dim vector
2. **Cosine Similarity:** Vectorize finds top K most similar game embeddings
3. **Database Fetch:** Full game records are retrieved from D1 using game IDs
4. **RAG Insights:** Top 3 games are sent to LLaMA 3.1 8B for contextual summary

## Automation Scripts

### Quick Seed Script

```bash
#!/usr/bin/env bash
# scripts/quick-seed.sh

WRANGLER="${WRANGLER:-wrangler}"

# Create temporary SQL file
cat > /tmp/seed.sql <<'EOF'
PRAGMA foreign_keys = OFF;

INSERT OR REPLACE INTO teams (sport, team_id, key, name, city, conference, division)
VALUES
  ('NFL', 1001, 'KC', 'Kansas City Chiefs', 'Kansas City', 'AFC', 'West');

INSERT OR REPLACE INTO games (sport, game_id, season, season_type, week, game_date, status,
  home_team_id, home_team_key, home_team_name, home_score,
  away_team_id, away_team_key, away_team_name, away_score, stadium_name, winning_team_id)
VALUES
  ('NFL', 10001, 2025, 'REG', 5, '2025-10-05', 'Final',
   1001, 'KC', 'Kansas City Chiefs', 28,
   1002, 'MIN', 'Minnesota Vikings', 24, 'Arrowhead Stadium', 1001);

PRAGMA foreign_keys = ON;
EOF

# Execute
$WRANGLER d1 execute blazesports-db --remote --file=/tmp/seed.sql

# Generate embeddings
curl -X POST https://blazesportsintel.com/api/copilot/embed \
  -H 'Content-Type: application/json' \
  -d '{"all": true}'

echo "✅ Data seeded and embeddings generated"
```

## Maintenance

### Check Current Data

```bash
# Count games by sport
wrangler d1 execute blazesports-db --remote --command="
SELECT sport, COUNT(*) as count FROM games GROUP BY sport;
"

# Check most recent games
wrangler d1 execute blazesports-db --remote --command="
SELECT sport, home_team_name, away_team_name, game_date
FROM games
ORDER BY game_date DESC
LIMIT 10;
"
```

### Regenerate All Embeddings

If embeddings become stale or corrupted:

```bash
curl -X POST https://blazesportsintel.com/api/copilot/embed \
  -H 'Content-Type: application/json' \
  -d '{"all": true}'
```

This will regenerate embeddings for ALL games in the database.

## Best Practices

1. **Always test locally first** using `--local` flag (if available)
2. **Batch insert games** - insert multiple games in one SQL file
3. **Generate embeddings immediately** after inserting games
4. **Test search** to verify data is searchable
5. **Use meaningful team names** - search quality improves with descriptive names
6. **Include stadium names** when available - adds context for search
7. **Set correct status** - 'Final' for completed games, 'Scheduled' for upcoming

## API Endpoints

### Health Check
```bash
curl https://blazesportsintel.com/api/copilot/health
```

### Status
```bash
curl https://blazesportsintel.com/api/copilot/status
```

### Embed Games
```bash
curl -X POST https://blazesportsintel.com/api/copilot/embed \
  -H 'Content-Type: application/json' \
  -d '{"all": true}'
```

### Search
```bash
curl -X POST https://blazesportsintel.com/api/copilot/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "your search query", "limit": 10, "sport": "NFL"}'
```

## Contact

For issues or questions, contact austin@blazesportsintel.com

---

**Last Updated:** 2025-10-10
**Version:** 1.0.0
**Maintainer:** Blaze Sports Intelligence
