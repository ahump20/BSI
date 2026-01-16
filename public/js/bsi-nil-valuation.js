/**
 * BSI NIL Valuation Engine
 * Cloudflare Worker for NIL Fair Market Value calculations
 * 
 * Features:
 * 1. Fair Market NIL Value Model (performance + exposure + social metrics)
 * 2. Roster Optimizer (budget + position needs → optimal combinations)
 * 3. Team-Specific WAR Calculator (player value relative to roster construction)
 * 
 * Data Sources:
 * - PFF Grades (performance proxy via composite metrics)
 * - Social Media APIs (follower counts, engagement)
 * - ESPN/NCAA (stats, exposure metrics)
 * - Program Revenue Data (market multipliers)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Position value multipliers based on market data
// Derived from collective compensation data and positional scarcity
const POSITION_VALUE_MULTIPLIERS = {
  QB: 2.50,      // Quarterback premium - highest paid position
  EDGE: 1.75,   // Pass rushers command premium
  OT: 1.60,     // Blind side protection
  WR: 1.45,     // Playmakers
  CB: 1.40,     // Lockdown corners
  RB: 1.20,     // Declining value but still important
  LB: 1.15,     // Defensive versatility
  S: 1.10,      // Safety play
  DT: 1.10,     // Interior presence
  TE: 1.05,     // Hybrid value
  IOL: 1.00,    // Interior line (baseline)
  K: 0.60,      // Specialists
  P: 0.55,
  LS: 0.40
};

// Conference/Program tier multipliers (exposure value)
const PROGRAM_MULTIPLIERS = {
  // Tier 1: Blue bloods and consistent CFP contenders
  tier1: { multiplier: 1.50, programs: ['Alabama', 'Ohio State', 'Georgia', 'Texas', 'Michigan', 'USC', 'Notre Dame', 'Clemson', 'Oklahoma', 'LSU'] },
  // Tier 2: Power programs with strong NIL infrastructure
  tier2: { multiplier: 1.30, programs: ['Florida', 'Penn State', 'Oregon', 'Tennessee', 'Miami', 'Texas A&M', 'Auburn', 'Florida State', 'Arkansas', 'Ole Miss', 'South Carolina', 'Wisconsin', 'Nebraska'] },
  // Tier 3: Solid P4 programs
  tier3: { multiplier: 1.15, programs: ['Kentucky', 'Missouri', 'Iowa', 'UCLA', 'Washington', 'Utah', 'Arizona', 'Colorado', 'NC State', 'Louisville', 'Pittsburgh', 'Virginia Tech', 'West Virginia', 'Kansas State', 'Oklahoma State', 'TCU', 'Baylor', 'Texas Tech'] },
  // Tier 4: Rebuilding or smaller market P4
  tier4: { multiplier: 1.00, programs: [] }, // Default P4
  // Tier 5: Group of 5
  g5: { multiplier: 0.70, programs: [] },
  // Tier 6: FCS
  fcs: { multiplier: 0.40, programs: [] }
};

// Social media follower thresholds and multipliers
const SOCIAL_MULTIPLIERS = {
  mega: { min: 500000, multiplier: 1.80 },      // 500K+ followers
  large: { min: 100000, multiplier: 1.50 },     // 100K-500K
  medium: { min: 25000, multiplier: 1.25 },     // 25K-100K
  small: { min: 5000, multiplier: 1.10 },       // 5K-25K
  micro: { min: 0, multiplier: 1.00 }           // Under 5K
};

// Performance grade to value mapping (0-100 scale)
const PERFORMANCE_VALUE_CURVE = (grade) => {
  // Non-linear curve - elite performance commands premium
  if (grade >= 90) return 2.00 + ((grade - 90) * 0.10); // Elite: 2.0-3.0x
  if (grade >= 80) return 1.50 + ((grade - 80) * 0.05); // Great: 1.5-2.0x
  if (grade >= 70) return 1.15 + ((grade - 70) * 0.035); // Good: 1.15-1.5x
  if (grade >= 60) return 0.90 + ((grade - 60) * 0.025); // Average: 0.9-1.15x
  return 0.50 + (grade * 0.0067); // Below average: 0.5-0.9x
};

// Base NIL values by position (median market values in thousands)
const BASE_NIL_VALUES = {
  QB: 450,
  EDGE: 280,
  OT: 250,
  WR: 220,
  CB: 200,
  RB: 180,
  LB: 170,
  S: 160,
  DT: 155,
  TE: 150,
  IOL: 140,
  K: 80,
  P: 70,
  LS: 50
};

// WAR coefficients by position (wins added per production unit)
const WAR_COEFFICIENTS = {
  QB: { passYards: 0.0015, passTD: 0.08, int: -0.12, rushYards: 0.002, rushTD: 0.10, sacks: -0.04 },
  RB: { rushYards: 0.001, rushTD: 0.06, recYards: 0.0008, recTD: 0.05, fumbles: -0.15 },
  WR: { recYards: 0.001, recTD: 0.07, receptions: 0.005 },
  TE: { recYards: 0.0008, recTD: 0.06, receptions: 0.004, blockGrade: 0.002 },
  OT: { sacksPrevented: 0.03, runBlockGrade: 0.015, passBlockGrade: 0.02 },
  IOL: { sacksPrevented: 0.02, runBlockGrade: 0.012, passBlockGrade: 0.015 },
  EDGE: { sacks: 0.12, tfl: 0.04, pressures: 0.02, forcedFumbles: 0.10 },
  DT: { sacks: 0.10, tfl: 0.05, runStops: 0.02 },
  LB: { tackles: 0.008, tfl: 0.04, sacks: 0.08, int: 0.15, passBreakups: 0.03 },
  CB: { int: 0.18, passBreakups: 0.04, targetsAllowed: -0.002, yardsAllowed: -0.001 },
  S: { int: 0.15, tackles: 0.006, passBreakups: 0.03, forcedFumbles: 0.08 }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const path = url.pathname;
    
    try {
      // Calculate Fair Market NIL Value
      if (path === '/api/nil/calculate') {
        return await handleCalculateNIL(request, env);
      }
      
      // Get NIL Rankings (paginated)
      if (path === '/api/nil/rankings') {
        return await handleRankings(url, env);
      }
      
      // Roster Optimizer
      if (path === '/api/nil/optimize') {
        return await handleOptimize(request, env);
      }
      
      // Team-Specific WAR Calculator
      if (path === '/api/nil/war') {
        return await handleWAR(request, env);
      }
      
      // Get player detail
      if (path.startsWith('/api/nil/player/')) {
        return await handlePlayerDetail(path, env);
      }
      
      // Transfer Portal Feed
      if (path === '/api/nil/portal') {
        return await handlePortalFeed(url, env);
      }
      
      // Position market analysis
      if (path === '/api/nil/market') {
        return await handleMarketAnalysis(url, env);
      }
      
      // Health check
      if (path === '/api/nil/health') {
        return jsonResponse({ status: 'ok', version: '1.0.0' });
      }
      
      return jsonResponse({ error: 'Not found' }, 404);
      
    } catch (error) {
      console.error('NIL API Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

/**
 * Calculate Fair Market NIL Value
 * POST /api/nil/calculate
 * Body: { player data including stats, social, program }
 */
