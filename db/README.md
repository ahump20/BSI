# Blaze Sports Intel - D1 Database Schema

## Overview

This directory contains the Cloudflare D1 database schema for storing historical college baseball data. The schema is designed to support comprehensive analytics, trend analysis, and predictive modeling across multiple seasons.

## Schema Version

**Current Version:** 1.0.0
**Database Engine:** Cloudflare D1 (SQLite)
**Last Updated:** 2025-10-16

## Database Structure

### Core Tables

#### 1. Reference Tables

- **`seasons`** - Track active college baseball seasons (2020-2025+)
- **`conferences`** - NCAA conference metadata (SEC, ACC, Big 12, etc.)

#### 2. Team Tables

- **`teams`** - College baseball programs with conference affiliations
- **`team_rosters`** - Player-team relationships by season

#### 3. Player Tables

- **`players`** - Individual player records with draft history
- **`player_season_stats`** - Aggregated player stats per season

#### 4. Game Tables

- **`games`** - Individual game results with venue and broadcast info
- **`box_scores`** - Game-level aggregated statistics

#### 5. Performance Tables

- **`batting_stats`** - Individual batting performances per game
- **`pitching_stats`** - Individual pitching performances per game
- **`team_season_stats`** - Aggregated team statistics per season

### Views

- **`v_active_teams`** - Active teams with conference information
- **`v_current_season_games`** - Games from the active season
- **`v_team_records`** - Team win-loss records by season

## Setup Instructions

### 1. Create D1 Database

```bash
# Create the D1 database in Cloudflare
wrangler d1 create blazesports-historical

# Note the database ID from the output and add to wrangler.toml
```

### 2. Apply Schema

```bash
# Apply the schema to the D1 database
wrangler d1 execute blazesports-historical --file=db/schema.sql

# Verify schema was applied
wrangler d1 execute blazesports-historical --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### 3. Seed Initial Data (Optional)

```bash
# Seed with sample data for testing
wrangler d1 execute blazesports-historical --file=db/seed.sql
```

### 4. Update wrangler.toml

Add the D1 database binding to your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "blazesports-historical"
database_id = "your-database-id-here"
```

## Usage Examples

### Accessing the Database in Workers

```javascript
// functions/api/college-baseball/stats.js
export async function onRequest({ env }) {
  const { DB } = env;

  // Get current season teams
  const { results } = await DB.prepare(
    `
    SELECT * FROM v_active_teams
    WHERE conference_name = ?
  `
  )
    .bind('SEC')
    .all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Common Queries

#### Get Team Season Record

```sql
SELECT * FROM v_team_records
WHERE team_name = 'Texas Longhorns'
  AND season = 2025;
```

#### Get Player Career Stats

```sql
SELECT
    p.full_name,
    s.year AS season,
    pss.games_played,
    pss.at_bats,
    pss.hits,
    pss.home_runs,
    pss.rbi,
    pss.batting_average
FROM player_season_stats pss
JOIN players p ON pss.player_id = p.player_id
JOIN seasons s ON pss.season_id = s.season_id
WHERE p.full_name = 'Player Name'
ORDER BY s.year DESC;
```

#### Get Conference Standings

```sql
SELECT
    t.name AS team,
    tss.wins,
    tss.losses,
    tss.conference_wins,
    tss.conference_losses,
    ROUND(CAST(tss.wins AS REAL) / NULLIF(tss.games_played, 0), 3) AS win_pct,
    tss.rpi
FROM team_season_stats tss
JOIN teams t ON tss.team_id = t.team_id
JOIN conferences c ON t.conference_id = c.conference_id
JOIN seasons s ON tss.season_id = s.season_id
WHERE c.abbreviation = 'SEC'
  AND s.year = 2025
ORDER BY tss.conference_wins DESC, tss.wins DESC;
```

#### Get Recent Games

```sql
SELECT
    g.game_date,
    ht.name AS home_team,
    at.name AS away_team,
    g.home_score,
    g.away_score,
    g.innings,
    g.venue_name
