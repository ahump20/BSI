/**
 * College Baseball Scouting Engine - Lightweight Ensemble
 *
 * Specialized models coordinated by meta-learner:
 * 1. Velocity Model: Pitch velocity trends and consistency
 * 2. Intangibles Model: Leadership, work ethic, composure ratings
 * 3. NLP Model: Scout notes sentiment analysis
 * 4. Champion Enigma Engine: Proprietary cognitive metrics (placeholder)
 *
 * Performance: <50ms total latency (mobile-friendly)
 * Data Source: ESPN college-baseball API + D1 historical + Scout notes
 * Timezone: America/Chicago
 *
 * @returns {EnsembleOutput} Complete scouting report with component scores
 */

import { ok, err, cache, fetchWithTimeout } from '../_utils.js';

const CACHE_TTL = 300; // 5 minutes

/**
 * Main handler for scouting reports
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const playerId = url.searchParams.get('player_id');
  const teamId = url.searchParams.get('team_id');

  if (!playerId) {
    return err(new Error('Missing required parameter: player_id'), 400);
  }

  try {
    // Fetch all data in parallel for speed
    const [gameData, historicalStats, scoutNotes] = await Promise.all([
      fetchLatestGameData(playerId, env),
      fetchHistoricalStats(playerId, env),
      fetchScoutNotes(playerId, env)
    ]);

    // Run each specialized model in parallel
    const [velocityScore, intangiblesScore, notesScore, enigmaScore] = await Promise.all([
      runVelocityModel(gameData, historicalStats),
      runIntangiblesModel(scoutNotes),
      runScoutNotesNLP(scoutNotes),
      runChampionEnigmaEngine(playerId, env)
    ]);

    // Meta-learner combines all signals
    const finalRec = runMetaLearner({
      velocity: velocityScore,
      intangibles: intangiblesScore,
      notes: notesScore,
      enigma: enigmaScore
    });

    const result = {
      player_id: playerId,
      team_id: teamId,
      component_scores: {
        velocity_model: velocityScore,
        intangibles_model: intangiblesScore,
        scout_notes_model: notesScore,
        champion_enigma_engine: enigmaScore
      },
      final_recommendation: finalRec,
      citations: {
        sources: [
          'ESPN college-baseball API',
          'D1 historical stats database',
          'Scout notes database',
          'Champion Enigma Engine (proprietary)'
        ],
        fetched_at: new Date().toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        timezone: 'America/Chicago'
      }
    };

    // Store in D1 for audit trail
    if (env.DB) {
      try {
        await env.DB
          .prepare(
            `INSERT INTO scouting_reports (player_id, report_json, created_at)
             VALUES (?1, ?2, ?3)`
          )
          .bind(playerId, JSON.stringify(result), new Date().toISOString())
          .run();
      } catch (dbError) {
        console.warn('Failed to save to D1:', dbError);
        // Non-blocking - continue with response
      }
    }

    return ok(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('Scouting engine error:', error);
    return err(error, 500);
  }
}

/**
 * Component 1: Velocity Time-Series Model
 * Analyzes pitch velocity trends for consistency and fatigue
 */
async function runVelocityModel(gameData, historical) {
  // Extract velocity sequence from latest game
  const latestVelocities = gameData?.plays
    ?.filter(p => p.type === 'Pitch' && p.pitchSpeed)
    ?.map(p => p.pitchSpeed) || [];

  // Calculate consistency (inverse of std dev)
  const stdDev = calculateStdDev(latestVelocities);
  const consistency = Math.max(0, 100 - stdDev * 10);

  // Trend analysis across multiple games
  const velocityHistory = historical?.games?.map(g => g.avg_velocity).filter(Boolean) || [];
  const trend = calculateTrend(velocityHistory);

  // Fatigue risk: velocity drop in late innings
  const earlyInnings = latestVelocities.slice(0, Math.floor(latestVelocities.length / 2));
  const lateInnings = latestVelocities.slice(Math.floor(latestVelocities.length / 2));
  const earlyAvg = average(earlyInnings);
  const lateAvg = average(lateInnings);
  const velocityDrop = earlyAvg - lateAvg;
  const fatigueRisk = velocityDrop > 2 ? 75 : velocityDrop > 1 ? 50 : 25;

  return {
    consistency: Math.round(consistency),
    trend,
    fatigue_risk: fatigueRisk,
    avg_velocity: average(latestVelocities),
    max_velocity: Math.max(...latestVelocities, 0),
    min_velocity: Math.min(...latestVelocities.filter(v => v > 0), 0) || 0,
    velocity_drop: Math.round(velocityDrop * 10) / 10
  };
}

/**
 * Component 2: Intangibles Rubric Model
 * Simple weighted scoring of 1-5 ratings from scouts
 */
