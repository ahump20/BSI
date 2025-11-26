/**
 * PDF Export Endpoint for Scouting Reports
 * Returns formatted PDF document for front office sharing
 *
 * Uses simple PDF generation for Cloudflare Workers compatibility
 * For production: Consider using pdf-lib library for enhanced formatting
 */

import { err, rateLimit, rateLimitError, corsHeaders } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
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
    const pdfBytes = generatePDF(data);

    // Return as downloadable PDF file
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="scouting-report-${playerId}-${Date.now()}.pdf"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return err(error, 500);
  }
}

/**
 * Generate a basic PDF document
 * This is a minimal PDF implementation for Cloudflare Workers
 * For production, consider using pdf-lib library for better formatting
 */
function generatePDF(data) {
  const content = generatePDFContent(data);

  // Basic PDF structure
  const pdfDoc = [
    '%PDF-1.4',
    '1 0 obj',
    '<<',
    '/Type /Catalog',
    '/Pages 2 0 R',
    '>>',
    'endobj',
    '2 0 obj',
    '<<',
    '/Type /Pages',
    '/Kids [3 0 R]',
    '/Count 1',
    '>>',
    'endobj',
    '3 0 obj',
    '<<',
    '/Type /Page',
    '/Parent 2 0 R',
    '/Resources <<',
    '/Font <<',
    '/F1 4 0 R',
    '/F2 5 0 R',
    '>>',
    '>>',
    '/MediaBox [0 0 612 792]',
    '/Contents 6 0 R',
    '>>',
    'endobj',
    '4 0 obj',
    '<<',
    '/Type /Font',
    '/Subtype /Type1',
    '/BaseFont /Helvetica',
    '>>',
    'endobj',
    '5 0 obj',
    '<<',
    '/Type /Font',
    '/Subtype /Type1',
    '/BaseFont /Helvetica-Bold',
    '>>',
    'endobj',
    '6 0 obj',
    '<<',
    `/Length ${content.length}`,
    '>>',
    'stream',
    content,
    'endstream',
    'endobj',
    'xref',
    '0 7',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000274 00000 n ',
    '0000000351 00000 n ',
    '0000000433 00000 n ',
    'trailer',
    '<<',
    '/Size 7',
    '/Root 1 0 R',
    '>>',
    'startxref',
    '532',
    '%%EOF',
  ].join('\n');

  // Convert to Uint8Array
  const encoder = new TextEncoder();
  return encoder.encode(pdfDoc);
}

/**
 * Generate PDF content stream with formatted text
 */
