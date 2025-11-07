/**
 * Advanced Monte Carlo Simulation Engine
 * Deep South Sports Authority - Blaze Intelligence
 * Championship Prediction Analytics Platform
 *
 * Elite statistical modeling for championship probability analysis
 * From Friday Night Lights to Sunday in the Show
 */

class MonteCarloEngine {
    constructor(options = {}) {
        this.config = {
            simulations: options.simulations || 100000, // Increased for championship accuracy
            iterations: options.iterations || 1000,
            convergenceThreshold: options.convergenceThreshold || 0.001,
            confidenceLevel: options.confidenceLevel || 0.95,
            randomSeed: options.randomSeed || null,
            useWebWorkers: options.useWebWorkers !== false,
            maxWorkers: options.maxWorkers || 4,
            ...options
        };

        // Simulation state
        this.initialized = false;
        this.workers = [];
        this.currentSimulation = null;
        this.simulationHistory = [];

        // Sports-specific models
        this.sportModels = {
            baseball: new BaseballChampionshipModel(),
            football: new FootballChampionshipModel(),
            basketball: new BasketballChampionshipModel(),
            track_field: new TrackFieldChampionshipModel()
        };

        // Statistical distributions
        this.distributions = {
            normal: this.normalDistribution,
            beta: this.betaDistribution,
            gamma: this.gammaDistribution,
            poisson: this.poissonDistribution,
            binomial: this.binomialDistribution
        };

        // Performance tracking
        this.performanceMetrics = {
            totalSimulations: 0,
            averageExecutionTime: 0,
            accuracyHistory: [],
            convergenceHistory: []
        };

        this.initialize();
    }

    async initialize() {

        try {
            // Initialize Web Workers for parallel processing
            if (this.config.useWebWorkers && typeof Worker !== 'undefined') {
                await this.setupWebWorkers();
            }

            // Initialize random number generator
            this.setupRandomGenerator();

            // Validate sport models
            this.validateSportModels();

            // Setup performance monitoring
            this.setupPerformanceMonitoring();

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Monte Carlo Engine Initialization Failed:', error);
            return false;
        }
    }

    // ========================= CORE SIMULATION ENGINE =========================

    async runChampionshipSimulation(teams, sport, parameters = {}) {
        if (!this.initialized) {
            throw new Error('Monte Carlo Engine not initialized');
        }

        const startTime = performance.now();

        try {
            // Get sport-specific model
            const model = this.sportModels[sport];
            if (!model) {
                throw new Error(`Sport model not found: ${sport}`);
            }

            // Prepare simulation parameters
            const simParams = this.prepareSimulationParameters(teams, sport, parameters);

            // Run parallel simulations
            const results = await this.executeParallelSimulation(model, simParams);

            // Analyze and format results
            const analysis = this.analyzeSimulationResults(results, teams, sport);

            // Update performance metrics
            const executionTime = performance.now() - startTime;
            this.updatePerformanceMetrics(executionTime, analysis.convergence);

            // Store simulation for history
            this.storeSimulationResult(analysis, sport, teams.length, executionTime);

            return analysis;

        } catch (error) {
            console.error('❌ Championship Simulation Failed:', error);
            throw error;
        }
    }

    async executeParallelSimulation(model, parameters) {
        const { teams, sport, config } = parameters;
        const simulationsPerWorker = Math.floor(this.config.simulations / this.config.maxWorkers);
        const remainingSimulations = this.config.simulations % this.config.maxWorkers;

        if (this.config.useWebWorkers && this.workers.length > 0) {
            // Parallel execution with Web Workers
            return await this.runParallelWorkerSimulation(model, parameters, simulationsPerWorker, remainingSimulations);
        } else {
            // Single-threaded execution
            return await this.runSingleThreadedSimulation(model, parameters);
        }
    }

    async runSingleThreadedSimulation(model, parameters) {
        const { teams, sport, config } = parameters;
        const results = [];

        // Initialize convergence tracking
        const convergenceCheck = Math.floor(this.config.simulations / 10);
        let previousResults = null;

        for (let i = 0; i < this.config.simulations; i++) {
            // Run single simulation
            const simulationResult = await this.runSingleSimulation(model, teams, config);
            results.push(simulationResult);

            // Check convergence periodically
            if (i > 0 && i % convergenceCheck === 0) {
                const currentResults = this.aggregateResults(results);
                if (previousResults && this.checkConvergence(currentResults, previousResults)) {
                    break;
                }
                previousResults = currentResults;
            }

            // Progress reporting for long simulations
            if (i % 10000 === 0 && i > 0) {
            }
        }

        return results;
    }

