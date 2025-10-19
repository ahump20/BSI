/**
 * BLAZE SPORTS INTEL - MACHINE LEARNING PIPELINE
 * Phase 3B: Production ML pipeline replacing random number generators
 *
 * Real predictive models using TensorFlow.js and statistical analysis
 * Features:
 * - Automated model training and retraining
 * - Feature engineering for sports analytics
 * - Model versioning and A/B testing
 * - Real-time prediction serving
 * - Performance monitoring and drift detection
 */

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

class MLPipelineService {
    constructor(logger, dbConfig, options = {}) {
        this.logger = logger;
        this.db = new Pool(dbConfig);

        this.allowedSports = [
            'mlb',
            'nfl',
            'nba',
            'ncaa_baseball',
            'ncaa_football',
            'ncaa_basketball'
        ];

        // Model configuration
        this.models = new Map();
        this.modelVersions = new Map();
        this.modelMetadata = new Map();
        this.activeTrainings = new Set();

        this.modelStoragePath = options.modelStoragePath
            || path.join(process.cwd(), 'storage', 'models');
        this.metadataPath = path.join(this.modelStoragePath, 'metadata.json');

        // Training configuration
        this.trainingConfig = {
            batchSize: options.batchSize || 32,
            epochs: options.epochs || 100,
            validationSplit: options.validationSplit || 0.2,
            patience: options.patience || 10,
            minDelta: options.minDelta || 0.001
        };

        // Feature engineering
        this.featureEngineering = new SportsFeatureEngineer(this.db, this.logger);

        // Prediction cache
        this.predictionCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes

        // Performance tracking
        this.metrics = {
            predictions: 0,
            cacheHits: 0,
            modelRetrainings: 0,
            errors: 0
        };

        this.initialize();
    }

    async initialize() {
        try {
            this.logger.info('Initializing ML Pipeline Service');

            // Load existing models
            await this.loadModels();

            // Register available model types
            this.registerModelTypes();

            // Start background tasks
            this.startModelMonitoring();

            this.logger.info('ML Pipeline Service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize ML Pipeline Service', {}, error);
            throw error;
        }
    }

    /**
     * Register available model types and their configurations
     */
    registerModelTypes() {
        // Game outcome prediction model
        this.modelConfigs = {
            'game_outcome': {
                type: 'classification',
                features: [
                    'home_elo_rating', 'away_elo_rating', 'elo_difference',
                    'home_recent_form', 'away_recent_form',
                    'home_offensive_rating', 'away_offensive_rating',
                    'home_defensive_rating', 'away_defensive_rating',
                    'strength_of_schedule_diff', 'rest_days_diff',
                    'home_field_advantage', 'weather_impact'
                ],
                labels: ['home_win', 'away_win'],
                architecture: this.createGameOutcomeModel,
                retrainFrequency: 'weekly'
            },

            'season_wins': {
                type: 'regression',
                features: [
                    'preseason_elo', 'roster_strength', 'coaching_stability',
                    'injury_risk_score', 'schedule_difficulty',
                    'offensive_projection', 'defensive_projection',
                    'depth_chart_strength', 'recent_transactions'
                ],
                target: 'total_wins',
                architecture: this.createSeasonWinsModel,
                retrainFrequency: 'monthly'
            },

            'player_performance': {
                type: 'regression',
                features: [
                    'career_stats', 'recent_form', 'age_factor',
                    'injury_history', 'matchup_difficulty',
                    'rest_days', 'home_away_splits',
                    'weather_performance', 'clutch_situations'
                ],
                target: 'performance_score',
                architecture: this.createPlayerPerformanceModel,
                retrainFrequency: 'daily'
            }
        };

        this.logger.info('Registered model types', {
            modelTypes: Object.keys(this.modelConfigs)
        });
    }

    /**
     * Train a specific model type
     */
    async trainModel(modelType, options = {}) {
        const startTime = Date.now();
        let trainingRun;

        try {
            if (this.activeTrainings.has(modelType)) {
                this.logger.warn(`Training already in progress for ${modelType}, skipping new request`);
                return null;
            }
            this.activeTrainings.add(modelType);

            this.logger.info(`Starting training for ${modelType} model`);

            const config = this.modelConfigs[modelType];
            if (!config) {
                throw new Error(`Unknown model type: ${modelType}`);
            }

            // Create training run record
            trainingRun = await this.createTrainingRun(modelType, options);

            // Get training data
            const trainingData = await this.prepareTrainingData(modelType, options);
            this.logger.info(`Prepared training data`, {
                modelType,
                samples: trainingData.train.features.length,
                features: trainingData.featureCount
            });

            // Validate data quality
            await this.validateTrainingData(trainingData);

            // Create and compile model
            const model = config.architecture.call(this, trainingData.featureCount);

            // Train model with callbacks
            const history = await this.trainModelWithCallbacks(
                model,
                trainingData,
                trainingRun,
                config.type
            );

            // Evaluate model performance
            const evaluation = await this.evaluateModel(model, trainingData, config.type);

            // Save model and update training run
            const modelVersion = await this.saveModel(
                model,
                modelType,
                evaluation,
                trainingRun?.model_version,
                trainingData.normalizationParams,
                trainingData.featureNames
            );
            await this.updateTrainingRun(trainingRun.id, 'completed', evaluation, modelVersion, null, modelType);

            // Update active model
            this.models.set(modelType, model);
            this.modelVersions.set(modelType, modelVersion);

            const duration = Date.now() - startTime;
            this.metrics.modelRetrainings++;

            this.logger.info(`Model training completed`, {
                modelType,
                modelVersion,
                duration_ms: duration,
                accuracy: evaluation.accuracy,
                loss: evaluation.loss
            });

            return {
                modelType,
                modelVersion,
                evaluation,
                duration_ms: duration
            };

        } catch (error) {
            this.metrics.errors++;

            if (trainingRun) {
                await this.updateTrainingRun(trainingRun.id, 'failed', null, null, error.message, modelType);
            }

            this.logger.error(`Model training failed for ${modelType}`, {
                duration_ms: Date.now() - startTime
            }, error);

            throw error;
        } finally {
            this.activeTrainings.delete(modelType);
        }
    }

