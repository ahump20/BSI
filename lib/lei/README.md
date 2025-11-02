# Leverage Equivalency Index (LEI)

Normalize clutch moments across sports to a 0-100 scale, enabling fair comparison of playoff pressure situations regardless of sport, era, or game context.

## Overview

**LEI Formula:**
```
LEI = 100 × (Championship_Weight × WPA × Scarcity) / MAX_SWING
```

Where:
- **Championship Weight**: 1x (wildcard) → 8x (championship)
- **WPA**: Win Probability Added (0-1.0)
- **Scarcity**: Opportunity cost multiplier (0-1.0, higher = fewer chances remaining)
- **MAX_SWING**: 8.0 (theoretical maximum)

### Score Interpretation

| LEI Range | Description | Examples |
|-----------|-------------|----------|
| 60-100 | Legendary championship moments | Butler INT (65.0) |
| 40-59 | Elite clutch plays | Freese triple (50.7) |
| 20-39 | High-leverage playoff moments | Boone HR (22.2) |
| 10-19 | Important playoff plays | Manningham catch (16.0) |
| 0-9 | Standard playoff situations | Regular wildcard moments |

## Quick Start

### Basic Usage

```typescript
import { computeLEI } from '@bsi/lei';

// David Freese triple, 2011 World Series Game 6
const result = computeLEI({
  sport: "baseball",
  playoff_round: "championship",
  pre_play_win_prob: 0.078,
  post_play_win_prob: 0.605,
  outs_remaining: 1,
  strikes_remaining: 0,
  score_differential: -2
});

console.log(result.lei); // ~95
console.log(result.components);
// {
//   championship_weight: 8.0,
//   wpa: 0.527,
//   scarcity: 0.96,
//   raw_score: 4.05
// }
```

### Using the Class

```typescript
import { LeverageEquivalencyIndex } from '@bsi/lei';

const calculator = new LeverageEquivalencyIndex();

// Compute multiple plays
const plays = [play1Context, play2Context, play3Context];
const results = plays.map(ctx => calculator.compute(ctx));

// Sort by LEI
const ranked = results.sort((a, b) => b.lei - a.lei);
```

### Famous Examples

```typescript
import {
  davidFreese2011WS,
  marioManningham2012SB,
  getAllFamousPlays
} from '@bsi/lei/examples';

// Get specific famous play
const freese = davidFreese2011WS();
console.log(freese.lei); // 95.0
console.log(freese.description); // "David Freese game-tying triple"

// Get all famous plays for comparison
const allPlays = getAllFamousPlays();
allPlays.forEach(play => {
  console.log(`${play.description}: ${play.lei.toFixed(1)}`);
});
```

## API Endpoints

### POST /api/lei

Compute LEI for a custom play context.

**Request:**
```bash
curl -X POST https://blazesportsintel.com/api/lei \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "baseball",
    "playoff_round": "championship",
    "pre_play_win_prob": 0.078,
    "post_play_win_prob": 0.605,
    "outs_remaining": 1,
    "strikes_remaining": 0,
    "score_differential": -2
  }'
```

**Response:**
```json
{
  "lei": 95.0,
  "components": {
    "championship_weight": 8.0,
    "wpa": 0.527,
    "scarcity": 0.96,
    "raw_score": 4.05
  }
}
```

### GET /api/lei/examples

Get famous playoff moments with pre-computed LEI scores.

**Response:**
```json
{
  "plays": [
    {
      "play_id": "2011-WS-G6-B9-FREESE-TRIPLE",
      "description": "David Freese game-tying triple",
      "lei": 95.0,
      "components": {...}
    },
    ...
  ]
}
```

### GET /api/lei/validate

Validate LEI calibration against expected clutch rankings.

**Response:**
```json
{
  "plays": [...],
  "isCorrectOrder": true,
  "expectedOrder": ["Malcolm Butler INT", "David Freese triple", ...],
  "actualOrder": ["Malcolm Butler INT", "David Freese triple", ...]
}
```

## Sport-Specific Context

### Baseball

Required fields:
- `outs_remaining`: 0-27 (typically 0-3 per inning)
- `strikes_remaining`: 0-2
- `score_differential`: runs (positive = leading)

Scarcity factors:
- Base scarcity from outs consumed (27 total)
- 1.2x multiplier for 2-strike counts
- Score factor: closer games = higher leverage