    async runSingleSimulation(model, teams, config) {
        // Generate random scenario
        const scenario = this.generateRandomScenario(teams, config);

        // Apply sport-specific model
        const matchResults = await model.simulateChampionshipPath(teams, scenario, config);

        // Determine winner and statistics
        return this.processSimulationResult(matchResults, teams);
    }

    generateRandomScenario(teams, config) {
        const scenario = {
            timestamp: Date.now(),
            randomSeed: this.generateRandomSeed(),
            gameVariance: this.sampleFromDistribution('normal', 0, config.gameVariance || 0.1),
            injuryFactor: this.sampleFromDistribution('beta', 2, 5), // Injury probability
            weatherImpact: this.sampleFromDistribution('normal', 0, config.weatherVariance || 0.05),
            homeFieldAdvantage: config.homeFieldAdvantage || 0.1,
            fatigueFactor: this.sampleFromDistribution('gamma', 2, 0.1),
            momentumCarryover: this.sampleFromDistribution('beta', 3, 3),
            clutchPerformance: teams.map(() => this.sampleFromDistribution('beta', 4, 2))
        };

        // Add team-specific random factors
        scenario.teamFactors = teams.map(team => ({
            teamId: team.id || team.name,
            performanceVariance: this.sampleFromDistribution('normal', 0, 0.08),
            keyPlayerHealth: this.sampleFromDistribution('beta', 8, 2),
            teamChemistry: this.sampleFromDistribution('beta', 5, 3),
            coachingAdjustment: this.sampleFromDistribution('normal', 0, 0.05),
            specializations: this.generateSpecializationFactors(team)
        }));

        return scenario;
    }

    generateSpecializationFactors(team) {
        // Sport-specific specialization factors
        return {
            offense: this.sampleFromDistribution('beta', 4, 4),
            defense: this.sampleFromDistribution('beta', 4, 4),
            specialTeams: this.sampleFromDistribution('beta', 3, 3),
            clutch: this.sampleFromDistribution('beta', 3, 5),
            depth: this.sampleFromDistribution('beta', 4, 3),
            experience: this.sampleFromDistribution('beta', 5, 3)
        };
    }

    // ========================= STATISTICAL DISTRIBUTIONS =========================

    normalDistribution(mean = 0, stdDev = 1) {
        // Box-Muller transformation for normal distribution
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * stdDev + mean;
    }

    betaDistribution(alpha, beta) {
        // Beta distribution using gamma functions
        const x = this.gammaDistribution(alpha, 1);
        const y = this.gammaDistribution(beta, 1);
        return x / (x + y);
    }