    /**
     * Make predictions using trained models
     */
    async predict(modelType, inputData, options = {}) {
        const startTime = Date.now();

        try {
            this.metrics.predictions++;

            // Check cache first
            const cacheKey = this.generateCacheKey(modelType, inputData);
            if (this.predictionCache.has(cacheKey)) {
                const cached = this.predictionCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheExpiry) {
                    this.metrics.cacheHits++;
                    return cached.prediction;
                }
            }

            // Get model
            const model = this.models.get(modelType);
            if (!model) {
                throw new Error(`Model not found: ${modelType}. Available: ${Array.from(this.models.keys())}`);
            }

            // Prepare features
            const features = await this.prepareFeatures(modelType, inputData);

            // Make prediction
            const prediction = await this.makePrediction(model, features, modelType);

            // Cache prediction
            this.predictionCache.set(cacheKey, {
                prediction,
                timestamp: Date.now()
            });

            // Log prediction
            await this.logPrediction(modelType, inputData, prediction, {
                duration_ms: Date.now() - startTime,
                cached: false
            });

            return prediction;

        } catch (error) {
            this.metrics.errors++;
            this.logger.error(`Prediction failed for ${modelType}`, {
                inputData,
                duration_ms: Date.now() - startTime
            }, error);
            throw error;
        }
    }

    /**
     * Create game outcome prediction model architecture
     */
    createGameOutcomeModel(featureCount) {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [featureCount],
                    units: 64,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 2, // home_win, away_win
                    activation: 'softmax'
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    /**
     * Create season wins regression model
     */
    createSeasonWinsModel(featureCount) {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [featureCount],
                    units: 128,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 64,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 1, // predicted wins
                    activation: 'linear'
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['meanAbsoluteError']
        });

        return model;
    }

    /**
     * Create player performance model
     */
    createPlayerPerformanceModel(featureCount) {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [featureCount],
                    units: 96,
                    activation: 'relu'
                }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 48,
                    activation: 'relu'
                }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 24,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 1,
                    activation: 'sigmoid' // performance score 0-1
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['meanAbsoluteError']
        });

        return model;
    }

    /**
     * Prepare training data from database
     */
    async prepareTrainingData(modelType, options = {}) {
        const config = this.modelConfigs[modelType];
        const startDate = options.startDate || '2020-01-01';
        const endDate = options.endDate || new Date().toISOString().split('T')[0];

        this.logger.info(`Preparing training data for ${modelType}`, {
            startDate,
            endDate,
            features: config.features
        });

        // Get raw data based on model type
        let rawData;
        switch (modelType) {
            case 'game_outcome':
                rawData = await this.getGameOutcomeData(startDate, endDate);
                break;
            case 'season_wins':
                rawData = await this.getSeasonWinsData(startDate, endDate);
                break;
            case 'player_performance':
                rawData = await this.getPlayerPerformanceData(startDate, endDate);
                break;
            default:
                throw new Error(`No data preparation method for ${modelType}`);
        }

        // Engineer features
        const engineeredData = await this.featureEngineering.engineer(rawData, config.features);

        // Normalize features
        const normalizedData = this.normalizeFeatures(engineeredData);

        // Split into train/validation
        const split = this.trainingConfig.validationSplit;
        const splitIndex = Math.floor(normalizedData.features.length * (1 - split));

        return {
            train: {
                features: normalizedData.features.slice(0, splitIndex),
                labels: normalizedData.labels.slice(0, splitIndex)
            },
            validation: {
                features: normalizedData.features.slice(splitIndex),
                labels: normalizedData.labels.slice(splitIndex)
            },
            featureCount: normalizedData.features[0].length,
            featureNames: config.features,
            normalizationParams: normalizedData.normalizationParams
        };
    }

    async getGameOutcomeData(startDate, endDate, filters = {}) {
        const params = [startDate, endDate, this.allowedSports];
        const conditions = [
            'g.game_date BETWEEN $1::date AND $2::date',
            'g.sport = ANY($3::text[])'
        ];

        let paramIndex = params.length;

        if (filters.statuses && filters.statuses.length) {
            params.push(filters.statuses);
            paramIndex += 1;
            conditions.push(`g.status = ANY($${paramIndex}::text[])`);
        } else {
            conditions.push("g.status = 'completed'");
        }

        if (filters.gameId) {
            params.push(filters.gameId);
            paramIndex += 1;
            conditions.push(`g.id = $${paramIndex}`);
        }

        if (filters.homeTeamId) {
            params.push(filters.homeTeamId);
            paramIndex += 1;
            conditions.push(`g.home_team_id = $${paramIndex}`);
        }

        if (filters.awayTeamId) {
            params.push(filters.awayTeamId);
            paramIndex += 1;
            conditions.push(`g.away_team_id = $${paramIndex}`);
        }

        if (filters.sport) {
            params.push(filters.sport);
            paramIndex += 1;
            conditions.push(`g.sport = $${paramIndex}`);
        }

        const limitClause = filters.limit ? `LIMIT $${paramIndex + 1}` : '';
        if (filters.limit) {
            params.push(filters.limit);
        }

        const query = `
            SELECT
                g.id as game_id,
                g.game_date,
                g.sport,
                g.home_team_id,
                g.away_team_id,
                g.home_score,
                g.away_score,
                g.weather,
                g.metadata,
                g.venue,
                g.season,
                ht.name as home_team_name,
                at.name as away_team_name,
                hta.elo_rating as home_elo_rating,
                ata.elo_rating as away_elo_rating,
                hta.strength_of_schedule as home_strength_of_schedule,
                ata.strength_of_schedule as away_strength_of_schedule,
                hta.games_played as home_games_played,
                ata.games_played as away_games_played,
                hta.wins as home_wins,
                ata.wins as away_wins,
                hta.losses as home_losses,
                ata.losses as away_losses,
                hta.runs_scored as home_runs_scored,
                ata.runs_scored as away_runs_scored,
                hta.runs_allowed as home_runs_allowed,
                ata.runs_allowed as away_runs_allowed,
                hta.sport_specific_stats as home_sport_stats,
                ata.sport_specific_stats as away_sport_stats,
                hform.recent_form as home_recent_form,
                aform.recent_form as away_recent_form,
                hform.last_game_date as home_last_game_date,
                aform.last_game_date as away_last_game_date
            FROM games g
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams at ON g.away_team_id = at.id
            LEFT JOIN LATERAL (
                SELECT ta.*
                FROM team_analytics ta
                WHERE ta.team_id = g.home_team_id
                  AND ta.season = g.season
                ORDER BY COALESCE(ta.week, 0) DESC, ta.calculation_date DESC
                LIMIT 1
            ) hta ON TRUE
            LEFT JOIN LATERAL (
                SELECT ta.*
                FROM team_analytics ta
                WHERE ta.team_id = g.away_team_id
                  AND ta.season = g.season
                ORDER BY COALESCE(ta.week, 0) DESC, ta.calculation_date DESC
                LIMIT 1
            ) ata ON TRUE
            LEFT JOIN LATERAL (
                SELECT
                    AVG(CASE
                        WHEN (sg.home_team_id = g.home_team_id AND sg.home_score > sg.away_score)
                          OR (sg.away_team_id = g.home_team_id AND sg.away_score > sg.home_score)
                        THEN 1.0 ELSE 0.0 END) AS recent_form,
                    MAX(sg.game_date) AS last_game_date
                FROM (
                    SELECT *
                    FROM games sg
                    WHERE sg.sport = g.sport
                      AND (sg.home_team_id = g.home_team_id OR sg.away_team_id = g.home_team_id)
                      AND sg.game_date < g.game_date
                    ORDER BY sg.game_date DESC
                    LIMIT 10
                ) sg
            ) hform ON TRUE
            LEFT JOIN LATERAL (
                SELECT
                    AVG(CASE
                        WHEN (sg.home_team_id = g.away_team_id AND sg.home_score > sg.away_score)
                          OR (sg.away_team_id = g.away_team_id AND sg.away_score > sg.home_score)
                        THEN 1.0 ELSE 0.0 END) AS recent_form,
                    MAX(sg.game_date) AS last_game_date
                FROM (
                    SELECT *
                    FROM games sg
                    WHERE sg.sport = g.sport
                      AND (sg.home_team_id = g.away_team_id OR sg.away_team_id = g.away_team_id)
                      AND sg.game_date < g.game_date
                    ORDER BY sg.game_date DESC
                    LIMIT 10
                ) sg
            ) aform ON TRUE
            WHERE ${conditions.join(' AND ')}
            ORDER BY g.game_date ASC
            ${limitClause}
        `;

        try {
            const result = await this.db.query(query, params);
            const mapValue = (value) => {
                if (value === null || value === undefined) {
                    return null;
                }
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch (err) {
                        return value;
                    }
                }
                return value;
            };

            const toNumber = (val, fallback = 0) => {
                const num = Number(val);
                return Number.isFinite(num) ? num : fallback;
            };

            return result.rows.map((row) => {
                const weather = mapValue(row.weather) || {};
                const homeStats = mapValue(row.home_sport_stats) || {};
                const awayStats = mapValue(row.away_sport_stats) || {};

                const gameDate = new Date(row.game_date);
                const lastHome = row.home_last_game_date ? new Date(row.home_last_game_date) : null;
                const lastAway = row.away_last_game_date ? new Date(row.away_last_game_date) : null;
                const restDaysHome = lastHome ? Math.max(0, Math.round((gameDate - lastHome) / (24 * 60 * 60 * 1000))) : 3;
                const restDaysAway = lastAway ? Math.max(0, Math.round((gameDate - lastAway) / (24 * 60 * 60 * 1000))) : 3;

                const defaultHomeOffensiveRating = toNumber(row.home_runs_scored, 0) / Math.max(toNumber(row.home_games_played, 1), 1);
                const defaultAwayOffensiveRating = toNumber(row.away_runs_scored, 0) / Math.max(toNumber(row.away_games_played, 1), 1);
                const homeOffensive = toNumber(homeStats.offensive_rating, defaultHomeOffensiveRating);
                const awayOffensive = toNumber(awayStats.offensive_rating, defaultAwayOffensiveRating);
                const homeDefensive = toNumber(homeStats.defensive_rating, toNumber(row.home_runs_allowed, 0) / Math.max(toNumber(row.home_games_played, 1), 1));
                const awayDefensive = toNumber(awayStats.defensive_rating, toNumber(row.away_runs_allowed, 0) / Math.max(toNumber(row.away_games_played, 1), 1));

                const sosDiff = toNumber(row.home_strength_of_schedule, 0.5) - toNumber(row.away_strength_of_schedule, 0.5);
                const weatherImpact = toNumber(weather.impact_score ?? weather.impact ?? weather.severity, 0);

                const homeAdvantage = this.featureEngineering.calculateHomeFieldAdvantage({ sport: row.sport });
                const label = (row.home_score != null && row.away_score != null)
                    ? (row.home_score > row.away_score ? [1, 0] : [0, 1])
                    : [0, 0];

                return {
                    game_id: row.game_id,
                    sport: row.sport,
                    game_date: row.game_date,
                    home_team_id: row.home_team_id,
                    away_team_id: row.away_team_id,
                    home_elo_rating: toNumber(row.home_elo_rating, 1500),
                    away_elo_rating: toNumber(row.away_elo_rating, 1500),
                    elo_difference: toNumber(row.home_elo_rating, 1500) - toNumber(row.away_elo_rating, 1500),
                    home_recent_form: toNumber(row.home_recent_form, 0.5),
                    away_recent_form: toNumber(row.away_recent_form, 0.5),
                    home_offensive_rating: homeOffensive,
                    away_offensive_rating: awayOffensive,
                    home_defensive_rating: homeDefensive,
                    away_defensive_rating: awayDefensive,
                    strength_of_schedule_diff: sosDiff,
                    rest_days_diff: restDaysHome - restDaysAway,
                    home_field_advantage: homeAdvantage,
                    weather_impact: weatherImpact,
                    label,
                    metadata: {
                        weather,
                        home_team_name: row.home_team_name,
                        away_team_name: row.away_team_name,
                        venue: row.venue,
                        rest_days: { home: restDaysHome, away: restDaysAway }
                    }
                };
            });
        } catch (error) {
            this.logger.error('Failed to load game outcome training data', {
                startDate,
                endDate,
                filters
            }, error);
            throw error;
        }
    }

    async getSeasonWinsData(startDate, endDate, filters = {}) {
        const startSeason = new Date(startDate).getFullYear();
        const endSeason = new Date(endDate).getFullYear();

        const params = [startSeason, endSeason, this.allowedSports];
        const conditions = [
            'ta.season BETWEEN $1 AND $2',
            't.sport = ANY($3::text[])'
        ];

        let paramIndex = params.length;

        if (filters.teamId) {
            params.push(filters.teamId);
            paramIndex += 1;
            conditions.push(`ta.team_id = $${paramIndex}`);
        }

        if (filters.season) {
            params.push(filters.season);
            paramIndex += 1;
            conditions.push(`ta.season = $${paramIndex}`);
        }

        if (filters.sport) {
            params.push(filters.sport);
            paramIndex += 1;
            conditions.push(`t.sport = $${paramIndex}`);
        }

        const query = `
            SELECT
                ta.team_id,
                ta.season,
                ta.games_played,
                ta.wins,
                ta.losses,
                ta.elo_rating,
                ta.strength_of_schedule,
                ta.pythagorean_win_pct,
                ta.sport_specific_stats,
                ta.predicted_wins,
                ta.predicted_losses,
                t.sport,
                t.metadata as team_metadata
            FROM team_analytics ta
            JOIN teams t ON ta.team_id = t.id
            WHERE ${conditions.join(' AND ')}
        `;

        try {
            const result = await this.db.query(query, params);
            return result.rows.map((row) => {
                const sportStats = typeof row.sport_specific_stats === 'string'
                    ? JSON.parse(row.sport_specific_stats)
                    : (row.sport_specific_stats || {});
                const teamMetadata = typeof row.team_metadata === 'string'
                    ? JSON.parse(row.team_metadata)
                    : (row.team_metadata || {});

                const safeNumber = (value, fallback = 0) => {
                    const num = Number(value);
                    return Number.isFinite(num) ? num : fallback;
                };

                const preseasonElo = safeNumber(
                    sportStats.preseason_elo ?? row.elo_rating,
                    1500
                );

                const rosterStrength = safeNumber(
                    sportStats.roster_strength ?? teamMetadata.roster_strength,
                    0.5
                );

                const coachingStability = safeNumber(
                    sportStats.coaching_stability ?? teamMetadata.coaching_stability,
                    0.5
                );

                const injuryRisk = safeNumber(
                    sportStats.injury_risk_score ?? teamMetadata.injury_risk_score,
                    0.25
                );

                const scheduleDifficulty = safeNumber(row.strength_of_schedule, 0.5);

                const predictedWins = Number.isFinite(Number(row.predicted_wins))
                    ? Number(row.predicted_wins)
                    : null;
                const projectedRunsScored = Number.isFinite(Number(sportStats.projected_runs_scored))
                    ? Number(sportStats.projected_runs_scored)
                    : null;
                const offensiveProjection = Number.isFinite(Number(sportStats.offensive_projection))
                    ? Number(sportStats.offensive_projection)
                    : (predictedWins ?? projectedRunsScored ?? 0);

                const predictedLosses = Number.isFinite(Number(row.predicted_losses))
                    ? Number(row.predicted_losses)
                    : null;
                const projectedRunsAllowed = Number.isFinite(Number(sportStats.projected_runs_allowed))
                    ? Number(sportStats.projected_runs_allowed)
                    : null;
                const defensiveProjection = Number.isFinite(Number(sportStats.defensive_projection))
                    ? Number(sportStats.defensive_projection)
                    : (predictedLosses ?? projectedRunsAllowed ?? 0);

                const depthChartStrength = safeNumber(
                    sportStats.depth_chart_strength ?? teamMetadata.depth_chart_strength,
                    0.5
                );

                const recentTransactions = safeNumber(
                    sportStats.recent_transactions ?? teamMetadata.recent_transactions_impact,
                    0
                );

                return {
                    team_id: row.team_id,
                    season: row.season,
                    sport: row.sport,
                    preseason_elo: preseasonElo,
                    roster_strength: rosterStrength,
                    coaching_stability: coachingStability,
                    injury_risk_score: injuryRisk,
                    schedule_difficulty: scheduleDifficulty,
                    offensive_projection: offensiveProjection,
                    defensive_projection: defensiveProjection,
                    depth_chart_strength: depthChartStrength,
                    recent_transactions: recentTransactions,
                    label: safeNumber(row.wins, 0)
                };
            });
        } catch (error) {
            this.logger.error('Failed to load season wins training data', {
                startDate,
                endDate,
                filters
            }, error);
            throw error;
        }
    }

    async getPlayerPerformanceData(startDate, endDate, filters = {}) {
        const params = [startDate, endDate, this.allowedSports];
        const conditions = [
            'pa.calculation_date BETWEEN $1::date AND $2::date',
            'p.sport = ANY($3::text[])'
        ];

        let paramIndex = params.length;

        if (filters.playerId) {
            params.push(filters.playerId);
            paramIndex += 1;
            conditions.push(`pa.player_id = $${paramIndex}`);
        }

        if (filters.teamId) {
            params.push(filters.teamId);
            paramIndex += 1;
            conditions.push(`pa.team_id = $${paramIndex}`);
        }

        if (filters.sport) {
            params.push(filters.sport);
            paramIndex += 1;
            conditions.push(`p.sport = $${paramIndex}`);
        }

        if (filters.season) {
            params.push(filters.season);
            paramIndex += 1;
            conditions.push(`pa.season = $${paramIndex}`);
        }

        const query = `
            SELECT
                pa.player_id,
                pa.team_id,
                pa.season,
                pa.performance_score,
                pa.games_played,
                pa.war,
                pa.value_over_replacement,
                pa.sport_specific_stats,
                pa.calculation_date,
                p.first_name,
                p.last_name,
                p.birth_date,
                p.metadata as player_metadata,
                p.sport,
                t.metadata as team_metadata,
                last_game.last_game_date,
                last_game.is_home
            FROM player_analytics pa
            JOIN players p ON pa.player_id = p.id
            LEFT JOIN teams t ON pa.team_id = t.id
            LEFT JOIN LATERAL (
                SELECT g.game_date as last_game_date,
                       (g.home_team_id = pa.team_id) as is_home
                FROM game_stats gs
                JOIN games g ON gs.game_id = g.id
                WHERE gs.player_id = pa.player_id
                  AND g.game_date < pa.calculation_date
                ORDER BY g.game_date DESC
                LIMIT 1
            ) last_game ON TRUE
            WHERE ${conditions.join(' AND ')}
        `;

        const safeNumber = (value, fallback = 0) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : fallback;
        };

        try {
            const result = await this.db.query(query, params);
            return result.rows.map((row) => {
                const playerMetadata = typeof row.player_metadata === 'string'
                    ? JSON.parse(row.player_metadata)
                    : (row.player_metadata || {});
                const teamMetadata = typeof row.team_metadata === 'string'
                    ? JSON.parse(row.team_metadata)
                    : (row.team_metadata || {});
                const sportStats = typeof row.sport_specific_stats === 'string'
                    ? JSON.parse(row.sport_specific_stats)
                    : (row.sport_specific_stats || {});

                const calculationDate = new Date(row.calculation_date);
                const lastGameDate = row.last_game_date ? new Date(row.last_game_date) : null;
                const restDays = lastGameDate
                    ? Math.max(0, Math.round((calculationDate - lastGameDate) / (24 * 60 * 60 * 1000)))
                    : 3;

                const birthDate = row.birth_date ? new Date(row.birth_date) : null;
                let ageFactor = 0.5;
                if (birthDate) {
                    const age = (calculationDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
                    ageFactor = Math.min(1, Math.max(0, (age - 18) / 20));
                }

                return {
                    player_id: row.player_id,
                    team_id: row.team_id,
                    sport: row.sport,
                    season: row.season,
                    career_stats: safeNumber(sportStats.career_index ?? playerMetadata.career_index, 0.5),
                    recent_form: safeNumber(sportStats.recent_form ?? sportStats.last_5_games_score, 0.5),
                    age_factor: ageFactor,
                    injury_history: safeNumber(playerMetadata.injury_history_score ?? sportStats.injury_history, 0.1),
                    matchup_difficulty: safeNumber(sportStats.matchup_difficulty ?? teamMetadata.matchup_difficulty, 0.5),
                    rest_days: restDays,
                    home_away_splits: safeNumber(sportStats.home_away_split_index ?? (row.is_home ? 0.6 : 0.4), 0.5),
                    weather_performance: safeNumber(sportStats.weather_performance ?? playerMetadata.weather_performance, 0.5),
                    clutch_situations: safeNumber(sportStats.clutch_index ?? playerMetadata.clutch_index, 0.5),
                    label: safeNumber(row.performance_score, 0.5)
                };
            });
        } catch (error) {
            this.logger.error('Failed to load player performance training data', {
                startDate,
                endDate,
                filters
            }, error);
            throw error;
        }
    }

    normalizeFeatures(engineeredData) {
        if (!engineeredData.features.length) {
            throw new Error('No engineered features available for normalization');
        }

        const featureCount = engineeredData.features[0].length;
        const means = new Array(featureCount).fill(0);
        const stds = new Array(featureCount).fill(0);

        engineeredData.features.forEach((featureVector) => {
            featureVector.forEach((value, index) => {
                const numericValue = Number(value);
                if (!Number.isFinite(numericValue)) {
                    throw new Error(`Encountered non-numeric feature value at index ${index}`);
                }
                means[index] += numericValue;
            });
        });

        const sampleCount = engineeredData.features.length;
        for (let i = 0; i < featureCount; i += 1) {
            means[i] = means[i] / sampleCount;
        }

        engineeredData.features.forEach((featureVector) => {
            featureVector.forEach((value, index) => {
                const centered = Number(value) - means[index];
                stds[index] += centered * centered;
            });
        });

        for (let i = 0; i < featureCount; i += 1) {
            stds[i] = Math.sqrt(stds[i] / sampleCount) || 1;
        }

        const normalizedFeatures = engineeredData.features.map((featureVector) => (
            featureVector.map((value, index) => {
                const normalized = (Number(value) - means[index]) / stds[index];
                if (!Number.isFinite(normalized)) {
                    return 0;
                }
                return normalized;
            })
        ));

        return {
            features: normalizedFeatures,
            labels: engineeredData.labels,
            normalizationParams: { means, stds }
        };
    }

    async validateTrainingData(trainingData) {
        const trainFeatures = trainingData.train?.features || [];
        const trainLabels = trainingData.train?.labels || [];
        const validationFeatures = trainingData.validation?.features || [];
        const validationLabels = trainingData.validation?.labels || [];

        if (!trainFeatures.length) {
            throw new Error('Training dataset is empty');
        }

        const featureLength = trainFeatures[0].length;
        const validateVector = (vector, index, context) => {
            if (vector.length !== featureLength) {
                throw new Error(`Inconsistent feature vector length detected at ${context} index ${index}`);
            }
            vector.forEach((value, featureIndex) => {
                if (!Number.isFinite(Number(value))) {
                    throw new Error(`Invalid feature value at ${context} index ${index}, feature ${featureIndex}`);
                }
            });
        };

        trainFeatures.forEach((vector, index) => validateVector(vector, index, 'train'));
        validationFeatures.forEach((vector, index) => validateVector(vector, index, 'validation'));

        const validateLabels = (labels, context) => {
            labels.forEach((label, index) => {
                if (Array.isArray(label)) {
                    label.forEach((value, labelIndex) => {
                        if (!Number.isFinite(Number(value))) {
                            throw new Error(`Invalid label value at ${context} index ${index}, label ${labelIndex}`);
                        }
                    });
                } else if (!Number.isFinite(Number(label))) {
                    throw new Error(`Invalid label value at ${context} index ${index}`);
                }
            });
        };

        validateLabels(trainLabels, 'train');
        validateLabels(validationLabels, 'validation');

        if (!validationFeatures.length) {
            this.logger.warn('Validation dataset is empty; evaluation metrics may be unreliable');
        }
    }

    async evaluateModel(model, trainingData, modelType) {
        const evaluation = {
            loss: null,
            accuracy: null,
            mae: null,
            rmse: null,
            precision: null,
            recall: null,
            f1Score: null,
            confusionMatrix: null,
            sampleCount: trainingData.validation.features.length
        };

        if (!trainingData.validation.features.length) {
            return evaluation;
        }

        const valFeatures = tf.tensor2d(trainingData.validation.features);

        try {
            if (modelType === 'classification') {
                const valLabels = tf.tensor2d(trainingData.validation.labels);
                const evalOutput = await model.evaluate(valFeatures, valLabels, { verbose: 0 });
                const [lossTensor, accuracyTensor] = Array.isArray(evalOutput) ? evalOutput : [evalOutput, null];

                evaluation.loss = lossTensor?.dataSync()[0] ?? null;
                if (accuracyTensor) {
                    evaluation.accuracy = accuracyTensor.dataSync()[0];
                }

                const predictionTensor = model.predict(valFeatures);
                const predictions = predictionTensor.arraySync();
                const labels = valLabels.arraySync();

                let truePositive = 0;
                let trueNegative = 0;
                let falsePositive = 0;
                let falseNegative = 0;

                predictions.forEach((prediction, index) => {
                    const predictedIndex = prediction.indexOf(Math.max(...prediction));
                    const actualIndex = labels[index].indexOf(Math.max(...labels[index]));

                    if (predictedIndex === 0 && actualIndex === 0) {
                        truePositive += 1;
                    } else if (predictedIndex === 0 && actualIndex === 1) {
                        falsePositive += 1;
                    } else if (predictedIndex === 1 && actualIndex === 0) {
                        falseNegative += 1;
                    } else if (predictedIndex === 1 && actualIndex === 1) {
                        trueNegative += 1;
                    }
                });

                const precision = truePositive + falsePositive === 0
                    ? 0
                    : truePositive / (truePositive + falsePositive);
                const recall = truePositive + falseNegative === 0
                    ? 0
                    : truePositive / (truePositive + falseNegative);
                const accuracy = (truePositive + trueNegative)
                    / Math.max(1, truePositive + trueNegative + falsePositive + falseNegative);
                const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

                evaluation.accuracy = evaluation.accuracy ?? accuracy;
                evaluation.precision = precision;
                evaluation.recall = recall;
                evaluation.f1Score = f1;
                evaluation.confusionMatrix = [
                    [truePositive, falsePositive],
                    [falseNegative, trueNegative]
                ];

                predictionTensor.dispose();
                valLabels.dispose();
            } else {
                const valLabels = tf.tensor1d(trainingData.validation.labels);
                const evalOutput = await model.evaluate(valFeatures, valLabels, { verbose: 0 });
                const [lossTensor, maeTensor] = Array.isArray(evalOutput) ? evalOutput : [evalOutput, null];

                evaluation.loss = lossTensor?.dataSync()[0] ?? null;
                if (maeTensor) {
                    evaluation.mae = maeTensor.dataSync()[0];
                }

                const predictionTensor = model.predict(valFeatures);
                const predictions = predictionTensor.dataSync();
                const labels = trainingData.validation.labels;

                const squaredErrors = [];
                const absoluteErrors = [];
                predictions.forEach((prediction, index) => {
                    const actual = Number(labels[index]);
                    const error = prediction - actual;
                    squaredErrors.push(error * error);
                    absoluteErrors.push(Math.abs(error));
                });

                const mse = squaredErrors.reduce((sum, value) => sum + value, 0) / Math.max(1, squaredErrors.length);
                evaluation.rmse = Math.sqrt(mse);
                evaluation.mae = evaluation.mae ?? (absoluteErrors.reduce((sum, value) => sum + value, 0) / Math.max(1, absoluteErrors.length));

                predictionTensor.dispose();
                valLabels.dispose();
            }
        } finally {
            valFeatures.dispose();
        }

        return evaluation;
    }

    async saveModel(model, modelType, evaluation, existingVersion, normalizationParams, featureNames) {
        const version = existingVersion || `v${Date.now()}`;
        const modelDirectory = path.join(this.modelStoragePath, modelType, version);

        await fs.promises.mkdir(modelDirectory, { recursive: true });

        await model.save(`file://${modelDirectory}`);

        const metadata = {
            version,
            modelType,
            evaluation,
            normalization: normalizationParams,
            featureNames,
            modelPath: modelDirectory,
            updatedAt: new Date().toISOString()
        };

        this.modelMetadata.set(modelType, metadata);
        await this.persistMetadata();

        this.logger.info('Model saved successfully', {
            modelType,
            version,
            modelDirectory
        });

        return version;
    }

    async prepareFeatures(modelType, inputData) {
        const config = this.modelConfigs[modelType];
        if (!config) {
            throw new Error(`Unknown model type: ${modelType}`);
        }

        const metadata = this.modelMetadata.get(modelType);
        if (!metadata) {
            throw new Error(`No metadata found for ${modelType}. Train the model before making predictions.`);
        }

        let featureRecord;

        switch (modelType) {
            case 'game_outcome': {
                if (!inputData.gameId) {
                    throw new Error('gameId is required to prepare game outcome features');
                }
                const gameData = await this.getGameOutcomeData(
                    inputData.gameDate || inputData.startDate || '2000-01-01',
                    inputData.gameDate || inputData.endDate || '2100-01-01',
                    {
                        gameId: inputData.gameId,
                        statuses: ['scheduled', 'in_progress', 'completed'],
                        limit: 1
                    }
                );
                if (!gameData.length) {
                    throw new Error(`Unable to prepare features for game ${inputData.gameId}`);
                }
                featureRecord = gameData[0];
                break;
            }
            case 'season_wins': {
                if (!inputData.teamId) {
                    throw new Error('teamId is required to prepare season wins features');
                }
                const data = await this.getSeasonWinsData(
                    inputData.startDate || `${inputData.season || new Date().getFullYear()}-01-01`,
                    inputData.endDate || `${inputData.season || new Date().getFullYear()}-12-31`,
                    {
                        teamId: inputData.teamId,
                        season: inputData.season
                    }
                );
                if (!data.length) {
                    throw new Error(`Unable to prepare features for team ${inputData.teamId}`);
                }
                featureRecord = data[0];
                break;
            }
            case 'player_performance': {
                if (!inputData.playerId) {
                    throw new Error('playerId is required to prepare player performance features');
                }
                const data = await this.getPlayerPerformanceData(
                    inputData.startDate || '2000-01-01',
                    inputData.endDate || new Date().toISOString().split('T')[0],
                    {
                        playerId: inputData.playerId,
                        season: inputData.season
                    }
                );
                if (!data.length) {
                    throw new Error(`Unable to prepare features for player ${inputData.playerId}`);
                }
                featureRecord = data[0];
                break;
            }
            default:
                throw new Error(`No feature preparation implemented for ${modelType}`);
        }

        const rawValues = config.features.map((featureName) => {
            const value = featureRecord[featureName];
            if (value === undefined || value === null) {
                throw new Error(`Missing feature ${featureName} for ${modelType}`);
            }
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue)) {
                throw new Error(`Invalid feature value for ${featureName}: ${value}`);
            }
            return numericValue;
        });

        const means = metadata.normalization?.means || new Array(rawValues.length).fill(0);
        const stds = metadata.normalization?.stds || new Array(rawValues.length).fill(1);
        const normalizedValues = rawValues.map((value, index) => {
            const std = stds[index] === 0 ? 1 : stds[index];
            return (value - means[index]) / std;
        });

        return {
            values: normalizedValues,
            rawValues,
            featureNames: config.features,
            context: featureRecord
        };
    }

    async makePrediction(model, features, modelType) {
        const inputTensor = tf.tensor2d([features.values]);
        let predictionTensor;

        try {
            predictionTensor = model.predict(inputTensor);
            const predictionArray = predictionTensor.arraySync();

            if (modelType === 'game_outcome') {
                const [homeProbability, awayProbability] = predictionArray[0];
                const predictedClass = homeProbability >= awayProbability ? 'home_win' : 'away_win';
                const confidence = Math.max(homeProbability, awayProbability);

                return {
                    prediction: predictedClass,
                    confidence,
                    probabilities: {
                        home_win: homeProbability,
                        away_win: awayProbability
                    },
                    featureNames: features.featureNames,
                    rawFeatures: features.rawValues,
                    context: features.context
                };
            }

            const predictedValue = predictionArray[0][0];
            return {
                prediction: predictedValue,
                confidence: null,
                featureNames: features.featureNames,
                rawFeatures: features.rawValues,
                context: features.context
            };
        } finally {
            inputTensor.dispose();
            if (predictionTensor) {
                predictionTensor.dispose();
            }
        }
    }

    /**
     * Train model with monitoring callbacks
     */
    async trainModelWithCallbacks(model, trainingData, trainingRun, modelType) {
        const trainTensor = tf.tensor2d(trainingData.train.features);
        const trainLabelsTensor = modelType === 'classification'
            ? tf.tensor2d(trainingData.train.labels)
            : tf.tensor1d(trainingData.train.labels);

        const hasValidation = trainingData.validation.features.length > 0;
        const valTensor = hasValidation ? tf.tensor2d(trainingData.validation.features) : null;
        const valLabelsTensor = hasValidation
            ? (modelType === 'classification'
                ? tf.tensor2d(trainingData.validation.labels)
                : tf.tensor1d(trainingData.validation.labels))
            : null;

        const callbacks = {
            onEpochEnd: async (epoch, logs) => {
                this.logger.debug(`Epoch ${epoch + 1} completed`, {
                    trainingRunId: trainingRun.id,
                    loss: logs.loss,
                    accuracy: logs.acc || logs.meanAbsoluteError,
                    valLoss: logs.val_loss,
                    valAccuracy: logs.val_acc || logs.val_meanAbsoluteError
                });

                // Update training run progress
                await this.updateTrainingProgress(trainingRun.id, epoch + 1, logs);
            },

            onTrainEnd: () => {
                // Clean up tensors
                trainTensor.dispose();
                trainLabelsTensor.dispose();
                if (valTensor) {
                    valTensor.dispose();
                }
                if (valLabelsTensor) {
                    valLabelsTensor.dispose();
                }
            }
        };

        // Early stopping callback
        const callbackList = [callbacks];
        if (hasValidation) {
            callbackList.push(tf.callbacks.earlyStopping({
                monitor: 'val_loss',
                patience: this.trainingConfig.patience,
                minDelta: this.trainingConfig.minDelta,
                restoreBestWeights: true
            }));
        }

        const fitOptions = {
            epochs: this.trainingConfig.epochs,
            batchSize: this.trainingConfig.batchSize,
            callbacks: callbackList,
            verbose: 0
        };

        if (hasValidation) {
            fitOptions.validationData = [valTensor, valLabelsTensor];
        }

        return await model.fit(trainTensor, trainLabelsTensor, fitOptions);
    }

    /**
     * Get pipeline health status
     */
    async getHealthStatus() {
        try {
            const modelHealth = {};
            for (const [modelType, model] of this.models) {
                modelHealth[modelType] = {
                    loaded: true,
                    version: this.modelVersions.get(modelType),
                    lastTrained: await this.getLastTrainingDate(modelType)
                };
            }

            return {
                status: 'healthy',
                models: modelHealth,
                metrics: this.metrics,
                cacheSize: this.predictionCache.size
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                metrics: this.metrics
            };
        }
    }

    /**
     * Background monitoring and maintenance
     */
    startModelMonitoring() {
        // Check for model retraining needs every hour
        setInterval(async () => {
            try {
                await this.checkRetrainingNeeds();
            } catch (error) {
                this.logger.error('Model monitoring failed', {}, error);
            }
        }, 60 * 60 * 1000); // 1 hour

        // Clear prediction cache every 10 minutes
        setInterval(() => {
            this.clearExpiredCache();
        }, 10 * 60 * 1000); // 10 minutes

        this.logger.info('Started model monitoring background tasks');
    }

    // Additional helper methods...
    async loadModels() {
        try {
            await fs.promises.mkdir(this.modelStoragePath, { recursive: true });

            let metadataRaw;
            try {
                metadataRaw = await fs.promises.readFile(this.metadataPath, 'utf-8');
            } catch (error) {
                if (error.code === 'ENOENT') {
                    this.logger.info('No persisted model metadata found; cold start expected');
                    return;
                }
                throw error;
            }

            const metadataObject = JSON.parse(metadataRaw);
            for (const [modelType, metadata] of Object.entries(metadataObject)) {
                try {
                    const modelJsonPath = path.join(metadata.modelPath, 'model.json');
                    const model = await tf.loadLayersModel(`file://${modelJsonPath}`);
                    this.models.set(modelType, model);
                    this.modelVersions.set(modelType, metadata.version);
                    this.modelMetadata.set(modelType, metadata);
                    this.logger.info('Loaded persisted model', {
                        modelType,
                        version: metadata.version
                    });
                } catch (error) {
                    this.logger.error('Failed to load persisted model', {
                        modelType,
                        metadata
                    }, error);
                }
            }
        } catch (error) {
            this.logger.error('Unable to hydrate models from storage', {}, error);
        }
    }

    async persistMetadata() {
        const serialized = {};
        for (const [modelType, metadata] of this.modelMetadata.entries()) {
            serialized[modelType] = metadata;
        }

        await fs.promises.mkdir(this.modelStoragePath, { recursive: true });
        await fs.promises.writeFile(this.metadataPath, JSON.stringify(serialized, null, 2), 'utf-8');
    }

    async updateTrainingRun(runId, status, evaluation = null, modelVersion = null, errorMessage = null, modelType = null) {
        const metrics = evaluation || {};
        const confusionMatrix = metrics.confusionMatrix ? JSON.stringify(metrics.confusionMatrix) : null;
        const modelPath = modelVersion && modelType
            ? path.join(this.modelStoragePath, modelType, modelVersion)
            : null;

        const query = `
            UPDATE model_training_runs
            SET status = $2,
                training_end = NOW(),
                accuracy = COALESCE($3, accuracy),
                precision_score = COALESCE($4, precision_score),
                recall_score = COALESCE($5, recall_score),
                f1_score = COALESCE($6, f1_score),
                mean_absolute_error = COALESCE($7, mean_absolute_error),
                root_mean_squared_error = COALESCE($8, root_mean_squared_error),
                model_path = COALESCE($9, model_path),
                confusion_matrix = COALESCE($10::jsonb, confusion_matrix)
            WHERE id = $1
        `;

        await this.db.query(query, [
            runId,
            status,
            metrics.accuracy,
            metrics.precision,
            metrics.recall,
            metrics.f1Score,
            metrics.mae,
            metrics.rmse,
            modelPath,
            confusionMatrix
        ]);

        if (errorMessage) {
            const errorQuery = `
                UPDATE model_training_runs
                SET hyperparameters = jsonb_set(
                    COALESCE(hyperparameters, '{}'::jsonb),
                    '{last_error}',
                    to_jsonb($2::text),
                    true
                )
                WHERE id = $1
            `;
            await this.db.query(errorQuery, [runId, errorMessage]);
        } else if (metrics && Object.keys(metrics).length) {
            const metricsQuery = `
                UPDATE model_training_runs
                SET feature_importance = $2::jsonb
                WHERE id = $1
            `;
            await this.db.query(metricsQuery, [runId, JSON.stringify({ evaluation: metrics })]);
        }
    }

    async updateTrainingProgress(runId, epoch, logs) {
        try {
            const query = `
                UPDATE model_training_runs
                SET hyperparameters = jsonb_set(
                    jsonb_set(
                        COALESCE(hyperparameters, '{}'::jsonb),
                        '{current_epoch}',
                        to_jsonb($2::int),
                        true
                    ),
                    '{last_logs}',
                    $3::jsonb,
                    true
                )
                WHERE id = $1
            `;
            await this.db.query(query, [runId, epoch, JSON.stringify(logs || {})]);
        } catch (error) {
            this.logger.error('Failed to update training progress', { runId, epoch }, error);
        }
    }

    async logPrediction(modelType, inputData, prediction, metadata = {}) {
        try {
            const targetEntityType = modelType === 'game_outcome'
                ? 'game'
                : modelType === 'season_wins'
                    ? 'team'
                    : 'player';

            const targetEntityId = inputData.gameId
                || inputData.teamId
                || inputData.playerId
                || inputData.targetId;

            if (!targetEntityId) {
                return;
            }

            const modelVersion = this.modelVersions.get(modelType) || 'unknown';
            const featurePayload = {
                feature_names: prediction.featureNames,
                feature_values: prediction.rawFeatures,
                context: prediction.context,
                metadata
            };

            const query = `
                INSERT INTO ml_predictions (
                    model_name,
                    model_version,
                    prediction_type,
                    target_entity_type,
                    target_entity_id,
                    prediction_date,
                    target_date,
                    predicted_value,
                    confidence_score,
                    probability_distribution,
                    features_used,
                    model_metrics
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    NOW(), $6,
                    $7, $8,
                    $9::jsonb,
                    $10::jsonb,
                    $11::jsonb
                )
            `;

            const probabilityDistribution = prediction.probabilities
                ? JSON.stringify(prediction.probabilities)
                : null;

            const modelMetrics = this.modelMetadata.get(modelType)?.evaluation || null;

            await this.db.query(query, [
                modelType,
                modelVersion,
                modelType,
                targetEntityType,
                targetEntityId,
                inputData.targetDate || inputData.gameDate || null,
                typeof prediction.prediction === 'number' ? prediction.prediction : null,
                prediction.confidence,
                probabilityDistribution,
                JSON.stringify(featurePayload),
                modelMetrics ? JSON.stringify(modelMetrics) : null
            ]);
        } catch (error) {
            this.logger.error('Failed to log prediction', {
                modelType,
                inputData
            }, error);
        }
    }

    async checkRetrainingNeeds() {
        for (const [modelType, config] of Object.entries(this.modelConfigs)) {
            try {
                const lastTrainingDate = await this.getLastTrainingDate(modelType);
                const now = Date.now();
                const interval = this.getRetrainingIntervalMs(config.retrainFrequency);

                if (!lastTrainingDate || now - lastTrainingDate.getTime() >= interval) {
                    this.logger.info('Retraining threshold met', {
                        modelType,
                        lastTrainingDate,
                        frequency: config.retrainFrequency
                    });
                    await this.trainModel(modelType);
                }
            } catch (error) {
                this.logger.error('Failed to evaluate retraining needs', { modelType }, error);
            }
        }
    }

    getRetrainingIntervalMs(frequency) {
        switch (frequency) {
            case 'daily':
                return 24 * 60 * 60 * 1000;
            case 'weekly':
                return 7 * 24 * 60 * 60 * 1000;
            case 'monthly':
                return 30 * 24 * 60 * 60 * 1000;
            default:
                return 30 * 24 * 60 * 60 * 1000;
        }
    }

    async getLastTrainingDate(modelType) {
        const query = `
            SELECT training_end, training_start
            FROM model_training_runs
            WHERE model_name = $1 AND status = 'completed'
            ORDER BY training_end DESC NULLS LAST, training_start DESC
            LIMIT 1
        `;

        const result = await this.db.query(query, [modelType]);
        if (!result.rows.length) {
            return null;
        }

        const row = result.rows[0];
        if (row.training_end) {
            return new Date(row.training_end);
        }
        if (row.training_start) {
            return new Date(row.training_start);
        }
        return null;
    }

    async createTrainingRun(modelType, options) {
        const query = `
            INSERT INTO model_training_runs (
                model_name, model_version, algorithm, hyperparameters,
                training_data_start_date, training_data_end_date
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, model_version
        `;

        const version = `v${Date.now()}`;
        const result = await this.db.query(query, [
            modelType,
            version,
            'tensorflow_neural_network',
            JSON.stringify(this.trainingConfig),
            options.startDate || '2020-01-01',
            options.endDate || new Date().toISOString().split('T')[0]
        ]);

        return result.rows[0];
    }

    generateCacheKey(modelType, inputData) {
        return `${modelType}:${JSON.stringify(inputData)}`;
    }

    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.predictionCache) {
            if (now - value.timestamp >= this.cacheExpiry) {
                this.predictionCache.delete(key);
            }
        }
    }
}

