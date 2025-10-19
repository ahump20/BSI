import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const ensureStubModule = (segments, content) => {
    const dir = path.join(projectRoot, 'node_modules', ...segments);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.js'), content, 'utf8');
};

ensureStubModule(['@tensorflow', 'tfjs-node'], 'export default {};\n');
ensureStubModule(['pg'], `export class Pool {\n    constructor() {}\n    async query() {\n        throw new Error('pg stub: query should be mocked');\n    }\n}\nexport default { Pool };\n`);

const { SportsFeatureEngineer } = await import('../../api/ml/ml-pipeline-service.js');

class StubDB {
    constructor(fixtures) {
        this.fixtures = fixtures;
        this.calls = [];
    }

    async query(sql, params = []) {
        this.calls.push({ sql, params });

        if (sql.includes('WITH ordered_games AS')) {
            const teamId = params[0];
            const score = this.fixtures.recentForm[teamId] ?? 0.55;
            return { rows: [{ form_score: score }] };
        }

        if (sql.includes('SELECT g.game_date') && !sql.includes('ROW_NUMBER() OVER')) {
            const teamId = params[0];
            const lastGame = this.fixtures.restDays[teamId];
            if (!lastGame) {
                return { rows: [] };
            }
            return { rows: [{ game_date: lastGame }] };
        }

        if (sql.includes('FROM team_analytics')) {
            const teamId = params[0];
            const row = this.fixtures.teamAnalytics[teamId];
            if (!row) {
                return { rows: [] };
            }
            return { rows: [row] };
        }

        return { rows: [] };
    }
}

const logger = {
    warn: () => {},
};

const createAnalyticsRow = (sport, overrides = {}) => ({
    games_played: overrides.games_played ?? 40,
    wins: overrides.wins ?? 25,
    losses: overrides.losses ?? 15,
    win_percentage: overrides.win_percentage ?? 0.625,
    runs_scored: overrides.runs_scored ?? 180,
    runs_allowed: overrides.runs_allowed ?? 150,
    elo_rating: overrides.elo_rating ?? 1520,
    strength_of_schedule: overrides.strength_of_schedule ?? 0.53,
    predicted_wins: overrides.predicted_wins ?? 18.5,
    predicted_losses: overrides.predicted_losses ?? 12.5,
    playoff_probability: overrides.playoff_probability ?? 0.42,
    sport_specific_stats: JSON.stringify({
        offensive_rating: overrides.offensive_rating ?? 4.8,
        defensive_rating: overrides.defensive_rating ?? 3.9,
        roster_strength: overrides.roster_strength ?? 0.68,
        coaching_stability: overrides.coaching_stability ?? 0.62,
        injury_risk_score: overrides.injury_risk_score ?? 0.22,
        offensive_projection: overrides.offensive_projection ?? 5.1,
        defensive_projection: overrides.defensive_projection ?? 3.6,
        depth_chart_strength: overrides.depth_chart_strength ?? 0.7,
        recent_transactions: overrides.recent_transactions ?? 0.12,
        points_per_game: overrides.points_per_game,
        points_allowed_per_game: overrides.points_allowed_per_game,
        runs_per_game: overrides.runs_per_game,
        runs_allowed_per_game: overrides.runs_allowed_per_game,
    }),
    team_metadata: JSON.stringify({
        roster_strength: overrides.roster_strength ?? 0.68,
        coaching_stability: overrides.coaching_stability ?? 0.62,
        injury_risk_score: overrides.injury_risk_score ?? 0.22,
        depth_chart_strength: overrides.depth_chart_strength ?? 0.7,
        recent_transactions_impact: overrides.recent_transactions ?? 0.12,
    }),
});