    gammaDistribution(shape, scale) {
        // Marsaglia and Tsang's method for gamma distribution
        if (shape < 1) {
            return this.gammaDistribution(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
        }

        const d = shape - 1/3;
        const c = 1 / Math.sqrt(9 * d);

        while (true) {
            let x, v;
            do {
                x = this.normalDistribution(0, 1);
                v = 1 + c * x;
            } while (v <= 0);

            v = v * v * v;
            const u = Math.random();

            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v * scale;
            }

            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v * scale;
            }
        }
    }

    poissonDistribution(lambda) {
        // Knuth's algorithm for Poisson distribution
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;

        do {
            k++;
            p *= Math.random();
        } while (p > L);

        return k - 1;
    }

    binomialDistribution(n, p) {
        // Simulate binomial distribution
        let successes = 0;
        for (let i = 0; i < n; i++) {
            if (Math.random() < p) {
                successes++;
            }
        }
        return successes;
    }

    sampleFromDistribution(distributionName, ...params) {
        const distribution = this.distributions[distributionName];
        if (!distribution) {
            throw new Error(`Unknown distribution: ${distributionName}`);
        }
        return distribution.apply(this, params);
    }

    // ========================= RESULT ANALYSIS =========================

    analyzeSimulationResults(results, teams, sport) {
        const analysis = {
            sport,
            totalSimulations: results.length,
            timestamp: new Date().toISOString(),
            executionTime: null, // Set by caller
            convergence: this.calculateConvergence(results),
            confidence: this.config.confidenceLevel,
            teams: this.calculateTeamProbabilities(results, teams),
            scenarios: this.analyzeScenarios(results),
            statistics: this.calculateStatistics(results),
            insights: this.generateInsights(results, teams, sport)
        };

        return analysis;
    }

    calculateTeamProbabilities(results, teams) {
        const teamStats = teams.map(team => {
            const teamId = team.id || team.name;
            const wins = results.filter(result => result.winner === teamId).length;
            const probability = wins / results.length;

            // Calculate confidence intervals
            const confidenceInterval = this.calculateConfidenceInterval(probability, results.length);

            // Calculate performance metrics
            const performanceMetrics = this.calculateTeamPerformanceMetrics(results, teamId);

            return {
                team: teamId,
                name: team.name || teamId,
                probability: Math.round(probability * 1000) / 1000,
                confidenceInterval: {
                    lower: Math.round(confidenceInterval.lower * 1000) / 1000,
                    upper: Math.round(confidenceInterval.upper * 1000) / 1000
                },
                wins,
                averageScore: performanceMetrics.averageScore,
                winMargin: performanceMetrics.averageWinMargin,
                upsetPotential: performanceMetrics.upsetPotential,
                clutchFactor: performanceMetrics.clutchFactor,
                consistency: performanceMetrics.consistency
            };
        });

        // Sort by probability
        return teamStats.sort((a, b) => b.probability - a.probability);
    }

    calculateConfidenceInterval(probability, sampleSize) {
        // Wilson score interval for better accuracy with small samples
        const z = 1.96; // 95% confidence level
        const n = sampleSize;
        const p = probability;

        const denominator = 1 + (z * z) / n;
        const center = p + (z * z) / (2 * n);
        const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

        return {
            lower: (center - margin) / denominator,
            upper: (center + margin) / denominator
        };
    }

    calculateTeamPerformanceMetrics(results, teamId) {
        const teamResults = results.filter(result =>
            result.winner === teamId || Object.keys(result.scores || {}).includes(teamId)
        );

        if (teamResults.length === 0) {
            return {
                averageScore: 0,
                averageWinMargin: 0,
                upsetPotential: 0,
                clutchFactor: 0,
                consistency: 0
            };
        }

        // Calculate metrics
        const scores = teamResults.map(result => result.scores?.[teamId] || 0);
        const winMargins = teamResults
            .filter(result => result.winner === teamId)
            .map(result => result.winMargin || 0);

        return {
            averageScore: this.calculateMean(scores),
            averageWinMargin: this.calculateMean(winMargins),
            upsetPotential: this.calculateUpsetPotential(teamResults, teamId),
            clutchFactor: this.calculateClutchFactor(teamResults, teamId),
            consistency: this.calculateConsistency(scores)
        };
    }

    calculateUpsetPotential(results, teamId) {
        // Measure tendency to win as underdog or lose as favorite
        const upsets = results.filter(result =>
            (result.winner === teamId && result.underdog === teamId) ||
            (result.winner !== teamId && result.favorite === teamId)
        );

        return upsets.length / results.length;
    }

    calculateClutchFactor(results, teamId) {
        // Measure performance in close games
        const closeGames = results.filter(result =>
            Math.abs((result.scores?.[teamId] || 0) - (result.scores?.[result.winner] || 0)) <= 3
        );

        const clutchWins = closeGames.filter(result => result.winner === teamId);
        return closeGames.length > 0 ? clutchWins.length / closeGames.length : 0;
    }

    calculateConsistency(scores) {
        if (scores.length < 2) return 0;

        const mean = this.calculateMean(scores);
        const variance = this.calculateVariance(scores, mean);
        const coefficientOfVariation = Math.sqrt(variance) / mean;

        // Lower coefficient of variation = higher consistency
        return Math.max(0, 1 - coefficientOfVariation);
    }

    // ========================= STATISTICAL UTILITIES =========================

    calculateMean(values) {
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }

    calculateVariance(values, mean = null) {
        if (values.length < 2) return 0;

        const avg = mean !== null ? mean : this.calculateMean(values);
        const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
        return this.calculateMean(squaredDiffs);
    }

    calculateStandardDeviation(values, mean = null) {
        return Math.sqrt(this.calculateVariance(values, mean));
    }

    calculateConvergence(results) {
        // Check if results are converging (stabilizing)
        if (results.length < 1000) return false;

        const chunkSize = Math.floor(results.length / 10);
        const chunks = [];

        for (let i = 0; i < 10; i++) {
            const start = i * chunkSize;
            const chunk = results.slice(start, start + chunkSize);
            chunks.push(this.aggregateResults(chunk));
        }

        // Check variance across chunks
        const probabilities = chunks.map(chunk => chunk.topTeamProbability);
        const variance = this.calculateVariance(probabilities);

        return variance < this.config.convergenceThreshold;
    }

    aggregateResults(results) {
        const winners = results.map(result => result.winner);
        const winCounts = {};

        winners.forEach(winner => {
            winCounts[winner] = (winCounts[winner] || 0) + 1;
        });

        const topTeam = Object.keys(winCounts).reduce((a, b) =>
            winCounts[a] > winCounts[b] ? a : b
        );

        return {
            topTeam,
            topTeamProbability: winCounts[topTeam] / results.length,
            winCounts
        };
    }

    // ========================= INSIGHTS GENERATION =========================

    generateInsights(results, teams, sport) {
        const insights = [];

        // Probability distribution insights
        const teamProbabilities = this.calculateTeamProbabilities(results, teams);
        const topTeam = teamProbabilities[0];
        const secondTeam = teamProbabilities[1];

        if (topTeam.probability > 0.6) {
            insights.push({
                type: 'dominance',
                message: `${topTeam.name} shows strong championship potential with ${(topTeam.probability * 100).toFixed(1)}% probability`,
                confidence: 'high'
            });
        }

        if (topTeam.probability - secondTeam.probability < 0.1) {
            insights.push({
                type: 'competition',
                message: `Very close race between ${topTeam.name} and ${secondTeam.name}`,
                confidence: 'high'
            });
        }

        // Upset potential insights
        const upsetCandidates = teamProbabilities.filter(team => team.upsetPotential > 0.3);
        if (upsetCandidates.length > 0) {
            insights.push({
                type: 'upset_potential',
                message: `Watch for potential upsets from ${upsetCandidates.map(t => t.name).join(', ')}`,
                confidence: 'medium'
            });
        }

        // Clutch performance insights
        const clutchTeams = teamProbabilities.filter(team => team.clutchFactor > 0.7);
        if (clutchTeams.length > 0) {
            insights.push({
                type: 'clutch_performance',
                message: `${clutchTeams.map(t => t.name).join(', ')} excel in close games`,
                confidence: 'high'
            });
        }

        // Sport-specific insights
        const sportModel = this.sportModels[sport];
        if (sportModel && sportModel.generateInsights) {
            const sportInsights = sportModel.generateInsights(results, teams);
            insights.push(...sportInsights);
        }

        return insights;
    }

    // ========================= PERFORMANCE MONITORING =========================

    updatePerformanceMetrics(executionTime, converged) {
        this.performanceMetrics.totalSimulations += this.config.simulations;
        this.performanceMetrics.averageExecutionTime =
            (this.performanceMetrics.averageExecutionTime + executionTime) / 2;

        this.performanceMetrics.convergenceHistory.push({
            timestamp: Date.now(),
            converged,
            executionTime,
            simulations: this.config.simulations
        });

        // Keep last 100 convergence records
        if (this.performanceMetrics.convergenceHistory.length > 100) {
            this.performanceMetrics.convergenceHistory.shift();
        }
    }

    getPerformanceStats() {
        return {
            ...this.performanceMetrics,
            convergenceRate: this.performanceMetrics.convergenceHistory
                .filter(record => record.converged).length / this.performanceMetrics.convergenceHistory.length,
            averageSimulationsPerSecond: this.config.simulations / (this.performanceMetrics.averageExecutionTime / 1000)
        };
    }

    // ========================= SETUP METHODS =========================

    setupRandomGenerator() {
        if (this.config.randomSeed) {
            // Implement seeded random number generator for reproducible results
            this.seededRandom = this.createSeededRandom(this.config.randomSeed);
            Math.random = this.seededRandom;
        }
    }

    createSeededRandom(seed) {
        // Simple seeded random number generator (Linear Congruential Generator)
        let currentSeed = seed;
        return function() {
            currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
            return currentSeed / 4294967296;
        };
    }

    generateRandomSeed() {
        return Math.floor(Math.random() * 1000000);
    }

    validateSportModels() {
        for (const [sport, model] of Object.entries(this.sportModels)) {
            if (!model.simulateChampionshipPath) {
                console.warn(`⚠️ Sport model ${sport} missing simulateChampionshipPath method`);
            }
        }
    }

    setupPerformanceMonitoring() {
        this.performanceMetrics = {
            totalSimulations: 0,
            averageExecutionTime: 0,
            accuracyHistory: [],
            convergenceHistory: []
        };
    }

    storeSimulationResult(analysis, sport, teamCount, executionTime) {
        const result = {
            timestamp: Date.now(),
            sport,
            teamCount,
            simulations: analysis.totalSimulations,
            executionTime,
            converged: analysis.convergence,
            topTeamProbability: analysis.teams[0]?.probability || 0
        };

        this.simulationHistory.push(result);

        // Keep last 50 simulation results
        if (this.simulationHistory.length > 50) {
            this.simulationHistory.shift();
        }
    }

    // ========================= WEB WORKERS SETUP =========================

    async setupWebWorkers() {
        // Web Workers implementation for parallel processing
        const workerCode = this.generateWorkerCode();
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        for (let i = 0; i < this.config.maxWorkers; i++) {
            try {
                const worker = new Worker(workerUrl);
                worker.onmessage = this.handleWorkerMessage.bind(this);
                worker.onerror = this.handleWorkerError.bind(this);
                this.workers.push(worker);
            } catch (error) {
                console.warn(`⚠️ Failed to create worker ${i}:`, error);
                break;
            }
        }

        URL.revokeObjectURL(workerUrl);
    }

    generateWorkerCode() {
        // Generate self-contained worker code for Monte Carlo simulation
        return `
            // Monte Carlo Worker Code
            self.onmessage = function(e) {
                const { id, simulations, model, teams, config } = e.data;

                try {
                    const results = [];
                    for (let i = 0; i < simulations; i++) {
                        // Simplified simulation logic for worker
                        const result = runSimpleSimulation(teams, config);
                        results.push(result);
                    }

                    self.postMessage({ id, results, success: true });
                } catch (error) {
                    self.postMessage({ id, error: error.message, success: false });
                }
            };

            function runSimpleSimulation(teams, config) {
                // Simplified simulation implementation
                const winner = teams[Math.floor(Math.random() * teams.length)];
                return {
                    winner: winner.id || winner.name,
                    scores: generateRandomScores(teams),
                    timestamp: Date.now()
                };
            }

            function generateRandomScores(teams) {
                const scores = {};
                teams.forEach(team => {
                    scores[team.id || team.name] = Math.floor(Math.random() * 100) + 20;
                });
                return scores;
            }
        `;
    }

    handleWorkerMessage(event) {
        const { id, results, success, error } = event.data;

        if (success) {
            // Handle worker results
        } else {
            console.error(`❌ Worker ${id} error:`, error);
        }
    }

    handleWorkerError(error) {
        console.error('❌ Worker error:', error);
    }

    // ========================= PUBLIC API =========================

    async simulateBaseballChampionship(teams, parameters = {}) {
        return await this.runChampionshipSimulation(teams, 'baseball', parameters);
    }

    async simulateFootballChampionship(teams, parameters = {}) {
        return await this.runChampionshipSimulation(teams, 'football', parameters);
    }

    async simulateBasketballChampionship(teams, parameters = {}) {
        return await this.runChampionshipSimulation(teams, 'basketball', parameters);
    }

    async simulateTrackFieldChampionship(athletes, parameters = {}) {
        return await this.runChampionshipSimulation(athletes, 'track_field', parameters);
    }

    getSimulationHistory() {
        return [...this.simulationHistory];
    }

    destroy() {
        // Clean up workers
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];

        // Clear simulation data
        this.simulationHistory = [];
        this.currentSimulation = null;

    }
}

