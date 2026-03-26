# BSI Route Patterns

Standard route hierarchy for sports UI pages. Use when building game, team, or league pages.

## Game Routes `/games/{gameId}/`

| Route | Purpose |
|-------|---------|
| `recap` | Post-game narrative, key moments, player of game |
| `box-score` | Complete stat tables by position group |
| `play-by-play` | Chronological event log with filters |
| `team-stats` | Side-by-side aggregate comparison |
| `videos` | Highlights and press content |

## Team Routes `/teams/{sport}/{teamId}/`

| Route | Purpose |
|-------|---------|
| `news` | Team-specific article feed |
| `standings` | Conference/division with team highlighted |
| `stats` | Leaders and season totals |
| `roster` | Player cards with status indicators |
| `depth-chart` | Position-by-position depth grid |

## League Routes

| Route | Purpose |
|-------|---------|
| `/scores/{sport}` | Daily scoreboard with date picker |
| `/standings/{sport}` | Full league standings |
| `/stats/{sport}/leaders` | League-wide stat leaders |

**Sports slugs:** `mlb`, `nfl`, `college-baseball`, `ncaaf`, `nba`

## API Route Structure

```
/api/v1/
  games/{gameId}/{recap|box-score|play-by-play|team-stats|videos}
  teams/{sport}/{teamId}/{news|standings|stats|roster|depth-chart}
  scores/{sport}?date=YYYY-MM-DD
  standings/{sport}
  stats/{sport}/leaders
```

## Navigation Patterns

**Bottom bar:** Home | Scores | Watch | Teams | More
**Team tabs:** News | Scores | Standings | Stats | Roster | Depth
**Game tabs:** Recap | Box Score | Play-by-Play | Team Stats | Videos

## Shared Components

**Score Header** — Sticky on all game routes:
```
[AWAY] 24  Final  37 [HOME]
```

**Citation Footer** — Required on all data views:
```
Data: ESPN | 2025-12-15 | CT
```