```typescript
const baseballPlay = {
  sport: "baseball",
  playoff_round: "division",
  pre_play_win_prob: 0.45,
  post_play_win_prob: 0.72,
  outs_remaining: 2,
  strikes_remaining: 1,
  score_differential: -1
};
```

### Football

Required fields:
- `time_remaining`: seconds (0-3600)
- `timeouts_remaining`: 0-3
- `score_differential`: points (positive = leading)

Scarcity factors:
- Base scarcity from time elapsed
- Exponential boost in 4th quarter (last 15 min)
- 1.15x per timeout used
- 1.3x for one-score games (≤8 points)

```typescript
const footballPlay = {
  sport: "football",
  playoff_round: "championship",
  pre_play_win_prob: 0.35,
  post_play_win_prob: 1.00,
  time_remaining: 20,
  timeouts_remaining: 1,
  score_differential: -4
};
```

## Data Sources

### Baseball Win Expectancy

**Recommended:** Baseball-Reference play-by-play tables
- URL: `https://www.baseball-reference.com/boxes/{game_id}.shtml`
- Provides: WE before/after each play
- Alternative: pybaseball library (`from pybaseball import statcast`)

**Converting WPA:**
```python
# Baseball-Reference provides WE% directly
pre_play_we = 0.078  # 7.8% from page
post_play_we = 0.605  # 60.5% from page
wpa = abs(post_play_we - pre_play_we)  # 0.527 = 52.7%
```

### Football Win Probability

**Recommended:** nflfastR Expected Points Added (EPA) model

**Converting EPA to WP:**
```python
import nfl_data_py as nfl

# Get play-by-play data
pbp = nfl.import_pbp_data([2024])

# WP already included in nflfastR
pre_play_wp = pbp['wp'].iloc[idx]
post_play_wp = pbp['wp'].iloc[idx + 1]

# Alternative: logistic regression on EPA
# WP = 1 / (1 + exp(-(-2.7 + 0.45*EPA + 0.003*time_remaining)))
```

## Database Storage

LEI scores are stored in Cloudflare D1:

```sql
-- Insert new play
INSERT INTO lei_plays (
    play_id, game_id, season, sport, playoff_round,
    description, players,
    pre_play_win_prob, post_play_win_prob,
    lei_score, championship_weight, scarcity,
    data_source, verified
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Query top 10 clutch plays all-time
SELECT * FROM lei_leaderboard LIMIT 10;

-- Query by season and sport
SELECT * FROM lei_plays
WHERE season = 2024 AND sport = 'baseball'
ORDER BY lei_score DESC;
```

## Calibration Notes

The current scarcity weights are calibrated against known clutch rankings:

1. **Baseball strike multiplier (1.2x)**: Based on historical 2-strike WPA analysis
2. **Football Q4 boost**: Exponential increase matches late-game leverage studies
3. **Score differential factors**: Validated against tie-game vs blowout WPA differences

**Validation needed:**
- Expand calibration dataset to n=100+ playoff plays
- Cross-validate against expert clutch rankings
- Establish confidence intervals for each component
- Test edge cases (extra innings, overtime, weather delays)

## Type Definitions

```typescript
type Sport = "baseball" | "football";
type PlayoffRound = "wildcard" | "division" | "conference" | "championship";

interface PlayContext {
  sport: Sport;
  playoff_round: PlayoffRound;
  pre_play_win_prob: number;  // 0.0-1.0
  post_play_win_prob: number;  // 0.0-1.0
  outs_remaining?: number;
  strikes_remaining?: number;
  time_remaining?: number;
  timeouts_remaining?: number;
  score_differential?: number;
}

interface LEIResult {
  lei: number;  // 0-100
  components: {
    championship_weight: number;
    wpa: number;
    scarcity: number;
    raw_score: number;
  };
}
```

## Future Enhancements

### Planned Features
- [ ] Basketball support (NBA/March Madness)
- [ ] Hockey support (NHL/Frozen Four)
- [ ] Context modifiers (weather, injuries, historical significance)
- [ ] Real-time LEI tracking during games
- [ ] Machine learning refinement of scarcity weights

### Data Integrations
- [ ] Automated Baseball-Reference scraping
- [ ] nflfastR API integration
- [ ] Live game state webhooks
- [ ] Historical play database (1990-present)

## Contributing

When adding new sports or refining weights:

1. Add sport to `types.ts` Sport union
2. Implement scarcity calculation in `index.ts`
3. Add famous examples to `examples.ts`
4. Update database schema in `schema/002_lei_tables.sql`
5. Validate against known clutch rankings

## License

MIT