// ========================= SPORT-SPECIFIC MODELS =========================

class BaseballChampionshipModel {
    async simulateChampionshipPath(teams, scenario, config) {
        // Baseball-specific championship simulation
        const results = [];

        // Simulate series-based playoffs (best of 7)
        const playoffTeams = [...teams];

        while (playoffTeams.length > 1) {
            const nextRound = [];

            for (let i = 0; i < playoffTeams.length; i += 2) {
                const team1 = playoffTeams[i];
                const team2 = playoffTeams[i + 1];

                if (team2) {
                    const seriesWinner = this.simulateBaseballSeries(team1, team2, scenario, 7);
                    nextRound.push(seriesWinner.winner);
                    results.push(seriesWinner);
                } else {
                    nextRound.push(team1); // Bye
                }
            }

            playoffTeams.length = 0;
            playoffTeams.push(...nextRound);
        }

        return {
            winner: playoffTeams[0]?.id || playoffTeams[0]?.name,
            path: results,
            scores: this.generateBaseballScores(teams, scenario)
        };
    }

    simulateBaseballSeries(team1, team2, scenario, gamesToWin = 4) {
        let team1Wins = 0;
        let team2Wins = 0;
        const games = [];

        while (team1Wins < gamesToWin && team2Wins < gamesToWin) {
            const game = this.simulateBaseballGame(team1, team2, scenario);
            games.push(game);

            if (game.winner === (team1.id || team1.name)) {
                team1Wins++;
            } else {
                team2Wins++;
            }
        }

        return {
            winner: team1Wins >= gamesToWin ? team1 : team2,
            games,
            finalScore: `${team1Wins}-${team2Wins}`
        };
    }

