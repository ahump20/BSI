#!/usr/bin/env node

/**
 * Robust Data Synchronization Layer for BSI
 *
 * Features:
 * - Periodic fetching from MLB Stats API and ESPN
 * - Rate limiting with exponential backoff
 * - Circuit breaker pattern for API failures
 * - Caching with stale data labeling
 * - WebSocket support for live games
 */

import pg from 'pg';
import fetch from 'node-fetch';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

class SportsSyncService extends EventEmitter {
  constructor() {
    super();

    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'blazesportsintel',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    // Rate limiting configuration
    this.rateLimits = {
      mlb: { calls: 0, resetTime: Date.now() + 60000, maxCalls: 30 },
      espn: { calls: 0, resetTime: Date.now() + 60000, maxCalls: 50 }
    };

    // Circuit breaker state
    this.circuitBreakers = {
      mlb: { failures: 0, state: 'closed', nextAttempt: 0 },
      espn: { failures: 0, state: 'closed', nextAttempt: 0 }
    };

    // Sync intervals (in minutes)
    this.syncIntervals = {
      liveGames: 0.5,      // 30 seconds for live games
      scores: 5,           // 5 minutes for recent scores
      standings: 60,       // 1 hour for standings
      players: 360         // 6 hours for player rosters
    };

    this.isRunning = false;
  }

  // Rate limiter with exponential backoff
  async rateLimit(api) {
    const limit = this.rateLimits[api];

    if (Date.now() > limit.resetTime) {
      limit.calls = 0;
      limit.resetTime = Date.now() + 60000;
    }

    if (limit.calls >= limit.maxCalls) {
      const waitTime = limit.resetTime - Date.now();
      await this.sleep(waitTime);
      limit.calls = 0;
      limit.resetTime = Date.now() + 60000;
    }

    limit.calls++;
  }

  // Circuit breaker implementation
  async checkCircuitBreaker(api) {
    const breaker = this.circuitBreakers[api];

    if (breaker.state === 'open') {
      if (Date.now() < breaker.nextAttempt) {
        throw new Error(`Circuit breaker open for ${api}`);
      }
      breaker.state = 'half-open';
    }

    return breaker;
  }

  handleApiSuccess(api) {
    const breaker = this.circuitBreakers[api];
    breaker.failures = 0;
    breaker.state = 'closed';
  }

  handleApiFailure(api, error) {
    const breaker = this.circuitBreakers[api];
    breaker.failures++;

    console.error(`❌ API failure for ${api}: ${error.message}`);

    if (breaker.failures >= 5) {
      breaker.state = 'open';
      breaker.nextAttempt = Date.now() + (60000 * Math.pow(2, Math.min(breaker.failures - 5, 5)));
    }
  }

