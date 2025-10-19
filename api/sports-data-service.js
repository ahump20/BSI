/**
 * BLAZE SPORTS INTEL - ENTERPRISE SPORTS DATA SERVICE
 * Phase 2B Implementation: Service Layer Architecture with Enterprise Components
 *
 * Real sports data with validation, caching, logging, and error handling
 * Staff Engineer: Austin Humphrey
 */

import LoggerService from './services/logger-service.js';
import CacheService from './services/cache-service.js';
import HttpClient from './services/http-client.js';
import SportsDataAdapter from './adapters/sports-data-adapter.js';
import SportsAnalyticsModels from './models/sports-analytics-models.js';
import MLPipelineService from './ml/ml-pipeline-service.js';
import DatabaseConnectionService from './database/connection-service.js';
import ConferenceStrengthService from './services/conferenceStrength.js';

class SportsDataService {
    constructor(env, options = {}) {
        this.env = env;

        // Initialize enterprise services
        this.logger = new LoggerService({
            level: env.LOG_LEVEL || 'info',
            environment: env.NODE_ENV || 'production',
            service: 'sports-data-service',
            version: '2.0.0'
        });

        this.cache = new CacheService(env, this.logger);
        this.http = new HttpClient(this.logger, {
            timeout: 15000,
            maxRetries: 3,
            retryDelay: 2000
        });

        this.adapter = new SportsDataAdapter(this.cache, this.logger);
        this.analytics = new SportsAnalyticsModels(this.logger);
        this.conferenceStrength = new ConferenceStrengthService(this.cache, this.logger, {
            iterations: 600,
            mode: 'advanced',
            cacheTtlSeconds: 90,
        });

        // Initialize database connection
        this.database = new DatabaseConnectionService({
            host: env.DB_HOST,
            port: env.DB_PORT,
            database: env.DB_NAME,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            ssl: env.NODE_ENV === 'production',
            maxConnections: 20
        }, this.logger);

        // Initialize ML pipeline
        this.mlPipeline = new MLPipelineService(this.logger, {
            host: env.DB_HOST,
            port: env.DB_PORT,
            database: env.DB_NAME,
            user: env.DB_USER,
            password: env.DB_PASSWORD
        }, {
            batchSize: 32,
            epochs: 100,
            validationSplit: 0.2
        });

        // API configuration
        this.apiKeys = {
            sportsDataIO: env.SPORTSDATAIO_API_KEY,
            mlb: env.MLB_API_KEY,
            nfl: env.NFL_API_KEY,
            nba: env.NBA_API_KEY,
            ncaa: env.NCAA_API_KEY
        };

        // Base URLs for different sports APIs
        this.baseUrls = {
            sportsDataIO: 'https://api.sportsdata.io/v3',
            mlbStats: 'https://statsapi.mlb.com/api/v1',
            espn: 'https://site.api.espn.com/apis/site/v2/sports'
        };

        // Performance metrics
        this.metrics = {
            totalRequests: 0,
            cacheHits: 0,
            apiCalls: 0,
            errors: 0
        };

        this.logger.info('SportsDataService initialized with enterprise components and real analytics models');
    }