async function runIntangiblesModel(scoutNotes) {
  const rubric = scoutNotes?.rubric || {};

  // Normalize 1-5 ratings to 0-100 scale
  const leadership = ((rubric.leadership || 3) - 1) * 25;
  const workEthic = ((rubric.work_ethic || 3) - 1) * 25;
  const composure = ((rubric.composure || 3) - 1) * 25;
  const coachability = ((rubric.coachability || 3) - 1) * 25;

  return {
    leadership: Math.round(leadership),
    work_ethic: Math.round(workEthic),
    composure: Math.round(composure),
    coachability: Math.round(coachability),
    overall_intangibles: Math.round((leadership + workEthic + composure + coachability) / 4)
  };
}

/**
 * Component 3: Scout Notes NLP
 * Sentiment analysis + keyword extraction from free-form text
 */
async function runScoutNotesNLP(scoutNotes) {
  const text = scoutNotes?.notes || '';

  // Simple sentiment: count positive vs negative words
  const positiveWords = [
    'excellent', 'strong', 'consistent', 'impressive', 'dominant',
    'outstanding', 'solid', 'reliable', 'effective', 'plus'
  ];
  const negativeWords = [
    'weak', 'inconsistent', 'concerning', 'struggles', 'poor',
    'below-average', 'unreliable', 'ineffective', 'questionable'
  ];

  const lowerText = text.toLowerCase();
  const posCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negCount = negativeWords.filter(w => lowerText.includes(w)).length;

  let sentiment = 0;
  if (posCount > negCount) {
    sentiment = Math.min(1, 0.2 + (posCount - negCount) * 0.15);
  } else if (negCount > posCount) {
    sentiment = Math.max(-1, -0.2 - (negCount - posCount) * 0.15);
  }

  // Extract key phrases
  const keyPhrases = [];
  positiveWords.forEach(word => {
    const regex = new RegExp(`${word}\\s+\\w+`, 'gi');
    const matches = text.match(regex) || [];
    keyPhrases.push(...matches);
  });

  // Flag concerns
  const concerns = negativeWords
    .filter(w => lowerText.includes(w))
    .map(w => `Note mentions: ${w}`);

  return {
    sentiment: Math.round(sentiment * 100) / 100,
    sentiment_score: Math.round((sentiment + 1) * 50), // Normalize -1 to 1 → 0 to 100
    key_phrases: keyPhrases.slice(0, 5),
    concerns,
    word_count: text.split(/\s+/).length
  };
}

/**
 * Component 4: Champion Enigma Engine (Proprietary System Placeholder)
 *
 * This is where your Decision Velocity Model™ and Pattern Recognition Hierarchy™ plug in
 * For now, returns placeholder scores based on available data
 */
async function runChampionEnigmaEngine(playerId, env) {
  // In production, fetch pre-computed enigma score from D1
  // For now, use placeholder logic

  if (env.DB) {
    try {
      const enigmaData = await env.DB
        .prepare('SELECT enigma_score, confidence FROM enigma_scores WHERE player_id = ?1')
        .bind(playerId)
        .first();

      if (enigmaData) {
        return {
          football_iq_equivalent: enigmaData.enigma_score,
          confidence: enigmaData.confidence,
          cognitive_traits: {
            pattern_recognition: Math.round(enigmaData.enigma_score * 0.85),
            decision_speed: Math.round(enigmaData.enigma_score * 0.92),
            tactical_awareness: Math.round(enigmaData.enigma_score * 0.88)
          }
        };
      }
    } catch (dbError) {
      console.warn('Enigma Engine DB lookup failed:', dbError);
    }
  }

  // Placeholder: Return baseline scores
  return {
    football_iq_equivalent: 70,
    confidence: 0.65,
    cognitive_traits: {
      pattern_recognition: 68,
      decision_speed: 72,
      tactical_awareness: 69
    },
    note: 'Placeholder - awaiting cognitive assessment'
  };
}

/**
 * Meta-Learner: Combines all component outputs
 * Uses weighted average but could be upgraded to trained model
 */
