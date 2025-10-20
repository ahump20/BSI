/**
 * BLAZE SPORTS INTEL - REAL SPORTS ANALYTICS MODELS
 * Phase 3A: Replace random number generators with actual statistical models
 *
 * Implements proven sports analytics models:
 * - Pythagorean Expectation
 * - Elo Rating System
 * - Strength of Schedule
 * - Sabermetric calculations
 *
 * No random numbers - only real statistical analysis
 */

class SportsAnalyticsModels {
    constructor(logger) {
        this.logger = logger;

        // Model parameters based on historical analysis
        this.pythagoreanExponents = {
            mlb: 1.83,     // Bill James' original
            nfl: 2.37,     // Football Outsiders
            nba: 13.91,    // Basketball Reference
            nhl: 2.15      // Hockey Reference
        };

        // Elo rating parameters
        this.eloParams = {
            mlb: { k: 20, base: 1500, homeAdvantage: 24 },
            nfl: { k: 20, base: 1500, homeAdvantage: 65 },
            nba: { k: 20, base: 1500, homeAdvantage: 100 },
            nhl: { k: 20, base: 1500, homeAdvantage: 55 }
        };
    }

    /**
     * Pythagorean Expectation - Predicts win percentage based on runs/points scored vs allowed
     * Formula: Win% = (RS^exp) / (RS^exp + RA^exp)
     * Where RS = Runs Scored, RA = Runs Allowed, exp = sport-specific exponent
     */
    calculatePythagoreanExpectation(runsScored, runsAllowed, sport = 'mlb') {
        if (runsScored <= 0 || runsAllowed <= 0) {
            this.logger?.warn('Invalid input for Pythagorean calculation', {
                runsScored, runsAllowed, sport
            });
            return null;
        }

        const exponent = this.pythagoreanExponents[sport] || this.pythagoreanExponents.mlb;

        const rsExp = Math.pow(runsScored, exponent);
        const raExp = Math.pow(runsAllowed, exponent);

        const pythagoreanWinPct = rsExp / (rsExp + raExp);

        // Calculate expected wins for 162-game season (adjust for sport)
        const gamesSeason = this.getSeasonGames(sport);
        const expectedWins = pythagoreanWinPct * gamesSeason;

        return {
            pythagoreanWinPercentage: parseFloat(pythagoreanWinPct.toFixed(4)),
            expectedWins: parseFloat(expectedWins.toFixed(1)),
            expectedLosses: parseFloat((gamesSeason - expectedWins).toFixed(1)),
            runsScored,
            runsAllowed,
            runDifferential: runsScored - runsAllowed,
            sport,
            exponent,
            model: 'Pythagorean Expectation'
        };
    }

    /**
     * Elo Rating System - Dynamic team strength ratings
     * Updates based on game results with margin of victory consideration
     */
    calculateEloRating(teamCurrentElo, opponentElo, result, marginOfVictory = 0, sport = 'mlb', isHome = false) {
        const params = this.eloParams[sport] || this.eloParams.mlb;

        // Home field advantage
        const adjustedTeamElo = isHome ? teamCurrentElo + params.homeAdvantage : teamCurrentElo;

        // Expected outcome (0 to 1)
        const expectedOutcome = 1 / (1 + Math.pow(10, (opponentElo - adjustedTeamElo) / 400));

        // Actual outcome (1 = win, 0.5 = tie, 0 = loss)
        let actualOutcome;
        if (result === 'W') actualOutcome = 1;
        else if (result === 'T') actualOutcome = 0.5;
        else actualOutcome = 0;

        // Margin of victory multiplier (NFL/NBA use this more than MLB)
        let movMultiplier = 1;
        if (sport === 'nfl' && marginOfVictory > 0) {
            movMultiplier = Math.log(Math.abs(marginOfVictory) + 1) * (2.2 / ((adjustedTeamElo - opponentElo) * 0.001 + 2.2));
        } else if (sport === 'nba' && marginOfVictory > 0) {
            movMultiplier = ((Math.abs(marginOfVictory) + 3) ** 0.8) / (7.5 + 0.006 * (adjustedTeamElo - opponentElo));
        }

        // Calculate new Elo
        const kFactor = params.k * movMultiplier;
        const ratingChange = kFactor * (actualOutcome - expectedOutcome);
        const newElo = teamCurrentElo + ratingChange;

        return {
            previousElo: teamCurrentElo,
            newElo: Math.round(newElo),
            ratingChange: Math.round(ratingChange),
            expectedOutcome: parseFloat(expectedOutcome.toFixed(3)),
            actualOutcome,
            marginOfVictory,
            isHome,
            sport,
            model: 'Elo Rating System'
        };
    }

