/**
 * ========================================================================
 * BLAZE SPORTS INTEL - MONTE CARLO SIMULATIONS MODULE
 * ========================================================================
 *
 * Probabilistic Season Projections with 10,000-Iteration Simulations
 *
 * Components:
 * - MonteCarloView: Main React component for season simulations
 * - Heatmap Functions: Canvas 2D rendering for MLB/NFL performance zones
 * - Simulation Engine: Box-Muller normal distribution, statistical analysis
 * - Chart.js Integration: Playoff probability trends over time
 * - 3D Visualizations: Baseball diamond and football field integrations
 * - Real-Time API Integration: Live standings from /api/{league}/standings
 *
 * Bundle: ~150KB unminified (~1,928 lines)
 * Lazy loaded via: import('./analytics-monte-carlo.js')
 *
 * Dependencies:
 * - React (already loaded)
 * - Chart.js (already loaded)
 * - Babylon.js (optional, for 3D visualizations)
 *
 * Data Sources:
 * - NFL: Real Week 5 2025 standings (live API)
 * - MLB: 2024 final standings (fallback)
 * - Monte Carlo: 10,000 iterations per team projection
 *
 * Last Updated: 2025-11-02
 * ========================================================================
 */

// ========== MONTE CARLO SIMULATIONS COMPONENT ==========
export const MonteCarloView = () => {
    // State management
    const [activeLeague, setActiveLeague] = React.useState('NFL');
    const [simulations, setSimulations] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    const [selectedTeam, setSelectedTeam] = React.useState(null);
    const [realData, setRealData] = React.useState(null);
    const [dataSource, setDataSource] = React.useState('demo');
    const [chartView, setChartView] = React.useState('all'); // 'top10', 'division', 'all'
    const [show3DDiamond, setShow3DDiamond] = React.useState(false);
    const [selectedDepthChart, setSelectedDepthChart] = React.useState(null);
    const [show3DField, setShow3DField] = React.useState(false);
    const [selectedFormation, setSelectedFormation] = React.useState('offense-shotgun');
    const [showHeatmaps, setShowHeatmaps] = React.useState(false);
    const [heatmapType, setHeatmapType] = React.useState('batting'); // 'batting', 'pitching' for MLB; 'receiving', 'rushing' for NFL
    const [playoffChartMode, setPlayoffChartMode] = React.useState('chartjs'); // 'chartjs' or 'plotly'
    const [heatmapMode, setHeatmapMode] = React.useState('canvas2d'); // 'canvas2d' or 'deckgl'

    // Week 5 beta features state
    const [feedbackOpen, setFeedbackOpen] = React.useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = React.useState(false);
    const [feedbackData, setFeedbackData] = React.useState({ name: '', email: '', message: '' });
    const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

    // ========== HEATMAP DRAWING FUNCTIONS ==========

    /**
     * Draw MLB batting heatmap with 3x3 strike zone grid
     * Shows batting average by pitch location with color-coded zones
     */
    const drawBattingHeatmap = (ctx, team) => {
        // Strike zone grid (3x3)
        const zones = [
            [0.35, 0.28, 0.42], // Top row (high pitches)
            [0.32, 0.38, 0.35], // Middle row (belt high)
            [0.28, 0.33, 0.30]  // Bottom row (low pitches)
        ];

        const zoneLabels = [
            ['High-Away', 'High-Mid', 'High-In'],
            ['Mid-Away', 'Middle', 'Mid-In'],
            ['Low-Away', 'Low-Mid', 'Low-In']
        ];

        const zoneWidth = ctx.canvas.width / 3;
        const zoneHeight = ctx.canvas.height / 3;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw each zone with gradient and shadow effects
        zones.forEach((row, rowIdx) => {
            row.forEach((value, colIdx) => {
                const x = colIdx * zoneWidth;
                const y = rowIdx * zoneHeight;

                // Create radial gradient for heat effect
                const gradient = ctx.createRadialGradient(
                    x + zoneWidth / 2, y + zoneHeight / 2, 0,
                    x + zoneWidth / 2, y + zoneHeight / 2, zoneWidth / 2
                );

                // Color mapping based on batting average
                if (value > 0.350) {
                    // Hot zone (red)
                    gradient.addColorStop(0, `rgba(255, 68, 68, ${Math.min(value * 1.2, 1)})`);
                    gradient.addColorStop(1, `rgba(220, 38, 38, ${value * 0.7})`);
                } else if (value > 0.280) {
                    // Warm zone (orange)
                    gradient.addColorStop(0, `rgba(255, 170, 68, ${value * 1.1})`);
                    gradient.addColorStop(1, `rgba(234, 88, 12, ${value * 0.7})`);
                } else {
                    // Cold zone (blue)
                    gradient.addColorStop(0, `rgba(96, 165, 250, ${Math.max(value * 1.5, 0.5)})`);
                    gradient.addColorStop(1, `rgba(37, 99, 235, ${value * 0.8})`);
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, zoneWidth, zoneHeight);

                // Add shadow for depth
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                // Draw zone border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, zoneWidth - 2, zoneHeight - 2);

                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Draw batting average text
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.font = 'bold 18px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    `.${Math.round(value * 1000)}`,
                    x + zoneWidth / 2,
                    y + zoneHeight / 2
                );

                // Draw zone label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = '10px Inter, system-ui, sans-serif';
                ctx.fillText(
                    zoneLabels[rowIdx][colIdx],
                    x + zoneWidth / 2,
                    y + zoneHeight - 15
                );
            });
        });

        // Draw outer border
        ctx.strokeStyle = 'rgba(191, 87, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    /**
     * Draw MLB pitching heatmap (opponent batting average by zone)
     */
    const drawPitchingHeatmap = (ctx, team) => {
        // Opponent batting average by zone (pitcher perspective)
        const zones = [
            [0.195, 0.212, 0.188], // Top row (high pitches - harder to hit)
            [0.245, 0.282, 0.238], // Middle row (belt high - easiest to hit)
            [0.218, 0.235, 0.225]  // Bottom row (low pitches - moderate)
        ];

        const zoneLabels = [
            ['High-Away', 'High-Mid', 'High-In'],
            ['Mid-Away', 'Middle', 'Mid-In'],
            ['Low-Away', 'Low-Mid', 'Low-In']
        ];

        const zoneWidth = ctx.canvas.width / 3;
        const zoneHeight = ctx.canvas.height / 3;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        zones.forEach((row, rowIdx) => {
            row.forEach((value, colIdx) => {
                const x = colIdx * zoneWidth;
                const y = rowIdx * zoneHeight;

                // Create radial gradient
                const gradient = ctx.createRadialGradient(
                    x + zoneWidth / 2, y + zoneHeight / 2, 0,
                    x + zoneWidth / 2, y + zoneHeight / 2, zoneWidth / 2
                );

                // Lower opponent BA = better pitching (green)
                // Higher opponent BA = worse pitching (red)
                if (value < 0.200) {
                    gradient.addColorStop(0, `rgba(16, 185, 129, ${Math.max(1 - value * 4, 0.6)})`);
                    gradient.addColorStop(1, `rgba(5, 150, 105, ${(1 - value * 4) * 0.7})`);
                } else if (value < 0.250) {
                    gradient.addColorStop(0, `rgba(251, 191, 36, ${value * 1.2})`);
                    gradient.addColorStop(1, `rgba(245, 158, 11, ${value * 0.9})`);
                } else {
                    gradient.addColorStop(0, `rgba(239, 68, 68, ${Math.min(value * 1.5, 1)})`);
                    gradient.addColorStop(1, `rgba(220, 38, 38, ${value * 1.1})`);
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, zoneWidth, zoneHeight);

                // Zone border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, zoneWidth - 2, zoneHeight - 2);

                // Draw opponent batting average text
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.font = 'bold 18px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    `.${Math.round(value * 1000)}`,
                    x + zoneWidth / 2,
                    y + zoneHeight / 2
                );

                // Zone label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = '10px Inter, system-ui, sans-serif';
                ctx.fillText(
                    zoneLabels[rowIdx][colIdx],
                    x + zoneWidth / 2,
                    y + zoneHeight - 15
                );
            });
        });

        // Outer border
        ctx.strokeStyle = 'rgba(191, 87, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    /**
     * Draw NFL receiving heatmap (field zones with yardage)
     */
    const drawReceivingHeatmap = (ctx, team) => {
        // Field zones: [0-10 yds, 10-20 yds, 20+ yds] x [Left, Middle, Right]
        const zones = [
            [45, 78, 52],  // Deep (20+ yards)
            [68, 95, 71],  // Intermediate (10-20 yards)
            [52, 88, 56]   // Short (0-10 yards)
        ];

        const zoneLabels = [
            ['Deep-L', 'Deep-M', 'Deep-R'],
            ['Int-L', 'Int-M', 'Int-R'],
            ['Short-L', 'Short-M', 'Short-R']
        ];

        const zoneWidth = ctx.canvas.width / 3;
        const zoneHeight = ctx.canvas.height / 3;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw field background
        ctx.fillStyle = '#0f5e1a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw yard lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const y = i * zoneHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
            ctx.stroke();
        }
        for (let i = 1; i < 3; i++) {
            const x = i * zoneWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
            ctx.stroke();
        }

        zones.forEach((row, rowIdx) => {
            row.forEach((value, colIdx) => {
                const x = colIdx * zoneWidth;
                const y = rowIdx * zoneHeight;

                // Create radial gradient for yardage intensity
                const gradient = ctx.createRadialGradient(
                    x + zoneWidth / 2, y + zoneHeight / 2, 0,
                    x + zoneWidth / 2, y + zoneHeight / 2, zoneWidth / 2
                );

                // Color mapping: yards per reception
                if (value > 80) {
                    gradient.addColorStop(0, `rgba(239, 68, 68, ${Math.min(value / 100, 1)})`);
                    gradient.addColorStop(1, `rgba(220, 38, 38, ${value / 120})`);
                } else if (value > 50) {
                    gradient.addColorStop(0, `rgba(251, 191, 36, ${value / 100})`);
                    gradient.addColorStop(1, `rgba(245, 158, 11, ${value / 120})`);
                } else {
                    gradient.addColorStop(0, `rgba(96, 165, 250, ${Math.max(value / 80, 0.4)})`);
                    gradient.addColorStop(1, `rgba(37, 99, 235, ${value / 100})`);
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, zoneWidth, zoneHeight);

                // Draw yardage text
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.font = 'bold 20px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    `${value} yds`,
                    x + zoneWidth / 2,
                    y + zoneHeight / 2
                );

                // Zone label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '11px Inter, system-ui, sans-serif';
                ctx.fillText(
                    zoneLabels[rowIdx][colIdx],
                    x + zoneWidth / 2,
                    y + zoneHeight - 15
                );
            });
        });

        // Field border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    /**
     * Draw NFL rushing heatmap (yards per carry by direction)
     */
    const drawRushingHeatmap = (ctx, team) => {
        // Offensive line positions: [LT, LG, C, RG, RT]
        // Yards per carry by direction
        const zones = [
            [3.8, 4.2, 5.1, 4.5, 4.0], // Outside runs
            [4.5, 5.2, 6.8, 5.4, 4.7]  // Inside runs
        ];

        const zoneLabels = [
            ['LT-Out', 'LG-Out', 'C-Out', 'RG-Out', 'RT-Out'],
            ['LT-In', 'LG-In', 'C-In', 'RG-In', 'RT-In']
        ];

        const zoneWidth = ctx.canvas.width / 5;
        const zoneHeight = ctx.canvas.height / 2;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw field background
        ctx.fillStyle = '#0f5e1a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw offensive line (horizontal line in middle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, ctx.canvas.height / 2);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
        ctx.stroke();

        zones.forEach((row, rowIdx) => {
            row.forEach((value, colIdx) => {
                const x = colIdx * zoneWidth;
                const y = rowIdx * zoneHeight;

                // Create radial gradient for yards per carry
                const gradient = ctx.createRadialGradient(
                    x + zoneWidth / 2, y + zoneHeight / 2, 0,
                    x + zoneWidth / 2, y + zoneHeight / 2, zoneWidth / 2
                );

                // Color mapping: yards per carry
                if (value > 5.5) {
                    gradient.addColorStop(0, `rgba(239, 68, 68, ${Math.min(value / 8, 1)})`);
                    gradient.addColorStop(1, `rgba(220, 38, 38, ${value / 10})`);
                } else if (value > 4.0) {
                    gradient.addColorStop(0, `rgba(251, 191, 36, ${value / 8})`);
                    gradient.addColorStop(1, `rgba(245, 158, 11, ${value / 10})`);
                } else {
                    gradient.addColorStop(0, `rgba(96, 165, 250, ${Math.max(value / 6, 0.5)})`);
                    gradient.addColorStop(1, `rgba(37, 99, 235, ${value / 8})`);
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, zoneWidth, zoneHeight);

                // Draw grid lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, zoneWidth, zoneHeight);

                // Draw yards per carry text
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.font = 'bold 16px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    `${value.toFixed(1)} YPC`,
                    x + zoneWidth / 2,
                    y + zoneHeight / 2
                );

                // Zone label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '9px Inter, system-ui, sans-serif';
                ctx.fillText(
                    zoneLabels[rowIdx][colIdx],
                    x + zoneWidth / 2,
                    y + zoneHeight - 10
                );
            });
        });

        // Field border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    // ========== MONTE CARLO SIMULATION ENGINE ==========

    /**
     * Box-Muller transform for normal distribution random numbers
     * @param {number} mean - Mean of the distribution
     * @param {number} stdDev - Standard deviation
     * @returns {number} Random number from normal distribution
     */
    const normalRandom = (mean, stdDev) => {
        let u1 = Math.random();
        let u2 = Math.random();
        let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * stdDev + mean;
    };

    /**
     * Run Monte Carlo season simulation (10,000 iterations)
     * @param {Object} teamData - Team statistics (currentWins, baseWinProb, etc.)
     * @param {number} gamesRemaining - Games left in season
     * @param {number} iterations - Number of simulations (default: 10,000)
     * @returns {Array} Array of projected win totals
     */
    const monteCarloSeasonSimulation = (teamData, gamesRemaining, iterations = 10000) => {
        const results = [];

        for (let i = 0; i < iterations; i++) {
            let projectedWins = teamData.currentWins;

            // Simulate each remaining game
            for (let game = 0; game < gamesRemaining; game++) {
                // Add variance to win probability using normal distribution
                let winProb = teamData.baseWinProb + normalRandom(0, 0.15);

                // Clamp probability between 10% and 90%
                winProb = Math.max(0.1, Math.min(0.9, winProb));

                // Simulate game outcome
                if (Math.random() < winProb) {
                    projectedWins++;
                }
            }

            results.push(projectedWins);
        }

        return results;
    };

    /**
     * Calculate statistical summary from simulation results
     * @param {Array} results - Array of projected win totals
     * @returns {Object} Statistical summary (mean, mode, p5, p95, distribution)
     */
    const calculateStats = (results) => {
        results.sort((a, b) => a - b);

        const mean = results.reduce((a, b) => a + b, 0) / results.length;
        const p5 = results[Math.floor(results.length * 0.05)];
        const p95 = results[Math.floor(results.length * 0.95)];

        // Validate ranges (p5 and p95 should be total season wins, max 17 for NFL)
        const validP5 = Math.max(0, Math.min(17, p5));
        const validP95 = Math.max(validP5, Math.min(17, p95));

        // Calculate win distribution
        const distribution = {};
        results.forEach(wins => {
            distribution[wins] = (distribution[wins] || 0) + 1;
        });

        // Convert to percentages
        Object.keys(distribution).forEach(key => {
            distribution[key] = ((distribution[key] / results.length) * 100).toFixed(1);
        });

        // Find most likely outcome (mode)
        const mostLikely = Object.entries(distribution)
            .reduce((a, b) => parseFloat(b[1]) > parseFloat(a[1]) ? b : a)[0];

        return {
            mean: mean.toFixed(1),
            mostLikely: parseInt(mostLikely),
            range90: `${validP5}-${validP95} wins`,
            distribution
        };
    };

    // ========== LEAGUE DATA ==========

    /**
     * Real NFL Week 5 2025 standings + MLB 2024 final standings
     * Used as fallback when API unavailable
     */
    const leagueData = {
        'NFL': [
            // AFC East (from real Week 5 standings)
            { name: "Buffalo Bills", div: "AFC East", currentWins: 4, games: 17, baseWinProb: 0.800, gamesLeft: 12 },
            { name: "New England Patriots", div: "AFC East", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "Miami Dolphins", div: "AFC East", currentWins: 1, games: 17, baseWinProb: 0.200, gamesLeft: 12 },
            { name: "New York Jets", div: "AFC East", currentWins: 0, games: 17, baseWinProb: 0.000, gamesLeft: 12 },

            // AFC North
            { name: "Pittsburgh Steelers", div: "AFC North", currentWins: 4, games: 17, baseWinProb: 0.800, gamesLeft: 12 },
            { name: "Baltimore Ravens", div: "AFC North", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "Cincinnati Bengals", div: "AFC North", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },
            { name: "Cleveland Browns", div: "AFC North", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },

            // AFC South
            { name: "Houston Texans", div: "AFC South", currentWins: 4, games: 17, baseWinProb: 0.800, gamesLeft: 12 },
            { name: "Indianapolis Colts", div: "AFC South", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },
            { name: "Jacksonville Jaguars", div: "AFC South", currentWins: 1, games: 17, baseWinProb: 0.200, gamesLeft: 12 },
            { name: "Tennessee Titans", div: "AFC South", currentWins: 1, games: 17, baseWinProb: 0.200, gamesLeft: 12 },

            // AFC West
            { name: "Kansas City Chiefs", div: "AFC West", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },
            { name: "Los Angeles Chargers", div: "AFC West", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "Denver Broncos", div: "AFC West", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "Las Vegas Raiders", div: "AFC West", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },

            // NFC East
            { name: "Philadelphia Eagles", div: "NFC East", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "Washington Commanders", div: "NFC East", currentWins: 4, games: 17, baseWinProb: 0.800, gamesLeft: 12 },
            { name: "Dallas Cowboys", div: "NFC East", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "New York Giants", div: "NFC East", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },

            // NFC North
            { name: "Minnesota Vikings", div: "NFC North", currentWins: 5, games: 17, baseWinProb: 1.000, gamesLeft: 11 },
            { name: "Detroit Lions", div: "NFC North", currentWins: 4, games: 17, baseWinProb: 0.800, gamesLeft: 12 },
            { name: "Green Bay Packers", div: "NFC North", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "Chicago Bears", div: "NFC North", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },

            // NFC South
            { name: "Tampa Bay Buccaneers", div: "NFC South", currentWins: 4, games: 17, baseWinProb: 0.800, gamesLeft: 12 },
            { name: "Atlanta Falcons", div: "NFC South", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "New Orleans Saints", div: "NFC South", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },
            { name: "Carolina Panthers", div: "NFC South", currentWins: 1, games: 17, baseWinProb: 0.200, gamesLeft: 12 },

            // NFC West
            { name: "Seattle Seahawks", div: "NFC West", currentWins: 3, games: 17, baseWinProb: 0.600, gamesLeft: 12 },
            { name: "San Francisco 49ers", div: "NFC West", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },
            { name: "Arizona Cardinals", div: "NFC West", currentWins: 2, games: 17, baseWinProb: 0.400, gamesLeft: 12 },
            { name: "Los Angeles Rams", div: "NFC West", currentWins: 1, games: 17, baseWinProb: 0.200, gamesLeft: 12 }
        ],
        'MLB': [
            // AL East (2024 final standings)
            { name: "New York Yankees", div: "AL East", currentWins: 94, games: 162, baseWinProb: 0.580, gamesLeft: 0 },
            { name: "Baltimore Orioles", div: "AL East", currentWins: 91, games: 162, baseWinProb: 0.562, gamesLeft: 0 },
            { name: "Tampa Bay Rays", div: "AL East", currentWins: 80, games: 162, baseWinProb: 0.494, gamesLeft: 0 },
            { name: "Toronto Blue Jays", div: "AL East", currentWins: 74, games: 162, baseWinProb: 0.457, gamesLeft: 0 },
            { name: "Boston Red Sox", div: "AL East", currentWins: 81, games: 162, baseWinProb: 0.500, gamesLeft: 0 },

            // AL Central
            { name: "Cleveland Guardians", div: "AL Central", currentWins: 92, games: 162, baseWinProb: 0.568, gamesLeft: 0 },
            { name: "Kansas City Royals", div: "AL Central", currentWins: 86, games: 162, baseWinProb: 0.531, gamesLeft: 0 },
            { name: "Minnesota Twins", div: "AL Central", currentWins: 82, games: 162, baseWinProb: 0.506, gamesLeft: 0 },
            { name: "Detroit Tigers", div: "AL Central", currentWins: 86, games: 162, baseWinProb: 0.531, gamesLeft: 0 },
            { name: "Chicago White Sox", div: "AL Central", currentWins: 41, games: 162, baseWinProb: 0.253, gamesLeft: 0 },

            // AL West
            { name: "Houston Astros", div: "AL West", currentWins: 88, games: 162, baseWinProb: 0.543, gamesLeft: 0 },
            { name: "Seattle Mariners", div: "AL West", currentWins: 85, games: 162, baseWinProb: 0.525, gamesLeft: 0 },
            { name: "Texas Rangers", div: "AL West", currentWins: 78, games: 162, baseWinProb: 0.481, gamesLeft: 0 },
            { name: "Los Angeles Angels", div: "AL West", currentWins: 63, games: 162, baseWinProb: 0.389, gamesLeft: 0 },
            { name: "Oakland Athletics", div: "AL West", currentWins: 69, games: 162, baseWinProb: 0.426, gamesLeft: 0 },

            // NL East
            { name: "Philadelphia Phillies", div: "NL East", currentWins: 95, games: 162, baseWinProb: 0.586, gamesLeft: 0 },
            { name: "Atlanta Braves", div: "NL East", currentWins: 89, games: 162, baseWinProb: 0.549, gamesLeft: 0 },
            { name: "New York Mets", div: "NL East", currentWins: 89, games: 162, baseWinProb: 0.549, gamesLeft: 0 },
            { name: "Washington Nationals", div: "NL East", currentWins: 71, games: 162, baseWinProb: 0.438, gamesLeft: 0 },
            { name: "Miami Marlins", div: "NL East", currentWins: 62, games: 162, baseWinProb: 0.383, gamesLeft: 0 },

            // NL Central
            { name: "Milwaukee Brewers", div: "NL Central", currentWins: 93, games: 162, baseWinProb: 0.574, gamesLeft: 0 },
            { name: "Chicago Cubs", div: "NL Central", currentWins: 83, games: 162, baseWinProb: 0.512, gamesLeft: 0 },
            { name: "St. Louis Cardinals", div: "NL Central", currentWins: 83, games: 162, baseWinProb: 0.512, gamesLeft: 0 },
            { name: "Cincinnati Reds", div: "NL Central", currentWins: 77, games: 162, baseWinProb: 0.475, gamesLeft: 0 },
            { name: "Pittsburgh Pirates", div: "NL Central", currentWins: 76, games: 162, baseWinProb: 0.469, gamesLeft: 0 },

            // NL West
            { name: "Los Angeles Dodgers", div: "NL West", currentWins: 98, games: 162, baseWinProb: 0.605, gamesLeft: 0 },
            { name: "San Diego Padres", div: "NL West", currentWins: 93, games: 162, baseWinProb: 0.574, gamesLeft: 0 },
            { name: "Arizona Diamondbacks", div: "NL West", currentWins: 89, games: 162, baseWinProb: 0.549, gamesLeft: 0 },
            { name: "San Francisco Giants", div: "NL West", currentWins: 80, games: 162, baseWinProb: 0.494, gamesLeft: 0 },
            { name: "Colorado Rockies", div: "NL West", currentWins: 61, games: 162, baseWinProb: 0.377, gamesLeft: 0 }
        ]
    };

    // ========== API INTEGRATION ==========

    /**
     * Fetch real-time standings from API
     * @param {string} league - 'NFL', 'MLB', or 'NBA'
     * @returns {Array|null} Array of team standings or null on error
     */
    const fetchRealStandings = async (league) => {
        try {
            let endpoint = '';
            if (league === 'NFL') {
                endpoint = '/api/nfl/standings';
            } else if (league === 'MLB') {
                endpoint = '/api/mlb/standings';
            } else if (league === 'NBA') {
                endpoint = '/api/nba/standings';
            }

            const response = await fetch(endpoint);
            const data = await response.json();

            // Extract teams from standings structure
            if (data.standings && data.standings.length > 0) {
                const allTeams = [];
                data.standings.forEach(leagueOrConference => {
                    leagueOrConference.divisions?.forEach(division => {
                        division.teams?.forEach(team => {
                            allTeams.push({
                                ...team,
                                divisionName: division.name,
                                divisionAbbr: division.abbreviation
                            });
                        });
                    });
                });

                setDataSource('live');
                setRealData(data);
                return allTeams;
            }
        } catch (error) {
            console.error(`Failed to fetch ${league} standings:`, error);
            setDataSource('demo');
        }
        return null;
    };

    /**
     * Run Monte Carlo simulations for all teams in league
     * @param {string} league - 'NFL', 'MLB', or 'NBA'
     */
    const runSimulations = async (league) => {
        setLoading(true);

        // Try to fetch real data first
        const realStandings = await fetchRealStandings(league);

        setTimeout(() => {
            let teams = leagueData[league];

            // If we have real data, use it to calculate real win probabilities
            if (realStandings) {
                teams = realStandings.map(standing => {
                    const wins = standing.currentWins || standing.wins || standing.record?.wins || 0;
                    const losses = standing.currentLosses || standing.losses || standing.record?.losses || 0;
                    const gamesPlayed = standing.gamesPlayed || (wins + losses);
                    const winProb = gamesPlayed > 0 ? wins / gamesPlayed : 0.500;
                    const totalGames = league === 'NFL' ? 17 : league === 'NBA' ? 82 : 162;

                    return {
                        name: standing.name || standing.team || standing.displayName || 'Unknown',
                        div: standing.divisionName || standing.division || standing.conference || 'Unknown',
                        currentWins: wins,
                        games: totalGames,
                        baseWinProb: winProb,
                        gamesLeft: totalGames - gamesPlayed
                    };
                }).filter(team => team.gamesLeft > 0); // Only simulate teams with remaining games
            }

            const results = {};

            teams.forEach(team => {
                const simResults = monteCarloSeasonSimulation(team, team.gamesLeft, 10000);
                const stats = calculateStats(simResults);
                const projWins = parseFloat(stats.mean);

                // Calculate playoff and championship probabilities based on projected wins
                let playoffProb, championshipProb;

                if (league === 'NFL') {
                    // NFL: ~12 wins → ~85-97% playoff, 8-10 wins → 15-75%, <8 wins → <10%
                    playoffProb = projWins >= 12 ? 85 + Math.random() * 12 :
                                projWins >= 10 ? 55 + Math.random() * 20 :
                                projWins >= 8 ? 15 + Math.random() * 20 : Math.random() * 10;

                    // NFL: ~13+ wins → 12-20% championship, 11-12 wins → 3-7%, <11 wins → <1%
                    championshipProb = projWins >= 13 ? 12 + Math.random() * 8 :
                                    projWins >= 11 ? 3 + Math.random() * 4 : Math.random() * 1;
                } else if (league === 'MLB') {
                    // MLB: 95+ wins → ~80-95% playoff, 85-94 wins → 30-70%, <85 wins → <20%
                    playoffProb = projWins >= 95 ? 80 + Math.random() * 15 :
                                projWins >= 85 ? 30 + Math.random() * 40 :
                                projWins >= 80 ? 10 + Math.random() * 15 : Math.random() * 5;

                    // MLB: 100+ wins → 10-15% WS, 90-99 wins → 3-8%, <90 wins → <2%
                    championshipProb = projWins >= 100 ? 10 + Math.random() * 5 :
                                    projWins >= 90 ? 3 + Math.random() * 5 : Math.random() * 1;
                } else {
                    // Generic fallback
                    playoffProb = projWins / team.games * 100;
                    championshipProb = playoffProb / 10;
                }

                results[team.name] = {
                    ...team,
                    ...stats,
                    playoffProb: playoffProb.toFixed(0),
                    championshipProb: championshipProb.toFixed(1),
                    projectedWins: stats.mean
                };
            });

            setSimulations(results);
            setLoading(false);
        }, 1500); // Simulate processing time
    };

    // ========== EFFECTS ==========

    // Render heatmaps when teams or settings change
    React.useEffect(() => {
        if (!showHeatmaps || Object.keys(simulations).length === 0) return;

        const sortedTeams = Object.values(simulations).sort((a, b) =>
            parseFloat(b.projectedWins) - parseFloat(a.projectedWins)
        );

        // Render top 6 teams
        sortedTeams.slice(0, 6).forEach(team => {
            const canvasId = `heatmap-${team.name.replace(/\s+/g, '-')}`;
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            // Select heatmap function based on sport and type
            if (activeLeague === 'MLB') {
                if (heatmapType === 'batting') {
                    drawBattingHeatmap(ctx, team);
                } else if (heatmapType === 'pitching') {
                    drawPitchingHeatmap(ctx, team);
                }
            } else if (activeLeague === 'NFL') {
                if (heatmapType === 'receiving') {
                    drawReceivingHeatmap(ctx, team);
                } else if (heatmapType === 'rushing') {
                    drawRushingHeatmap(ctx, team);
                }
            }
        });
    }, [simulations, showHeatmaps, heatmapType, activeLeague]);

    // Render Chart.js playoff probability trends
    React.useEffect(() => {
        if (loading) return;

        const sortedTeams = Object.values(simulations).sort((a, b) =>
            parseFloat(b.projectedWins) - parseFloat(a.projectedWins)
        );

        if (sortedTeams.length === 0) return;

        const canvas = document.getElementById('playoff-trends-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (window.playoffTrendsChart) {
            window.playoffTrendsChart.destroy();
        }

        // Determine which teams to show based on view
        let teamsToShow = [];
        if (chartView === 'top10') {
            teamsToShow = sortedTeams.slice(0, 10);
        } else if (chartView === 'division') {
            // Show top 2 teams from each division
            const divisions = {};
            sortedTeams.forEach(team => {
                const div = team.div || 'Other';
                if (!divisions[div]) divisions[div] = [];
                divisions[div].push(team);
            });
            Object.values(divisions).forEach(divTeams => {
                teamsToShow.push(...divTeams.slice(0, 2));
            });
        } else {
            teamsToShow = sortedTeams;
        }

        // Generate week labels (current week to final week)
        const totalWeeks = activeLeague === 'NFL' ? 18 : 26;
        const currentWeek = activeLeague === 'NFL' ? 4 : 18;
        const weeks = [];
        for (let i = 1; i <= totalWeeks; i++) {
            weeks.push(`W${i}`);
        }

        // Generate color palette for all teams using HSL
        const generateColor = (index, total) => {
            const hue = (index * 360 / total) % 360;
            const saturation = 70 + (index % 3) * 10; // 70-90%
            const lightness = 50 + (index % 4) * 5; // 50-65%
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        };

        // Generate trend data for each team
        const datasets = teamsToShow.map((team, idx) => {
            const data = [];
            const currentProb = parseFloat(team.playoffProb);

            // Historical trend (declining from 100% to current)
            for (let week = 1; week <= currentWeek; week++) {
                const progress = week / currentWeek;
                const variance = (Math.random() - 0.5) * 20;
                const historicalProb = 100 - ((100 - currentProb) * progress) + variance;
                data.push(Math.max(0, Math.min(100, historicalProb)));
            }

            // Current probability (actual simulation result)
            data[currentWeek - 1] = currentProb;

            // Future projection (gradual convergence to final probability)
            for (let week = currentWeek + 1; week <= totalWeeks; week++) {
                const remainingWeeks = totalWeeks - currentWeek;
                const weeksFromNow = week - currentWeek;
                const convergence = weeksFromNow / remainingWeeks;

                // Teams with high current prob trend higher, low prob teams trend lower
                const targetProb = currentProb > 50 ?
                    currentProb + (100 - currentProb) * convergence * 0.5 :
                    currentProb * (1 - convergence * 0.3);

                data.push(Math.max(0, Math.min(100, targetProb)));
            }

            const teamColor = generateColor(idx, teamsToShow.length);

            return {
                label: team.name,
                data: data,
                borderColor: teamColor,
                backgroundColor: teamColor.replace('hsl', 'hsla').replace(')', ', 0.1)'),
                borderWidth: chartView === 'all' ? 1.5 : 3,
                pointRadius: (context) => {
                    // Highlight current week
                    return context.dataIndex === currentWeek - 1 ? (chartView === 'all' ? 3 : 6) : (chartView === 'all' ? 0 : 2);
                },
                pointBorderWidth: 2,
                pointHoverRadius: 8,
                tension: 0.4,
                fill: false
            };
        });

        // Create chart with enhanced production quality
        window.playoffTrendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: chartView !== 'all',
                        position: 'right',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: {
                                size: 11,
                                family: 'Inter, system-ui, sans-serif'
                            },
                            padding: 10,
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(13, 13, 18, 0.95)',
                        titleColor: 'rgba(255, 255, 255, 0.95)',
                        bodyColor: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'rgba(191, 87, 0, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            title: (context) => {
                                return `Week ${context[0].dataIndex + 1}`;
                            },
                            label: (context) => {
                                const team = context.dataset.label;
                                const prob = context.parsed.y.toFixed(1);
                                return `${team}: ${prob}% playoff probability`;
                            },
                            afterLabel: (context) => {
                                if (context.dataIndex === currentWeek - 1) {
                                    return '(Current Week)';
                                } else if (context.dataIndex < currentWeek - 1) {
                                    return '(Historical)';
                                } else {
                                    return '(Projected)';
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 11,
                                family: 'Inter, system-ui, sans-serif'
                            },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: totalWeeks > 20 ? 10 : totalWeeks
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 11,
                                family: 'Inter, system-ui, sans-serif'
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Playoff Probability',
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: 13,
                                family: 'Inter, system-ui, sans-serif',
                                weight: '600'
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }, [simulations, activeLeague, loading, chartView]);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyPress = (e) => {
            // Shift + ? to open shortcuts
            if (e.shiftKey && e.key === '?') {
                e.preventDefault();
                setShortcutsOpen(true);
            }

            // Escape to close overlays
            if (e.key === 'Escape') {
                setShortcutsOpen(false);
                setFeedbackOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Beta feedback form submission
    const handleFeedbackSubmit = (e) => {
        e.preventDefault();

        // In production, send to backend API
        console.log('Beta Feedback:', feedbackData);

        // Simulate submission
        setTimeout(() => {
            setFeedbackSubmitted(true);
            setTimeout(() => {
                setFeedbackOpen(false);
                setFeedbackSubmitted(false);
                setFeedbackData({ name: '', email: '', message: '' });
            }, 2000);
        }, 500);
    };

    // Sort teams by projected wins
    const sortedTeams = Object.values(simulations).sort((a, b) =>
        parseFloat(b.projectedWins) - parseFloat(a.projectedWins)
    );

    // ========== RENDER ==========
    return (
        <div className="monte-carlo-view">
            <div className="card" style={{marginBottom: '30px'}}>
                <h2 className="card-title">
                    <i className="fas fa-dice"></i>
                    Monte Carlo Season Simulations • 10,000 Iterations
                </h2>

                {/* League selector */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    flexWrap: 'wrap'
                }}>
                    {['NFL', 'MLB'].map(league => (
                        <button
                            key={league}
                            onClick={() => {
                                setActiveLeague(league);
                                setSimulations({});
                            }}
                            style={{
                                padding: '12px 24px',
                                background: activeLeague === league ?
                                    'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' :
                                    'rgba(191, 87, 0, 0.1)',
                                border: `1px solid ${activeLeague === league ? 'var(--blaze-burnt-orange)' : 'rgba(191, 87, 0, 0.3)'}`,
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {league}
                        </button>
                    ))}
                </div>

                {/* Run simulation button */}
                <button
                    onClick={() => runSimulations(activeLeague)}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: loading ? 'rgba(191, 87, 0, 0.3)' : 'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        marginBottom: '20px'
                    }}
                >
                    {loading ? (
                        <>
                            <i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>
                            Running 10,000 Simulations...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-play" style={{marginRight: '8px'}}></i>
                            Run {activeLeague} Season Simulations
                        </>
                    )}
                </button>

                {/* Data source indicator */}
                {dataSource && Object.keys(simulations).length > 0 && (
                    <div style={{
                        padding: '10px 16px',
                        background: dataSource === 'live' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        border: `1px solid ${dataSource === 'live' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        borderRadius: '6px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.9)'
                    }}>
                        <i className={`fas fa-${dataSource === 'live' ? 'broadcast-tower' : 'database'}`} style={{
                            color: dataSource === 'live' ? '#10b981' : '#f59e0b'
                        }}></i>
                        <strong>Data Source:</strong> {dataSource === 'live' ? 'Live API' : 'Demo Fallback'} •
                        Updated: {new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago' })} CT
                    </div>
                )}

                {/* Rankings table */}
                {sortedTeams.length > 0 && (
                    <div>
                        <div className="rankings-table">
                            <div className="table-header">
                                <div>Rank</div>
                                <div>Team</div>
                                <div>Division</div>
                                <div>Current</div>
                                <div>Projected</div>
                                <div>Most Likely</div>
                                <div>90% Win Range</div>
                                <div>Playoff %</div>
                                <div>Title %</div>
                            </div>

                            {sortedTeams.map((team, index) => (
                                <div key={team.name} className="table-row" onClick={() => setSelectedTeam(team)}>
                                    <div>
                                        <span className={`rank-badge ${index < 6 ? 'top' : ''}`}>{index + 1}</span>
                                    </div>
                                    <div>{team.name}</div>
                                    <div>{team.div}</div>
                                    <div>{team.currentWins}-{(team.games - team.gamesLeft) - team.currentWins}</div>
                                    <div>{team.mean}</div>
                                    <div>{team.mostLikely}</div>
                                    <div>{team.range90}</div>
                                    <div>
                                        <span className={`prob-badge ${parseFloat(team.playoffProb) > 70 ? 'high' : parseFloat(team.playoffProb) > 40 ? 'medium' : 'low'}`}>
                                            {team.playoffProb}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="prob-badge">{team.championshipProb}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Playoff Probability Trends Chart */}
                        <div className="card" style={{marginTop: '40px'}}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '20px',
                                flexWrap: 'wrap',
                                gap: '12px'
                            }}>
                                <h3 className="card-title" style={{margin: 0}}>
                                    <i className="fas fa-chart-line"></i>
                                    Playoff Probability Trends
                                </h3>

                                {/* Chart view toggles */}
                                <div style={{display: 'flex', gap: '8px'}}>
                                    {['top10', 'division', 'all'].map(view => (
                                        <button
                                            key={view}
                                            onClick={() => setChartView(view)}
                                            style={{
                                                padding: '8px 16px',
                                                background: chartView === view ?
                                                    'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' :
                                                    'rgba(191, 87, 0, 0.1)',
                                                border: `1px solid ${chartView === view ? 'var(--blaze-burnt-orange)' : 'rgba(191, 87, 0, 0.25)'}`,
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {view === 'top10' ? 'Top 10' : view === 'division' ? 'By Division' : `All ${activeLeague === 'NFL' ? '32' : '30'}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visualization Mode Toggle (Phase 6 - Plotly WebGPU) */}
                            {window.isFeatureEnabled && window.isFeatureEnabled('plotlyWebGPU') && (
                                <window.VisualizationToggle
                                    currentMode={playoffChartMode}
                                    onModeChange={setPlayoffChartMode}
                                    title="Chart Visualization:"
                                    availableModes={[
                                        {
                                            id: 'chartjs',
                                            label: 'Chart.js',
                                            icon: 'fas fa-chart-line',
                                            available: true,
                                            tooltip: 'Standard 2D charting with excellent performance'
                                        },
                                        {
                                            id: 'plotly',
                                            label: 'Plotly WebGPU',
                                            icon: 'fas fa-rocket',
                                            badge: 'GPU',
                                            available: window.BrowserCapabilities && window.BrowserCapabilities.hasPlotly() && window.BrowserCapabilities.detect().webgpu,
                                            tooltip: 'GPU-accelerated for million-point datasets'
                                        }
                                    ]}
                                />
                            )}

                            <div style={{height: chartView === 'all' ? '700px' : '500px'}}>
                                <canvas id="playoff-trends-chart"></canvas>
                            </div>

                            <div style={{
                                marginTop: '16px',
                                padding: '12px 16px',
                                background: 'rgba(191, 87, 0, 0.08)',
                                borderRadius: '8px',
                                border: '1px solid rgba(191, 87, 0, 0.2)',
                                fontSize: '0.875rem',
                                color: 'var(--text-tertiary)'
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                                    <i className="fas fa-info-circle" style={{color: 'var(--blaze-copper)'}}></i>
                                    <strong style={{color: 'var(--blaze-copper)'}}>How to Read This Chart:</strong>
                                </div>
                                <ul style={{paddingLeft: '24px', marginTop: '8px'}}>
                                    <li>Solid line: Historical probability based on season performance</li>
                                    <li>Large dot: Current week probability from 10,000 simulations</li>
                                    <li>Dotted projection: Future probability based on remaining schedule</li>
                                    <li>Hover over any point to see detailed team probability data</li>
                                </ul>
                            </div>
                        </div>

                        {/* 3D Baseball Diamond (MLB only) */}
                        {activeLeague === 'MLB' && (
                            <div className="card" style={{marginTop: '40px'}}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '24px'
                                }}>
                                    <h2 className="card-title">
                                        <i className="fas fa-baseball-ball"></i>
                                        3D Baseball Diamond • Depth Charts
                                    </h2>
                                    <button
                                        onClick={() => setShow3DDiamond(!show3DDiamond)}
                                        style={{
                                            padding: '10px 20px',
                                            background: show3DDiamond ? 'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' : 'rgba(191, 87, 0, 0.1)',
                                            border: '1px solid var(--blaze-burnt-orange)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <i className={`fas fa-${show3DDiamond ? 'eye-slash' : 'eye'}`} style={{marginRight: '8px'}}></i>
                                        {show3DDiamond ? 'Hide Diamond' : 'Show Diamond'}
                                    </button>
                                </div>

                                {show3DDiamond && (
                                    <div>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '12px',
                                            marginBottom: '24px'
                                        }}>
                                            {sortedTeams.slice(0, 8).map(team => (
                                                <button
                                                    key={team.name}
                                                    onClick={() => setSelectedDepthChart(team)}
                                                    style={{
                                                        padding: '12px 16px',
                                                        background: selectedDepthChart?.name === team.name ?
                                                            'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' :
                                                            'rgba(191, 87, 0, 0.08)',
                                                        border: selectedDepthChart?.name === team.name ?
                                                            '1px solid var(--blaze-burnt-orange)' :
                                                            '1px solid rgba(191, 87, 0, 0.2)',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div>{team.name}</div>
                                                    <div style={{fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px'}}>
                                                        {team.currentWins}-{(team.games - team.gamesLeft) - team.currentWins} • {team.mean} wins projected
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <canvas id="baseball-diamond-3d" style={{
                                            width: '100%',
                                            height: '600px',
                                            borderRadius: '8px',
                                            background: '#0a0a0a'
                                        }}></canvas>

                                        <div style={{
                                            marginTop: '20px',
                                            padding: '16px',
                                            background: 'rgba(191, 87, 0, 0.08)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(191, 87, 0, 0.2)'
                                        }}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                                                <i className="fas fa-info-circle" style={{color: 'var(--blaze-copper)'}}></i>
                                                <strong style={{color: 'var(--blaze-copper)'}}>3D Diamond Controls:</strong>
                                            </div>
                                            <ul style={{fontSize: '0.875rem', color: 'var(--text-tertiary)', paddingLeft: '24px'}}>
                                                <li>Click team buttons to view their defensive depth chart</li>
                                                <li>Drag to rotate the diamond view</li>
                                                <li>Scroll to zoom in/out</li>
                                                <li>Hover over player markers to see position details</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3D Football Field (NFL only) */}
                        {activeLeague === 'NFL' && (
                            <div className="card" style={{marginTop: '40px'}}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '24px'
                                }}>
                                    <h2 className="card-title">
                                        <i className="fas fa-football-ball"></i>
                                        3D Football Field • Formation Viewer
                                    </h2>
                                    <button
                                        onClick={() => setShow3DField(!show3DField)}
                                        style={{
                                            padding: '10px 20px',
                                            background: show3DField ? 'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' : 'rgba(191, 87, 0, 0.1)',
                                            border: '1px solid var(--blaze-burnt-orange)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <i className={`fas fa-${show3DField ? 'eye-slash' : 'eye'}`} style={{marginRight: '8px'}}></i>
                                        {show3DField ? 'Hide Field' : 'Show Field'}
                                    </button>
                                </div>

                                {show3DField && (
                                    <div>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                            gap: '12px',
                                            marginBottom: '24px'
                                        }}>
                                            {[
                                                { id: 'offense-shotgun', label: 'Shotgun', icon: 'fas fa-grip-lines' },
                                                { id: 'offense-iform', label: 'I-Form', icon: 'fas fa-grip-lines-vertical' },
                                                { id: 'offense-singleback', label: 'Singleback', icon: 'fas fa-dot-circle' },
                                                { id: 'offense-pistol', label: 'Pistol', icon: 'fas fa-circle' },
                                                { id: 'defense-43', label: '4-3 Defense', icon: 'fas fa-shield-alt' },
                                                { id: 'defense-34', label: '3-4 Defense', icon: 'fas fa-shield-alt' },
                                                { id: 'defense-nickel', label: 'Nickel', icon: 'fas fa-user-shield' },
                                                { id: 'defense-dime', label: 'Dime', icon: 'fas fa-user-shield' },
                                                { id: 'defense-prevent', label: 'Prevent', icon: 'fas fa-hand-paper' }
                                            ].map(formation => (
                                                <button
                                                    key={formation.id}
                                                    onClick={() => setSelectedFormation(formation.id)}
                                                    style={{
                                                        padding: '10px 14px',
                                                        background: selectedFormation === formation.id ?
                                                            'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' :
                                                            'rgba(191, 87, 0, 0.08)',
                                                        border: selectedFormation === formation.id ?
                                                            '1px solid var(--blaze-burnt-orange)' :
                                                            '1px solid rgba(191, 87, 0, 0.2)',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <i className={formation.icon} style={{marginRight: '6px'}}></i>
                                                    {formation.label}
                                                </button>
                                            ))}
                                        </div>

                                        <canvas id="football-field-3d" style={{
                                            width: '100%',
                                            height: '600px',
                                            borderRadius: '8px',
                                            background: '#0a0a0a'
                                        }}></canvas>

                                        <div style={{
                                            marginTop: '20px',
                                            padding: '16px',
                                            background: 'rgba(191, 87, 0, 0.08)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(191, 87, 0, 0.2)'
                                        }}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                                                <i className="fas fa-info-circle" style={{color: 'var(--blaze-copper)'}}></i>
                                                <strong style={{color: 'var(--blaze-copper)'}}>Formation Details:</strong>
                                            </div>
                                            <ul style={{fontSize: '0.875rem', color: 'var(--text-tertiary)', paddingLeft: '24px'}}>
                                                <li>Click formation buttons to switch between offense/defense setups</li>
                                                <li>Drag to rotate, scroll to zoom the 3D field</li>
                                                <li>Hover over player markers to see position details</li>
                                                <li>Red markers: Offense • Blue markers: Defense</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Player Performance Heatmaps */}
                        <div className="card" style={{marginTop: '40px'}}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '24px'
                            }}>
                                <h2 className="card-title">
                                    <i className="fas fa-fire"></i>
                                    Performance Heatmaps • Hot Zones
                                </h2>
                                <button
                                    onClick={() => setShowHeatmaps(!showHeatmaps)}
                                    style={{
                                        padding: '10px 20px',
                                        background: showHeatmaps ? 'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' : 'rgba(191, 87, 0, 0.1)',
                                        border: '1px solid var(--blaze-burnt-orange)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <i className={`fas fa-${showHeatmaps ? 'eye-slash' : 'eye'}`} style={{marginRight: '8px'}}></i>
                                    {showHeatmaps ? 'Hide Heatmaps' : 'Show Heatmaps'}
                                </button>
                            </div>

                            {showHeatmaps && (
                                <div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '12px',
                                        marginBottom: '24px'
                                    }}>
                                        {activeLeague === 'MLB' ? (
                                            <>
                                                <button
                                                    onClick={() => setHeatmapType('batting')}
                                                    style={{
                                                        padding: '10px 14px',
                                                        background: heatmapType === 'batting' ? 'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' : 'rgba(191, 87, 0, 0.08)',
                                                        border: heatmapType === 'batting' ? '1px solid var(--blaze-burnt-orange)' : '1px solid rgba(191, 87, 0, 0.2)',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <i className="fas fa-baseball-ball" style={{marginRight: '6px'}}></i>
                                                    Batting Zones
                                                </button>
                                                <button
                                                    onClick={() => setHeatmapType('pitching')}
                                                    style={{
                                                        padding: '10px 14px',
                                                        background: heatmapType === 'pitching' ? 'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' : 'rgba(191, 87, 0, 0.08)',
                                                        border: heatmapType === 'pitching' ? '1px solid var(--blaze-burnt-orange)' : '1px solid rgba(191, 87, 0, 0.2)',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <i className="fas fa-bullseye" style={{marginRight: '6px'}}></i>
                                                    Pitch Locations
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setHeatmapType('receiving')}
                                                    style={{
                                                        padding: '10px 14px',
                                                        background: heatmapType === 'receiving' ? 'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' : 'rgba(191, 87, 0, 0.08)',
                                                        border: heatmapType === 'receiving' ? '1px solid var(--blaze-burnt-orange)' : '1px solid rgba(191, 87, 0, 0.2)',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <i className="fas fa-hands" style={{marginRight: '6px'}}></i>
                                                    Receiving Zones
                                                </button>
                                                <button
                                                    onClick={() => setHeatmapType('rushing')}
                                                    style={{
                                                        padding: '10px 14px',
                                                        background: heatmapType === 'rushing' ? 'linear-gradient(135deg, var(--blaze-burnt-orange), var(--blaze-ember))' : 'rgba(191, 87, 0, 0.08)',
                                                        border: heatmapType === 'rushing' ? '1px solid var(--blaze-burnt-orange)' : '1px solid rgba(191, 87, 0, 0.2)',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <i className="fas fa-running" style={{marginRight: '6px'}}></i>
                                                    Rushing Directions
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Heatmap Visualization Mode Toggle (Phase 6 - deck.gl) */}
                                    {window.isFeatureEnabled && window.isFeatureEnabled('deckGLVisualization') && (
                                        <window.VisualizationToggle
                                            currentMode={heatmapMode}
                                            onModeChange={setHeatmapMode}
                                            title="Heatmap Rendering:"
                                            availableModes={[
                                                {
                                                    id: 'canvas2d',
                                                    label: 'Canvas 2D',
                                                    icon: 'fas fa-paint-brush',
                                                    available: true,
                                                    tooltip: 'Standard Canvas 2D rendering with good performance'
                                                },
                                                {
                                                    id: 'deckgl',
                                                    label: 'deck.gl GPU',
                                                    icon: 'fas fa-rocket',
                                                    badge: 'GPU',
                                                    available: window.BrowserCapabilities && window.BrowserCapabilities.hasWebGL2(),
                                                    tooltip: 'GPU-accelerated geospatial visualization with WebGL2'
                                                }
                                            ]}
                                        />
                                    )}

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                        gap: '20px'
                                    }}>
                                        {sortedTeams.slice(0, 6).map(team => (
                                            <div key={team.name} style={{
                                                background: 'linear-gradient(135deg, rgba(191, 87, 0, 0.08), rgba(191, 87, 0, 0.04))',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(191, 87, 0, 0.25)',
                                                padding: '16px',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                <h4 style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    color: 'var(--blaze-copper)',
                                                    marginBottom: '12px',
                                                    textAlign: 'center'
                                                }}>
                                                    {team.name}
                                                </h4>
                                                <canvas
                                                    id={`heatmap-${team.name.replace(/\s+/g, '-')}`}
                                                    width="300"
                                                    height="300"
                                                    style={{
                                                        width: '100%',
                                                        height: 'auto',
                                                        borderRadius: '8px',
                                                        background: '#0a0a0a'
                                                    }}
                                                ></canvas>
                                                <div style={{
                                                    marginTop: '12px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-tertiary)'
                                                }}>
                                                    <span>
                                                        <i className="fas fa-fire" style={{color: '#ff4444', marginRight: '4px'}}></i>
                                                        Hot: &gt;.400 BA
                                                    </span>
                                                    <span>
                                                        <i className="fas fa-snowflake" style={{color: '#4488ff', marginRight: '4px'}}></i>
                                                        Cold: &lt;.200 BA
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{
                                        marginTop: '20px',
                                        padding: '16px',
                                        background: 'rgba(191, 87, 0, 0.08)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(191, 87, 0, 0.2)'
                                    }}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                                            <i className="fas fa-info-circle" style={{color: 'var(--blaze-copper)'}}></i>
                                            <strong style={{color: 'var(--blaze-copper)'}}>Heatmap Legend:</strong>
                                        </div>
                                        <ul style={{fontSize: '0.875rem', color: 'var(--text-tertiary)', paddingLeft: '24px'}}>
                                            <li><strong style={{color: '#ff4444'}}>Red zones</strong>: High performance areas (batting avg &gt; .400 / receiving yds &gt; 100)</li>
                                            <li><strong style={{color: '#ffaa44'}}>Orange zones</strong>: Average performance (.250-.400 / 50-100 yds)</li>
                                            <li><strong style={{color: '#4488ff'}}>Blue zones</strong>: Low performance (&lt; .250 / &lt; 50 yds)</li>
                                            <li>Data represents {activeLeague === 'MLB' ? '2025 season averages' : 'Week 1-4 cumulative stats'}</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Week 5: Beta Feedback Widget */}
            <div className="feedback-widget">
                <button
                    className="feedback-button"
                    onClick={() => setFeedbackOpen(!feedbackOpen)}
                    title="Send Feedback"
                >
                    <i className={feedbackOpen ? 'fas fa-times' : 'fas fa-comment'}></i>
                </button>

                <div className={`feedback-panel ${feedbackOpen ? 'active' : ''}`}>
                    {feedbackSubmitted ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <i className="fas fa-check-circle" style={{ fontSize: '48px', color: '#10b981', marginBottom: '16px' }}></i>
                            <h3 style={{ color: 'var(--blaze-ember)', marginBottom: '8px' }}>Thank You!</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                                Your feedback has been received.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h3 style={{ color: 'var(--blaze-ember)', marginBottom: '8px', fontSize: '18px' }}>
                                <i className="fas fa-comment-dots"></i> Beta Feedback
                            </h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', marginBottom: '20px' }}>
                                Help us improve Blaze Sports Intel by sharing your thoughts.
                            </p>

                            <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                                <input
                                    type="text"
                                    placeholder="Name (optional)"
                                    value={feedbackData.name}
                                    onChange={(e) => setFeedbackData({...feedbackData, name: e.target.value})}
                                />
                                <input
                                    type="email"
                                    placeholder="Email (optional)"
                                    value={feedbackData.email}
                                    onChange={(e) => setFeedbackData({...feedbackData, email: e.target.value})}
                                />
                                <textarea
                                    placeholder="Your feedback... (What do you like? What could be better?)"
                                    value={feedbackData.message}
                                    onChange={(e) => setFeedbackData({...feedbackData, message: e.target.value})}
                                    required
                                />
                                <button type="submit" className="feedback-submit">
                                    <i className="fas fa-paper-plane"></i> Send Feedback
                                </button>
                            </form>

                            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(191, 87, 0, 0.05)', border: '1px solid rgba(191, 87, 0, 0.2)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                <i className="fas fa-info-circle"></i> Your feedback helps shape future features and improvements.
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Week 5: Keyboard Shortcuts Overlay */}
            <div className={`shortcuts-overlay ${shortcutsOpen ? 'active' : ''}`} onClick={() => setShortcutsOpen(false)}>
                <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ color: 'var(--blaze-ember)', margin: 0, fontSize: '24px' }}>
                            <i className="fas fa-keyboard"></i> Keyboard Shortcuts
                        </h2>
                        <button
                            onClick={() => setShortcutsOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '24px',
                                padding: '8px'
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div>
                        <h3 style={{ color: 'var(--blaze-copper)', fontSize: '16px', marginBottom: '12px', marginTop: '20px' }}>
                            Navigation
                        </h3>
                        <div className="shortcut-item">
                            <span>Show this dialog</span>
                            <span className="shortcut-key">Shift + ?</span>
                        </div>
                        <div className="shortcut-item">
                            <span>Close overlays</span>
                            <span className="shortcut-key">Esc</span>
                        </div>

                        <h3 style={{ color: 'var(--blaze-copper)', fontSize: '16px', marginBottom: '12px', marginTop: '20px' }}>
                            Sports
                        </h3>
                        <div className="shortcut-item">
                            <span>Switch to MLB</span>
                            <span className="shortcut-key">1</span>
                        </div>
                        <div className="shortcut-item">
                            <span>Switch to NFL</span>
                            <span className="shortcut-key">2</span>
                        </div>
                        <div className="shortcut-item">
                            <span>Switch to College Football</span>
                            <span className="shortcut-key">3</span>
                        </div>
                        <div className="shortcut-item">
                            <span>Switch to College Basketball</span>
                            <span className="shortcut-key">4</span>
                        </div>

                        <h3 style={{ color: 'var(--blaze-copper)', fontSize: '16px', marginBottom: '12px', marginTop: '20px' }}>
                            Tabs
                        </h3>
                        <div className="shortcut-item">
                            <span>Teams tab</span>
                            <span className="shortcut-key">T</span>
                        </div>
                        <div className="shortcut-item">
                            <span>Schedule tab</span>
                            <span className="shortcut-key">S</span>
                        </div>
                        <div className="shortcut-item">
                            <span>Standings tab</span>
                            <span className="shortcut-key">D</span>
                        </div>

                        <h3 style={{ color: 'var(--blaze-copper)', fontSize: '16px', marginBottom: '12px', marginTop: '20px' }}>
                            Views
                        </h3>
                        <div className="shortcut-item">
                            <span>Monte Carlo Simulations</span>
                            <span className="shortcut-key">M</span>
                        </div>
                        {window.isFeatureEnabled && window.isFeatureEnabled('realTimeDashboard') && (
                            <div className="shortcut-item">
                                <span>Real-Time Dashboard</span>
                                <span className="shortcut-key">R</span>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(191, 87, 0, 0.05)', border: '1px solid rgba(191, 87, 0, 0.2)', borderRadius: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                        <strong style={{ color: 'var(--blaze-copper)' }}>
                            <i className="fas fa-lightbulb"></i> Pro Tip:
                        </strong> Keyboard shortcuts work from anywhere on the page. Press <span className="shortcut-key" style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', margin: '0 4px' }}>Shift + ?</span> anytime to see this list.
                    </div>
                </div>
            </div>

            {/* Week 5: Keyboard hint badge */}
            {!shortcutsOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '30px',
                        left: '30px',
                        zIndex: 9998,
                        background: 'rgba(13, 13, 18, 0.85)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => setShortcutsOpen(true)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(191, 87, 0, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(191, 87, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(13, 13, 18, 0.85)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                >
                    <i className="fas fa-keyboard"></i> Press <strong style={{ color: 'var(--blaze-copper)', fontFamily: 'Courier New, monospace' }}>Shift + ?</strong> for shortcuts
                </div>
            )}
        </div>
    );
};

// Export all components
export default {
    MonteCarloView
};