    simulateBaseballGame(team1, team2, scenario) {
        // Baseball game simulation with sport-specific factors
        const team1Strength = this.calculateBaseballStrength(team1, scenario);
        const team2Strength = this.calculateBaseballStrength(team2, scenario);

        // Simulate 9 innings
        let team1Score = 0;
        let team2Score = 0;

        for (let inning = 1; inning <= 9; inning++) {
            team1Score += this.simulateHalfInning(team1Strength, scenario);
            team2Score += this.simulateHalfInning(team2Strength, scenario);
        }

        // Extra innings if tied
        let extraInning = 10;
        while (team1Score === team2Score && extraInning <= 15) {
            team1Score += this.simulateHalfInning(team1Strength, scenario);
            if (team1Score > team2Score) break;
            team2Score += this.simulateHalfInning(team2Strength, scenario);
            extraInning++;
        }

        return {
            winner: team1Score > team2Score ? (team1.id || team1.name) : (team2.id || team2.name),
            score: { [team1.id || team1.name]: team1Score, [team2.id || team2.name]: team2Score },
            innings: extraInning - 1
        };
    }

    calculateBaseballStrength(team, scenario) {
        const baseStrength = team.strength || 0.5;
        const pitching = team.pitching || 0.5;
        const hitting = team.hitting || 0.5;
        const fielding = team.fielding || 0.5;

        // Apply scenario factors
        let adjustedStrength = baseStrength;
        adjustedStrength += scenario.gameVariance;
        adjustedStrength *= (1 - scenario.injuryFactor * 0.1);
        adjustedStrength += scenario.weatherImpact;

        return Math.max(0.1, Math.min(0.9, adjustedStrength));
    }