    /**
     * Strength of Schedule (SOS) - Measures difficulty of opponents faced
     * Uses opponents' win percentage excluding games against the team being analyzed
     */
    calculateStrengthOfSchedule(teamSchedule, allTeamRecords) {
        if (!teamSchedule || teamSchedule.length === 0) {
            return null;
        }

        let totalOpponentWins = 0;
        let totalOpponentGames = 0;
        let opponentCount = 0;

        for (const game of teamSchedule) {
            const opponent = game.opponent;
            if (!allTeamRecords[opponent]) continue;

            const oppRecord = allTeamRecords[opponent];

            // Exclude games against the team we're calculating SOS for
            let oppWins = oppRecord.wins;
            let oppLosses = oppRecord.losses;

            if (game.result === 'W') {
                oppLosses -= 1; // Opponent lost this game
            } else if (game.result === 'L') {
                oppWins -= 1;   // Opponent won this game
            }

            totalOpponentWins += oppWins;
            totalOpponentGames += (oppWins + oppLosses);
            opponentCount++;
        }

        if (totalOpponentGames === 0) return null;

        const strengthOfSchedule = totalOpponentWins / totalOpponentGames;

        // Calculate SOS rating (0.500 is average)
        const sosRating = (strengthOfSchedule - 0.500) * 100;

        return {
            strengthOfSchedule: parseFloat(strengthOfSchedule.toFixed(4)),
            sosRating: parseFloat(sosRating.toFixed(2)),
            opponentWinPercentage: parseFloat(strengthOfSchedule.toFixed(3)),
            gamesAnalyzed: teamSchedule.length,
            opponentCount,
            interpretation: this.interpretSOS(strengthOfSchedule),
            model: 'Strength of Schedule'
        };
    }

    /**
     * Baseball-specific sabermetric calculations
     */
    calculateBaseballSabermetrics(teamStats) {
        const {
            runs, hits, doubles, triples, homeRuns, walks, hitByPitch,
            atBats, sacrificeFlies, stolenBases, caughtStealing,
            runsAllowed, pitchingInnings, earnedRuns, strikeouts, wildPitches
        } = teamStats;

        // On-Base Percentage (OBP)
        const onBasePercentage = (hits + walks + hitByPitch) /
            (atBats + walks + hitByPitch + sacrificeFlies);

        // Slugging Percentage (SLG)
        const totalBases = hits + doubles + (triples * 2) + (homeRuns * 3);
        const sluggingPercentage = totalBases / atBats;

        // OPS (On-base Plus Slugging)
        const ops = onBasePercentage + sluggingPercentage;

        // Batting Average (BA)
        const battingAverage = hits / atBats;

        // ERA (Earned Run Average)
        const era = (earnedRuns * 9) / pitchingInnings;

        // WHIP (Walks + Hits per Inning Pitched)
        const whip = (walks + hits) / pitchingInnings;

        // Base Stealing Efficiency
        const stealSuccessRate = stolenBases / (stolenBases + caughtStealing);

        return {
            battingAverage: parseFloat(battingAverage.toFixed(3)),
            onBasePercentage: parseFloat(onBasePercentage.toFixed(3)),
            sluggingPercentage: parseFloat(sluggingPercentage.toFixed(3)),
            ops: parseFloat(ops.toFixed(3)),
            era: parseFloat(era.toFixed(2)),
            whip: parseFloat(whip.toFixed(2)),
            stealSuccessRate: parseFloat((stealSuccessRate * 100).toFixed(1)),
            runsPerGame: parseFloat((runs / (atBats / 27)).toFixed(2)),
            teamStats,
            model: 'Sabermetric Analysis'
        };
    }

    /**
     * Football-specific advanced metrics
     */
    calculateFootballAnalytics(teamStats) {
        const {
            pointsScored, pointsAllowed, passingYards, rushingYards,
            turnovers, takeaways, penalties, penaltyYards, timeOfPossession
        } = teamStats;

        // Points per game differential
        const pointDifferential = pointsScored - pointsAllowed;

        // Turnover differential (positive is good)
        const turnoverDifferential = takeaways - turnovers;

        // Yards per play
        const totalOffensiveYards = passingYards + rushingYards;

        // Penalty efficiency
        const penaltyYardsPerGame = penaltyYards / teamStats.games;

        // Time of possession percentage
        const timeOfPossessionPct = (timeOfPossession / 60) * 100; // Convert to percentage

        return {
            pointDifferential,
            turnoverDifferential,
            totalOffensiveYards,
            yardsPerGame: parseFloat((totalOffensiveYards / teamStats.games).toFixed(1)),
            penaltyYardsPerGame: parseFloat(penaltyYardsPerGame.toFixed(1)),
            timeOfPossessionPct: parseFloat(timeOfPossessionPct.toFixed(1)),
            efficiency: {
                redZoneEfficiency: teamStats.redZoneScores / teamStats.redZoneAttempts,
                thirdDownConversion: teamStats.thirdDownConversions / teamStats.thirdDownAttempts
            },
            teamStats,
            model: 'Football Analytics'
        };
    }

