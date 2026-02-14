interface Env {
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;
}

interface RequestBody {
  provider: 'claude' | 'gemini';
  prompt: string;
  gameContext: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = (await context.request.json()) as RequestBody;
    const { provider, prompt, gameContext } = body;

    if (!prompt || !gameContext) {
      return new Response(JSON.stringify({ error: 'Missing prompt or gameContext' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const systemPrompt = `You are a college baseball analyst for Blaze Sports Intel. Analyze the following game data and respond to the user's request. Be specific, cite stats, and write in a direct, analytical tone. No fluff.`;

    const userMessage = `${prompt}\n\nGame Data:\n${gameContext}`;

    if (provider === 'claude') {
      const apiKey = context.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return new Response(JSON.stringify({ error: `Claude API error: ${response.status}`, details: err }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const data = await response.json() as { content: Array<{ text: string }> };
      const analysis = data.content?.[0]?.text || '';

      return new Response(JSON.stringify({ analysis, provider: 'claude', model: 'claude-sonnet-4-5-20250514' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (provider === 'gemini') {
      const apiKey = context.env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return new Response(JSON.stringify({ error: `Gemini API error: ${response.status}`, details: err }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const data = await response.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return new Response(JSON.stringify({ analysis, provider: 'gemini', model: 'gemini-2.0-flash' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid provider. Use "claude" or "gemini".' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