FROM games g
JOIN teams ht ON g.home_team_id = ht.team_id
JOIN teams at ON g.away_team_id = at.team_id
WHERE g.game_date >= date('now', '-7 days')
ORDER BY g.game_date DESC;
```

#### Get Box Score Data

```sql
SELECT
    g.game_date,
    ht.name AS home_team,
    at.name AS away_team,
    bs.home_runs,
    bs.home_hits,
    bs.home_errors,
    bs.away_runs,
    bs.away_hits,
    bs.away_errors,
    bs.home_innings,
    bs.away_innings
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
JOIN teams ht ON g.home_team_id = ht.team_id
JOIN teams at ON g.away_team_id = at.team_id
WHERE g.espn_id = ?;
```

## Data Ingestion Pipeline

### ETL Process

1. **Extract**: Fetch data from ESPN API
2. **Transform**: Normalize data to match schema
3. **Load**: Insert into D1 database

### Example Ingestion Function

```javascript
// scripts/ingest-game-data.js
export async function ingestGame(env, gameData) {
  const { DB } = env;

  // Start transaction
  await DB.batch([
    // Insert game
    DB.prepare(
      `
      INSERT INTO games (
        espn_id, season_id, game_date, home_team_id,
        away_team_id, home_score, away_score, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).bind(
      gameData.id,
      gameData.seasonId,
      gameData.date,
      gameData.homeTeamId,
      gameData.awayTeamId,
      gameData.homeScore,
      gameData.awayScore,
      gameData.status
    ),

    // Insert box score
    DB.prepare(
      `
      INSERT INTO box_scores (
        game_id, home_runs, home_hits, home_errors,
        away_runs, away_hits, away_errors
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).bind(
      gameData.gameId,
      gameData.homeRuns,
      gameData.homeHits,
      gameData.homeErrors,
      gameData.awayRuns,
      gameData.awayHits,
      gameData.awayErrors
    ),
  ]);
}
```

## Maintenance

### Backup Strategy

```bash
# Export database to SQL
wrangler d1 export blazesports-historical > backup-$(date +%Y%m%d).sql
```

### Performance Optimization

- Indexes are automatically created for frequently queried columns
- Use prepared statements for repeated queries
- Batch inserts when ingesting large datasets
- Monitor query performance with EXPLAIN QUERY PLAN

### Schema Migrations

When updating the schema:

1. Create a new migration file: `db/migrations/002_add_feature.sql`
2. Test locally with a copy of production data
3. Apply to production with version tracking

```sql
-- db/migrations/002_add_feature.sql
ALTER TABLE teams ADD COLUMN nickname TEXT;

UPDATE schema_version
SET version = '1.1.0',
    description = 'Added team nickname field';
```

## Data Integrity

### Constraints

- **Foreign Keys**: Maintain referential integrity between tables
- **Check Constraints**: Validate enum values (e.g., `status IN ('scheduled', 'final')`)
- **Unique Constraints**: Prevent duplicate records (e.g., `UNIQUE(player_id, team_id, season_id)`)
- **NOT NULL**: Enforce required fields

### Triggers

Automatic timestamp updates on record modifications:

- `update_seasons_timestamp`
- `update_conferences_timestamp`
- `update_teams_timestamp`
- `update_players_timestamp`
- `update_games_timestamp`

## Testing

### Unit Tests

```javascript
// tests/db.test.js
import { describe, it, expect } from 'vitest';

describe('D1 Schema Tests', () => {
  it('should insert and retrieve a team', async () => {
    const result = await DB.prepare(
      `
      INSERT INTO teams (name, school, abbreviation)
      VALUES (?, ?, ?)
      RETURNING *
    `
    )
      .bind('Longhorns', 'University of Texas', 'TEX')
      .first();

    expect(result.name).toBe('Longhorns');
  });

  it('should calculate team win percentage correctly', async () => {
    const result = await DB.prepare(
      `
      SELECT * FROM v_team_records
      WHERE team_name = ?
    `
    )
      .bind('Texas Longhorns')
      .first();

    expect(result.win_percentage).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

**Q: Schema changes not applying**

```bash
# Force re-apply the schema
wrangler d1 execute blazesports-historical --file=db/schema.sql --force
```

**Q: Foreign key constraint errors**

```sql
-- Check orphaned records
SELECT * FROM games
WHERE home_team_id NOT IN (SELECT team_id FROM teams);
```

**Q: Performance issues with large queries**

```sql
-- Use EXPLAIN to diagnose slow queries
EXPLAIN QUERY PLAN
SELECT * FROM games
WHERE game_date > '2025-01-01';
```

## Support

For questions or issues:

- **GitHub Issues**: https://github.com/ahump20/BSI/issues
- **Email**: austin@blazesportsintel.com
- **Documentation**: https://blazesportsintel.com/docs

## License

Proprietary - Blaze Sports Intel © 2025