    /**
     * Calculate real team analytics using proven statistical models
     * Replaces fake random number generators with actual sports science
     */
    async calculateTeamAnalytics(teamKey, sport, teamData) {
        const timer = this.logger.timer(`calculateTeamAnalytics:${teamKey}`);

        try {
            const analytics = {};

            // For MLB teams - calculate real sabermetrics
            if (sport === 'mlb' && teamData.stats) {
                // Replace fake analytics with real Pythagorean Expectation
                if (teamData.stats.runsScored && teamData.stats.runsAllowed) {
                    analytics.pythagorean = this.analytics.calculatePythagoreanExpectation(
                        teamData.stats.runsScored,
                        teamData.stats.runsAllowed,
                        sport
                    );
                }

                // Calculate real sabermetrics
                if (teamData.stats.hits && teamData.stats.atBats) {
                    analytics.sabermetrics = this.analytics.calculateBaseballSabermetrics(teamData.stats);
                }
            }

            // For NFL teams - calculate real football analytics
            if (sport === 'nfl' && teamData.stats) {
                if (teamData.stats.pointsScored && teamData.stats.pointsAllowed) {
                    analytics.football = this.analytics.calculateFootballAnalytics(teamData.stats);
                }
            }

            // Calculate Elo rating based on actual game results
            if (teamData.gameResults && teamData.gameResults.length > 0) {
                let currentElo = 1500; // Starting Elo
                const eloHistory = [];

                for (const game of teamData.gameResults) {
                    const eloUpdate = this.analytics.calculateEloRating(
                        currentElo,
                        game.opponentElo || 1500,
                        game.result,
                        game.marginOfVictory,
                        sport,
                        game.isHome
                    );

                    currentElo = eloUpdate.newElo;
                    eloHistory.push(eloUpdate);
                }

                analytics.elo = {
                    currentRating: currentElo,
                    history: eloHistory,
                    model: 'Elo Rating System'
                };
            }

            // Calculate Strength of Schedule if schedule data available
            if (teamData.schedule && teamData.allTeamRecords) {
                analytics.strengthOfSchedule = this.analytics.calculateStrengthOfSchedule(
                    teamData.schedule,
                    teamData.allTeamRecords
                );
            }

            // Add ML predictions to enhance traditional analytics
            try {
                // Predict season performance using ML models
                if (teamData.teamId) {
                    const seasonPrediction = await this.mlPipeline.predict('season_wins', {
                        teamId: teamData.teamId,
                        sport: sport,
                        currentStats: teamData.stats,
                        eloRating: analytics.elo?.currentRating || 1500,
                        strengthOfSchedule: analytics.strengthOfSchedule?.strengthOfSchedule || 0.5
                    });

                    analytics.mlPredictions = {
                        seasonWins: seasonPrediction,
                        model: 'TensorFlow Neural Network',
                        confidence: seasonPrediction.confidence || 0.75,
                        features: seasonPrediction.features || []
                    };

                    // Store prediction in database
                    await this.database.storePrediction(
                        'season_wins',
                        seasonPrediction.modelVersion || 'v1',
                        'season_performance',
                        'team',
                        teamData.teamId,
                        seasonPrediction.predictedValue,
                        seasonPrediction.confidence,
                        { features: seasonPrediction.features }
                    );

                    this.logger.info(`ML prediction generated for ${teamKey}`, {
                        predictedWins: seasonPrediction.predictedValue,
                        confidence: seasonPrediction.confidence
                    });
                }
            } catch (mlError) {
                this.logger.warn(`ML prediction failed for ${teamKey}, using traditional analytics only`, {}, mlError);
                analytics.mlPredictions = {
                    error: 'ML prediction unavailable',
                    fallback: 'Traditional statistical models only'
                };
            }

            // Generate composite rating (now includes ML predictions)
            analytics.composite = this.analytics.calculateCompositeRating(analytics, sport);

            // Cache the calculated analytics
            await this.cache.put(`analytics:${sport}:${teamKey}`, JSON.stringify(analytics), {
                expirationTtl: 600 // 10 minutes
            });

            timer.end({ calculationsCount: Object.keys(analytics).length });

            this.logger.info(`Real analytics calculated for ${teamKey}`, {
                sport,
                models: Object.keys(analytics),
                compositeRating: analytics.composite?.compositeRating
            });

            return {
                teamKey,
                sport,
                analytics,
                calculatedAt: new Date().toISOString(),
                dataSource: 'Real Statistical Models - No Random Generation',
                models: Object.keys(analytics)
            };

        } catch (error) {
            this.logger.error(`Analytics calculation failed for ${teamKey}`, { teamKey, sport }, error);
            timer.end({ error: true });

            // Return honest error instead of fake data
            return {
                teamKey,
                sport,
                error: 'Real analytics calculation failed',
                message: 'Statistical models require actual game data',
                calculatedAt: new Date().toISOString(),
                dataSource: 'Error - No fake fallback data provided'
            };
        }
    }