describe('SportsFeatureEngineer feature calculations', () => {
    it('produces realistic outcome features for MLB/NFL/NBA teams', async () => {
        const fixtures = {
            teamAnalytics: {
                'mlb-home': createAnalyticsRow('mlb', { offensive_rating: 4.9, defensive_rating: 3.7, elo_rating: 1535 }),
                'mlb-away': createAnalyticsRow('mlb', { offensive_rating: 4.3, defensive_rating: 4.1, elo_rating: 1490, strength_of_schedule: 0.49 }),
                'nfl-home': createAnalyticsRow('nfl', { offensive_rating: 27.5, defensive_rating: 19.3, runs_scored: 330, runs_allowed: 240, elo_rating: 1580 }),
                'nfl-away': createAnalyticsRow('nfl', { offensive_rating: 23.4, defensive_rating: 21.1, runs_scored: 300, runs_allowed: 260, elo_rating: 1510, strength_of_schedule: 0.5 }),
                'nba-home': createAnalyticsRow('nba', { offensive_rating: 115.2, defensive_rating: 108.9, runs_scored: 4500, runs_allowed: 4300, elo_rating: 1600 }),
                'nba-away': createAnalyticsRow('nba', { offensive_rating: 111.1, defensive_rating: 112.5, runs_scored: 4300, runs_allowed: 4400, elo_rating: 1550, strength_of_schedule: 0.51 }),
            },
            recentForm: {
                'mlb-home': 0.64,
                'mlb-away': 0.52,
                'nfl-home': 0.7,
                'nfl-away': 0.55,
                'nba-home': 0.66,
                'nba-away': 0.5,
            },
            restDays: {
                'mlb-home': new Date(Date.UTC(2025, 5, 1)).toISOString(),
                'mlb-away': new Date(Date.UTC(2025, 5, 2)).toISOString(),
                'nfl-home': new Date(Date.UTC(2025, 8, 10)).toISOString(),
                'nfl-away': new Date(Date.UTC(2025, 8, 8)).toISOString(),
                'nba-home': new Date(Date.UTC(2025, 2, 20)).toISOString(),
                'nba-away': new Date(Date.UTC(2025, 2, 21)).toISOString(),
            },
        };
        const db = new StubDB(fixtures);
        const engineer = new SportsFeatureEngineer(db, logger);

        const now = new Date(Date.UTC(2025, 5, 5)).toISOString();
        const sports = ['mlb', 'nfl', 'nba'];
        for (const sport of sports) {
            const dataPoint = {
                sport,
                game_date: now,
                home_team_id: `${sport}-home`,
                away_team_id: `${sport}-away`,
                metadata: {},
            };

            const homeForm = await engineer.calculateFeature('home_recent_form', dataPoint);
            const awayForm = await engineer.calculateFeature('away_recent_form', dataPoint);
            const offense = await engineer.calculateFeature('home_offensive_rating', dataPoint);
            const defense = await engineer.calculateFeature('home_defensive_rating', dataPoint);
            const sosDiff = await engineer.calculateFeature('strength_of_schedule_diff', dataPoint);
            const restDiff = await engineer.calculateFeature('rest_days_diff', dataPoint);

            assert.ok(homeForm > 0.5);
            assert.ok(awayForm >= 0.5);
            assert.ok(offense > 0);
            assert.ok(defense > 0);
            assert.notStrictEqual(sosDiff, 0);
            assert.ok(Number.isFinite(restDiff));
        }

        assert.ok(db.calls.some((call) => call.sql.includes('ROW_NUMBER() OVER')));
    });

    it('supports NCAA sports with roster and projection metrics', async () => {
        const fixtures = {
            teamAnalytics: {
                'ncaa_baseball-team': createAnalyticsRow('ncaa_baseball', {
                    offensive_rating: 6.8,
                    defensive_rating: 4.9,
                    roster_strength: 0.74,
                    strength_of_schedule: 0.58,
                    offensive_projection: 7.1,
                    defensive_projection: 4.3,
                    elo_rating: 1540,
                }),
                'ncaa_football-team': createAnalyticsRow('ncaa_football', {
                    offensive_rating: 32.4,
                    defensive_rating: 22.1,
                    roster_strength: 0.79,
                    strength_of_schedule: 0.6,
                    offensive_projection: 33.2,
                    defensive_projection: 21.6,
                    elo_rating: 1605,
                }),
                'ncaa_basketball-team': createAnalyticsRow('ncaa_basketball', {
                    offensive_rating: 108.3,
                    defensive_rating: 99.6,
                    roster_strength: 0.72,
                    strength_of_schedule: 0.59,
                    offensive_projection: 109.5,
                    defensive_projection: 98.4,
                    elo_rating: 1570,
                }),
            },
            recentForm: {
                'ncaa_baseball-team': 0.61,
                'ncaa_football-team': 0.68,
                'ncaa_basketball-team': 0.65,
            },
            restDays: {},
        };

        const db = new StubDB(fixtures);
        const engineer = new SportsFeatureEngineer(db, logger);

        const sports = ['ncaa_baseball', 'ncaa_football', 'ncaa_basketball'];
        for (const sport of sports) {
            const dataPoint = {
                sport,
                team_id: `${sport}-team`,
            };

            const rosterStrength = await engineer.calculateFeature('roster_strength', dataPoint);
            const offensiveProjection = await engineer.calculateFeature('offensive_projection', dataPoint);
            const defensiveProjection = await engineer.calculateFeature('defensive_projection', dataPoint);
            const recentForm = await engineer.calculateFeature('recent_form', dataPoint);

            assert.ok(rosterStrength > 0.6);
            assert.ok(offensiveProjection > 0);
            assert.ok(defensiveProjection > 0);
            assert.ok(recentForm >= 0.5);
        }

        assert.ok(db.calls.some((call) => call.sql.includes('team_analytics')));
    });

    it('returns stable player performance features with sport-aware defaults', async () => {
        const fixtures = {
            teamAnalytics: {},
            recentForm: {},
            restDays: {},
        };
        const db = new StubDB(fixtures);
        const engineer = new SportsFeatureEngineer(db, logger);

        const playerPoint = {
            sport: 'mlb',
            player_id: 'player-1',
            team_id: 'mlb-home',
            recent_form: 0.62,
            career_stats: 0.71,
            age_factor: 0.33,
            injury_history: 0.12,
            matchup_difficulty: 0.48,
            rest_days: 2,
            home_away_splits: 0.55,
            weather_performance: 0.57,
            clutch_situations: 0.6,
        };

        const features = [
            'career_stats',
            'recent_form',
            'age_factor',
            'injury_history',
            'matchup_difficulty',
            'rest_days',
            'home_away_splits',
            'weather_performance',
            'clutch_situations',
        ];

        for (const feature of features) {
            const value = await engineer.calculateFeature(feature, playerPoint);
            assert.ok(Number.isFinite(value));
            assert.ok(value >= 0);
        }
    });
});