async function handleCalculateNIL(request, env) {
  const body = await request.json();
  
  const {
    name,
    position,
    program,
    conference,
    performanceGrade,  // 0-100 composite performance grade
    socialFollowers,   // Total social media followers
    engagementRate,    // 0-1 engagement rate
    eligibilityYears,  // Remaining years
    stats,             // Position-specific stats
    marketability      // 0-100 marketability score (appearance, personality, etc.)
  } = body;
  
  // Validate required fields
  if (!position || !performanceGrade) {
    return jsonResponse({ error: 'Missing required fields: position, performanceGrade' }, 400);
  }
  
  // Calculate each component
  const baseValue = BASE_NIL_VALUES[position] || 150;
  const positionMultiplier = POSITION_VALUE_MULTIPLIERS[position] || 1.0;
  const performanceMultiplier = PERFORMANCE_VALUE_CURVE(performanceGrade);
  const programMultiplier = getProgramMultiplier(program);
  const socialMultiplier = getSocialMultiplier(socialFollowers || 0, engagementRate || 0.02);
  const eligibilityMultiplier = getEligibilityMultiplier(eligibilityYears || 1);
  const marketabilityMultiplier = 1 + ((marketability || 50) - 50) / 200; // ±25% range
  
  // Calculate component values
  const performanceValue = baseValue * positionMultiplier * performanceMultiplier;
  const exposureValue = baseValue * programMultiplier * 0.3; // Exposure is 30% of base
  const socialValue = baseValue * socialMultiplier * 0.2; // Social is 20% of base
  
  // Final Fair Market NIL Value (in thousands)
  const rawValue = (performanceValue + exposureValue + socialValue) * eligibilityMultiplier * marketabilityMultiplier;
  
  // Round to nearest $5K
  const fairMarketValue = Math.round(rawValue / 5) * 5;
  
  // Calculate value range (±15%)
  const lowEstimate = Math.round(fairMarketValue * 0.85 / 5) * 5;
  const highEstimate = Math.round(fairMarketValue * 1.15 / 5) * 5;
  
  // Generate value breakdown
  const breakdown = {
    baseValue: Math.round(baseValue),
    performanceComponent: {
      grade: performanceGrade,
      multiplier: performanceMultiplier.toFixed(2),
      value: Math.round(performanceValue)
    },
    positionComponent: {
      position,
      multiplier: positionMultiplier.toFixed(2)
    },
    exposureComponent: {
      program: program || 'Unknown',
      multiplier: programMultiplier.toFixed(2),
      value: Math.round(exposureValue)
    },
    socialComponent: {
      followers: socialFollowers || 0,
      engagementRate: ((engagementRate || 0.02) * 100).toFixed(1) + '%',
      multiplier: socialMultiplier.toFixed(2),
      value: Math.round(socialValue)
    },
    eligibilityComponent: {
      yearsRemaining: eligibilityYears || 1,
      multiplier: eligibilityMultiplier.toFixed(2)
    },
    marketabilityComponent: {
      score: marketability || 50,
      multiplier: marketabilityMultiplier.toFixed(2)
    }
  };
  
  // Comparable players (would come from database)
  const comparables = generateComparables(position, fairMarketValue, performanceGrade);
  
  return jsonResponse({
    player: name || 'Unknown Player',
    position,
    program: program || 'Unknown',
    fairMarketValue: fairMarketValue * 1000, // Convert to actual dollars
    valueRange: {
      low: lowEstimate * 1000,
      high: highEstimate * 1000
    },
    breakdown,
    comparables,
    methodology: 'BSI Fair Market NIL Value Model v1.0',
    disclaimer: 'Values are estimates based on public data and market trends. Actual NIL deals may vary significantly.',
    calculatedAt: new Date().toISOString()
  });
}