    simulateHalfInning(teamStrength, scenario) {
        // Simplified half-inning simulation
        const runProbability = teamStrength * 0.3; // Base run scoring probability
        let runs = 0;

        // Simulate up to 3 outs
        for (let outs = 0; outs < 3; outs++) {
            if (Math.random() < runProbability) {
                runs += Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 3) + 2;
            }
        }

        return Math.min(runs, 10); // Cap at 10 runs per inning
    }

    generateBaseballScores(teams, scenario) {
        const scores = {};
        teams.forEach(team => {
            const teamId = team.id || team.name;
            scores[teamId] = Math.floor(Math.random() * 8) + 2; // 2-9 runs typical
        });
        return scores;
    }
}

class FootballChampionshipModel {
    async simulateChampionshipPath(teams, scenario, config) {
        // Football single-elimination tournament
        const results = [];
        const playoffTeams = [...teams];

        while (playoffTeams.length > 1) {
            const nextRound = [];

            for (let i = 0; i < playoffTeams.length; i += 2) {
                const team1 = playoffTeams[i];
                const team2 = playoffTeams[i + 1];

                if (team2) {
                    const gameResult = this.simulateFootballGame(team1, team2, scenario);
                    nextRound.push(gameResult.winner);
                    results.push(gameResult);
                } else {
                    nextRound.push(team1);
                }
            }

            playoffTeams.length = 0;
            playoffTeams.push(...nextRound);
        }

        return {
            winner: playoffTeams[0]?.id || playoffTeams[0]?.name,
            path: results,
            scores: this.generateFootballScores(teams, scenario)
        };
    }

