/**
 * Blaze Sports Intel - Historical Game Data Ingestion Cron
 *
 * Runs daily at 3 AM CST to fetch and store historical game data
 * from the last 10 seasons for all supported sports.
 *
 * Cron Trigger: 0 8 * * * (3 AM CST = 8 AM UTC)
 *
 * Data Sources:
 * - MLB: MLB Stats API (2015-2024)
 * - NFL: SportsDataIO (2015-2024)
 * - NBA: SportsDataIO (2015-2024)
 * - NCAA: ESPN API (2015-2024)
 */

import { jsonResponse, errorResponse } from '../../lib/utils/api-helpers.js';

/**
 * Scheduled cron handler - runs daily
 */
export async function scheduled(event, env, ctx) {
  const startTime = Date.now();
  const results = {
    mlb: { success: 0, failed: 0 },
    nfl: { success: 0, failed: 0 },
    nba: { success: 0, failed: 0 },
    ncaa_football: { success: 0, failed: 0 },
    ncaa_baseball: { success: 0, failed: 0 }
  };

  console.log('🔄 Starting historical data ingestion...');

  try {
    // Fetch last 10 seasons for each sport
    const currentYear = new Date().getFullYear();
    const seasons = Array.from({ length: 10 }, (_, i) => currentYear - i);

    // Process each sport in parallel
    await Promise.all([
      ingestMLBHistorical(env, seasons, results),
      ingestNFLHistorical(env, seasons, results),
      ingestNBAHistorical(env, seasons, results),
      ingestNCAAFootballHistorical(env, seasons, results),
      ingestNCAABaseballHistorical(env, seasons, results)
    ]);

    // Log summary to Analytics Engine
    await env.ANALYTICS?.writeDataPoint({
      blobs: ['historical_ingestion_complete'],
      doubles: [
        results.mlb.success + results.mlb.failed,
        results.nfl.success + results.nfl.failed,
        results.nba.success + results.nba.failed,
        results.ncaa_football.success + results.ncaa_football.failed,
        results.ncaa_baseball.success + results.ncaa_baseball.failed
      ],
      indexes: ['daily_ingestion', new Date().toISOString().split('T')[0]]
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Historical ingestion complete in ${duration}ms`, results);

  } catch (error) {
    console.error('❌ Historical ingestion failed:', error);

    await env.ANALYTICS?.writeDataPoint({
      blobs: ['historical_ingestion_error'],
      doubles: [1],
      indexes: [error.message]
    });
  }
}

/**
 * Ingest MLB historical games
 */
async function ingestMLBHistorical(env, seasons, results) {
  for (const season of seasons) {
    try {
      // Check if season already ingested
      const existing = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM historical_games
        WHERE sport = 'MLB' AND season = ?
      `).bind(season).first();

      if (existing.count > 1000) {
        console.log(`⏩ MLB ${season} already ingested (${existing.count} games)`);
        continue;
      }

      // Fetch season schedule from MLB Stats API
      const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=${season}&gameType=R,F,D,L,W`;
      const response = await fetch(scheduleUrl, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`MLB API error: ${response.status}`);
      }

      const data = await response.json();
      const games = [];

      // Extract games from all dates
      for (const date of data.dates || []) {
        for (const game of date.games || []) {
          if (game.status.detailedState === 'Final') {
            games.push({
              game_id: `mlb_${game.gamePk}`,
              sport: 'MLB',
              season,
              game_date: game.officialDate,
              home_team_id: game.teams.home.team.id,
              home_team_name: game.teams.home.team.name,
              away_team_id: game.teams.away.team.id,
              away_team_name: game.teams.away.team.name,
              home_score: game.teams.home.score,
              away_score: game.teams.away.score,
              venue: game.venue.name,
              attendance: game.attendance || null,
              game_duration_minutes: game.gameInfo?.duration || null,
              innings: game.linescore?.currentInning || 9,
              status: 'final'
            });
          }
        }
      }

      // Batch insert games
      if (games.length > 0) {
        await batchInsertGames(env.DB, games);
        results.mlb.success += games.length;
        console.log(`✅ Ingested ${games.length} MLB games for ${season}`);
      }

    } catch (error) {
      console.error(`❌ MLB ${season} ingestion failed:`, error);
      results.mlb.failed += 1;
    }
  }
}

/**
 * Ingest NFL historical games
 */
async function ingestNFLHistorical(env, seasons, results) {
  const API_KEY = env.SPORTSDATAIO_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️ SPORTSDATAIO_API_KEY not configured, skipping NFL ingestion');
    return;
  }

  for (const season of seasons) {
    try {
      const existing = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM historical_games
        WHERE sport = 'NFL' AND season = ?
      `).bind(season).first();

      if (existing.count > 200) {
        console.log(`⏩ NFL ${season} already ingested (${existing.count} games)`);
        continue;
      }

      // Fetch all weeks (regular season + playoffs)
      const games = [];

      for (let week = 1; week <= 21; week++) {
        const url = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${week}?key=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) continue;

        const weekGames = await response.json();

        for (const game of weekGames) {
          if (game.IsClosed) {
            games.push({
              game_id: `nfl_${game.GameKey}`,
              sport: 'NFL',
              season,
              season_type: week <= 18 ? 'REG' : 'POST',
              week,
              game_date: game.Date.split('T')[0],
              home_team_id: game.HomeTeam,
              home_team_name: game.HomeTeam,
              away_team_id: game.AwayTeam,
              away_team_name: game.AwayTeam,
              home_score: game.HomeScore,
              away_score: game.AwayScore,
              venue: game.StadiumDetails?.Name || null,
              attendance: game.Attendance || null,
              status: 'final'
            });
          }
        }

        // Rate limit: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (games.length > 0) {
        await batchInsertGames(env.DB, games);
        results.nfl.success += games.length;
        console.log(`✅ Ingested ${games.length} NFL games for ${season}`);
      }

    } catch (error) {
      console.error(`❌ NFL ${season} ingestion failed:`, error);
      results.nfl.failed += 1;
    }
  }
}