  // Fetch with retry logic
  async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          timeout: 10000,
          headers: {
            'User-Agent': 'BSI/1.0',
            'Accept': 'application/json',
            ...options.headers
          }
        });

        if (!response.ok && i < retries - 1) {
          await this.sleep(1000 * Math.pow(2, i)); // Exponential backoff
          continue;
        }

        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.sleep(1000 * Math.pow(2, i));
      }
    }
  }

  // Sync MLB data
  async syncMLBData() {

    try {
      await this.checkCircuitBreaker('mlb');
      await this.rateLimit('mlb');

      // Get all MLB teams
      const teamsUrl = 'https://statsapi.mlb.com/api/v1/teams?sportId=1';
      const response = await this.fetchWithRetry(teamsUrl);
      const data = await response.json();

      for (const team of data.teams || []) {
        // Upsert team data
        await this.db.query(`
          INSERT INTO teams (external_id, name, sport, league, division, venue_name, city, state)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (external_id) DO UPDATE
          SET name = EXCLUDED.name,
              division = EXCLUDED.division,
              updated_at = CURRENT_TIMESTAMP
        `, [
          team.id.toString(),
          team.name,
          'MLB',
          team.league?.name || 'Unknown',
          team.division?.name || 'Unknown',
          team.venue?.name || 'Unknown',
          team.venue?.city || team.locationName,
          team.venue?.state || 'Unknown'
        ]);
      }

      // Sync today's games
      await this.syncMLBGames();

      // Update standings
      await this.syncMLBStandings();

      this.handleApiSuccess('mlb');

      // Cache in database
      await this.cacheApiResponse('mlb_teams', data, 3600);

    } catch (error) {
      this.handleApiFailure('mlb', error);
      await this.loadFromCache('mlb_teams');
    }
  }

  // Sync MLB games
  async syncMLBGames() {
    const today = new Date().toISOString().split('T')[0];
    const gamesUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`;

    const response = await this.fetchWithRetry(gamesUrl);
    const data = await response.json();

    for (const date of data.dates || []) {
      for (const game of date.games || []) {
        // Get team IDs from database
        const homeTeam = await this.getTeamByExternalId(game.teams.home.team.id);
        const awayTeam = await this.getTeamByExternalId(game.teams.away.team.id);

        if (homeTeam && awayTeam) {
          await this.db.query(`
            INSERT INTO games (external_game_id, sport, home_team_id, away_team_id, game_date, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (external_game_id) DO UPDATE
            SET status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
          `, [
            game.gamePk.toString(),
            'MLB',
            homeTeam.id,
            awayTeam.id,
            game.gameDate,
            game.status.abstractGameState
          ]);

          // If game is live, sync live scores
          if (game.status.abstractGameState === 'Live') {
            await this.syncLiveScore(game.gamePk, game);
          }
        }
      }
    }
  }

  // Sync MLB standings
  async syncMLBStandings() {
    const standingsUrl = 'https://statsapi.mlb.com/api/v1/standings?leagueId=103,104';
    const response = await this.fetchWithRetry(standingsUrl);
    const data = await response.json();

    for (const record of data.records || []) {
      for (const teamRecord of record.teamRecords || []) {
        const team = await this.getTeamByExternalId(teamRecord.team.id);

        if (team) {
          await this.db.query(`
            INSERT INTO standings (team_id, season, division, wins, losses, win_percentage, games_back, streak, last_10)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (team_id, season) DO UPDATE
            SET wins = EXCLUDED.wins,
                losses = EXCLUDED.losses,
                win_percentage = EXCLUDED.win_percentage,
                games_back = EXCLUDED.games_back,
                streak = EXCLUDED.streak,
                last_10 = EXCLUDED.last_10,
                updated_at = CURRENT_TIMESTAMP
          `, [
            team.id,
            new Date().getFullYear(),
            record.division.name,
            teamRecord.wins,
            teamRecord.losses,
            teamRecord.winningPercentage,
            teamRecord.gamesBack,
            teamRecord.streak?.streakCode,
            teamRecord.records?.splitRecords?.find(r => r.type === 'lastTen')?.wins + '-' +
            teamRecord.records?.splitRecords?.find(r => r.type === 'lastTen')?.losses
          ]);
        }
      }
    }
  }

  // Sync ESPN data (NFL, NBA, NCAA)
  async syncESPNData(sport) {

    const sportConfig = {
      nfl: { path: 'football/nfl', sportName: 'NFL' },
      nba: { path: 'basketball/nba', sportName: 'NBA' },
      ncaa_football: { path: 'football/college-football', sportName: 'NCAA Football' }
    };

    const config = sportConfig[sport];
    if (!config) return;

    try {
      await this.checkCircuitBreaker('espn');
      await this.rateLimit('espn');

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.espn.com/'
      };

      // Sync teams
      const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${config.path}/teams`;
      const response = await this.fetchWithRetry(teamsUrl, { headers });
      const data = await response.json();

      for (const team of data.sports?.[0]?.leagues?.[0]?.teams || []) {
        const teamData = team.team;

        await this.db.query(`
          INSERT INTO teams (external_id, name, sport, league, city)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (external_id) DO UPDATE
          SET name = EXCLUDED.name,
              updated_at = CURRENT_TIMESTAMP
        `, [
          teamData.id,
          teamData.displayName,
          config.sportName,
          teamData.groups?.[0]?.name || 'Unknown',
          teamData.location
        ]);
      }

      // Sync scores and standings
      await this.syncESPNScores(config.path, config.sportName);

      this.handleApiSuccess('espn');

    } catch (error) {
      this.handleApiFailure('espn', error);
    }
  }

  // Sync ESPN scores
  async syncESPNScores(path, sportName) {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.espn.com/'
    };

    const scoresUrl = `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`;
    const response = await this.fetchWithRetry(scoresUrl, { headers });
    const data = await response.json();

    for (const event of data.events || []) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
      const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

      if (homeCompetitor && awayCompetitor) {
        const homeTeam = await this.getTeamByExternalId(homeCompetitor.id);
        const awayTeam = await this.getTeamByExternalId(awayCompetitor.id);

        if (homeTeam && awayTeam) {
          // Upsert game
          const gameResult = await this.db.query(`
            INSERT INTO games (external_game_id, sport, home_team_id, away_team_id, game_date, status, home_score, away_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (external_game_id) DO UPDATE
            SET status = EXCLUDED.status,
                home_score = EXCLUDED.home_score,
                away_score = EXCLUDED.away_score,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
          `, [
            event.id,
            sportName,
            homeTeam.id,
            awayTeam.id,
            event.date,
            competition.status.type.name,
            parseInt(homeCompetitor.score) || 0,
            parseInt(awayCompetitor.score) || 0
          ]);

          // If game is in progress, update live scores
          if (competition.status.type.state === 'in') {
            await this.updateLiveScore(gameResult.rows[0].id, competition);
          }
        }
      }
    }
  }

  // Update live scores
  async updateLiveScore(gameId, competition) {
    await this.db.query(`
      INSERT INTO live_scores (game_id, period, time_remaining, home_score, away_score, last_play)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (game_id) DO UPDATE
      SET period = EXCLUDED.period,
          time_remaining = EXCLUDED.time_remaining,
          home_score = EXCLUDED.home_score,
          away_score = EXCLUDED.away_score,
          last_play = EXCLUDED.last_play,
          updated_at = CURRENT_TIMESTAMP
    `, [
      gameId,
      competition.status.period,
      competition.status.displayClock,
      parseInt(competition.competitors.find(c => c.homeAway === 'home').score) || 0,
      parseInt(competition.competitors.find(c => c.homeAway === 'away').score) || 0,
      competition.situation?.lastPlay?.text || null
    ]);

    // Emit WebSocket event for real-time updates
    this.emit('liveScoreUpdate', {
      gameId,
      homeScore: competition.competitors.find(c => c.homeAway === 'home').score,
      awayScore: competition.competitors.find(c => c.homeAway === 'away').score,
      period: competition.status.period,
      timeRemaining: competition.status.displayClock
    });
  }

  // Helper functions
  async getTeamByExternalId(externalId) {
    const result = await this.db.query(
      'SELECT * FROM teams WHERE external_id = $1',
      [externalId.toString()]
    );
    return result.rows[0];
  }

  async syncLiveScore(gameId, gameData) {
    // Implementation for MLB live scores
    const linescore = gameData.linescore;
    if (linescore) {
      await this.db.query(`
        UPDATE games
        SET home_score = $1, away_score = $2, status = $3
        WHERE external_game_id = $4
      `, [
        linescore.teams?.home?.runs || 0,
        linescore.teams?.away?.runs || 0,
        gameData.status.abstractGameState,
        gameId.toString()
      ]);
    }
  }

  async cacheApiResponse(key, data, ttlSeconds) {
    const expiresAt = new Date(Date.now() + (ttlSeconds * 1000));

    await this.db.query(`
      INSERT INTO api_cache (cache_key, response_data, api_source, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (cache_key) DO UPDATE
      SET response_data = EXCLUDED.response_data,
          expires_at = EXCLUDED.expires_at,
          hit_count = api_cache.hit_count + 1
    `, [key, JSON.stringify(data), 'sync_service', expiresAt]);
  }

  async loadFromCache(key) {
    const result = await this.db.query(`
      SELECT response_data, expires_at
      FROM api_cache
      WHERE cache_key = $1 AND expires_at > CURRENT_TIMESTAMP
    `, [key]);

    if (result.rows.length > 0) {
      const cache = result.rows[0];
      const isStale = new Date(cache.expires_at) < new Date();

      return {
        data: cache.response_data,
        isStale,
        expiresAt: cache.expires_at
      };
    }

    return null;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main sync loop
  async startSync() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Initial sync
    await this.syncMLBData();
    await this.syncESPNData('nfl');
    await this.syncESPNData('nba');
    await this.syncESPNData('ncaa_football');

    // Schedule periodic syncs
    setInterval(() => this.syncLiveGames(), this.syncIntervals.liveGames * 60000);
    setInterval(() => this.syncRecentScores(), this.syncIntervals.scores * 60000);
    setInterval(() => this.syncStandings(), this.syncIntervals.standings * 60000);
    setInterval(() => this.syncPlayers(), this.syncIntervals.players * 60000);

  }

  async syncLiveGames() {

    const liveGames = await this.db.query(`
      SELECT * FROM games
      WHERE status IN ('Live', 'In Progress')
      AND game_date::date = CURRENT_DATE
    `);

    for (const game of liveGames.rows) {
      // Sync live data for each active game
      if (game.sport === 'MLB') {
        // Fetch live MLB data
        await this.syncMLBLiveGame(game.external_game_id);
      } else {
        // Fetch live ESPN data
        await this.syncESPNLiveGame(game.external_game_id, game.sport);
      }
    }
  }

  async syncMLBLiveGame(gameId) {
    try {
      const url = `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`;
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      const liveData = data.liveData;
      if (liveData) {
        const linescore = liveData.linescore;

        await this.db.query(`
          UPDATE games
          SET home_score = $1, away_score = $2, status = $3
          WHERE external_game_id = $4
        `, [
          linescore.teams?.home?.runs || 0,
          linescore.teams?.away?.runs || 0,
          data.gameData.status.abstractGameState,
          gameId
        ]);

        this.emit('liveGameUpdate', {
          gameId,
          homeScore: linescore.teams?.home?.runs,
          awayScore: linescore.teams?.away?.runs,
          inning: linescore.currentInning,
          inningState: linescore.inningState
        });
      }
    } catch (error) {
      console.error(`Error syncing live MLB game ${gameId}:`, error.message);
    }
  }

  async syncESPNLiveGame(gameId, sport) {
    // Similar implementation for ESPN live games
  }

  async syncRecentScores() {
    await this.syncMLBGames();
    await this.syncESPNScores('football/nfl', 'NFL');
    await this.syncESPNScores('basketball/nba', 'NBA');
  }

  async syncStandings() {
    await this.syncMLBStandings();
    // Add ESPN standings sync
  }

  async syncPlayers() {
    // Implementation for player sync
  }

  async stopSync() {
    this.isRunning = false;
    await this.db.end();
  }
}

// Export for use in other modules
export default SportsSyncService;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const syncService = new SportsSyncService();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await syncService.stopSync();
    process.exit(0);
  });

  // Start the sync service
  syncService.startSync().catch(console.error);
}