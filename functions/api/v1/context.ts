import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  BSI_CACHE: KVNamespace;
}

interface ContextualFact {
  id: string;
  type: 'record' | 'streak' | 'milestone' | 'rivalry' | 'history' | 'stat';
  headline: string;
  detail?: string;
  relevance: 'high' | 'medium' | 'low';
}

interface ContextResponse {
  facts: ContextualFact[];
  meta: {
    source: string;
    timestamp: string;
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const sport = url.searchParams.get('sport');
  const contextType = url.searchParams.get('context');
  const entities = url.searchParams.get('entities')?.split(',') || [];

  if (!sport || !contextType) {
    return new Response(JSON.stringify({ error: 'Missing sport or context' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check cache
  const cacheKey = `context:${sport}:${contextType}:${entities.join(',')}`;
  const cached = await context.env.BSI_CACHE.get(cacheKey, 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate facts based on context type
  const facts = generateFacts(sport, contextType, entities);

  const response: ContextResponse = {
    facts,
    meta: { source: 'BSI', timestamp: new Date().toISOString() },
  };

  // Cache for 5 minutes
  await context.env.BSI_CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function generateFacts(sport: string, contextType: string, entities: string[]): ContextualFact[] {
  // Initial implementation with empty array
  // Expand to dynamic generation based on sport, context type, and entities
  // Future: Wire to historical data, streaks, records databases
  return [];
}