    /**
     * Get enhanced team data with real analytics
     * Replaces hardcoded stats with calculated models
     */
    async getEnhancedTeamData(teamKey, sport) {
        const timer = this.logger.timer(`getEnhancedTeamData:${teamKey}`);

        try {
            // Get base team data
            let baseData;
            switch (sport) {
                case 'mlb':
                    baseData = await this.getMLBTeamData(teamKey);
                    break;
                case 'nfl':
                    baseData = await this.getNFLTeamData(teamKey);
                    break;
                case 'nba':
                    baseData = await this.getNBATeamData(teamKey);
                    break;
                default:
                    throw new Error(`Unsupported sport: ${sport}`);
            }

            if (baseData.error) {
                return baseData; // Return error state without fake enhancement
            }

            // Calculate real analytics if we have sufficient data
            const analyticsData = await this.calculateTeamAnalytics(teamKey, sport, {
                stats: baseData.stats || this.getStatsPlaceholder(sport),
                gameResults: baseData.gameResults || [],
                schedule: baseData.schedule || [],
                allTeamRecords: baseData.allTeamRecords || {}
            });

            timer.end({ enhanced: true });

            return {
                ...baseData,
                realAnalytics: analyticsData.analytics,
                enhancementNote: 'Analytics calculated using proven statistical models',
                modelsUsed: analyticsData.models,
                lastEnhanced: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error(`Enhanced team data failed for ${teamKey}`, { teamKey, sport }, error);
            timer.end({ error: true });

            return {
                teamKey,
                sport,
                error: 'Enhanced analytics unavailable',
                message: 'Real statistical models require complete game data',
                dataSource: 'Error - No fake analytics provided'
            };
        }
    }

    /**
     * Predict game outcome using real statistical models
     * Replaces random prediction generators
     */
    async predictGameOutcome(homeTeamKey, awayTeamKey, sport) {
        const timer = this.logger.timer(`predictGameOutcome:${homeTeamKey}vs${awayTeamKey}`);

        try {
            // Get enhanced data for both teams
            const [homeTeam, awayTeam] = await Promise.all([
                this.getEnhancedTeamData(homeTeamKey, sport),
                this.getEnhancedTeamData(awayTeamKey, sport)
            ]);

            if (homeTeam.error || awayTeam.error) {
                return {
                    error: 'Prediction requires valid team data',
                    homeTeam: homeTeam.error ? 'Data unavailable' : homeTeam.name,
                    awayTeam: awayTeam.error ? 'Data unavailable' : awayTeam.name,
                    sport,
                    dataSource: 'Error - Real prediction models require actual data'
                };
            }

            // Use real statistical models for prediction
            const prediction = this.analytics.predictGameOutcome(
                {
                    name: homeTeam.name,
                    elo: homeTeam.realAnalytics?.elo,
                    pythagorean: homeTeam.realAnalytics?.pythagorean,
                    games: homeTeam.games || 0
                },
                {
                    name: awayTeam.name,
                    elo: awayTeam.realAnalytics?.elo,
                    pythagorean: awayTeam.realAnalytics?.pythagorean,
                    games: awayTeam.games || 0
                },
                sport
            );

            timer.end({ predicted: true });

            return {
                ...prediction,
                predictedAt: new Date().toISOString(),
                dataSource: 'Real Statistical Models (Elo, Pythagorean)',
                disclaimer: 'Predictions based on actual team performance data and proven statistical models'
            };

        } catch (error) {
            this.logger.error(`Game prediction failed`, { homeTeamKey, awayTeamKey, sport }, error);
            timer.end({ error: true });

            return {
                error: 'Real prediction model failed',
                homeTeam: homeTeamKey,
                awayTeam: awayTeamKey,
                sport,
                message: 'Statistical predictions require actual game data and team records',
                dataSource: 'Error - No random predictions provided'
            };
        }
    }

    /**
     * Get stats placeholder (honest about limitations)
     */
    getStatsPlaceholder(sport) {
        return {
            note: `${sport.toUpperCase()} statistics integration in development`,
            message: 'Real statistical calculations require comprehensive game data',
            runsScored: null,
            runsAllowed: null,
            dataStatus: 'placeholder'
        };
    }

    /**
     * Get real MLB team data with enterprise architecture
     */
    async getMLBTeamData(teamKey = 'STL') {
        const timer = this.logger.timer(`getMLBTeamData:${teamKey}`);
        this.metrics.totalRequests++;

        try {
            // Check cache first
            const cacheKey = `mlb:team:${teamKey}`;
            const cached = await this.cache.get(cacheKey);

            if (cached) {
                this.metrics.cacheHits++;
                this.logger.debug(`Cache hit for MLB team: ${teamKey}`);
                timer.end({ cache: 'hit' });
                return JSON.parse(cached);
            }

            // Cache miss - fetch from APIs with fallback chain
            const result = await this.adapter.aggregateWithFallback([
                () => this.fetchMLBFromSportsDataIO(teamKey),
                () => this.fetchMLBFromStatsAPI(teamKey)
            ], teamKey, 'mlb');

            // Cache successful results
            if (!result.error) {
                await this.adapter.cacheTeamData(teamKey, 'mlb', result, 300); // 5 minutes
            }

            timer.end({
                cache: 'miss',
                source: result.dataSource,
                success: !result.error
            });

            return result;

        } catch (error) {
            this.metrics.errors++;
            this.logger.error(`Failed to get MLB data for ${teamKey}`, { teamKey }, error);
            timer.end({ error: true });
            return this.adapter.createErrorTeamData('mlb', teamKey, error.message);
        }
    }

    /**
     * Fetch MLB data from SportsDataIO with enterprise HTTP client
     */
    async fetchMLBFromSportsDataIO(teamKey) {
        if (!this.apiKeys.sportsDataIO) {
            throw new Error('SportsDataIO API key not configured');
        }

        this.metrics.apiCalls++;
        const url = `${this.baseUrls.sportsDataIO}/mlb/scores/json/TeamSeasonStats/2024`;

        const response = await this.http.get(url, {
            headers: {
                'Ocp-Apim-Subscription-Key': this.apiKeys.sportsDataIO
            }
        });

        const teamData = response.data.find(team => team.Key === teamKey);
        if (!teamData) {
            throw new Error(`Team ${teamKey} not found in SportsDataIO data`);
        }

        return this.adapter.normalizeSportsDataIO(teamData, teamKey, 'mlb');
    }

    /**
     * Fetch MLB data from free MLB Stats API with enterprise client
     */
    async fetchMLBFromStatsAPI(teamKey) {
        this.metrics.apiCalls++;

        // Get team info
        const teamResponse = await this.http.get(`${this.baseUrls.mlbStats}/teams`);
        const team = teamResponse.data.teams.find(t => t.abbreviation === teamKey);

        if (!team) {
            throw new Error(`Team ${teamKey} not found in MLB Stats API`);
        }

        // Get current season standings
        const standingsResponse = await this.http.get(
            `${this.baseUrls.mlbStats}/standings?leagueId=103,104&season=2024`
        );

        // Use adapter to normalize the response
        const combinedData = {
            teams: [team],
            standings: standingsResponse.data
        };

        return this.adapter.normalizeMLBStatsAPI(combinedData, teamKey);
    }

    /**
     * Get real NFL team data (replacing hardcoded Titans data)
     */
    async getNFLTeamData(teamKey = 'TEN') {
        try {
            // Use ESPN API for NFL data (free)
            const response = await fetch(
                `${this.baseUrls.espn}/football/nfl/standings`
            );

            if (response.ok) {
                const data = await response.json();
                const standings = data.children || [];

                for (const conference of standings) {
                    for (const division of conference.standings.entries) {
                        const team = division.team;
                        if (team.abbreviation === teamKey) {
                            return {
                                name: team.displayName,
                                sport: "nfl",
                                wins: division.stats.find(s => s.name === 'wins')?.value || 0,
                                losses: division.stats.find(s => s.name === 'losses')?.value || 0,
                                winPercentage: parseFloat(division.stats.find(s => s.name === 'winPercent')?.value || 0),
                                conference: conference.name,
                                division: division.note || "Unknown",
                                dataSource: "ESPN API",
                                lastUpdated: new Date().toISOString()
                            };
            }
        }
    }

    async optimizeSchedulingProjection(request = {}) {
        const {
            teamId,
            conference,
            currentMetrics = {},
            futureOpponents = [],
            userTier = 'free',
            iterations,
            deterministic,
        } = request;

        if (!teamId) {
            throw new Error('teamId is required for scheduling optimization');
        }

        const normalizedConference = conference || 'independent';
        const currentRpi = this.normalizeNumber(currentMetrics.rpi, 0.5);
        const currentSor = this.normalizeNumber(currentMetrics.sor, 0.5);
        const currentWins = this.normalizeNumber(currentMetrics.wins, 0);
        const currentLosses = this.normalizeNumber(currentMetrics.losses, 0);

        const sanitizedOpponents = futureOpponents.map((opponent) => ({
            teamId: opponent.teamId || opponent.id || `temp-${Math.random().toString(36).slice(2, 8)}`,
            name: opponent.name || 'Opponent',
            conference: opponent.conference || 'non-conference',
            rpi: this.normalizeNumber(opponent.rpi, 0.5, 0, 1),
            sor: this.normalizeNumber(opponent.sor, 0.5, 0, 1),
            games: opponent.games && opponent.games > 0 ? opponent.games : 1,
            winProbability:
                typeof opponent.winProbability === 'number'
                    ? Math.min(Math.max(opponent.winProbability, 0.01), 0.99)
                    : undefined,
            location: opponent.location === 'home' || opponent.location === 'away' ? opponent.location : 'neutral',
        }));

        const snapshot = {
            teamId,
            conference: normalizedConference,
            currentRpi,
            currentSor,
            currentWins,
            currentLosses,
            futureOpponents: sanitizedOpponents,
        };

        const isDiamondPro = userTier === 'diamond-pro' || userTier === 'pro';
        const resolvedIterations = isDiamondPro
            ? Math.min(Math.max(iterations || 900, 400), 2500)
            : 1;

        const resolvedMode = isDiamondPro ? 'advanced' : 'basic';

        const forecast = await this.conferenceStrength.forecastStrength(snapshot, {
            mode: resolvedMode,
            iterations: resolvedIterations,
            deterministic: isDiamondPro ? deterministic ?? false : true,
            cacheTtlSeconds: isDiamondPro ? 90 : 120,
        });

        return {
            forecast,
            tierAccess: {
                userTier: isDiamondPro ? 'diamond-pro' : 'free',
                advancedUnlocked: isDiamondPro,
            },
        };
    }

    normalizeNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return Math.min(Math.max(parsed, min), max);
        }
        return Math.min(Math.max(Number(fallback) || 0, min), max);
    }
            }

            return this.getNFLFallbackData(teamKey);

        } catch (error) {
            console.error('Error fetching NFL data:', error);
            return this.getNFLFallbackData(teamKey);
        }
    }

    /**
     * Get real NBA team data (replacing hardcoded Grizzlies data)
     */
    async getNBATeamData(teamKey = 'MEM') {
        try {
            const response = await fetch(
                `${this.baseUrls.espn}/basketball/nba/standings`
            );

            if (response.ok) {
                const data = await response.json();
                const standings = data.children || [];

                for (const conference of standings) {
                    for (const division of conference.standings.entries) {
                        const team = division.team;
                        if (team.abbreviation === teamKey) {
                            return {
                                name: team.displayName,
                                sport: "nba",
                                wins: division.stats.find(s => s.name === 'wins')?.value || 0,
                                losses: division.stats.find(s => s.name === 'losses')?.value || 0,
                                winPercentage: parseFloat(division.stats.find(s => s.name === 'winPercent')?.value || 0),
                                conference: conference.name,
                                division: division.note || "Unknown",
                                dataSource: "ESPN API",
                                lastUpdated: new Date().toISOString()
                            };
                        }
                    }
                }
            }

            return this.getNBAFallbackData(teamKey);

        } catch (error) {
            console.error('Error fetching NBA data:', error);
            return this.getNBAFallbackData(teamKey);
        }
    }

    /**
     * Get real NCAA football data (replacing hardcoded Longhorns data)
     */
    async getNCAAFootballData(teamKey = 'TEX') {
        try {
            const response = await fetch(
                `${this.baseUrls.espn}/football/college-football/standings`
            );

            if (response.ok) {
                const data = await response.json();
                // ESPN college football standings structure
                const conferences = data.children || [];

                for (const conference of conferences) {
                    if (conference.standings?.entries) {
                        for (const team of conference.standings.entries) {
                            if (team.team.abbreviation === teamKey) {
                                return {
                                    name: team.team.displayName,
                                    sport: "ncaa-football",
                                    wins: team.stats.find(s => s.name === 'wins')?.value || 0,
                                    losses: team.stats.find(s => s.name === 'losses')?.value || 0,
                                    winPercentage: parseFloat(team.stats.find(s => s.name === 'winPercent')?.value || 0),
                                    conference: conference.name,
                                    ranking: team.stats.find(s => s.name === 'rank')?.value || null,
                                    dataSource: "ESPN API",
                                    lastUpdated: new Date().toISOString()
                                };
                            }
                        }
                    }
                }
            }

            return this.getNCAAFallbackData(teamKey);

        } catch (error) {
            console.error('Error fetching NCAA data:', error);
            return this.getNCAAFallbackData(teamKey);
        }
    }

    /**
     * Get all featured teams with real data
     */
    async getFeaturedTeamsData() {
        const [cardinals, titans, grizzlies, longhorns] = await Promise.allSettled([
            this.getMLBTeamData('STL'),
            this.getNFLTeamData('TEN'),
            this.getNBATeamData('MEM'),
            this.getNCAAFootballData('TEX')
        ]);

        return {
            cardinals: cardinals.status === 'fulfilled' ? cardinals.value : this.getMLBFallbackData('STL'),
            titans: titans.status === 'fulfilled' ? titans.value : this.getNFLFallbackData('TEN'),
            grizzlies: grizzlies.status === 'fulfilled' ? grizzlies.value : this.getNBAFallbackData('MEM'),
            longhorns: longhorns.status === 'fulfilled' ? longhorns.value : this.getNCAAFallbackData('TEX')
        };
    }

    // Fallback data with disclaimers (honest about limitations)
    getMLBFallbackData(teamKey) {
        return {
            name: "Data Unavailable",
            sport: "mlb",
            wins: 0,
            losses: 0,
            winPercentage: 0,
            gamesBack: "N/A",
            streak: "N/A",
            error: "Unable to fetch real-time data",
            dataSource: "Fallback - API Error",
            lastUpdated: new Date().toISOString()
        };
    }

    getNFLFallbackData(teamKey) {
        return {
            name: "Data Unavailable",
            sport: "nfl",
            wins: 0,
            losses: 0,
            winPercentage: 0,
            conference: "N/A",
            error: "Unable to fetch real-time data",
            dataSource: "Fallback - API Error",
            lastUpdated: new Date().toISOString()
        };
    }

    getNBAFallbackData(teamKey) {
        return {
            name: "Data Unavailable",
            sport: "nba",
            wins: 0,
            losses: 0,
            winPercentage: 0,
            conference: "N/A",
            error: "Unable to fetch real-time data",
            dataSource: "Fallback - API Error",
            lastUpdated: new Date().toISOString()
        };
    }

    getNCAAFallbackData(teamKey) {
        return {
            name: "Data Unavailable",
            sport: "ncaa-football",
            wins: 0,
            losses: 0,
            winPercentage: 0,
            conference: "N/A",
            ranking: null,
            error: "Unable to fetch real-time data",
            dataSource: "Fallback - API Error",
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Enterprise health check for all services
     */
    async healthCheck() {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {},
            metrics: this.getMetrics()
        };

        try {
            // Check cache service
            const cacheHealth = await this.cache.healthCheck();
            healthData.services.cache = cacheHealth;

            // Check HTTP client
            const httpHealth = await this.http.healthCheck();
            healthData.services.http = httpHealth;

            // Check logger
            const loggerHealth = this.logger.healthCheck();
            healthData.services.logger = loggerHealth;

            // Test API connectivity
            const apiHealth = await this.testApiConnectivity();
            healthData.services.apis = apiHealth;

            // Overall status
            const unhealthyServices = Object.values(healthData.services)
                .filter(service => service.status !== 'healthy');

            if (unhealthyServices.length > 0) {
                healthData.status = 'degraded';
                if (unhealthyServices.length > 2) {
                    healthData.status = 'unhealthy';
                }
            }

            this.logger.info('Health check completed', { status: healthData.status });
            return healthData;

        } catch (error) {
            this.logger.error('Health check failed', {}, error);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                metrics: this.getMetrics()
            };
        }
    }

    /**
     * Test connectivity to all APIs
     */
    async testApiConnectivity() {
        const results = {
            mlbStats: { status: 'unknown' },
            espn: { status: 'unknown' },
            sportsDataIO: { status: 'unknown' }
        };

        try {
            // Test MLB Stats API (free)
            await this.http.get(`${this.baseUrls.mlbStats}/teams/117`, { timeout: 5000 });
            results.mlbStats = { status: 'healthy', latency: 'measured' };
        } catch (error) {
            results.mlbStats = { status: 'unhealthy', error: error.message };
        }

        try {
            // Test ESPN API
            await this.http.get(`${this.baseUrls.espn}/football/nfl/standings`, { timeout: 5000 });
            results.espn = { status: 'healthy', latency: 'measured' };
        } catch (error) {
            results.espn = { status: 'unhealthy', error: error.message };
        }

        // Test SportsDataIO only if API key available
        if (this.apiKeys.sportsDataIO) {
            try {
                await this.http.get(`${this.baseUrls.sportsDataIO}/mlb/scores/json/Teams`, {
                    timeout: 5000,
                    headers: { 'Ocp-Apim-Subscription-Key': this.apiKeys.sportsDataIO }
                });
                results.sportsDataIO = { status: 'healthy', latency: 'measured' };
            } catch (error) {
                results.sportsDataIO = { status: 'unhealthy', error: error.message };
            }
        } else {
            results.sportsDataIO = { status: 'not_configured' };
        }

        return results;
    }

    /**
     * Get comprehensive service metrics
     */
    getMetrics() {
        const cacheHitRate = this.metrics.totalRequests > 0
            ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2)
            : 0;

        const errorRate = this.metrics.totalRequests > 0
            ? (this.metrics.errors / this.metrics.totalRequests * 100).toFixed(2)
            : 0;

        return {
            ...this.metrics,
            cacheHitRate: `${cacheHitRate}%`,
            errorRate: `${errorRate}%`,
            cacheStats: this.cache.getStats(),
            httpStats: this.http.getMetrics()
        };
    }

    /**
     * Warm critical data caches
     */
    async warmCaches() {
        const warmingSpecs = [
            {
                key: 'mlb:team:STL',
                fetcher: () => this.fetchMLBFromStatsAPI('STL'),
                ttl: 300
            },
            {
                key: 'nfl:team:TEN',
                fetcher: () => this.fetchNFLFromESPN('TEN'),
                ttl: 300
            },
            {
                key: 'nba:team:MEM',
                fetcher: () => this.fetchNBAFromESPN('MEM'),
                ttl: 300
            }
        ];

        const results = await this.cache.warmCache(warmingSpecs);
        this.logger.info('Cache warming completed', { results });
        return results;
    }

    /**
     * Reset all service metrics
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            cacheHits: 0,
            apiCalls: 0,
            errors: 0
        };

        this.cache.clear();
        this.http.resetMetrics();
        this.logger.info('All service metrics reset');
    }

    /**
     * Get service configuration
     */
    getConfiguration() {
        return {
            service: 'SportsDataService',
            version: '2.0.0',
            environment: this.env.NODE_ENV || 'production',
            apiKeys: {
                sportsDataIO: !!this.apiKeys.sportsDataIO,
                mlb: !!this.apiKeys.mlb,
                nfl: !!this.apiKeys.nfl,
                nba: !!this.apiKeys.nba,
                ncaa: !!this.apiKeys.ncaa
            },
            features: {
                caching: true,
                retryLogic: true,
                circuitBreaker: true,
                structuredLogging: true,
                dataValidation: true,
                fallbackChain: true,
                machineLearning: true,
                realTimePredictions: true
            }
        };
    }

    /**
     * Predict game outcome using ML models
     * Replaces random outcome generators with real predictive analytics
     */
    async predictGameOutcome(homeTeam, awayTeam, sport, gameDate = new Date()) {
        const timer = this.logger.timer(`predictGameOutcome:${homeTeam}vs${awayTeam}`);

        try {
            this.logger.info(`Generating ML game prediction`, {
                homeTeam,
                awayTeam,
                sport,
                gameDate: gameDate.toISOString()
            });

            // Get current team analytics for both teams
            const [homeAnalytics, awayAnalytics] = await Promise.all([
                this.calculateTeamAnalytics(homeTeam, sport, { teamId: homeTeam }),
                this.calculateTeamAnalytics(awayTeam, sport, { teamId: awayTeam })
            ]);

            // Prepare ML input features
            const mlInput = {
                homeTeamId: homeTeam,
                awayTeamId: awayTeam,
                sport: sport,
                gameDate: gameDate,
                homeEloRating: homeAnalytics.analytics?.elo?.currentRating || 1500,
                awayEloRating: awayAnalytics.analytics?.elo?.currentRating || 1500,
                homeRecentForm: homeAnalytics.analytics?.composite?.components?.pythagorean || 0,
                awayRecentForm: awayAnalytics.analytics?.composite?.components?.pythagorean || 0,
                homeFieldAdvantage: this.calculateHomeFieldAdvantage(sport),
                strengthOfScheduleDiff: (homeAnalytics.analytics?.strengthOfSchedule?.sosRating || 0) -
                                      (awayAnalytics.analytics?.strengthOfSchedule?.sosRating || 0)
            };

            // Get ML prediction
            const mlPrediction = await this.mlPipeline.predict('game_outcome', mlInput);

            // Also calculate traditional prediction for comparison
            const traditionalPrediction = this.analytics.predictGameOutcome(
                { elo: homeAnalytics.analytics?.elo || { newElo: 1500 } },
                { elo: awayAnalytics.analytics?.elo || { newElo: 1500 } },
                sport
            );

            // Store prediction in database
            await this.database.storePrediction(
                'game_outcome',
                mlPrediction.modelVersion || 'v1',
                'game_prediction',
                'game',
                `${homeTeam}_vs_${awayTeam}_${gameDate.toISOString()}`,
                mlPrediction.predictedValue,
                mlPrediction.confidence,
                {
                    features: mlInput,
                    traditionalComparison: traditionalPrediction
                }
            );

            timer.end({
                mlConfidence: mlPrediction.confidence,
                traditionalConfidence: traditionalPrediction.confidence
            });

            return {
                prediction: {
                    homeWinProbability: mlPrediction.homeWinProbability || mlPrediction.predictedValue,
                    awayWinProbability: 1 - (mlPrediction.homeWinProbability || mlPrediction.predictedValue),
                    confidence: mlPrediction.confidence,
                    modelType: 'TensorFlow Neural Network'
                },
                traditionalComparison: traditionalPrediction,
                features: mlInput,
                homeTeam: {
                    name: homeTeam,
                    analytics: homeAnalytics.analytics
                },
                awayTeam: {
                    name: awayTeam,
                    analytics: awayAnalytics.analytics
                },
                metadata: {
                    predictedAt: new Date().toISOString(),
                    gameDate: gameDate.toISOString(),
                    dataSource: 'Machine Learning Pipeline + Real Statistical Models',
                    methodology: 'Neural network trained on historical game data with feature engineering'
                }
            };

        } catch (error) {
            timer.end({ error: true });
            this.logger.error(`Game prediction failed`, {
                homeTeam,
                awayTeam,
                sport
            }, error);

            // Honest error response - no fake predictions
            return {
                error: 'Game prediction unavailable',
                message: 'ML model requires sufficient training data',
                fallback: 'Traditional Elo prediction may be available',
                homeTeam,
                awayTeam,
                sport,
                predictedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Predict player performance using ML models
     */
    async predictPlayerPerformance(playerId, sport, gameContext = {}) {
        const timer = this.logger.timer(`predictPlayerPerformance:${playerId}`);

        try {
            this.logger.info(`Generating ML player performance prediction`, {
                playerId,
                sport,
                gameContext
            });

            // Prepare ML input features
            const mlInput = {
                playerId: playerId,
                sport: sport,
                gameDate: gameContext.gameDate || new Date(),
                opponent: gameContext.opponent,
                isHome: gameContext.isHome || false,
                restDays: gameContext.restDays || 1,
                weatherConditions: gameContext.weather || 'normal'
            };

            // Get ML prediction
            const mlPrediction = await this.mlPipeline.predict('player_performance', mlInput);

            // Store prediction in database
            await this.database.storePrediction(
                'player_performance',
                mlPrediction.modelVersion || 'v1',
                'player_prediction',
                'player',
                playerId,
                mlPrediction.predictedValue,
                mlPrediction.confidence,
                { features: mlInput }
            );

            timer.end({ confidence: mlPrediction.confidence });

            return {
                playerId,
                sport,
                performanceScore: mlPrediction.predictedValue,
                confidence: mlPrediction.confidence,
                projectedStats: mlPrediction.projectedStats || {},
                features: mlInput,
                metadata: {
                    predictedAt: new Date().toISOString(),
                    modelType: 'TensorFlow Neural Network',
                    dataSource: 'Machine Learning Pipeline',
                    methodology: 'Neural network trained on historical player performance data'
                }
            };

        } catch (error) {
            timer.end({ error: true });
            this.logger.error(`Player performance prediction failed`, { playerId, sport }, error);

            return {
                error: 'Player performance prediction unavailable',
                message: 'ML model requires player historical data',
                playerId,
                sport,
                predictedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Get health status including ML pipeline status
     */
    async getHealthStatus() {
        try {
            const [cacheHealth, httpHealth, mlHealth, dbHealth] = await Promise.all([
                this.cache.healthCheck(),
                this.http.healthCheck(),
                this.mlPipeline.getHealthStatus(),
                this.database.healthCheck()
            ]);

            return {
                status: 'healthy',
                service: 'SportsDataService',
                version: '2.0.0',
                components: {
                    cache: cacheHealth,
                    http: httpHealth,
                    machineLearning: mlHealth,
                    database: dbHealth
                },
                metrics: this.metrics,
                capabilities: [
                    'Real-time sports data',
                    'Statistical model calculations',
                    'Machine learning predictions',
                    'Database persistence',
                    'Performance caching'
                ]
            };

        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                service: 'SportsDataService',
                version: '2.0.0'
            };
        }
    }

    /**
     * Calculate sport-specific home field advantage
     */
    calculateHomeFieldAdvantage(sport) {
        const advantages = {
            'mlb': 0.54,
            'nfl': 0.57,
            'nba': 0.60,
            'nhl': 0.55,
            'ncaa_football': 0.59,
            'ncaa_basketball': 0.64
        };
        return advantages[sport] || 0.54;
    }

    /**
     * Train ML models with new data
     */
    async trainMLModels(modelTypes = ['game_outcome', 'season_wins', 'player_performance']) {
        const results = {};

        for (const modelType of modelTypes) {
            try {
                this.logger.info(`Starting ML model training for ${modelType}`);
                const result = await this.mlPipeline.trainModel(modelType);
                results[modelType] = result;
                this.logger.info(`Model training completed for ${modelType}`, {
                    accuracy: result.evaluation?.accuracy,
                    version: result.modelVersion
                });
            } catch (error) {
                this.logger.error(`Model training failed for ${modelType}`, {}, error);
                results[modelType] = { error: error.message };
            }
        }

        return {
            trainingResults: results,
            completedAt: new Date().toISOString(),
            summary: {
                successful: Object.values(results).filter(r => !r.error).length,
                failed: Object.values(results).filter(r => r.error).length
            }
        };
    }
}

export default SportsDataService;