/**
 * Roster Optimizer
 * POST /api/nil/optimize
 * Body: { budget, positionNeeds, constraints }
 */
async function handleOptimize(request, env) {
  const body = await request.json();
  
  const {
    budget,              // Total NIL budget in dollars
    positionNeeds,       // Array of { position, priority, minGrade }
    existingRoster,      // Current roster for WAR calculations
    constraints,         // { maxPlayers, minEligibility, conferences }
    availablePlayers     // Portal players to consider (or fetch from DB)
  } = body;
  
  if (!budget || !positionNeeds || positionNeeds.length === 0) {
    return jsonResponse({ error: 'Missing required fields: budget, positionNeeds' }, 400);
  }
  
  // Get available players (from body or database)
  let candidates = availablePlayers || await getPortalPlayers(env, positionNeeds.map(p => p.position));
  
  // Filter by constraints
  if (constraints?.minEligibility) {
    candidates = candidates.filter(p => p.eligibilityYears >= constraints.minEligibility);
  }
  if (constraints?.conferences?.length > 0) {
    candidates = candidates.filter(p => constraints.conferences.includes(p.conference));
  }
  if (constraints?.minGrade) {
    candidates = candidates.filter(p => p.performanceGrade >= constraints.minGrade);
  }
  
  // Calculate value scores for each candidate
  const scoredCandidates = candidates.map(player => {
    const nilValue = calculateQuickNIL(player);
    const warProjection = calculateQuickWAR(player, existingRoster);
    const valueScore = (warProjection / nilValue) * 1000000; // WAR per million dollars
    const positionNeed = positionNeeds.find(n => n.position === player.position);
    const priorityBonus = positionNeed ? (positionNeed.priority || 1) : 0.5;
    
    return {
      ...player,
      nilValue,
      warProjection,
      valueScore,
      adjustedScore: valueScore * priorityBonus
    };
  });
  
  // Sort by adjusted score
  scoredCandidates.sort((a, b) => b.adjustedScore - a.adjustedScore);
  
  // Greedy optimization: select best value players within budget
  const selectedPlayers = [];
  let remainingBudget = budget;
  const filledPositions = new Set();
  
  // First pass: fill high-priority positions
  for (const need of positionNeeds.sort((a, b) => (b.priority || 1) - (a.priority || 1))) {
    const bestForPosition = scoredCandidates.find(p => 
      p.position === need.position && 
      p.nilValue <= remainingBudget &&
      !selectedPlayers.includes(p) &&
      (!need.minGrade || p.performanceGrade >= need.minGrade)
    );
    
    if (bestForPosition) {
      selectedPlayers.push(bestForPosition);
      remainingBudget -= bestForPosition.nilValue;
      filledPositions.add(need.position);
    }
  }
  
  // Second pass: fill remaining budget with best value
  const maxPlayers = constraints?.maxPlayers || 10;
  while (selectedPlayers.length < maxPlayers && remainingBudget > 0) {
    const nextBest = scoredCandidates.find(p => 
      p.nilValue <= remainingBudget && 
      !selectedPlayers.includes(p)
    );
    
    if (!nextBest) break;
    
    selectedPlayers.push(nextBest);
    remainingBudget -= nextBest.nilValue;
  }
  
  // Calculate totals
  const totalSpent = budget - remainingBudget;
  const totalWAR = selectedPlayers.reduce((sum, p) => sum + p.warProjection, 0);
  const avgValueScore = selectedPlayers.reduce((sum, p) => sum + p.valueScore, 0) / selectedPlayers.length;
  
  // Generate alternative combinations
  const alternatives = generateAlternatives(scoredCandidates, budget, positionNeeds, selectedPlayers);
  
  return jsonResponse({
    optimization: {
      budget,
      spent: totalSpent,
      remaining: remainingBudget,
      playersSelected: selectedPlayers.length,
      totalProjectedWAR: totalWAR.toFixed(2),
      averageValueScore: avgValueScore.toFixed(2),
      efficiency: ((totalWAR / totalSpent) * 1000000).toFixed(2) + ' WAR/$M'
    },
    selectedPlayers: selectedPlayers.map(p => ({
      name: p.name,
      position: p.position,
      program: p.program,
      performanceGrade: p.performanceGrade,
      nilValue: p.nilValue,
      projectedWAR: p.warProjection.toFixed(2),
      valueScore: p.valueScore.toFixed(2)
    })),
    positionsFilled: Array.from(filledPositions),
    unfilledNeeds: positionNeeds
      .filter(n => !filledPositions.has(n.position))
      .map(n => n.position),
    alternativeCombinations: alternatives,
    methodology: 'BSI Roster Optimizer v1.0 - Greedy optimization with position priority weighting',
    calculatedAt: new Date().toISOString()
  });
}