function runMetaLearner(scores) {
  // Weighted combination
  const weights = {
    velocity_consistency: 0.25,
    intangibles_avg: 0.20,
    notes_sentiment: 0.15,
    enigma_score: 0.40  // Proprietary system gets highest weight
  };

  const velocityScore = scores.velocity.consistency;
  const intangiblesAvg = scores.intangibles.overall_intangibles;
  const notesSentiment = scores.notes.sentiment_score;
  const enigmaScore = scores.enigma.football_iq_equivalent;

  const draftGrade =
    velocityScore * weights.velocity_consistency +
    intangiblesAvg * weights.intangibles_avg +
    notesSentiment * weights.notes_sentiment +
    enigmaScore * weights.enigma_score;

  // Role suggestions based on velocity trend and intangibles
  const roles = [];
  if (scores.velocity.trend === 'increasing' && scores.velocity.consistency > 80) {
    roles.push('Ace starter (velocity improving, consistent)');
  }
  if (scores.velocity.avg_velocity > 93 && scores.velocity.consistency > 75) {
    roles.push('Front-line starter (elite velocity + control)');
  }
  if (scores.intangibles.leadership > 75) {
    roles.push('Team leader / closer (high leadership)');
  }
  if (enigmaScore > 85) {
    roles.push('Analytics-friendly high-IQ pitcher');
  }
  if (scores.velocity.avg_velocity < 91 && scores.intangibles.work_ethic > 80) {
    roles.push('Bullpen specialist (work ethic compensates for velocity)');
  }

  // Risk factors
  const risks = [];
  if (scores.velocity.fatigue_risk > 60) {
    risks.push(`Fatigue risk: velocity drops ${scores.velocity.velocity_drop} mph late in games`);
  }
  if (scores.velocity.trend === 'decreasing') {
    risks.push('Velocity trend declining over recent games');
  }
  if (scores.notes.concerns.length > 0) {
    risks.push(`Scout concerns: ${scores.notes.concerns.join(', ')}`);
  }
  if (enigmaScore < 60) {
    risks.push('Low cognitive score—may struggle with complex schemes');
  }
  if (scores.intangibles.composure < 50) {
    risks.push('Below-average composure rating from scouts');
  }

  // Decision Velocity: How quickly can coaching staff make this call?
  // High scores = clear decision, low scores = needs more data
  const decisionVelocity = scores.enigma.confidence * 100;

  return {
    draft_grade: Math.round(draftGrade),
    role_suggestions: roles.length > 0 ? roles : ['Additional evaluation needed'],
    risk_factors: risks.length > 0 ? risks : ['No significant risk factors identified'],
    decision_velocity_score: Math.round(decisionVelocity),
    confidence_level: draftGrade > 80 ? 'High' : draftGrade > 60 ? 'Medium' : 'Low',
    recommendation: draftGrade > 80 ? 'Strong recommend' :
                    draftGrade > 65 ? 'Recommend with development plan' :
                    draftGrade > 50 ? 'Monitor closely' : 'Pass'
  };
}

// ============================================================================
// Data Fetching Helpers
// ============================================================================

/**
 * Fetch latest game data from ESPN API
 */
async function fetchLatestGameData(playerId, env) {
  const cacheKey = `cb:scouting:game:${playerId}`;

  return await cache(env, cacheKey, async () => {
    try {
      // Fetch player's recent games from ESPN
      const espnUrl = `https://site.api.espn.com/apis/common/v3/sports/baseball/college-baseball/athletes/${playerId}`;
      const response = await fetchWithTimeout(espnUrl, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
          'Accept': 'application/json'
        }
      }, 8000);

      if (!response.ok) {
        throw new Error(`ESPN API returned ${response.status}`);
      }

      const data = await response.json();

      // Extract play-by-play data if available
      const plays = data.events?.[0]?.competitions?.[0]?.details || [];

      return {
        plays: plays.map(p => ({
          type: p.type?.text,
          pitchSpeed: p.pitchSpeed,
          inning: p.inning,
          sequenceNumber: p.sequenceNumber
        })),
        stats: data.statistics?.[0] || {}
      };
    } catch (error) {
      console.warn('ESPN game fetch failed, using fallback:', error);
      return { plays: [], stats: {} };
    }
  }, 60); // 1 min cache for live data
}

/**
 * Fetch historical stats from D1 database
 */
async function fetchHistoricalStats(playerId, env) {
  if (!env.DB) {
    return { games: [] };
  }

  try {
    const result = await env.DB
      .prepare(`
        SELECT game_date, avg_velocity, max_velocity, innings_pitched, strikeouts, walks
        FROM player_history
        WHERE player_id = ?1
        ORDER BY game_date DESC
        LIMIT 10
      `)
      .bind(playerId)
      .all();

    return {
      games: result.results || []
    };
  } catch (error) {
    console.warn('Failed to fetch historical stats:', error);
    return { games: [] };
  }
}

/**
 * Fetch scout notes from D1 database
 */
async function fetchScoutNotes(playerId, env) {
  if (!env.DB) {
    return { notes: '', rubric: {} };
  }

  try {
    const result = await env.DB
      .prepare(`
        SELECT notes, rubric_json, created_at
        FROM scout_notes
        WHERE player_id = ?1
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .bind(playerId)
      .first();

    if (!result) {
      return { notes: '', rubric: {} };
    }

    return {
      notes: result.notes || '',
      rubric: result.rubric_json ? JSON.parse(result.rubric_json) : {},
      created_at: result.created_at
    };
  } catch (error) {
    console.warn('Failed to fetch scout notes:', error);
    return { notes: '', rubric: {} };
  }
}

// ============================================================================
// Math Helper Functions
// ============================================================================

function calculateStdDev(values) {
  if (!values || values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateTrend(values) {
  if (!values || values.length < 3) return 'stable';

  const recent = values.slice(0, 3);
  const older = values.slice(3, 6);

  if (older.length === 0) return 'stable';

  const recentAvg = average(recent);
  const olderAvg = average(older);

  if (recentAvg > olderAvg + 1) return 'increasing';
  if (recentAvg < olderAvg - 1) return 'decreasing';
  return 'stable';
}

function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
