#!/usr/bin/env node

/**
 * Neon Database Integration for Blaze Sports Intel
 * Serverless PostgreSQL database with auto-scaling capabilities
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

// Helper to safely access process.env in both Node.js and Workers
const getProcessEnv = (key) => (typeof process !== 'undefined' ? process.env?.[key] : undefined);

class NeonDatabaseManager {
  constructor(options = {}) {
    this.connectionString = options.connectionString || getProcessEnv('NEON_DATABASE_URL');
    this.pool = null;
    this.options = {
      ssl: options.ssl !== false, // Default to SSL enabled
      max: options.maxConnections || 10,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: options.connectionTimeoutMillis || 5000,
      ...options,
    };
  }

  /**
   * Initialize connection to Neon database
   */
  async initialize() {
    if (!this.connectionString) {
      throw new Error('Neon database connection string is required');
    }

    this.pool = new Pool({
      connectionString: this.connectionString,
      ssl: this.options.ssl ? { rejectUnauthorized: false } : false,
      max: this.options.max,
      idleTimeoutMillis: this.options.idleTimeoutMillis,
      connectionTimeoutMillis: this.options.connectionTimeoutMillis,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT version()');
      client.release();

      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Neon database:', error.message);
      throw error;
    }
  }

  /**
   * Execute a query with automatic connection management
   */
  async query(text, params = []) {
    if (!this.pool) {
      await this.initialize();
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      // Query completed in ${duration}ms, ${result.rowCount} rows
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Setup Blaze Sports Intel schema in Neon database
   */
  async setupSchema() {
    const schemaSQL = `
      -- Enable necessary extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
      
      -- Teams table
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sport VARCHAR(50) NOT NULL,
        league VARCHAR(50),
        division VARCHAR(50),
        abbreviation VARCHAR(10),
        city VARCHAR(100),
        state VARCHAR(50),
        country VARCHAR(50) DEFAULT 'USA',
        established_year INTEGER,
        stadium_name VARCHAR(200),
        stadium_capacity INTEGER,
        primary_color VARCHAR(7),
        secondary_color VARCHAR(7),
        logo_url TEXT,
        website_url TEXT,
        social_media JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Players table
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        external_id VARCHAR(100),
        name VARCHAR(200) NOT NULL,
        jersey_number INTEGER,
        position VARCHAR(50),
        birth_date DATE,
        height_cm DECIMAL(5,2),
        weight_kg DECIMAL(5,2),
        dominant_hand VARCHAR(10) CHECK (dominant_hand IN ('left', 'right', 'both')),
        years_pro INTEGER,
        college VARCHAR(200),
        high_school VARCHAR(200),
        hometown VARCHAR(200),
        country VARCHAR(50) DEFAULT 'USA',
        draft_year INTEGER,
        draft_round INTEGER,
        draft_pick INTEGER,
        salary_usd DECIMAL(12,2),
        contract_years INTEGER,
        injury_history JSONB[],
        physical_metrics JSONB,
        performance_notes TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'injured', 'retired', 'suspended')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Games table
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(100),
        home_team_id INTEGER REFERENCES teams(id) NOT NULL,
        away_team_id INTEGER REFERENCES teams(id) NOT NULL,
        season INTEGER NOT NULL,
        week INTEGER,
        game_date DATE NOT NULL,
        game_time TIME,
        timezone VARCHAR(50) DEFAULT 'America/New_York',
        venue VARCHAR(200),
        home_score INTEGER DEFAULT 0,
        away_score INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'scheduled',
        inning_period INTEGER,
        clock_time VARCHAR(20),
        attendance INTEGER,
        weather JSONB,
        officials JSONB,
        broadcast_info JSONB,
        game_notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_different_teams CHECK (home_team_id != away_team_id)
      );

      -- Analytics table
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id),
        season INTEGER NOT NULL,
        metric_type VARCHAR(100) NOT NULL,
        metric_value DECIMAL(10,4),
        metric_data JSONB,
        calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_source VARCHAR(200),
        confidence DECIMAL(4,3),
        metadata JSONB
      );

      -- Pose data table (for biomechanics)
      CREATE TABLE IF NOT EXISTS pose_data (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id) NOT NULL,
        session_id UUID DEFAULT uuid_generate_v4(),
        recorded_at TIMESTAMP NOT NULL,
        camera_setup JSONB,
        keypoints JSONB NOT NULL,
        sport VARCHAR(50) NOT NULL,
        action_type VARCHAR(100),
        play_context JSONB,
        confidence_score DECIMAL(4,3),
        frame_rate INTEGER DEFAULT 30,
        duration_ms INTEGER,
        raw_data_url TEXT,
        processing_version VARCHAR(20),
        quality_flags JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Biomechanics analysis table
      CREATE TABLE IF NOT EXISTS biomech_analysis (
        id SERIAL PRIMARY KEY,
        pose_data_id INTEGER REFERENCES pose_data(id) NOT NULL,
        player_id INTEGER REFERENCES players(id) NOT NULL,
        analysis_version VARCHAR(20) NOT NULL,
        computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        joint_angles JSONB,
        angular_velocities JSONB,
        linear_velocities JSONB,
        accelerations JSONB,
        sport_metrics JSONB,
        efficiency_score DECIMAL(4,2),
        power_score DECIMAL(4,2),
        technique_score DECIMAL(4,2),
        consistency_score DECIMAL(4,2),
        injury_risk_score DECIMAL(4,2),
        risk_factors JSONB,
        risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'extreme')),
        percentile_rank DECIMAL(4,1),
        peer_comparison JSONB,
        overall_score DECIMAL(4,2),
        strengths TEXT[],
        weaknesses TEXT[],
        recommendations TEXT[],
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Game stats table
      CREATE TABLE IF NOT EXISTS game_stats (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) NOT NULL,
        player_id INTEGER REFERENCES players(id) NOT NULL,
        stats_data JSONB NOT NULL,
        minutes_played DECIMAL(5,2),
        position_played VARCHAR(50),
        performance_rating DECIMAL(4,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, player_id)
      );

      -- Season stats table
      CREATE TABLE IF NOT EXISTS season_stats (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id) NOT NULL,
        team_id INTEGER REFERENCES teams(id),
        season INTEGER NOT NULL,
        games_played INTEGER DEFAULT 0,
        stats_data JSONB NOT NULL,
        advanced_metrics JSONB,
        rankings JSONB,
        awards TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, season)
      );

      -- Injuries table
      CREATE TABLE IF NOT EXISTS injuries (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id) NOT NULL,
        injury_type VARCHAR(100) NOT NULL,
        body_part VARCHAR(100) NOT NULL,
        severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'major', 'season-ending')),
        injury_date DATE NOT NULL,
        expected_return_date DATE,
        actual_return_date DATE,
        games_missed INTEGER DEFAULT 0,
        treatment_plan TEXT,
        recovery_notes TEXT,
        related_biomech_data INTEGER REFERENCES biomech_analysis(id),
        caused_by_fatigue BOOLEAN DEFAULT FALSE,
        preventable_assessment JSONB,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'recovered', 'chronic')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Standings table
      CREATE TABLE IF NOT EXISTS standings (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) NOT NULL,
        season INTEGER NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0,
        win_percentage DECIMAL(5,3),
        games_back DECIMAL(4,1),
        streak VARCHAR(10),
        home_record VARCHAR(10),
        away_record VARCHAR(10),
        division_record VARCHAR(10),
        conference_record VARCHAR(10),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, season)
      );

      -- Live scores table
      CREATE TABLE IF NOT EXISTS live_scores (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) NOT NULL,
        event_sequence INTEGER NOT NULL,
        event_time TIMESTAMP NOT NULL,
        quarter_period INTEGER,
        clock_time VARCHAR(20),
        event_type VARCHAR(100),
        event_description TEXT,
        home_score INTEGER NOT NULL,
        away_score INTEGER NOT NULL,
        player_involved INTEGER REFERENCES players(id),
        event_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Predictions table
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id),
        team_id INTEGER REFERENCES teams(id),
        prediction_type VARCHAR(100) NOT NULL,
        prediction_data JSONB NOT NULL,
        confidence DECIMAL(4,3),
        prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        target_date DATE,
        actual_outcome JSONB,
        is_correct BOOLEAN,
        model_version VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- API cache table
      CREATE TABLE IF NOT EXISTS api_cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(500) UNIQUE NOT NULL,
        response_data JSONB NOT NULL,
        api_source VARCHAR(200) NOT NULL,
        request_params JSONB,
        expires_at TIMESTAMP NOT NULL,
        hit_count INTEGER DEFAULT 0,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport);
      CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league);
      CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
      CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
      CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
      CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
      CREATE INDEX IF NOT EXISTS idx_games_home_team ON games(home_team_id);
      CREATE INDEX IF NOT EXISTS idx_games_away_team ON games(away_team_id);
      CREATE INDEX IF NOT EXISTS idx_games_season ON games(season);
      CREATE INDEX IF NOT EXISTS idx_pose_data_player_id ON pose_data(player_id);
      CREATE INDEX IF NOT EXISTS idx_pose_data_recorded_at ON pose_data(recorded_at);
      CREATE INDEX IF NOT EXISTS idx_biomech_player_id ON biomech_analysis(player_id);
      CREATE INDEX IF NOT EXISTS idx_biomech_overall_score ON biomech_analysis(overall_score);
      CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at);

      -- JSONB GIN indexes for fast JSON queries
      CREATE INDEX IF NOT EXISTS idx_analytics_data ON analytics USING GIN (metric_data);
      CREATE INDEX IF NOT EXISTS idx_pose_keypoints ON pose_data USING GIN (keypoints);
      CREATE INDEX IF NOT EXISTS idx_biomech_metrics ON biomech_analysis USING GIN (sport_metrics);

      -- Create views for common queries
      CREATE OR REPLACE VIEW player_current_stats AS
      SELECT 
        p.id,
        p.name,
        p.position,
        t.name as team_name,
        t.abbreviation as team_abbr,
        ss.games_played,
        ss.stats_data,
        ss.advanced_metrics,
        ss.rankings
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN season_stats ss ON p.id = ss.player_id 
        AND ss.season = EXTRACT(YEAR FROM CURRENT_DATE)
      WHERE p.status = 'active';

      CREATE OR REPLACE VIEW team_standings_current AS
      SELECT 
        t.id,
        t.name,
        t.abbreviation,
        t.sport,
        t.division,
        s.wins,
        s.losses,
        s.ties,
        s.win_percentage,
        s.games_back,
        s.streak,
        s.last_updated
      FROM teams t
      LEFT JOIN standings s ON t.id = s.team_id 
        AND s.season = EXTRACT(YEAR FROM CURRENT_DATE)
      ORDER BY t.sport, t.division, s.win_percentage DESC;

      CREATE OR REPLACE VIEW biomech_risk_summary AS
      SELECT 
        p.id as player_id,
        p.name as player_name,
        t.name as team_name,
        COUNT(ba.id) as analysis_count,
        AVG(ba.overall_score) as avg_overall_score,
        AVG(ba.injury_risk_score) as avg_risk_score,
        MODE() WITHIN GROUP (ORDER BY ba.risk_level) as primary_risk_level,
        MAX(ba.computed_at) as last_analysis
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN biomech_analysis ba ON p.id = ba.player_id
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, t.name
      HAVING COUNT(ba.id) > 0
      ORDER BY avg_risk_score DESC;
    `;

    try {
      await this.query(schemaSQL);
      return true;
    } catch (error) {
      console.error('❌ Schema setup failed:', error);
      throw error;
    }
  }

  /**
   * Seed initial data for testing and development
   */
  async seedData() {
    // Sample teams
    const teamsData = [
      {
        name: 'St. Louis Cardinals',
        sport: 'MLB',
        league: 'National League',
        division: 'NL Central',
        abbreviation: 'STL',
        city: 'St. Louis',
        state: 'Missouri',
        stadium_name: 'Busch Stadium',
        stadium_capacity: 45494,
        primary_color: '#C41E3A',
        secondary_color: '#FFC52F',
      },
      {
        name: 'Tennessee Titans',
        sport: 'NFL',
        league: 'American Football Conference',
        division: 'AFC South',
        abbreviation: 'TEN',
        city: 'Nashville',
        state: 'Tennessee',
        stadium_name: 'Nissan Stadium',
        stadium_capacity: 69143,
        primary_color: '#4B92DB',
        secondary_color: '#C8102E',
      },
      {
        name: 'Memphis Grizzlies',
        sport: 'NBA',
        league: 'National Basketball Association',
        division: 'Southwest Division',
        abbreviation: 'MEM',
        city: 'Memphis',
        state: 'Tennessee',
        stadium_name: 'FedExForum',
        stadium_capacity: 17794,
        primary_color: '#5D76A9',
        secondary_color: '#F5B112',
      },
    ];

    for (const team of teamsData) {
      await this.query(
        `
        INSERT INTO teams (name, sport, league, division, abbreviation, city, state, stadium_name, stadium_capacity, primary_color, secondary_color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `,
        [
          team.name,
          team.sport,
          team.league,
          team.division,
          team.abbreviation,
          team.city,
          team.state,
          team.stadium_name,
          team.stadium_capacity,
          team.primary_color,
          team.secondary_color,
        ]
      );
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Test database performance
   */
  async performanceTest() {
    const tests = [
      {
        name: 'Simple SELECT',
        query: 'SELECT 1 as test',
        iterations: 100,
      },
      {
        name: 'Teams query',
        query: 'SELECT * FROM teams LIMIT 10',
        iterations: 50,
      },
      {
        name: 'Complex JOIN',
        query: `
          SELECT p.name, t.name as team, COUNT(gs.id) as games
          FROM players p
          LEFT JOIN teams t ON p.team_id = t.id
          LEFT JOIN game_stats gs ON p.id = gs.player_id
          GROUP BY p.id, p.name, t.name
          LIMIT 10
        `,
        iterations: 20,
      },
    ];

    const results = [];

    for (const test of tests) {
      const times = [];

      for (let i = 0; i < test.iterations; i++) {
        const start = Date.now();
        await this.query(test.query);
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      results.push({
        test: test.name,
        iterations: test.iterations,
        avgTime: `${avgTime.toFixed(2)}ms`,
        minTime: `${minTime}ms`,
        maxTime: `${maxTime}ms`,
      });
    }

    return results;
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache() {
    const result = await this.query('DELETE FROM api_cache WHERE expires_at < CURRENT_TIMESTAMP');

    return result.rowCount;
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    const stats = await this.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);

    return stats.rows;
  }

  /**
   * Gracefully close all connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export default NeonDatabaseManager;

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const neon = new NeonDatabaseManager();

  async function main() {
    try {
      await neon.initialize();
      await neon.setupSchema();
      await neon.seedData();

      await neon.performanceTest();

      const stats = await neon.getDatabaseStats();
      console.table(stats);

      await neon.close();
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }

  main();
}