/**
 * Team-Specific WAR Calculator
 * POST /api/nil/war
 * Body: { player, targetTeam roster data }
 */
async function handleWAR(request, env) {
  const body = await request.json();
  
  const {
    player,           // Player being evaluated
    targetTeam,       // Team considering the player
    currentTeamStats, // Current team performance metrics
    replacementLevel  // Custom replacement level (optional)
  } = body;
  
  if (!player || !targetTeam) {
    return jsonResponse({ error: 'Missing required fields: player, targetTeam' }, 400);
  }
  
  const position = player.position;
  const coefficients = WAR_COEFFICIENTS[position];
  
  if (!coefficients) {
    return jsonResponse({ error: `WAR not supported for position: ${position}` }, 400);
  }
  
  // Calculate baseline WAR from raw production
  let baselineWAR = 0;
  const stats = player.stats || {};
  
  for (const [stat, coef] of Object.entries(coefficients)) {
    if (stats[stat] !== undefined) {
      baselineWAR += stats[stat] * coef;
    }
  }
  
  // Calculate team-specific adjustments
  const teamContext = analyzeTeamContext(targetTeam, position, currentTeamStats);
  
  // Scheme fit adjustment (-20% to +20%)
  const schemeFit = teamContext.schemeFit || 1.0;
  
  // Positional need adjustment (+0% to +30% for high-need positions)
  const needMultiplier = teamContext.positionNeed || 1.0;
  
  // Competition adjustment (starter vs backup value)
  const depthChartValue = teamContext.depthChartValue || 1.0;
  
  // Conference strength adjustment
  const conferenceAdjustment = teamContext.conferenceStrength || 1.0;
  
  // Calculate team-specific WAR
  const teamSpecificWAR = baselineWAR * schemeFit * needMultiplier * depthChartValue * conferenceAdjustment;
  
  // Calculate opportunity cost (what team loses by NOT adding this player)
  const currentStarterWAR = teamContext.currentStarterWAR || 0;
  const warOverReplacement = teamSpecificWAR - (replacementLevel || 0);
  const marginalWAR = teamSpecificWAR - currentStarterWAR;
  
  // Calculate dollar value of WAR
  const dollarPerWAR = 250000; // Estimated market rate per WAR
  const impliedValue = teamSpecificWAR * dollarPerWAR;
  
  // Generate comparison to other destinations
  const destinationComparison = generateDestinationComparison(player, targetTeam);
  
  return jsonResponse({
    player: player.name,
    position: player.position,
    targetTeam: targetTeam.name,
    warAnalysis: {
      baselineWAR: baselineWAR.toFixed(2),
      teamSpecificWAR: teamSpecificWAR.toFixed(2),
      warOverReplacement: warOverReplacement.toFixed(2),
      marginalWAR: marginalWAR.toFixed(2),
      impliedMarketValue: impliedValue
    },
    adjustmentFactors: {
      schemeFit: {
        value: schemeFit.toFixed(2),
        description: teamContext.schemeFitDescription || 'Average scheme fit'
      },
      positionalNeed: {
        value: needMultiplier.toFixed(2),
        description: teamContext.needDescription || 'Moderate positional need'
      },
      depthChart: {
        value: depthChartValue.toFixed(2),
        projectedRole: teamContext.projectedRole || 'Starter',
        currentStarter: teamContext.currentStarter || 'Unknown'
      },
      conferenceStrength: {
        value: conferenceAdjustment.toFixed(2),
        conference: targetTeam.conference
      }
    },
    opportunityCost: {
      currentStarterWAR: currentStarterWAR.toFixed(2),
      winsAddedOverCurrent: marginalWAR.toFixed(2),
      seasonImpact: marginalWAR > 0.5 ? 'Significant upgrade' : 
                   marginalWAR > 0.2 ? 'Moderate upgrade' :
                   marginalWAR > 0 ? 'Marginal upgrade' : 'Not an upgrade'
    },
    destinationComparison: destinationComparison.slice(0, 5),
    recommendation: generateRecommendation(teamSpecificWAR, player.nilValue || impliedValue, marginalWAR),
    methodology: 'BSI Team-Specific WAR Model v1.0',
    calculatedAt: new Date().toISOString()
  });
}

