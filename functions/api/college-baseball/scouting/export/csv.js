/**
 * CSV Export Endpoint for Scouting Reports
 * Returns flattened scouting report data in CSV format for spreadsheet analysis
 */

import { err, rateLimit, rateLimitError, corsHeaders } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const playerId = url.searchParams.get('player_id');
  const teamId = url.searchParams.get('team_id');

  if (!playerId) {
    return err(new Error('Missing required parameter: player_id'), 400);
  }

  try {
    // Fetch the complete scouting report
    const reportUrl = new URL('/api/college-baseball/scouting-professional', url.origin);
    reportUrl.searchParams.set('player_id', playerId);
    if (teamId) reportUrl.searchParams.set('team_id', teamId);
    reportUrl.searchParams.set('include_video', 'true');

    const reportResponse = await fetch(reportUrl.toString());

    if (!reportResponse.ok) {
      throw new Error(`Failed to fetch scouting report: ${reportResponse.status}`);
    }

    const data = await reportResponse.json();
    const csv = generateCSV(data);

    // Return as downloadable CSV file
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="scouting-report-${playerId}-${Date.now()}.csv"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return err(error, 500);
  }
}

function generateCSV(data) {
  const rows = [];

  // Header: Basic Information
  rows.push('=== BASIC INFORMATION ===');
  rows.push('Field,Value');
  rows.push(`Player ID,${data.player_id || 'N/A'}`);
  rows.push(`Team ID,${data.team_id || 'N/A'}`);
  rows.push(`Generated At,${data.generated_at || 'N/A'}`);
  rows.push(`Timezone,${data.citations?.timezone || 'America/Chicago'}`);
  rows.push('');

  // Component Scores
  rows.push('=== COMPONENT SCORES ===');
  rows.push('Component,Score,Details');

  const comp = data.component_scores || {};

  if (comp.velocity_model) {
    rows.push(`Velocity Consistency,${comp.velocity_model.consistency},"Avg: ${comp.velocity_model.avg_velocity?.toFixed(1)} mph, Trend: ${comp.velocity_model.trend}, Fatigue Risk: ${comp.velocity_model.fatigue_risk}%"`);
  }

  if (comp.intangibles_model) {
    rows.push(`Intangibles Overall,${comp.intangibles_model.overall_intangibles},"Leadership: ${comp.intangibles_model.leadership}, Work Ethic: ${comp.intangibles_model.work_ethic}, Composure: ${comp.intangibles_model.composure}"`);
  }

  if (comp.scout_notes_model) {
    rows.push(`Scout Notes NLP,${comp.scout_notes_model.sentiment_score},"Sentiment: ${comp.scout_notes_model.sentiment}, Key Phrases: ${comp.scout_notes_model.key_phrases?.length || 0}, Concerns: ${comp.scout_notes_model.concerns?.length || 0}"`);
  }

  if (comp.champion_enigma_engine) {
    rows.push(`Champion Enigma Engine,${comp.champion_enigma_engine.football_iq_equivalent},"Confidence: ${(comp.champion_enigma_engine.confidence * 100).toFixed(0)}%, Pattern Recognition: ${comp.champion_enigma_engine.cognitive_traits?.pattern_recognition || 'N/A'}"`);
  }

  rows.push('');

  // Final Recommendation
  rows.push('=== FINAL RECOMMENDATION ===');
  rows.push('Metric,Value');
  const final = data.final_recommendation || {};
  rows.push(`Draft Grade,${final.draft_grade || 'N/A'}`);
  rows.push(`Confidence Level,${final.confidence_level || 'N/A'}`);
  rows.push(`Decision Velocity Score,${final.decision_velocity_score || 'N/A'}`);
  rows.push(`Recommendation,"${final.recommendation || 'N/A'}"`);
  rows.push('');

  // Draft Projection
  if (data.draft_projection) {
    rows.push('=== DRAFT PROJECTION ===');
    rows.push('Field,Value');
    const draft = data.draft_projection;
    rows.push(`Projected Round,${draft.projected_round || 'N/A'}`);
    rows.push(`Pick Range,${draft.pick_range || 'N/A'}`);
    rows.push(`Signing Bonus Range,${draft.signing_bonus_range || 'N/A'}`);
    rows.push(`Draft Grade,${draft.draft_grade || 'N/A'}`);
    rows.push(`Confidence,${draft.confidence_level || 'N/A'}`);
    rows.push(`Signability,${draft.signability_assessment || 'N/A'}`);
    rows.push('');
  }

  // MLB Comparisons
  if (data.mlb_comparisons && data.mlb_comparisons.length > 0) {
    rows.push('=== MLB COMPARISONS ===');
    rows.push('Player Name,Similarity Score,Peak Velocity,Career WAR,Draft Year,Style Notes');
    data.mlb_comparisons.forEach(comp => {
      rows.push(`"${comp.name}",${comp.similarity_score}%,${comp.peak_velocity || 'N/A'},${comp.career_war || 'N/A'},${comp.draft_year || 'N/A'},"${comp.style_notes || 'N/A'}"`);
    });
    rows.push('');
  }

  // Injury Risk Assessment
  if (data.injury_risk_assessment) {
    rows.push('=== INJURY RISK ASSESSMENT ===');
    rows.push('Field,Value');
    const injury = data.injury_risk_assessment;
    rows.push(`Overall Risk,${injury.overall_risk || 'N/A'}`);
    rows.push(`Risk Score,${injury.risk_score || 'N/A'}`);

    if (injury.risk_factors && injury.risk_factors.length > 0) {
      rows.push(`Risk Factors,"${injury.risk_factors.join('; ')}"`);
    }

    if (injury.preventive_measures && injury.preventive_measures.length > 0) {
      rows.push(`Preventive Measures,"${injury.preventive_measures.join('; ')}"`);
    }

    if (injury.recommended_workload) {
      const wl = injury.recommended_workload;
      rows.push(`Recommended Workload,"Pitches: ${wl.pitches_per_outing}, Innings: ${wl.innings_per_start}, Rest: ${wl.days_rest} days, Season Target: ${wl.season_innings_target}"`);
    }
    rows.push('');
  }

  // Development Roadmap
  if (data.development_roadmap && data.development_roadmap.priority_areas) {
    rows.push('=== DEVELOPMENT ROADMAP ===');
    rows.push('Priority Area,Current Level,Target,Priority Level');
    data.development_roadmap.priority_areas.forEach(area => {
      rows.push(`"${area.area}","${area.current_level}","${area.target}",${area.priority}`);
    });
    rows.push('');

    if (data.development_roadmap.short_term_plan) {
      rows.push('Short-Term Action Items:');
      data.development_roadmap.short_term_plan.action_items?.forEach(item => {
        rows.push(`"${item}"`);
      });
      rows.push('');
    }
  }

  // Role Suggestions and Risk Factors
  rows.push('=== ROLE SUGGESTIONS ===');
  if (final.role_suggestions && final.role_suggestions.length > 0) {
    final.role_suggestions.forEach(role => rows.push(`"${role}"`));
  } else {
    rows.push('N/A');
  }
  rows.push('');

  rows.push('=== RISK FACTORS ===');
  if (final.risk_factors && final.risk_factors.length > 0) {
    final.risk_factors.forEach(risk => rows.push(`"${risk}"`));
  } else {
    rows.push('None identified');
  }
  rows.push('');

  // Data Sources
  rows.push('=== DATA SOURCES ===');
  if (data.citations && data.citations.sources) {
    data.citations.sources.forEach(source => rows.push(`"${source}"`));
  }
  rows.push(`Fetched At: ${data.citations?.fetched_at || 'N/A'}`);

  return rows.join('\n');
}