    simulateFootballGame(team1, team2, scenario) {
        const team1Strength = this.calculateFootballStrength(team1, scenario);
        const team2Strength = this.calculateFootballStrength(team2, scenario);

        // Simulate quarters
        let team1Score = 0;
        let team2Score = 0;

        for (let quarter = 1; quarter <= 4; quarter++) {
            team1Score += this.simulateQuarter(team1Strength, scenario);
            team2Score += this.simulateQuarter(team2Strength, scenario);
        }

        // Overtime if tied
        if (team1Score === team2Score) {
            team1Score += this.simulateOvertime(team1Strength, scenario);
            team2Score += this.simulateOvertime(team2Strength, scenario);
        }

        return {
            winner: team1Score > team2Score ? team1 : team2,
            score: { [team1.id || team1.name]: team1Score, [team2.id || team2.name]: team2Score },
            margin: Math.abs(team1Score - team2Score)
        };
    }

    calculateFootballStrength(team, scenario) {
        const baseStrength = team.strength || 0.5;
        const offense = team.offense || 0.5;
        const defense = team.defense || 0.5;
        const specialTeams = team.specialTeams || 0.5;

        let adjustedStrength = (offense + defense + specialTeams) / 3;
        adjustedStrength += scenario.gameVariance;
        adjustedStrength *= (1 - scenario.injuryFactor * 0.15);

        return Math.max(0.1, Math.min(0.9, adjustedStrength));
    }

    simulateQuarter(teamStrength, scenario) {
        // Football quarter simulation
        const scoringProbability = teamStrength * 0.4;
        let points = 0;

        // Multiple scoring opportunities per quarter
        for (let drive = 0; drive < 3; drive++) {
            if (Math.random() < scoringProbability) {
                const scoreType = Math.random();
                if (scoreType < 0.6) points += 7; // Touchdown
                else if (scoreType < 0.9) points += 3; // Field goal
                else points += 2; // Safety
            }
        }

        return points;
    }

    simulateOvertime(teamStrength, scenario) {
        // Simplified overtime simulation
        return Math.random() < teamStrength ? 7 : 0;
    }

    generateFootballScores(teams, scenario) {
        const scores = {};
        teams.forEach(team => {
            const teamId = team.id || team.name;
            scores[teamId] = Math.floor(Math.random() * 35) + 7; // 7-41 points typical
        });
        return scores;
    }
}

class BasketballChampionshipModel {
    async simulateChampionshipPath(teams, scenario, config) {
        // Basketball tournament simulation
        const results = [];
        const playoffTeams = [...teams];

        while (playoffTeams.length > 1) {
            const nextRound = [];

            for (let i = 0; i < playoffTeams.length; i += 2) {
                const team1 = playoffTeams[i];
                const team2 = playoffTeams[i + 1];

                if (team2) {
                    const gameResult = this.simulateBasketballGame(team1, team2, scenario);
                    nextRound.push(gameResult.winner);
                    results.push(gameResult);
                } else {
                    nextRound.push(team1);
                }
            }

            playoffTeams.length = 0;
            playoffTeams.push(...nextRound);
        }

        return {
            winner: playoffTeams[0]?.id || playoffTeams[0]?.name,
            path: results,
            scores: this.generateBasketballScores(teams, scenario)
        };
    }

    simulateBasketballGame(team1, team2, scenario) {
        const team1Strength = this.calculateBasketballStrength(team1, scenario);
        const team2Strength = this.calculateBasketballStrength(team2, scenario);

        // Simulate halves
        let team1Score = 0;
        let team2Score = 0;

        for (let half = 1; half <= 2; half++) {
            team1Score += this.simulateHalf(team1Strength, scenario);
            team2Score += this.simulateHalf(team2Strength, scenario);
        }

        // Overtime if tied
        let overtimes = 0;
        while (team1Score === team2Score && overtimes < 5) {
            team1Score += this.simulateOvertime(team1Strength, scenario);
            team2Score += this.simulateOvertime(team2Strength, scenario);
            overtimes++;
        }

        return {
            winner: team1Score > team2Score ? team1 : team2,
            score: { [team1.id || team1.name]: team1Score, [team2.id || team2.name]: team2Score },
            margin: Math.abs(team1Score - team2Score),
            overtimes
        };
    }

    calculateBasketballStrength(team, scenario) {
        const baseStrength = team.strength || 0.5;
        const offense = team.offense || 0.5;
        const defense = team.defense || 0.5;
        const rebounds = team.rebounds || 0.5;

        let adjustedStrength = (offense + defense + rebounds) / 3;
        adjustedStrength += scenario.gameVariance;
        adjustedStrength *= (1 - scenario.injuryFactor * 0.12);

        return Math.max(0.1, Math.min(0.9, adjustedStrength));
    }