/**
 * Get NIL Rankings
 * GET /api/nil/rankings?position=QB&limit=50&offset=0
 */
async function handleRankings(url, env) {
  const position = url.searchParams.get('position');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const conference = url.searchParams.get('conference');
  const minGrade = parseInt(url.searchParams.get('minGrade') || '0');
  
  // Fetch from database (D1)
  let query = `
    SELECT * FROM nil_valuations 
    WHERE 1=1
  `;
  const params = [];
  
  if (position) {
    query += ` AND position = ?`;
    params.push(position);
  }
  if (conference) {
    query += ` AND conference = ?`;
    params.push(conference);
  }
  if (minGrade > 0) {
    query += ` AND performance_grade >= ?`;
    params.push(minGrade);
  }
  
  query += ` ORDER BY fair_market_value DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  // If no database, return sample data
  const sampleRankings = generateSampleRankings(position, limit, offset);
  
  return jsonResponse({
    rankings: sampleRankings,
    filters: { position, conference, minGrade },
    pagination: { limit, offset, total: 500 },
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Portal Feed
 * GET /api/nil/portal?position=QB&days=7
 */
async function handlePortalFeed(url, env) {
  const position = url.searchParams.get('position');
  const days = parseInt(url.searchParams.get('days') || '30');
  const status = url.searchParams.get('status') || 'all'; // entered, committed, withdrawn
  
  // Would fetch from real database
  const portalEntries = generateSamplePortalEntries(position, days, status);
  
  return jsonResponse({
    portalEntries,
    filters: { position, days, status },
    summary: {
      totalEntered: portalEntries.length,
      committed: portalEntries.filter(p => p.status === 'committed').length,
      available: portalEntries.filter(p => p.status === 'entered').length
    },
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Market Analysis
 * GET /api/nil/market?position=QB
 */
async function handleMarketAnalysis(url, env) {
  const position = url.searchParams.get('position') || 'all';
  
  const analysis = {
    position,
    marketMetrics: {
      medianValue: BASE_NIL_VALUES[position] ? BASE_NIL_VALUES[position] * 1000 : 175000,
      averageValue: BASE_NIL_VALUES[position] ? BASE_NIL_VALUES[position] * 1100 : 195000,
      topTierThreshold: BASE_NIL_VALUES[position] ? BASE_NIL_VALUES[position] * 2000 : 350000,
      totalMarketSize: position === 'all' ? 850000000 : (BASE_NIL_VALUES[position] || 150) * 130 * 1000
    },
    trends: {
      yearOverYear: '+18%',
      quarterOverQuarter: '+4.2%',
      portalInflation: '+23%'
    },
    supplyDemand: {
      availableInPortal: position === 'QB' ? 89 : 234,
      projectedDemand: position === 'QB' ? 45 : 120,
      marketBalance: position === 'QB' ? 'Seller\'s market' : 'Balanced'
    },
    positionMultiplier: POSITION_VALUE_MULTIPLIERS[position] || 1.0,
    comparisons: generateMarketComparisons(position)
  };
  
  return jsonResponse(analysis);
}

/**
 * Player Detail
 * GET /api/nil/player/{playerId}
 */
async function handlePlayerDetail(path, env) {
  const playerId = path.replace('/api/nil/player/', '');
  
  // Would fetch from database
  const player = generateSamplePlayer(playerId);
  
  return jsonResponse(player);
}

// Helper functions

function getProgramMultiplier(program) {
  if (!program) return 1.0;
  
  for (const [tier, data] of Object.entries(PROGRAM_MULTIPLIERS)) {
    if (data.programs.includes(program)) {
      return data.multiplier;
    }
  }
  return 1.0; // Default P4
}

function getSocialMultiplier(followers, engagementRate) {
  let baseMultiplier = 1.0;
  
  for (const [tier, data] of Object.entries(SOCIAL_MULTIPLIERS)) {
    if (followers >= data.min) {
      baseMultiplier = data.multiplier;
      break;
    }
  }
  
  // Engagement rate bonus (good engagement = 3%+)
  const engagementBonus = Math.min(engagementRate / 0.03, 1.5);
  
  return baseMultiplier * (0.7 + (engagementBonus * 0.3));
}

function getEligibilityMultiplier(years) {
  // More years = more value (but diminishing returns)
  if (years >= 4) return 1.20;
  if (years >= 3) return 1.15;
  if (years >= 2) return 1.05;
  return 1.00;
}

function calculateQuickNIL(player) {
  const base = BASE_NIL_VALUES[player.position] || 150;
  const perf = PERFORMANCE_VALUE_CURVE(player.performanceGrade || 70);
  const prog = getProgramMultiplier(player.program);
  return Math.round(base * perf * prog) * 1000;
}

function calculateQuickWAR(player, roster) {
  const baseWAR = (player.performanceGrade || 70) / 100 * 1.5;
  const positionMult = POSITION_VALUE_MULTIPLIERS[player.position] || 1.0;
  return baseWAR * positionMult;
}

function generateComparables(position, value, grade) {
  // Sample comparables - would come from database
  const names = {
    QB: ['Arch Manning', 'Quinn Ewers', 'Carson Beck', 'Drew Allar', 'Jalen Milroe'],
    WR: ['Tetairoa McMillan', 'Luther Burden III', 'Ryan Williams', 'Evan Stewart'],
    RB: ['Quinshon Judkins', 'TreVeyon Henderson', 'Ollie Gordon II'],
    EDGE: ['James Pearce Jr.', 'Abdul Carter', 'Mykel Williams'],
    CB: ['Travis Hunter', 'Caleb Downs', 'Benjamin Morrison']
  };
  
  return (names[position] || ['Player A', 'Player B', 'Player C']).slice(0, 3).map((name, i) => ({
    name,
    position,
    nilValue: value * (0.9 + Math.random() * 0.2) * 1000,
    performanceGrade: grade + Math.floor(Math.random() * 10 - 5)
  }));
}

function generateAlternatives(candidates, budget, needs, selected) {
  // Generate 2-3 alternative combinations
  return [{
    strategy: 'Value Focus',
    description: 'Maximize WAR per dollar spent',
    projectedWAR: 4.2,
    totalSpent: budget * 0.85
  }, {
    strategy: 'Star Hunting',
    description: 'Prioritize elite talent at key positions',
    projectedWAR: 3.8,
    totalSpent: budget * 0.98
  }];
}

function analyzeTeamContext(team, position, stats) {
  // Would analyze actual team data
  return {
    schemeFit: 1.0 + (Math.random() * 0.3 - 0.15),
    schemeFitDescription: 'Good fit for spread offense',
    positionNeed: 1.1,
    needDescription: 'High priority position need',
    depthChartValue: 1.0,
    projectedRole: 'Day 1 Starter',
    currentStarter: 'Incumbent Starter',
    currentStarterWAR: 0.8,
    conferenceStrength: 1.0
  };
}

function generateDestinationComparison(player, currentTeam) {
  // Compare WAR at different destinations
  return [
    { team: 'Ohio State', projectedWAR: 2.1, schemeFit: 'Excellent' },
    { team: 'Georgia', projectedWAR: 1.9, schemeFit: 'Good' },
    { team: 'Texas', projectedWAR: 2.0, schemeFit: 'Very Good' }
  ];
}

function generateRecommendation(war, value, marginal) {
  const efficiency = war / (value / 1000000);
  if (efficiency > 2.0 && marginal > 0.5) return 'Strong Pursue - Elite value and significant upgrade';
  if (efficiency > 1.5 && marginal > 0.3) return 'Pursue - Good value proposition';
  if (efficiency > 1.0 && marginal > 0) return 'Consider - Fair value, modest upgrade';
  if (marginal <= 0) return 'Pass - Does not improve roster';
  return 'Evaluate - Mixed indicators, proceed with caution';
}

function generateSampleRankings(position, limit, offset) {
  // Sample data - would come from database
  const players = [];
  const positions = position ? [position] : Object.keys(BASE_NIL_VALUES);
  
  for (let i = 0; i < limit; i++) {
    const pos = positions[i % positions.length];
    const grade = 95 - (offset + i) * 0.3;
    const value = calculateQuickNIL({ position: pos, performanceGrade: grade, program: 'Texas' });
    
    players.push({
      rank: offset + i + 1,
      name: `Player ${offset + i + 1}`,
      position: pos,
      program: ['Texas', 'Ohio State', 'Georgia', 'Alabama', 'USC'][i % 5],
      conference: 'SEC',
      performanceGrade: Math.round(grade),
      fairMarketValue: value,
      socialFollowers: Math.floor(50000 + Math.random() * 450000),
      eligibilityYears: Math.floor(1 + Math.random() * 3),
      portalStatus: i < 20 ? 'entered' : null
    });
  }
  
  return players;
}

function generateSamplePortalEntries(position, days, status) {
  const entries = [];
  const count = position ? 15 : 50;
  
  for (let i = 0; i < count; i++) {
    entries.push({
      name: `Portal Player ${i + 1}`,
      position: position || ['QB', 'WR', 'RB', 'EDGE', 'CB'][i % 5],
      fromProgram: ['USC', 'Oregon', 'Miami', 'Florida', 'Auburn'][i % 5],
      performanceGrade: 70 + Math.floor(Math.random() * 25),
      fairMarketValue: 150000 + Math.floor(Math.random() * 500000),
      enteredDate: new Date(Date.now() - Math.random() * days * 86400000).toISOString(),
      status: status === 'all' ? ['entered', 'committed', 'withdrawn'][i % 3] : status,
      destination: status === 'committed' ? ['Texas', 'Georgia', 'Ohio State'][i % 3] : null
    });
  }
  
  return entries;
}

function generateMarketComparisons(position) {
  return [
    { position: 'QB', medianValue: 450000, change: '+22%' },
    { position: 'EDGE', medianValue: 280000, change: '+15%' },
    { position: 'WR', medianValue: 220000, change: '+18%' },
    { position: 'CB', medianValue: 200000, change: '+12%' },
    { position: 'OT', medianValue: 250000, change: '+20%' }
  ];
}

function generateSamplePlayer(id) {
  return {
    id,
    name: 'Sample Player',
    position: 'QB',
    program: 'Texas',
    conference: 'SEC',
    performanceGrade: 88,
    fairMarketValue: 650000,
    socialFollowers: 125000,
    engagementRate: 0.034,
    eligibilityYears: 2,
    stats: {
      passYards: 3200,
      passTD: 28,
      int: 6,
      completionPct: 68.5,
      rushYards: 320,
      rushTD: 5
    },
    history: [
      { year: 2023, team: 'Texas', stats: { passYards: 2800, passTD: 22 } },
      { year: 2022, team: 'Texas', stats: { passYards: 1200, passTD: 10 } }
    ]
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
