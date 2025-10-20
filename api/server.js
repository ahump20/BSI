#!/usr/bin/env node

/**
 * BLAZE SPORTS INTEL - API SERVER
 * Phase 4A: Database and persistence layer server
 *
 * Express.js server with ML pipeline integration
 * Replaces hardcoded responses with real database-backed analytics
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import SportsDataService from './sports-data-service.js';
import LoggerService from './services/logger-service.js';

// Load environment variables
dotenv.config();

class BlazeIntelligenceAPIServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.env = process.env;

        // Initialize logger
        this.logger = new LoggerService({
            level: this.env.LOG_LEVEL || 'info',
            environment: this.env.NODE_ENV || 'development',
            service: 'blaze-api-server',
            version: '2.0.0'
        });

        // Initialize sports data service with ML pipeline
        this.sportsService = new SportsDataService(this.env);

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "unpkg.com"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "api.sportsdata.io", "statsapi.mlb.com"]
                }
            }
        }));

        // CORS
        this.app.use(cors({
            origin: this.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8000'],
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: parseInt(this.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: {
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: '15 minutes'
            }
        });
        this.app.use('/api/', limiter);

        // Body parsing and compression
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.logger.logHttpRequest(req, res, duration);
            });
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', async (req, res) => {
            try {
                const health = await this.sportsService.getHealthStatus();
                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    service: 'Blaze Intelligence API',
                    version: '2.0.0',
                    features: [
                        'Real sports data integration',
                        'Machine learning predictions',
                        'Statistical model calculations',
                        'Database persistence',
                        'No fake data generation'
                    ],
                    components: health.components || {}
                });
            } catch (error) {
                this.logger.error('Health check failed', {}, error);
                res.status(503).json({
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Team analytics - now with real ML predictions
        this.app.get('/api/team/:sport/:teamKey/analytics', async (req, res) => {
            try {
                const { sport, teamKey } = req.params;
                const analytics = await this.sportsService.calculateTeamAnalytics(
                    teamKey,
                    sport,
                    { teamId: teamKey }
                );

                res.json({
                    success: true,
                    data: analytics,
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        dataSource: 'Real Statistical Models + Machine Learning',
                        disclaimer: 'Analytics based on actual game data and proven statistical methods'
                    }
                });

            } catch (error) {
                this.logger.error('Team analytics request failed', {
                    sport,
                    teamKey: req.params.teamKey
                }, error);

                res.status(500).json({
                    success: false,
                    error: 'Analytics calculation failed',
                    message: 'Unable to calculate team analytics with current data',
                    teamKey: req.params.teamKey,
                    sport,
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.app.get('/api/analytics/ncaa_baseball/teams', async (req, res) => {
            try {
                const { metadata, teams } = await this.sportsService.listCollegeBaseballRegressionTeams();
                res.json({
                    success: true,
                    data: teams,
                    metadata: {
                        ...metadata,
                        generatedAt: new Date().toISOString(),
                        description: 'College baseball regression-ready teams (SEC focus)',
                    },
                });
            } catch (error) {
                this.logger.error('Failed to list NCAA baseball regression teams', {}, error);
                res.status(500).json({
                    success: false,
                    error: 'Unable to load NCAA baseball regression teams',
                    message: error.message,
                });
            }
        });

        // Game predictions using ML models
        this.app.post('/api/predict/game', async (req, res) => {
            try {
                const { homeTeam, awayTeam, sport, gameDate } = req.body;

                if (!homeTeam || !awayTeam || !sport) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required parameters',
                        required: ['homeTeam', 'awayTeam', 'sport']
                    });
                }

                const prediction = await this.sportsService.predictGameOutcome(
                    homeTeam,
                    awayTeam,
                    sport,
                    gameDate ? new Date(gameDate) : new Date()
                );

                res.json({
                    success: !prediction.error,
                    data: prediction,
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        methodology: 'Neural network trained on historical game data',
                        dataSource: 'TensorFlow.js ML Pipeline'
                    }
                });

            } catch (error) {
                this.logger.error('Game prediction failed', req.body, error);
                res.status(500).json({
                    success: false,
                    error: 'Prediction generation failed',
                    message: 'ML model requires sufficient training data'
                });
            }
        });

        // Scheduling optimizer (RPI/SOR projection)
        this.app.post('/api/v1/scheduling/optimizer', async (req, res) => {
            const requestBody = req.body || {};
            const { teamId, conference, currentMetrics, futureOpponents, userTier, iterations, deterministic } = requestBody;

            if (!teamId || !Array.isArray(futureOpponents)) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters',
                    required: ['teamId', 'futureOpponents[]'],
                });
            }

            const requestStarted = Date.now();

            try {
                const projection = await this.sportsService.optimizeSchedulingProjection({
                    teamId,
                    conference,
                    currentMetrics,
                    futureOpponents,
                    userTier,
                    iterations,
                    deterministic,
                });

                const upgradeMessage = projection.tierAccess.advancedUnlocked
                    ? null
                    : 'Diamond Pro unlocks multi-thousand iteration Monte Carlo runs, percentile bands, and exportable scheduling packets.';

                res.json({
                    success: true,
                    data: projection.forecast,
                    tierAccess: projection.tierAccess,
                    performance: {
                        computeMs: projection.forecast.meta.durationMs,
                        totalMs: Date.now() - requestStarted,
                        cached: projection.forecast.meta.cached,
                    },
                    upgradeMessage,
                });
            } catch (error) {
                this.logger.error('Scheduling optimizer failed', requestBody, error);
                res.status(500).json({
                    success: false,
                    error: 'Scheduling optimizer unavailable',
                    message: error.message,
                });
            }
        });

        // Player performance predictions
        this.app.post('/api/predict/player', async (req, res) => {
            try {
                const { playerId, sport, gameContext } = req.body;

                if (!playerId || !sport) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required parameters',
                        required: ['playerId', 'sport']
                    });
                }

                const prediction = await this.sportsService.predictPlayerPerformance(
                    playerId,
                    sport,
                    gameContext || {}
                );

                res.json({
                    success: !prediction.error,
                    data: prediction,
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        methodology: 'Neural network trained on historical player performance',
                        dataSource: 'TensorFlow.js ML Pipeline'
                    }
                });

            } catch (error) {
                this.logger.error('Player prediction failed', req.body, error);
                res.status(500).json({
                    success: false,
                    error: 'Player prediction failed',
                    message: 'ML model requires player historical data'
                });
            }
        });

        // Train ML models endpoint
        this.app.post('/api/ml/train', async (req, res) => {
            try {
                const { modelTypes } = req.body;
                const results = await this.sportsService.trainMLModels(modelTypes);

                res.json({
                    success: true,
                    data: results,
                    metadata: {
                        startedAt: new Date().toISOString(),
                        note: 'Model training initiated. Check logs for progress.'
                    }
                });

            } catch (error) {
                this.logger.error('ML training initiation failed', req.body, error);
                res.status(500).json({
                    success: false,
                    error: 'ML training failed to start',
                    message: error.message
                });
            }
        });

        // Get team data with enhanced analytics
        this.app.get('/api/team/:sport/:teamKey', async (req, res) => {
            try {
                const { sport, teamKey } = req.params;
                const teamData = await this.sportsService.getEnhancedTeamData(teamKey, sport);

                res.json({
                    success: true,
                    data: teamData,
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        dataSource: 'Real Sports APIs + Statistical Models'
                    }
                });

            } catch (error) {
                this.logger.error('Team data request failed', {
                    sport,
                    teamKey: req.params.teamKey
                }, error);

                res.status(500).json({
                    success: false,
                    error: 'Team data unavailable',
                    message: 'Unable to fetch team data from external APIs'
                });
            }
        });

        // API documentation
        this.app.get('/api/docs', (req, res) => {
            res.json({
                service: 'Blaze Intelligence API',
                version: '2.0.0',
                description: 'Real sports analytics with machine learning predictions',
                endpoints: {
                    'GET /health': 'Service health check',
                    'GET /api/team/:sport/:teamKey/analytics': 'Real team analytics with ML predictions',
                    'POST /api/predict/game': 'ML-powered game outcome predictions',
                    'POST /api/predict/player': 'ML-powered player performance predictions',
                    'POST /api/ml/train': 'Initiate ML model training',
                    'GET /api/team/:sport/:teamKey': 'Enhanced team data',
                    'POST /api/v1/scheduling/optimizer': 'Project RPI/SOR deltas for proposed non-conference schedules'
                },
                supportedSports: ['mlb', 'nfl', 'nba', 'ncaa_football', 'ncaa_baseball'],
                features: [
                    'Real statistical models (Pythagorean, Elo, SOS)',
                    'TensorFlow.js neural networks',
                    'PostgreSQL data persistence',
                    'Real-time API integration',
                    'No fake data generation'
                ],
                authentication: 'Bearer token (when enabled)',
                rateLimit: '100 requests per 15 minutes'
            });
        });

        // Default route
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Blaze Intelligence API Server',
                version: '2.0.0',
                status: 'running',
                documentation: '/api/docs',
                health: '/health'
            });
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method,
                documentation: '/api/docs'
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            this.logger.error('Unhandled API error', {
                path: req.originalUrl,
                method: req.method,
                body: req.body
            }, error);

            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred',
                timestamp: new Date().toISOString()
            });
        });
    }

    async start() {
        try {
            this.logger.info('Starting Blaze Intelligence API Server...');

            // Test database connection
            await this.sportsService.database.testConnection();
            this.logger.info('Database connection verified');

            // Start server
            this.server = this.app.listen(this.port, () => {
                this.logger.info(`Blaze Intelligence API Server running`, {
                    port: this.port,
                    environment: this.env.NODE_ENV || 'development',
                    features: [
                        'Real sports data',
                        'ML predictions',
                        'Database persistence',
                        'Statistical models'
                    ]
                });

            });

        } catch (error) {
            this.logger.error('Failed to start API server', {}, error);
            process.exit(1);
        }
    }

    async stop() {
        if (this.server) {
            this.logger.info('Stopping API server...');
            await new Promise((resolve) => this.server.close(resolve));
            await this.sportsService.database.close();
            this.logger.info('API server stopped');
        }
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    if (global.apiServer) {
        await global.apiServer.stop();
        process.exit(0);
    }
});

process.on('SIGINT', async () => {
    if (global.apiServer) {
        await global.apiServer.stop();
        process.exit(0);
    }
});

// Start server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    global.apiServer = new BlazeIntelligenceAPIServer();
    global.apiServer.start();
}

export default BlazeIntelligenceAPIServer;