/**
 * Ingest NBA historical games
 */
async function ingestNBAHistorical(env, seasons, results) {
  const API_KEY = env.SPORTSDATAIO_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️ SPORTSDATAIO_API_KEY not configured, skipping NBA ingestion');
    return;
  }

  for (const season of seasons) {
    try {
      const existing = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM historical_games
        WHERE sport = 'NBA' AND season = ?
      `).bind(season).first();

      if (existing.count > 1000) {
        console.log(`⏩ NBA ${season} already ingested (${existing.count} games)`);
        continue;
      }

      // NBA season format: 2024 = 2023-24 season
      const seasonStr = `${season-1}-${season.toString().slice(-2)}`;
      const url = `https://api.sportsdata.io/v3/nba/scores/json/Games/${season}?key=${API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NBA API error: ${response.status}`);
      }

      const games = [];
      const allGames = await response.json();

      for (const game of allGames) {
        if (game.Status === 'Final') {
          games.push({
            game_id: `nba_${game.GameID}`,
            sport: 'NBA',
            season,
            season_type: game.SeasonType === 1 ? 'REG' : 'POST',
            game_date: game.DateTime.split('T')[0],
            home_team_id: game.HomeTeam,
            home_team_name: game.HomeTeam,
            away_team_id: game.AwayTeam,
            away_team_name: game.AwayTeam,
            home_score: game.HomeScore,
            away_score: game.AwayScore,
            venue: game.Stadium || null,
            attendance: game.Attendance || null,
            status: 'final'
          });
        }
      }

      if (games.length > 0) {
        await batchInsertGames(env.DB, games);
        results.nba.success += games.length;
        console.log(`✅ Ingested ${games.length} NBA games for ${season}`);
      }

    } catch (error) {
      console.error(`❌ NBA ${season} ingestion failed:`, error);
      results.nba.failed += 1;
    }
  }
}

/**
 * Ingest NCAA Football historical games
 */
async function ingestNCAAFootballHistorical(env, seasons, results) {
  for (const season of seasons) {
    try {
      const existing = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM historical_games
        WHERE sport = 'NCAA_FOOTBALL' AND season = ?
      `).bind(season).first();

      if (existing.count > 500) {
        console.log(`⏩ NCAA Football ${season} already ingested (${existing.count} games)`);
        continue;
      }

      const games = [];

      // Fetch all weeks of season
      for (let week = 1; week <= 16; week++) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${season}&seasontype=2&week=${week}`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json'
          }
        });

        if (!response.ok) continue;

        const data = await response.json();

        for (const event of data.events || []) {
          if (event.status.type.completed) {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

            games.push({
              game_id: `ncaaf_${event.id}`,
              sport: 'NCAA_FOOTBALL',
              season,
              season_type: 'REG',
              week,
              game_date: event.date.split('T')[0],
              home_team_id: homeTeam.id,
              home_team_name: homeTeam.team.displayName,
              away_team_id: awayTeam.id,
              away_team_name: awayTeam.team.displayName,
              home_score: parseInt(homeTeam.score),
              away_score: parseInt(awayTeam.score),
              venue: competition.venue?.fullName || null,
              attendance: competition.attendance || null,
              status: 'final'
            });
          }
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (games.length > 0) {
        await batchInsertGames(env.DB, games);
        results.ncaa_football.success += games.length;
        console.log(`✅ Ingested ${games.length} NCAA Football games for ${season}`);
      }

    } catch (error) {
      console.error(`❌ NCAA Football ${season} ingestion failed:`, error);
      results.ncaa_football.failed += 1;
    }
  }
}

/**
 * Ingest NCAA Baseball historical games (limited data available)
 */
async function ingestNCAABaseballHistorical(env, seasons, results) {
  // NCAA Baseball historical data is limited in public APIs
  // Placeholder for future integration with D1Baseball or NCAA Stats
  console.log('ℹ️ NCAA Baseball historical ingestion not yet implemented');
}

/**
 * Batch insert games into database
 */
async function batchInsertGames(db, games) {
  const batchSize = 100;

  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);

    for (const game of batch) {
      await db.prepare(`
        INSERT OR IGNORE INTO historical_games (
          game_id, sport, season, season_type, week, game_date,
          home_team_id, home_team_name, away_team_id, away_team_name,
          home_score, away_score, venue, attendance, game_duration_minutes,
          innings, status, ingested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        game.game_id,
        game.sport,
        game.season,
        game.season_type || null,
        game.week || null,
        game.game_date,
        game.home_team_id,
        game.home_team_name,
        game.away_team_id,
        game.away_team_name,
        game.home_score,
        game.away_score,
        game.venue,
        game.attendance,
        game.game_duration_minutes || null,
        game.innings || null,
        game.status,
        new Date().toISOString()
      ).run();
    }
  }
}
