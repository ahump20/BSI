/**
 * Claude API Integration for Historical Data Summaries
 * Blaze Sports Intel - Natural Language Query Enhancement
 *
 * Uses Anthropic Claude API to generate human-readable summaries
 * of complex historical query results.
 */

interface ClaudeSummaryRequest {
  query: string;
  data: any[];
  sources: string[];
  sport: string;
}

interface ClaudeSummaryResponse {
  summary: string;
  insights: string[];
  confidence: number;
  model: string;
}

/**
 * Generate natural language summary using Claude API
 */
export async function generateClaudeSummary(
  request: ClaudeSummaryRequest,
  anthropicApiKey: string
): Promise<ClaudeSummaryResponse> {
  const { query, data, sources, sport } = request;

  // Construct context-aware prompt
  const prompt = buildPrompt(query, data, sources, sport);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const summaryText = result.content[0].text;

    // Parse summary and extract insights
    const { summary, insights } = parseSummary(summaryText);

    return {
      summary,
      insights,
      confidence: calculateConfidence(data.length, sources.length),
      model: result.model
    };
  } catch (error) {
    console.error('Claude API call failed:', error);
    throw error;
  }
}

/**
 * Build context-aware prompt for Claude
 */
function buildPrompt(query: string, data: any[], sources: string[], sport: string): string {
  const dataContext = JSON.stringify(data, null, 2);
  const sourcesContext = sources.join(', ');

  return `You are a professional sports analyst for Blaze Sports Intel, specializing in ${sport} historical data analysis.

User Query: "${query}"

Data Retrieved:
${dataContext}

Sources: ${sourcesContext}

Task: Provide a concise, insightful 2-3 paragraph summary of this historical data that:
1. Directly answers the user's query
2. Highlights the most significant patterns or trends
3. Adds contextual insights that aren't immediately obvious from raw data
4. Uses America/Chicago timezone for all dates
5. Maintains professional, neutral tone (no speculation)

After the summary, provide 3-5 key insights as bullet points starting with "INSIGHTS:" on a new line.

Format:
[2-3 paragraph summary]

INSIGHTS:
• [Insight 1]
• [Insight 2]
• [Insight 3]
• [Optional insight 4]
• [Optional insight 5]

Summary:`;
}

/**
 * Parse Claude's response into summary and insights
 */
function parseSummary(text: string): { summary: string; insights: string[] } {
  const parts = text.split('INSIGHTS:');

  if (parts.length === 1) {
    // No explicit INSIGHTS section, return full text as summary
    return {
      summary: text.trim(),
      insights: []
    };
  }

  const summary = parts[0].trim();
  const insightsText = parts[1].trim();

  // Extract bullet points
  const insights = insightsText
    .split(/\n/)
    .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(line => line.length > 0);

  return { summary, insights };
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidence(dataCount: number, sourceCount: number): number {
  if (dataCount === 0) return 0;

  let confidence = 0.5; // Base confidence

  // More data points = higher confidence
  if (dataCount >= 10) confidence += 0.2;
  else if (dataCount >= 5) confidence += 0.1;

  // Multiple sources = higher confidence
  if (sourceCount >= 3) confidence += 0.2;
  else if (sourceCount >= 2) confidence += 0.1;

  // Cap at 0.95 (never 100% certainty)
  return Math.min(0.95, confidence);
}

/**
 * Fallback summary generator (when Claude API unavailable)
 */
export function generateFallbackSummary(
  query: string,
  data: any[],
  sources: string[]
): ClaudeSummaryResponse {
  const dataCount = data.length;

  const summary = dataCount > 0
    ? `Found ${dataCount} record${dataCount === 1 ? '' : 's'} matching "${query}". Data sourced from ${sources.join(', ')}. For detailed analysis, contact austin@blazesportsintel.com or enable Claude API integration.`
    : `No records found matching "${query}". This may indicate limited historical coverage for this query. Try rephrasing or expanding the search criteria.`;

  return {
    summary,
    insights: [
      `${dataCount} total records retrieved`,
      `Data sources: ${sources.join(', ')}`,
      'Claude API integration available for enhanced summaries'
    ],
    confidence: 0.65,
    model: 'fallback'
  };
}

/**
 * Enhanced query handler with optional Claude summarization
 */
export async function enhanceQueryResult(
  query: string,
  data: any[],
  sources: string[],
  sport: string,
  anthropicApiKey?: string
): Promise<{ enhanced: boolean; claude_summary?: ClaudeSummaryResponse }> {
  if (!anthropicApiKey) {
    return {
      enhanced: false
    };
  }

  try {
    const summary = await generateClaudeSummary(
      { query, data, sources, sport },
      anthropicApiKey
    );

    return {
      enhanced: true,
      claude_summary: summary
    };
  } catch (error) {
    console.warn('Claude enhancement failed, using fallback:', error);

    return {
      enhanced: true,
      claude_summary: generateFallbackSummary(query, data, sources)
    };
  }
}
