/**
 * Blaze Sports Intel - Injury Impact API
 *
 * Analyzes impact of player injuries on team performance
 * with positional value and replacement quality assessment.
 *
 * Endpoints:
 * - GET /api/v1/predictions/injury-impact?playerId=123&sport=NFL
 * - GET /api/v1/predictions/injury-impact/team?teamId=456&sport=NFL
 * - GET /api/v1/predictions/injury-impact/compare?team1=456&team2=789&sport=NFL
 * - GET /api/v1/predictions/injury-impact/recovery?playerId=123
 */

import {
  predictInjuryImpact,
  analyzeTeamInjuries,
  compareTeamInjuries,
  trackRecoveryTimeline
} from '../../../../lib/ml/injury-impact-predictor.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'player'; // 'player', 'team', 'compare', 'recovery'
  const sport = url.searchParams.get('sport') || 'NFL';

  try {
    let result;

    switch (mode) {
      case 'team':
        // Analyze all injuries for a team
        const teamId = url.searchParams.get('teamId');
        if (!teamId) {
          throw new Error('teamId required for team injury analysis');
        }
        result = await analyzeTeamInjuries(teamId, sport, env);
        break;

      case 'compare':
        // Compare injury situations between two teams
        const team1 = url.searchParams.get('team1');
        const team2 = url.searchParams.get('team2');
        if (!team1 || !team2) {
          throw new Error('team1 and team2 required for comparison');
        }
        result = await compareTeamInjuries(team1, team2, sport, env);
        break;

      case 'recovery':
        // Track recovery timeline for player
        const recoveryPlayerId = url.searchParams.get('playerId');
        if (!recoveryPlayerId) {
          throw new Error('playerId required for recovery tracking');
        }
        result = await trackRecoveryTimeline(recoveryPlayerId, env);
        break;

      case 'player':
      default:
        // Analyze single player injury
        const playerId = url.searchParams.get('playerId');

        if (playerId) {
          // Fetch injury details from database
          const injury = await fetchInjuryDetails(env, playerId, sport);
          result = await predictInjuryImpact(injury, env);
        } else {
          // Return demo data
          result = generateDemoInjuryImpact(sport);
        }
        break;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, s-maxage=600' // 5-10 min cache
      }
    });

  } catch (error) {
    console.error('Injury impact API error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to analyze injury impact',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Fetch injury details from database
 */
async function fetchInjuryDetails(env, playerId, sport) {
  try {
    const injury = await env.DB.prepare(`
      SELECT
        ci.player_id,
        ci.player_name,
        ci.team_id,
        ci.position,
        ci.sport,
        ci.injury_type,
        ci.severity,
        ci.injury_date,
        ci.expected_return,
        ci.status
      FROM current_injuries ci
      WHERE ci.player_id = ? AND ci.sport = ?
      ORDER BY ci.injury_date DESC
      LIMIT 1
    `).bind(playerId, sport).first();

    if (!injury) {
      throw new Error(`No injury found for player ${playerId}`);
    }

    return {
      playerId: injury.player_id,
      playerName: injury.player_name,
      teamId: injury.team_id,
      sport: injury.sport,
      position: injury.position,
      severity: injury.severity,
      expectedReturn: injury.expected_return
    };

  } catch (error) {
    console.error('Error fetching injury details:', error);
    throw error;
  }
}

/**
 * Generate demo injury impact data
 */
function generateDemoInjuryImpact(sport) {
  const demoData = {
    'NFL': {
      player: {
        id: 'demo_player_001',
        name: 'Patrick Mahomes',
        team: 'KC',
        position: 'QB'
      },
      injury: {
        severity: 'moderate',
        expectedReturn: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectedGamesMissed: {
          min: 2,
          expected: 3,
          max: 5
        }
      },
      impact: {
        qualityDropoff: 0.35,
        positionalImportance: 1.0,
        winProbabilityChange: 12.5,
        seasonWinChange: 0.4,
        severity: 'major'
      },
      replacement: {
        quality: 0.42,
        comparison: 'downgrade',
        dropoffMagnitude: 0.35
      },
      historical: {
        comparableInjuries: [
          {
            player_name: 'Josh Allen',
            position: 'QB',
            severity: 'moderate',
            games_missed: 3,
            impact: 0.11
          },
          {
            player_name: 'Lamar Jackson',
            position: 'QB',
            severity: 'moderate',
            games_missed: 4,
            impact: 0.13
          }
        ],
        avgImpact: 0.12
      },
      confidence: {
        level: 'high',
        factors: [
          'Player sample: 80 games',
          'Replacement data: available',
          'Historical comp: 5 injuries'
        ]
      }
    },
    'MLB': {
      player: {
        id: 'demo_player_002',
        name: 'Shohei Ohtani',
        team: 'LAD',
        position: 'SP'
      },
      injury: {
        severity: 'major',
        expectedReturn: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectedGamesMissed: {
          min: 8,
          expected: 12,
          max: 20
        }
      },
      impact: {
        qualityDropoff: 0.28,
        positionalImportance: 0.90,
        winProbabilityChange: 8.2,
        seasonWinChange: 1.0,
        severity: 'major'
      },
      replacement: {
        quality: 0.48,
        comparison: 'downgrade',
        dropoffMagnitude: 0.28
      },
      historical: {
        comparableInjuries: [
          {
            player_name: 'Jacob deGrom',
            position: 'SP',
            severity: 'major',
            games_missed: 15,
            impact: 0.09
          }
        ],
        avgImpact: 0.09
      },
      confidence: {
        level: 'high',
        factors: [
          'Player sample: 150 games',
          'Replacement data: available',
          'Historical comp: 3 injuries'
        ]
      }
    },
    'NBA': {
      player: {
        id: 'demo_player_003',
        name: 'LeBron James',
        team: 'LAL',
        position: 'SF'
      },
      injury: {
        severity: 'minor',
        expectedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectedGamesMissed: {
          min: 1,
          expected: 2,
          max: 3
        }
      },
      impact: {
        qualityDropoff: 0.22,
        positionalImportance: 0.75,
        winProbabilityChange: 6.1,
        seasonWinChange: 0.1,
        severity: 'moderate'
      },
      replacement: {
        quality: 0.58,
        comparison: 'downgrade',
        dropoffMagnitude: 0.22
      },
      historical: {
        comparableInjuries: [
          {
            player_name: 'Kevin Durant',
            position: 'SF',
            severity: 'minor',
            games_missed: 2,
            impact: 0.05
          }
        ],
        avgImpact: 0.05
      },
      confidence: {
        level: 'high',
        factors: [
          'Player sample: 250 games',
          'Replacement data: available',
          'Historical comp: 8 injuries'
        ]
      }
    }
  };

  const demo = demoData[sport] || demoData['NFL'];

  return {
    ...demo,
    disclaimer: 'Demo data for testing purposes',
    lastUpdated: new Date().toISOString(),
    timezone: 'America/Chicago'
  };
}
