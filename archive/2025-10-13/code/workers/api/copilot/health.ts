/**
 * Copilot Health Check API - Phase 2 AI Infrastructure
 * GET /api/copilot/health
 *
 * Tests all Cloudflare bindings required for semantic search and RAG:
 * - D1 Database (blazesports-db)
 * - KV Namespace (CACHE)
 * - R2 Bucket (EMBEDDINGS → bsi-embeddings)
 * - Vectorize Index (VECTOR_INDEX → sports-scouting-index)
 * - Workers AI (AI → bge-base-en-v1.5 + llama-3.1-8b-instruct)
 */

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  EMBEDDINGS: R2Bucket;
  VECTOR_INDEX: VectorizeIndex;
  AI: any;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: string;
  details?: string;
  error?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const startTime = Date.now();

  const checks: HealthCheck[] = [];

  // ========================================
  // 1. D1 Database Check
  // ========================================
  try {
    const d1Start = Date.now();

    // Test basic query
    const testQuery = await env.DB.prepare('SELECT 1 as test').first();

    // Count teams to verify data exists
    const teamCount = await env.DB
      .prepare('SELECT COUNT(*) as count FROM teams')
      .first() as { count: number } | null;

    // Count games
    const gameCount = await env.DB
      .prepare('SELECT COUNT(*) as count FROM games')
      .first() as { count: number } | null;

    checks.push({
      service: 'D1 Database',
      status: testQuery && teamCount ? 'healthy' : 'degraded',
      responseTime: `${Date.now() - d1Start}ms`,
      details: `${teamCount?.count || 0} teams, ${gameCount?.count || 0} games`
    });
  } catch (error) {
    checks.push({
      service: 'D1 Database',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // ========================================
  // 2. KV Namespace Check
  // ========================================
  try {
    const kvStart = Date.now();
    const testKey = `__copilot_health_${Date.now()}__`;
    const testValue = Date.now().toString();

    // Write test
    await env.CACHE.put(testKey, testValue, { expirationTtl: 60 });

    // Read test
    const readValue = await env.CACHE.get(testKey);

    // Clean up
    await env.CACHE.delete(testKey);

    checks.push({
      service: 'KV Namespace (CACHE)',
      status: readValue === testValue ? 'healthy' : 'degraded',
      responseTime: `${Date.now() - kvStart}ms`
    });
  } catch (error) {
    checks.push({
      service: 'KV Namespace (CACHE)',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // ========================================
  // 3. R2 Bucket Check
  // ========================================
  try {
    const r2Start = Date.now();

    // List objects (just check if bucket is accessible)
    const objects = await env.EMBEDDINGS.list({ limit: 1 });

    checks.push({
      service: 'R2 Bucket (EMBEDDINGS)',
      status: 'healthy',
      responseTime: `${Date.now() - r2Start}ms`,
      details: `${objects.objects.length} objects accessible`
    });
  } catch (error) {
    checks.push({
      service: 'R2 Bucket (EMBEDDINGS)',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // ========================================
  // 4. Vectorize Index Check
  // ========================================
  try {
    const vecStart = Date.now();

    // Create a test vector (768 dimensions for bge-base-en-v1.5)
    const testVector = Array(768).fill(0.1);

    // Query (don't insert, just test query capability)
    const results = await env.VECTOR_INDEX.query(testVector, {
      topK: 1,
      returnMetadata: true
    });

    checks.push({
      service: 'Vectorize Index',
      status: 'healthy',
      responseTime: `${Date.now() - vecStart}ms`,
      details: `${results.matches?.length || 0} indexed vectors`
    });
  } catch (error) {
    checks.push({
      service: 'Vectorize Index',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // ========================================
  // 5. Workers AI - Embedding Model Check
  // ========================================
  try {
    const aiEmbedStart = Date.now();

    const embedResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: 'health check test'
    });

    const embedding = embedResponse.data?.[0];
    const isValid = Array.isArray(embedding) && embedding.length === 768;

    checks.push({
      service: 'Workers AI (Embeddings)',
      status: isValid ? 'healthy' : 'degraded',
      responseTime: `${Date.now() - aiEmbedStart}ms`,
      details: `bge-base-en-v1.5 (${embedding?.length || 0}d vector)`
    });
  } catch (error) {
    checks.push({
      service: 'Workers AI (Embeddings)',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // ========================================
  // 6. Workers AI - LLM Check
  // ========================================
  try {
    const aiLLMStart = Date.now();

    const llmResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "OK" if you receive this message.' }
      ],
      max_tokens: 10
    });

    const responseText = llmResponse.response || '';

    checks.push({
      service: 'Workers AI (LLM)',
      status: responseText.length > 0 ? 'healthy' : 'degraded',
      responseTime: `${Date.now() - aiLLMStart}ms`,
      details: `llama-3.1-8b-instruct (${responseText.length} chars)`
    });
  } catch (error) {
    checks.push({
      service: 'Workers AI (LLM)',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // ========================================
  // Calculate Summary
  // ========================================
  const totalTime = Date.now() - startTime;

  const summary = {
    total: checks.length,
    healthy: checks.filter(c => c.status === 'healthy').length,
    degraded: checks.filter(c => c.status === 'degraded').length,
    unhealthy: checks.filter(c => c.status === 'unhealthy').length
  };

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (summary.unhealthy > 0) {
    overallStatus = summary.unhealthy === summary.total ? 'unhealthy' : 'degraded';
  } else if (summary.degraded > 0) {
    overallStatus = 'degraded';
  }

  // Build response
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    platform: 'Blaze Sports Intel Copilot',
    version: '2.0.0 - Phase 2 AI Integration',
    responseTime: `${totalTime}ms`,
    checks,
    summary,
    ready_for_production: overallStatus === 'healthy' && summary.healthy === summary.total,
    phase2_features: {
      semantic_search: overallStatus === 'healthy',
      rag_insights: overallStatus === 'healthy',
      embedding_generation: checks.find(c => c.service.includes('Embeddings'))?.status === 'healthy',
      vector_search: checks.find(c => c.service.includes('Vectorize'))?.status === 'healthy',
      ai_chat: checks.find(c => c.service.includes('LLM'))?.status === 'healthy'
    }
  };

  // Set HTTP status code
  const statusCode = overallStatus === 'healthy' ? 200 :
                     overallStatus === 'degraded' ? 503 : 500;

  return new Response(JSON.stringify(response, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};