    /**
     * Team performance rating combining multiple metrics
     */
    calculateCompositeRating(teamData, sport) {
        let rating = 500; // Base rating (average team)
        let components = {};

        if (sport === 'mlb' && teamData.pythagorean) {
            // Weight Pythagorean expectation heavily for baseball
            const pyth = teamData.pythagorean.pythagoreanWinPercentage;
            components.pythagorean = (pyth - 0.500) * 1000; // Scale to rating points
            rating += components.pythagorean * 0.6;
        }

        if (teamData.elo) {
            // Normalize Elo to our rating scale
            components.elo = (teamData.elo.newElo - 1500) * 0.2;
            rating += components.elo * 0.3;
        }

        if (teamData.strengthOfSchedule) {
            // Adjust for strength of schedule
            components.sos = teamData.strengthOfSchedule.sosRating * 2;
            rating += components.sos * 0.1;
        }

        if (sport === 'ncaa_baseball' && teamData.regression?.models) {
            const ridgeModel = teamData.regression.models.winPctRidge;
            if (ridgeModel?.predictedWinPct !== undefined) {
                const baseline = ridgeModel.leagueAverage ?? 0.5;
                const delta = ridgeModel.predictedWinPct - baseline;
                components.regressionWinPct = parseFloat((delta * 1200).toFixed(2));
                rating += components.regressionWinPct * 0.5;
            }

            const topEightModel = teamData.regression.models.topEightLogit;
            if (topEightModel?.probability !== undefined) {
                const centered = topEightModel.probability - 0.5;
                components.regressionTopEight = parseFloat((centered * 800).toFixed(2));
                rating += components.regressionTopEight * 0.5;
            }
        }

        rating = Math.max(0, Math.min(1000, rating)); // Bound between 0-1000

        return {
            compositeRating: Math.round(rating),
            components,
            interpretation: this.interpretRating(rating),
            sport,
            model: 'Composite Team Rating'
        };
    }

    /**
     * Predict game outcome using statistical models
     */
    predictGameOutcome(homeTeam, awayTeam, sport = 'mlb') {
        if (!homeTeam.elo || !awayTeam.elo) {
            return { error: 'Elo ratings required for prediction' };
        }

        const params = this.eloParams[sport];
        const homeElo = homeTeam.elo.newElo + params.homeAdvantage;
        const awayElo = awayTeam.elo.newElo;

        // Win probability calculation
        const homeWinProb = 1 / (1 + Math.pow(10, (awayElo - homeElo) / 400));
        const awayWinProb = 1 - homeWinProb;

        // Predicted score (basic model)
        let predictedScore = null;
        if (homeTeam.pythagorean && awayTeam.pythagorean) {
            const homeOffense = homeTeam.pythagorean.runsScored / homeTeam.games;
            const homeDefense = homeTeam.pythagorean.runsAllowed / homeTeam.games;
            const awayOffense = awayTeam.pythagorean.runsScored / awayTeam.games;
            const awayDefense = awayTeam.pythagorean.runsAllowed / awayTeam.games;

            predictedScore = {
                home: parseFloat(((homeOffense + awayDefense) / 2).toFixed(1)),
                away: parseFloat(((awayOffense + homeDefense) / 2).toFixed(1))
            };
        }

        return {
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
            homeWinProbability: parseFloat(homeWinProb.toFixed(3)),
            awayWinProbability: parseFloat(awayWinProb.toFixed(3)),
            predictedScore,
            confidence: this.calculatePredictionConfidence(homeWinProb),
            sport,
            model: 'Game Outcome Prediction'
        };
    }

    /**
     * Helper methods
     */
    getSeasonGames(sport) {
        const seasonGames = {
            mlb: 162,
            nfl: 17,
            nba: 82,
            nhl: 82
        };
        return seasonGames[sport] || 162;
    }

    interpretSOS(sos) {
        if (sos > 0.550) return 'Very Difficult';
        if (sos > 0.525) return 'Difficult';
        if (sos > 0.475) return 'Average';
        if (sos > 0.450) return 'Easy';
        return 'Very Easy';
    }

    interpretRating(rating) {
        if (rating > 750) return 'Elite';
        if (rating > 650) return 'Very Good';
        if (rating > 550) return 'Above Average';
        if (rating > 450) return 'Below Average';
        if (rating > 350) return 'Poor';
        return 'Very Poor';
    }

    calculatePredictionConfidence(winProb) {
        const confidence = Math.abs(winProb - 0.5) * 2; // 0 to 1 scale
        if (confidence > 0.8) return 'Very High';
        if (confidence > 0.6) return 'High';
        if (confidence > 0.4) return 'Medium';
        if (confidence > 0.2) return 'Low';
        return 'Very Low';
    }
}

export default SportsAnalyticsModels;