    simulateHalf(teamStrength, scenario) {
        // Basketball half simulation (20 minutes)
        const possessions = 35; // Approximate possessions per half
        let points = 0;

        for (let i = 0; i < possessions; i++) {
            if (Math.random() < teamStrength) {
                const shotType = Math.random();
                if (shotType < 0.35) points += 3; // Three-pointer
                else points += 2; // Two-pointer
            }
        }

        return points;
    }

    generateBasketballScores(teams, scenario) {
        const scores = {};
        teams.forEach(team => {
            const teamId = team.id || team.name;
            scores[teamId] = Math.floor(Math.random() * 40) + 60; // 60-99 points typical
        });
        return scores;
    }
}

class TrackFieldChampionshipModel {
    async simulateChampionshipPath(athletes, scenario, config) {
        // Track and field meet simulation
        const events = config.events || [
            '100m', '200m', '400m', '800m', '1500m', '5000m',
            'long_jump', 'high_jump', 'pole_vault', 'shot_put', 'discus'
        ];

        const results = [];
        const teamScores = {};

        // Initialize team scores
        athletes.forEach(athlete => {
            const teamId = athlete.team || 'Unattached';
            teamScores[teamId] = 0;
        });

        // Simulate each event
        for (const event of events) {
            const eventResult = this.simulateTrackFieldEvent(athletes, event, scenario);
            results.push(eventResult);

            // Award points based on placement
            eventResult.places.forEach((athlete, index) => {
                const points = this.getTrackFieldPoints(index + 1);
                const teamId = athlete.team || 'Unattached';
                teamScores[teamId] += points;
            });
        }

        // Determine winning team
        const winner = Object.keys(teamScores).reduce((a, b) =>
            teamScores[a] > teamScores[b] ? a : b
        );

        return {
            winner,
            teamScores,
            eventResults: results,
            totalEvents: events.length
        };
    }

    simulateTrackFieldEvent(athletes, event, scenario) {
        const performances = athletes.map(athlete => {
            const performance = this.simulateAthletePerformance(athlete, event, scenario);
            return { athlete, performance, event };
        });

        // Sort by performance (ascending for time events, descending for distance/height)
        const isTimeEvent = ['100m', '200m', '400m', '800m', '1500m', '5000m'].includes(event);
        performances.sort((a, b) => isTimeEvent ? a.performance - b.performance : b.performance - a.performance);

        return {
            event,
            places: performances.map(p => p.athlete),
            performances: performances.map(p => p.performance),
            winner: performances[0].athlete
        };
    }

    simulateAthletePerformance(athlete, event, scenario) {
        const basePerformance = athlete.personalBest || this.getEventStandard(event);
        const variance = athlete.consistency || 0.05;

        // Apply random variance
        const performanceVariance = (Math.random() - 0.5) * variance * 2;
        let performance = basePerformance * (1 + performanceVariance);

        // Apply scenario factors
        performance *= (1 + scenario.gameVariance * 0.5);
        performance *= (1 - scenario.injuryFactor * 0.1);

        return Math.max(0, performance);
    }

    getEventStandard(event) {
        // Default standards for different events
        const standards = {
            '100m': 11.0,
            '200m': 22.5,
            '400m': 50.0,
            '800m': 120.0,
            '1500m': 240.0,
            '5000m': 900.0,
            long_jump: 6.5,
            high_jump: 1.8,
            pole_vault: 4.0,
            shot_put: 15.0,
            discus: 45.0
        };

        return standards[event] || 10.0;
    }

    getTrackFieldPoints(place) {
        // Standard track and field scoring system
        const pointSystem = [10, 8, 6, 5, 4, 3, 2, 1];
        return place <= pointSystem.length ? pointSystem[place - 1] : 0;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.MonteCarloEngine = MonteCarloEngine;
    window.BaseballChampionshipModel = BaseballChampionshipModel;
    window.FootballChampionshipModel = FootballChampionshipModel;
    window.BasketballChampionshipModel = BasketballChampionshipModel;
    window.TrackFieldChampionshipModel = TrackFieldChampionshipModel;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MonteCarloEngine,
        BaseballChampionshipModel,
        FootballChampionshipModel,
        BasketballChampionshipModel,
        TrackFieldChampionshipModel
    };
}