function generatePDFContent(data) {
  const lines = [];
  let yPos = 750; // Start from top of page
  const lineHeight = 14;

  // Helper to add text
  const addText = (text, fontSize = 11, font = 'F1') => {
    lines.push(`BT`);
    lines.push(`/${font} ${fontSize} Tf`);
    lines.push(`50 ${yPos} Td`);
    lines.push(`(${escapePDFString(text)}) Tj`);
    lines.push(`ET`);
    yPos -= lineHeight;
  };

  const addHeader = (text) => {
    addText(text, 16, 'F2');
    yPos -= 5;
  };

  const addSubheader = (text) => {
    addText(text, 12, 'F2');
  };

  const addLine = () => {
    yPos -= 10;
  };

  // Document Header
  addHeader('PROFESSIONAL SCOUTING REPORT');
  addLine();
  addText(`Blaze Sports Intelligence - College Baseball Division`);
  addText(
    `Generated: ${data.citations?.fetched_at || new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}`
  );
  addLine();

  // Basic Information
  addSubheader('PLAYER INFORMATION');
  addText(`Player ID: ${data.player_id || 'N/A'}`);
  if (data.team_id) {
    addText(`Team: ${data.team_id}`);
  }
  addLine();

  // Draft Projection
  if (data.draft_projection) {
    addSubheader('MLB DRAFT PROJECTION');
    const draft = data.draft_projection;
    addText(`Projected Round: ${draft.projected_round || 'N/A'}`);
    addText(`Pick Range: ${draft.pick_range || 'N/A'}`);
    addText(`Signing Bonus: ${draft.signing_bonus_range || 'N/A'}`);
    addText(`Draft Grade: ${draft.draft_grade || 'N/A'}/100`);
    addText(`Confidence: ${draft.confidence_level || 'N/A'}`);
    addLine();
  }

  // Component Scores
  addSubheader('COMPONENT SCORES');
  const comp = data.component_scores || {};

  if (comp.velocity_model) {
    addText(`Velocity Consistency: ${comp.velocity_model.consistency}/100`);
    addText(
      `  Avg: ${comp.velocity_model.avg_velocity?.toFixed(1)} mph | Trend: ${comp.velocity_model.trend}`
    );
  }

  if (comp.intangibles_model) {
    addText(`Intangibles: ${comp.intangibles_model.overall_intangibles}/100`);
    addText(
      `  Leadership: ${comp.intangibles_model.leadership} | Work Ethic: ${comp.intangibles_model.work_ethic}`
    );
  }

  if (comp.scout_notes_model) {
    addText(`Scout Notes NLP: ${comp.scout_notes_model.sentiment_score}/100`);
  }

  if (comp.champion_enigma_engine) {
    addText(`Champion Enigma Engine: ${comp.champion_enigma_engine.football_iq_equivalent}/100`);
    addText(`  Confidence: ${(comp.champion_enigma_engine.confidence * 100).toFixed(0)}%`);
  }
  addLine();

  // Final Recommendation
  addSubheader('FINAL RECOMMENDATION');
  const final = data.final_recommendation || {};
  addText(`Draft Grade: ${final.draft_grade || 'N/A'}/100`);
  addText(`Confidence Level: ${final.confidence_level || 'N/A'}`);
  addText(`Recommendation: ${final.recommendation || 'N/A'}`);
  addLine();

  // MLB Comparisons
  if (data.mlb_comparisons && data.mlb_comparisons.length > 0) {
    addSubheader('MLB PLAYER COMPARISONS');
    data.mlb_comparisons.forEach((comp) => {
      addText(`${comp.name} (${comp.similarity_score}% similar)`);
      addText(
        `  ${comp.peak_velocity || 'N/A'} mph | WAR: ${comp.career_war || 'N/A'} | ${comp.draft_year || 'N/A'}`
      );
    });
    addLine();
  }

  // Injury Risk
  if (data.injury_risk_assessment) {
    addSubheader('INJURY RISK ASSESSMENT');
    const injury = data.injury_risk_assessment;
    addText(`Overall Risk: ${injury.overall_risk || 'N/A'} (${injury.risk_score || 'N/A'}/100)`);

    if (injury.risk_factors && injury.risk_factors.length > 0) {
      addText(`Risk Factors:`);
      injury.risk_factors.forEach((factor) => {
        addText(`  - ${factor}`);
      });
    }
    addLine();
  }

  // Role Suggestions
  if (final.role_suggestions && final.role_suggestions.length > 0) {
    addSubheader('ROLE SUGGESTIONS');
    final.role_suggestions.forEach((role) => {
      addText(`- ${role}`);
    });
    addLine();
  }

  // Risk Factors
  if (final.risk_factors && final.risk_factors.length > 0) {
    addSubheader('RISK FACTORS');
    final.risk_factors.forEach((risk) => {
      addText(`- ${risk}`);
    });
    addLine();
  }

  // Footer
  yPos = 50;
  addText('---', 9);
  addText('Powered by Blaze Sports Intelligence - Professional Scouting Engine', 9);
  addText('Champion Enigma Engine is a trademark of Blaze Intelligence', 9);
  addText(
    `Data Sources: ${data.citations?.sources?.join(', ') || 'Multiple validated sources'}`,
    9
  );

  return lines.join('\n');
}

/**
 * Escape special characters for PDF strings
 */
function escapePDFString(str) {
  if (!str) return '';
  return str
    .toString()
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r/g, '')
    .replace(/\n/g, ' ')
    .substring(0, 120); // Limit line length for PDF compatibility
}