/**
 * Sports Feature Engineering helper class
 */
class SportsFeatureEngineer {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    async engineer(rawData, requiredFeatures) {
        const engineeredFeatures = [];
        const labels = [];

        for (const dataPoint of rawData) {
            const features = [];

            // Engineer each required feature
            for (const featureName of requiredFeatures) {
                const value = await this.calculateFeature(featureName, dataPoint);
                features.push(value);
            }

            engineeredFeatures.push(features);
            labels.push(dataPoint.label);
        }

        return {
            features: engineeredFeatures,
            labels,
            featureNames: requiredFeatures
        };
    }

    async calculateFeature(featureName, dataPoint) {
        // Implement specific feature calculations
        switch (featureName) {
            case 'elo_difference':
                return (
                    Number(dataPoint.home_elo_rating ?? dataPoint.home_elo ?? 1500)
                    - Number(dataPoint.away_elo_rating ?? dataPoint.away_elo ?? 1500)
                );
            case 'home_field_advantage':
                return this.calculateHomeFieldAdvantage(dataPoint);
            case 'recent_form':
                return await this.calculateRecentForm(dataPoint.team_id);
            // Add more feature calculations...
            default:
                return dataPoint[featureName] || 0;
        }
    }

    calculateHomeFieldAdvantage(dataPoint) {
        // Sport-specific home field advantage
        const advantages = {
            'mlb': 0.54,              // 54% home win rate historically
            'nfl': 0.57,              // 57% home win rate
            'nba': 0.60,              // 60% home win rate
            'ncaa_baseball': 0.58,    // college baseball tends to favor home teams slightly more
            'ncaa_football': 0.65,    // significant college football home advantage
            'ncaa_basketball': 0.63   // college basketball home advantage
        };
        return advantages[dataPoint.sport] || 0.54;
    }

    async calculateRecentForm(teamId, games = 10) {
        const query = `
            SELECT AVG(CASE
                    WHEN (g.home_team_id = $1 AND g.home_score > g.away_score)
                      OR (g.away_team_id = $1 AND g.away_score > g.home_score)
                    THEN 1.0 ELSE 0.0 END) AS win_rate
            FROM (
                SELECT *
                FROM games g
                WHERE (g.home_team_id = $1 OR g.away_team_id = $1)
                  AND g.status = 'completed'
                ORDER BY g.game_date DESC
                LIMIT $2
            ) g
        `;

        const result = await this.db.query(query, [teamId, games]);
        return Number(result.rows[0]?.win_rate) || 0.5;
    }
}

export default MLPipelineService;