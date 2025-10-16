// Copilot Status API
export const onRequest: PagesFunction = async (context) => {
  return new Response(JSON.stringify({
    status: 'operational',
    version: '2.0.0 - Production',
    features: {
      semantic_search: 'Coming soon - Workers AI integration pending',
      real_time_data: true,
      enhanced_3d: true,
      model: 'bge-base-en-v1.5 (pending)',
      llm: 'llama-3.1-8b-instruct (pending)'
    },
    timestamp: new Date().toISOString(),
    message: 'Copilot backend API ready. Database and AI features coming in Phase 2.'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
