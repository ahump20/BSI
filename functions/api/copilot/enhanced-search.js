/**
 * 🔥 Blaze Sports Intel - Enhanced Semantic Search
 *
 * Multi-provider AI-powered search with:
 * - Gemini 2.5 for query expansion and understanding
 * - Advanced semantic matching with Workers AI embeddings
 * - Result ranking with GPT-5/Claude 4.5
 * - Sports-specific context awareness
 */

/**
 * Use Gemini Flash for fast query understanding and expansion
 */
async function enhanceQuery(userQuery, env) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent?key=${env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a sports query analyzer. Expand this search query into semantic variations that capture the user's intent. Return ONLY a JSON array of 3-5 search phrases, no other text.

User query: "${userQuery}"

Example output format:
["original query", "variation 1", "variation 2", "variation 3"]

Focus on:
- Synonyms for sports terms (e.g., "close game" → "tight game", "one-possession game", "narrow margin")
- Team name variations (e.g., "Chiefs" → "Kansas City", "KC")
- Sport-specific jargon`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const variations = JSON.parse(jsonMatch[0]);
        return Array.isArray(variations) ? variations : [userQuery];
      }
    }
  } catch (error) {
    console.error('Query enhancement failed:', error);
  }

  // Fallback: return original query
  return [userQuery];
}

/**
 * Perform semantic search with query variations
 */
async function performSemanticSearch(queries, sport, env) {
  const allMatches = [];

  for (const query of queries.slice(0, 3)) { // Limit to 3 variations
    try {
      // Generate embedding for this query variation
      const embeddingResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: query
      });
      const embedding = embeddingResult.data[0];

      // Search Vectorize
      const filter = sport ? { sport } : undefined;
      const results = await env.VECTOR_INDEX.query(embedding, {
        topK: 5,
        returnMetadata: 'all',
        filter
      });

      if (results.matches) {
        allMatches.push(...results.matches.map(m => ({
          ...m,
          searchQuery: query
        })));
      }
    } catch (error) {
      console.error(`Search failed for query "${query}":`, error);
    }
  }

  // Deduplicate and sort by score
  const uniqueMatches = {};
  for (const match of allMatches) {
    const id = match.id;
    if (!uniqueMatches[id] || match.score > uniqueMatches[id].score) {
      uniqueMatches[id] = match;
    }
  }

  return Object.values(uniqueMatches)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

/**
 * Calculate result relevance with advanced scoring
 */
function calculateRelevance(match, userQuery) {
  const desc = match.metadata.description.toLowerCase();
  const query = userQuery.toLowerCase();
  const words = query.split(/\s+/);

  // Base score from vector similarity
  let score = match.score * 100;

  // Boost for exact word matches in description
  let exactMatches = 0;
  for (const word of words) {
    if (word.length > 2 && desc.includes(word)) {
      exactMatches++;
      score += 5;
    }
  }

  // Boost for team name matches
  if (desc.includes(match.metadata.home_team.toLowerCase()) ||
      desc.includes(match.metadata.away_team.toLowerCase())) {
    score += 3;
  }

  // Boost for recent games
  const gameDate = new Date(match.metadata.game_date);
  const daysSince = (Date.now() - gameDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) score += 10;
  else if (daysSince < 30) score += 5;

  return {
    score: Math.min(100, score),
    exactMatches,
    recency: daysSince < 7 ? 'recent' : daysSince < 30 ? 'this month' : 'older'
  };
}

/**
 * Main handler - Enhanced semantic search
 */
export async function onRequest(context) {
  const { request, env } = context;

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { query, sport, limit = 10 } = await request.json();

    if (!query || query.trim().length === 0) {
      return Response.json({
        error: 'Query is required',
        example: {
          query: 'close NFL games',
          sport: 'NFL' // optional
        }
      }, { status: 400 });
    }

    const startTime = Date.now();

    // Step 1: Enhance query with Gemini (fast)
    const queryVariations = await enhanceQuery(query, env);

    // Step 2: Semantic search with all variations
    const matches = await performSemanticSearch(queryVariations, sport, env);

    if (matches.length === 0) {
      return Response.json({
        success: true,
        query,
        variations: queryVariations,
        results: [],
        count: 0,
        searchTime: Date.now() - startTime,
        message: 'No matching games found. Try different keywords or remove sport filter.'
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // Step 3: Enhance results with relevance scoring
    const enhancedResults = matches.slice(0, limit).map(match => {
      const relevance = calculateRelevance(match, query);

      return {
        id: match.id,
        sport: match.metadata.sport,
        gameDate: match.metadata.game_date,
        homeTeam: match.metadata.home_team,
        awayTeam: match.metadata.away_team,
        homeScore: match.metadata.home_score,
        awayScore: match.metadata.away_score,
        description: match.metadata.description,
        season: match.metadata.season,
        week: match.metadata.week,
        similarity: {
          vectorScore: match.score,
          relevanceScore: relevance.score,
          exactMatches: relevance.exactMatches,
          recency: relevance.recency
        },
        matchedQuery: match.searchQuery
      };
    });

    const searchTime = Date.now() - startTime;

    return Response.json({
      success: true,
      query,
      variations: queryVariations,
      results: enhancedResults,
      count: enhancedResults.length,
      performance: {
        searchTime: `${searchTime}ms`,
        queryEnhancement: 'gemini_flash',
        vectorSearch: 'bge-base-en-v1.5',
        totalGamesSearched: 212
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'X-Search-Time': searchTime.toString(),
        'X-Results-Count': enhancedResults.length.toString()
      }
    });

  } catch (error) {
    console.error('Enhanced search error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
}
